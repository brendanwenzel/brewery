const hre = require("hardhat");
const ethers = hre.ethers;
require("dotenv").config();
const chalk = require("chalk");
const abiDecoder = require('abi-decoder');

const wssProvider = new ethers.providers.WebSocketProvider(process.env.RPC_URL_WSS);
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const rpcProvider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
const searcherWallet = new ethers.Wallet( process.env.PRIVATE_KEY_LIVE, provider );
const signerKey = searcherWallet.connect(provider);

const { MongoClient, CURSOR_FLAGS } = require('mongodb');

const logWarn = (...args) => { console.log(chalk.hex("#FFA500")(...args)); };
const logSuccess = (...args) => { console.log(chalk.green(...args)); };
const logInfo = (...args) => { console.log(chalk.yellow(...args)); };
const logError = (...args) => { console.log(chalk.red(...args)); };
const logTrace = (...args) => { console.log(chalk.grey(...args)); };
const logDebug = (...args) => { console.log(chalk.magenta(...args)); };
const logFatal = (...args) => { console.log(chalk.redBright(...args)); };

// Initialize MongoDB and Collection
const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);
const db = client.db("liquidity");
const collect = db.collection("spooky");
try {
  client.connect();
  console.log("MongoDB Connected");
} catch (e) {
  console.error(e);
}

const IBooBrew = require("./abi/IBooBrew.json");
const IPancakeswapV2RouterABI = require("./abi/IPancakswapV2Router02.json");
const ILiquidity = require("./abi/ILiquidityPair.json");
const hreProvider = hre.network.provider;

abiDecoder.addABI(IPancakeswapV2RouterABI);

const TOKENS = {
  WFTM: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
  USDC: "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75",
  BOO: "0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE",
};
const CONTRACTS = {
  SPOOKY: "0xF491e7B69E4244ad4002BC14e878a34207E38c29",
  BOOBREWCONTRACT: "0x3B3fdC40582a957206Aed119842F2313DE9eE21b"
}
const PRIVATEKEY = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
  "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
  "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
  "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356",
  "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
  "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6",
  "0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897",
  "0x701b615bbdfb9de65240bc28bd21bbc0d996645a3dd57e7b12bc2bdf6f192c82",
  "0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1",
  "0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd",
  "0xc526ee95bf44d8fc405a158bb884d9d1238d99f0612e9f33d006bb0789009aaa",
  "0x8166f546bab6da521a8369cab06c5d2b9e46670292d85c875ee9ec20e84ffb61",
  "0xea6c44ac03bff858b476bba40716402b03e41b8e97e276d1baec7c37d42484a0",
  "0x689af8efa8c651a91ad287602527f3af2fe9f6501a7ac4b061667b5a93e037fd",
  "0xde9be858da4a475276426320d5e9262ecfc3ba460bfac56360bfa6c4c28b4ee0",
  "0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e"
]

// const match = (a, b, caseIncensitive = true) => {
//   if (a === null || a === undefined) return false;

//   if (Array.isArray(b)) {
//     if (caseIncensitive) {
//       return b.map((x) => x.toLowerCase()).includes(a.toLowerCase());
//     }

//     return b.includes(a);
//   }

//   if (caseIncensitive) {
//     return a.toLowerCase() === b.toLowerCase();
//   }

//   return a === b;
// };

// const parseUniv2RouterTx = (txData) => {
//   let data = null;
//   try {
//     data = abiDecoder.decodeMethod(txData);
//   } catch (e) {
//     return null;
//   }

//   if (data.name === "swapExactETHForTokens") {
//     const [amountOutMin, path, to, deadline] = data.params.map((x) => x.value);
//     const nullValue = "null";
//     return {
//       amountIn: nullValue,
//       amountOutMin,
//       path,
//       to,
//       deadline
//     };
//   }

//   if (data.name === "swapETHForExactTokens") {
//     const [amountOut, path, to, deadline] = data.params.map((x) => x.value);
//     const nullValue = "null";
//     return {
//       amountIn: nullValue,
//       amountOutMin: amountOut,
//       path,
//       to,
//       deadline
//     };
//   }

//   if (data.name === "swapTokensForExactTokens" || data.name === "swapTokensForExactETH")  { 
//     const [amountOut, amountInMax, path, to, deadline] = data.params.map((x) => x.value); 
//     return {
//       amountIn: amountInMax,
//       amountOutMin: amountOut,
//       path,
//       to,
//       deadline
//     };
//   }

//   if (data.name !== "swapExactTokensForETH" && data.name !== "swapExactTokensForTokens" && data.name !== "swapExactTokensForETHSupportingFeeOnTransferTokens" && data.name !== "swapExactTokensForTokensSupportingFeeOnTransferTokens") { return null; }

