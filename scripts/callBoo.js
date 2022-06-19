const hre = require("hardhat");
const ethers = hre.ethers;
require("dotenv").config();
const chalk = require("chalk");
const { MongoClient, CURSOR_FLAGS } = require('mongodb');

const logWarn = (...args) => { console.log(chalk.hex("#FFA500")(...args)); };
const logSuccess = (...args) => { console.log(chalk.green(...args)); };
const logInfo = (...args) => { console.log(chalk.yellow(...args)); };
const logError = (...args) => { console.log(chalk.red(...args)); };
const logTrace = (...args) => { console.log(chalk.grey(...args)); };
const logDebug = (...args) => { console.log(chalk.magenta(...args)); };
const logFatal = (...args) => { console.log(chalk.redBright(...args)); };

const match = (a, b, caseIncensitive = true) => {
  if (a === null || a === undefined) return false;

  if (Array.isArray(b)) {
    if (caseIncensitive) {
      return b.map((x) => x.toLowerCase()).includes(a.toLowerCase());
    }

    return b.includes(a);
  }

  if (caseIncensitive) {
    return a.toLowerCase() === b.toLowerCase();
  }

  return a === b;
};

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

const rpcProvider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
const wssProvider = new ethers.providers.WebSocketProvider(process.env.RPC_URL_WSS);
const TOKENS = {
  WFTM: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
  USDC: "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75",
  BOO: "0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE",
};

const CONTRACTS = {
  SPOOKY: "0xF491e7B69E4244ad4002BC14e878a34207E38c29",
  BOOBREWCONTRACT: "0x3B3fdC40582a957206Aed119842F2313DE9eE21b"
}
const IBooBrew = require("./abi/IBooBrew.json");
const IPancakeswapV2RouterABI = require("./abi/IPancakswapV2Router02.json");
const ILiquidity = require("./abi/ILiquidityPair.json");

const callBoo = async (blockNumber) => {

  const blockToFork = await wssProvider.getBlockNumber();  
  const estGasPrice = await wssProvider.getGasPrice();  
  const hreProvider = hre.network.provider;

  const forkedWallet = new ethers.Wallet(
    process.env.PRIVATE_KEY2,
    rpcProvider
  );
  const forkedKey = forkedWallet.connect(rpcProvider);
  const searcherWallet = new ethers.Wallet( process.env.PRIVATE_KEY_LIVE, wssProvider );
  const signerKey = searcherWallet.connect(wssProvider);

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

// await hreProvider.request({
//   method: "hardhat_reset",
//   params: [
//     {
//       forking: {
//         jsonRpcUrl: process.env.RPC_URL,
//         blockNumer: blockToFork,
//       },
//     },
//   ],
// });

  // Find Top 5 Rewards
  const topFiveRewards = collect.find({ reward: { $gt: 0 } }).sort({ reward: -1 }).limit(5);
  const topFive = await topFiveRewards.toArray();

  for (i = 0; i < topFive.length; i++ ) {
    const pairAddress = topFive[i].pair;
    const lpContract = new ethers.Contract(
      pairAddress,
      ILiquidity,
      signerKey
  );
  const tokenBalance = await lpContract.balanceOf(CONTRACTS.BOOBREWCONTRACT);
  const lpBalance = tokenBalance.toString();

  const queryPairData = { pair: pairAddress };
  const newPairData = { $set: { balance: lpBalance } };
  const result = await collect.updateOne(queryPairData, newPairData);
  logInfo(`Updated Pair: ${pairAddress} with LP Balance: ${lpBalance}`);
  }

  const updatedFiveRewards = collect.find().sort({ reward: -1 }).limit(5);
  const updatedFive = await topFiveRewards.toArray();
  const pairAaddress = updatedFive[0].pair;
  const pairAtoken0 = updatedFive[0].token0;
  const pairAtoken1 = updatedFive[0].token1;
  const pairAbalance = updatedFive[0].balance;
  const pairbaddress = updatedFive[1].pair;
  const pairBtoken0 = updatedFive[1].token0;
  const pairBtoken1 = updatedFive[1].token1;
  const pairBbalance = updatedFive[1].balance;
  const pairCaddress = updatedFive[2].pair;
  const pairCtoken0 = updatedFive[2].token0;
  const pairCtoken1 = updatedFive[2].token1;
  const pairCbalance = updatedFive[2].balance;
  const pairDaddress = updatedFive[3].pair;
  const pairDtoken0 = updatedFive[3].token0;
  const pairDtoken1 = updatedFive[3].token1;
  const pairDbalance = updatedFive[3].balance;
  const pairEaddress = updatedFive[4].pair;
  const pairEtoken0 = updatedFive[4].token0;
  const pairEtoken1 = updatedFive[4].token1;
  const pairEbalance = updatedFive[4].balance;

  const gasPrice = ethers.utils.hexlify(estGasPrice);
  const gasLimit = ethers.utils.hexlify(2500000);
  const calcTargetRewards = await booBrewContract.convertMultiple([pairAtoken0, pairBtoken0, pairCtoken0, pairDtoken0, pairEtoken0], [pairAtoken1, pairBtoken1, pairCtoken1, pairDtoken1, pairEtoken1], [pairAbalance, pairBbalance, pairCbalance, pairDbalance, pairEbalance], {gasPrice: estGasPrice, gasLimit: gasLimit});
  const callTargetResult = await calcTargetRewards.wait();
  const booTokenBalance = await tokenContract.balanceOf(forkedWallet.address);
  const booReward = parseInt(booTokenBalance); 
  const booTokenRewardFormat = ethers.utils.formatUnits(booTokenBalance); 
  logInfo(`Boo Reward ${booTokenRewardFormat}`);

  return;
};

const main = async () => {

wssProvider.on("block", (blockNumber) =>
callBoo(blockNumber).catch((e) => {
  logFatal(`Block Number = ${blockNumber} error`);
})
);

};

main();