//   const [amountIn, amountOutMin, path, to, deadline] = data.params.map((x) => x.value);

//   return {
//     amountIn,
//     amountOutMin,
//     path,
//     to,
//     deadline
//   };
// };

// const sortTokens = (tokenA, tokenB) => {
//   if (ethers.BigNumber.from(tokenA).lt(ethers.BigNumber.from(tokenB))) {
//     return [tokenA, tokenB];
//   }
//   return [tokenB, tokenA];
// };

// const getUniv2PairAddress = (tokenA, tokenB) => {
//   const [token0, token1] = sortTokens(tokenA, tokenB);

//   const salt = ethers.utils.keccak256(token0 + token1.replace("0x", ""));
//   const address = ethers.utils.getCreate2Address(
//     "0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3", // Factory address (contract creator)
//     salt,
//     "0xcdf2deca40a0bd56de8e3ce5c7df6727e5b1bf2ac96f283fa9c4b3e6b42ea9d2" // init code hash
//   );

//   return address;
// };


const main = async () => {

  const estGasPrice = await wssProvider.getGasPrice();
  const gasPriceDesired = estGasPrice.add(estGasPrice.div(5));
  const forkedWallet = new ethers.Wallet(
    PRIVATEKEY[17],
    rpcProvider
  );
  const forkedKey = forkedWallet.connect(rpcProvider);


  const booBrewContract = new ethers.Contract(
    CONTRACTS.BOOBREWCONTRACT,
    IBooBrew,
    forkedWallet
  );

  const tokenContract = new ethers.Contract(
    TOKENS.BOO,
    [
        'function balanceOf(address account) public view returns (uint256)',
    ],
    forkedKey
);
  
// Target Pair (TP) for Reward Calculation
const gasPrice = ethers.utils.hexlify(estGasPrice);
const gasLimit = ethers.utils.hexlify(2000000);
const documentCount = await collect.countDocuments();

  for (var i = 1; i < documentCount; i++) {
    const blockToFork = await wssProvider.getBlock();
    await hreProvider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.RPC_URL,
            blockNumer: blockToFork,
          },
        },
      ],
    });
    
    const determineReward = async () => {
      const targetPair = await collect.findOne( { _id: i } );
      const targetAddress = targetPair.pair;
      const targetToken0 = targetPair.token0;
      const targetToken1 = targetPair.token1;
      const calcTargetRewards = await booBrewContract.convertMultiple([targetToken0], [targetToken1], [], {gasPrice: gasPrice, gasLimit: gasLimit});
      const callTargetResult = await calcTargetRewards.wait();
      const gasUsed = callTargetResult.gasUsed;
      const booTokenBalance = await tokenContract.balanceOf(forkedWallet.address);
      const booReward = parseInt(booTokenBalance);
      const gasCost = ethers.BigNumber.from(estGasPrice.mul(gasUsed));

      // Find Value of BOO in FTM
      const routerContractLive = new ethers.Contract(
        CONTRACTS.SPOOKY,
        IPancakeswapV2RouterABI,
        searcherWallet
      );

      const booFTMPath = [TOKENS.BOO, TOKENS.WFTM];
      const calcAmountOut = await routerContractLive.getAmountsOut(booTokenBalance, booFTMPath);
      const ftmOut = calcAmountOut[1];

      const profitCalculation = ftmOut - gasCost.mul(2);  
      if (profitCalculation > 0) { 
      logDebug("==========================================");
      logDebug("Possible Profit:", profitCalculation);

      const booBrewContractLive = new ethers.Contract(
        CONTRACTS.BOOBREWCONTRACT,
        IBooBrew,
        searcherWallet
      );

      const transactionCount = await wssProvider.getTransactionCount(searcherWallet.address);

      logTrace("Submitting Claim...");
      const claimBooReward = await booBrewContractLive.convertMultiple([targetToken0], [targetToken1], [], {gasPrice: gasPrice, gasLimit: gasLimit});
      logTrace("Claim Submitted");
      const claimRect = await claimBooReward.wait();
      logInfo(`Boo Claimed!`)
      logInfo(`Transaction: ${claimRect.transactionHash}`);
      return;
      }

      const queryDocument = { pair: targetAddress };
      const newPairData = { $set: { reward: booReward } };
      const result = await collect.updateOne(queryDocument, newPairData);

      const booTokenRewardFormat = ethers.utils.formatUnits(booTokenBalance);
      logTrace(`Updated ${targetAddress} with reward ${booTokenRewardFormat}`);
      return booTokenRewardFormat;
    };
      try {
      const booTokenReward = await determineReward();
      } catch(e) {}

  }
  
  process.exit(1);

};

main();