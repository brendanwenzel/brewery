const hre = require("hardhat");
const ethers = hre.ethers;
require("dotenv").config();
const chalk = require("chalk");
const abiDecoder = require('abi-decoder');
const { MongoClient, CURSOR_FLAGS } = require('mongodb');

const wssProvider = new ethers.providers.WebSocketProvider(process.env.RPC_URL_WSS);
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const rpcProvider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
const hreProvider = hre.network.provider;
const searcherWallet = new ethers.Wallet( process.env.PRIVATE_KEY_LIVE, wssProvider );
const signerKey = searcherWallet.connect(provider);

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
const db = client.db("boobrew");
const collect = db.collection("lptokens");
const claimsDB = db.collection("claims");
try {
  client.connect();
  console.log("MongoDB Connected");
} catch (e) {
  console.error(e);
}

// ABIs 
const IBooBrew = require("./abi/IBooBrew.json");
const IPancakeswapV2RouterABI = require("./abi/IPancakswapV2Router02.json");
const ILiquidity = require("./abi/ILiquidityPair.json");

const TOKENS = {
  WFTM: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
  USDC: "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75",
  BOO: "0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE",
};
const CONTRACTS = {
  SPOOKY: "0xF491e7B69E4244ad4002BC14e878a34207E38c29",
  BOOBREWCONTRACT: "0x3B3fdC40582a957206Aed119842F2313DE9eE21b"
}

// Private Keys from Hardhat
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
  "0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e",
  "0xeaa861a9a01391ed3d587d8a5a84ca56ee277629a8b02c22093a419bf240e65d",
  "0xc511b2aa70776d4ff1d376e8537903dae36896132c90b91d52c1dfbae267cd8b",
  "0x224b7eb7449992aac96d631d9677f7bf5888245eef6d6eeda31e62d2f29a83e4",
  "0x4624e0802698b9769f5bdb260a3777fbd4941ad2901f5966b854f953497eec1b",
  "0x375ad145df13ed97f8ca8e27bb21ebf2a3819e9e0a06509a812db377e533def7",
  "0x18743e59419b01d1d846d97ea070b5a3368a3e7f6f0242cf497e1baac6972427",
  "0xe383b226df7c8282489889170b0f68f66af6459261f4833a781acd0804fafe7a",
  "0xf3a6b71b94f5cd909fb2dbb287da47badaa6d8bcdc45d595e2884835d8749001",
  "0x4e249d317253b9641e477aba8dd5d8f1f7cf5250a5acadd1229693e262720a19",
  "0x233c86e887ac435d7f7dc64979d7758d69320906a0d340d2b6518b0fd20aa998",
  "0x85a74ca11529e215137ccffd9c95b2c72c5fb0295c973eb21032e823329b3d2d",
  "0xac8698a440d33b866b6ffe8775621ce1a4e6ebd04ab7980deb97b3d997fc64fb",
  "0xf076539fbce50f0513c488f32bf81524d30ca7a29f400d68378cc5b1b17bc8f2",
  "0x5544b8b2010dbdbef382d254802d856629156aba578f453a76af01b81a80104e",
  "0x47003709a0a9a4431899d4e014c1fd01c5aad19e873172538a02370a119bae11",
  "0x9644b39377553a920edc79a275f45fa5399cbcf030972f771d0bca8097f9aad3",
  "0xcaa7b4a2d30d1d565716199f068f69ba5df586cf32ce396744858924fdf827f0",
  "0xfc5a028670e1b6381ea876dd444d3faaee96cffae6db8d93ca6141130259247c",
  "0x5b92c5fe82d4fabee0bc6d95b4b8a3f9680a0ed7801f631035528f32c9eb2ad5",
  "0xb68ac4aa2137dd31fd0732436d8e59e959bb62b4db2e6107b15f594caf0f405f",
  "0xc95eaed402c8bd203ba04d81b35509f17d0719e3f71f40061a2ec2889bc4caa7",
  "0x55afe0ab59c1f7bbd00d5531ddb834c3c0d289a4ff8f318e498cb3f004db0b53",
  "0xc3f9b30f83d660231203f8395762fa4257fa7db32039f739630f87b8836552cc",
  "0x3db34a7bcc6424e7eadb8e290ce6b3e1423c6e3ef482dd890a812cd3c12bbede",
  "0xae2daaa1ce8a70e510243a77187d2bc8da63f0186074e4a4e3a7bfae7fa0d639",
  "0x5ea5c783b615eb12be1afd2bdd9d96fae56dda0efe894da77286501fd56bac64",
  "0xf702e0ff916a5a76aaf953de7583d128c013e7f13ecee5d701b49917361c5e90",
  "0x7ec49efc632757533404c2139a55b4d60d565105ca930a58709a1c52d86cf5d3",
  "0x755e273950f5ae64f02096ae99fe7d4f478a28afd39ef2422068ee7304c636c0",
  "0xaf6ecabcdbbfb2aefa8248b19d811234cd95caa51b8e59b6ffd3d4bbc2a6be4c"
]

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

const parseUniv2RouterTx = (txData) => {
  abiDecoder.addABI(IPancakeswapV2RouterABI);
  let data = null;
  try {
    data = abiDecoder.decodeMethod(txData);
  } catch (e) {
    return null;
  }

  if (data.name === "swapExactETHForTokens") {
    const [amountOutMin, path, to, deadline] = data.params.map((x) => x.value);
    const nullValue = "null";
    return {
      amountIn: nullValue,
      amountOutMin,
      path,
      to,
      deadline
    };
  }

  if (data.name === "swapETHForExactTokens") {
    const [amountOut, path, to, deadline] = data.params.map((x) => x.value);
    const nullValue = "null";
    return {
      amountIn: nullValue,
      amountOutMin: amountOut,
      path,
      to,
      deadline
    };
  }

  if (data.name === "swapTokensForExactTokens" || data.name === "swapTokensForExactETH")  { 
    const [amountOut, amountInMax, path, to, deadline] = data.params.map((x) => x.value); 
    return {
      amountIn: amountInMax,
      amountOutMin: amountOut,
      path,
      to,
      deadline
    };
  }

  if (data.name !== "swapExactTokensForETH" && data.name !== "swapExactTokensForTokens" && data.name !== "swapExactTokensForETHSupportingFeeOnTransferTokens" && data.name !== "swapExactTokensForTokensSupportingFeeOnTransferTokens") { return null; }

  const [amountIn, amountOutMin, path, to, deadline] = data.params.map((x) => x.value);

  return {
    amountIn,
    amountOutMin,
    path,
    to,
    deadline
  };
};

const parseBooBrewTx = (txData) => {
  abiDecoder.addABI(IBooBrew);
  let data = null;
  try {
    data = abiDecoder.decodeMethod(txData);
  } catch (e) {
    return null;
  }

  if (data.name !== "convertMultiple") { return null; }

    const [token0, token1, LPamounts] = data.params.map((x) => x.value);
    return {
      token0,
      token1,
      LPamounts
    };
};

const sortTokens = (tokenA, tokenB) => {
  if (ethers.BigNumber.from(tokenA).lt(ethers.BigNumber.from(tokenB))) {
    return [tokenA, tokenB];
  }
  return [tokenB, tokenA];
};

const getUniv2PairAddress = (tokenA, tokenB) => {
  const [token0, token1] = sortTokens(tokenA, tokenB);

  const salt = ethers.utils.keccak256(token0 + token1.replace("0x", ""));
  const address = ethers.utils.getCreate2Address(
    "0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3", // Factory address (contract creator)
    salt,
    "0xcdf2deca40a0bd56de8e3ce5c7df6727e5b1bf2ac96f283fa9c4b3e6b42ea9d2" // init code hash
  );

  return address;
};

const clearRewards = async (tx) => {
  const routerDataDecoded = parseBooBrewTx(tx.data);
  if (routerDataDecoded === null) { return; }
  const { token0, token1, LPamounts } = routerDataDecoded;
  const tokenAmount = token0.length;

  for (var i = 0; i < tokenAmount; i++) {
    const pairAddress = getUniv2PairAddress(token0[i], token1[i]);
    const queryPairData = { pair: pairAddress };

    const findAddress = await collect.findOne(queryPairData);
    if (findAddress) {
    const resetRewards = { $set: { reward: 0 } };
    await collect.updateOne(queryPairData, resetRewards);
    } else {
      const documentCount = await collect.countDocuments();
      const idNumber = documentCount + 1;
      const findID = await collect.findOne({ _id: idNumber });
      if (findID) { return; }
      const addPairData = { _id: idNumber, pair: pairAddress, token0: token0[i], token1: token1[i], reward: 0, router: CONTRACTS.SPOOKY };
      await collect.insertOne(addPairData);
      logSuccess(`New Pair Added: ${pairAddress}`);
    }
  }

    return;

};

const addNewPair = async (tx) => {
  const routerDataDecoded = parseUniv2RouterTx(tx.data);
  if (routerDataDecoded === null) { return; }
  const { amountIn, amountOutMin, path, deadline} = routerDataDecoded;

// Loop to Go Through All Pairs in Swap
for (var i = 2; i <= path.length; i++) {
  const tokenA = path[i - 2];
  const tokenB = path[i - 1];
 
  const pairAddress = getUniv2PairAddress(tokenA, tokenB);

  const lpContract = new ethers.Contract(
    pairAddress,
    ILiquidity,
    signerKey
);

// Collect Information for Database Document
const token0 = await lpContract.token0();
const token1 = await lpContract.token1();

const documentCount = await collect.countDocuments();
const idNumber = documentCount + 1;

// If Pair Already Exists... Ignore
const findAddress = await collect.findOne({pair: pairAddress});
if (findAddress) { return; }

// Don't Duplicate IDs
const findID = await collect.findOne({ _id: idNumber });
if (findID) { return; }

// Add Pair Data to MongoDB Collection
const addPairData = { _id: idNumber, pair: pairAddress, token0: token0, token1: token1, reward: 0, router: CONTRACTS.SPOOKY };
const result = await collect.insertOne(addPairData);
logSuccess(`New Pair Added: ${pairAddress}`);
  }
  return;

};

const rewardClaim3 = async (blockNumber) => {

  // Choose a random Hardhat wallet
  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
  const randomWallet = getRandomInt(50);
  const privateKeyHH = PRIVATEKEY[randomWallet];

  const forkedWallet = new ethers.Wallet(
    privateKeyHH,
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

// Gas Price Setup
const estGasPrice = await wssProvider.getGasPrice();
const gasPrice = ethers.utils.hexlify(estGasPrice);
const gasLimit = ethers.utils.hexlify(2000000);

const determineReward = async () => {
  const topThreeRewards = collect.find({ reward: { $ne:  "0" }}).sort({ reward: -1 }).limit(3);
  const topThree = await topThreeRewards.toArray();
  const pairAaddress = topThree[0].pair;
  const pairAtoken0 = topThree[0].token0;
  const pairAtoken1 = topThree[0].token1;
  const pairAbalance = topThree[0].balance;
  const pairBaddress = topThree[1].pair;
  const pairBtoken0 = topThree[1].token0;
  const pairBtoken1 = topThree[1].token1;
  const pairBbalance = topThree[1].balance;
  const pairCaddress = topThree[2].pair;
  const pairCtoken0 = topThree[2].token0;
  const pairCtoken1 = topThree[2].token1;
  const pairCbalance = topThree[2].balance;

  // Filter Previous Claims Within a 60 Block Window
  const blockSpace = blockNumber - 60;
  const queryAddress = await claimsDB.findOne({pair: pairAaddress, block: {$gt: blockSpace}});
  if (queryAddress) { return; }
  const queryAddressB = await claimsDB.findOne({pair: pairBaddress, block: {$gt: blockSpace}});
  if (queryAddressB) { return; }
  const queryAddressC = await claimsDB.findOne({pair: pairCaddress, block: {$gt: blockSpace}});
  if (queryAddressC) { return; }

  const calcTargetRewards = await booBrewContract.convertMultiple([pairAtoken0, pairBtoken0, pairCtoken0], [pairAtoken1, pairBtoken1, pairCtoken1], [pairAbalance, pairBbalance, pairCbalance], {gasPrice: gasPrice, gasLimit: gasLimit});
  const callTargetResult = await calcTargetRewards.wait();
  const gasUsed = callTargetResult.gasUsed; // Close Est. of Gas Used
  const booTokenBalance = await tokenContract.balanceOf(forkedWallet.address);
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


  const profitCalculation = ftmOut - gasCost.add(gasCost.div(5));
  const actualProfit = ftmOut - gasCost;

  if (profitCalculation > 0) { 
  logDebug("==========================================");
  logDebug("Profit in FTM:", actualProfit);

  const newClaimA = { pair: pairAaddress, block: blockNumber };
  const addClaimA = await claimsDB.insertOne( newClaimA );  
  const newClaimB = { pair: pairBaddress, block: blockNumber };
  const addClaimB = await claimsDB.insertOne( newClaimB );  
  const newClaimC = { pair: pairCaddress, block: blockNumber };
  const addClaimC = await claimsDB.insertOne( newClaimC );

  const booBrewContractLive = new ethers.Contract(
    CONTRACTS.BOOBREWCONTRACT,
    IBooBrew,
    searcherWallet
  );

  logTrace("Submitting Claim...");
  const claimBooReward = await booBrewContractLive.convertMultiple([pairAtoken0, pairBtoken0, pairCtoken0], [pairAtoken1, pairBtoken1, pairCtoken1], [pairAbalance, pairBbalance, pairCbalance], {gasPrice: gasPrice, gasLimit: gasLimit});
  logTrace("Top Three Claim Submitted");
  const claimRect = await claimBooReward.wait();
  logInfo(`Boo Claimed!`)
  logInfo(`Transaction: https://ftmscan.com/tx/${claimRect.transactionHash}`);
  }
  return;
};

  try {
    await determineReward();
  } catch(e) {}
  return;
};

const rewardClaim2 = async (blockNumber) => {

  // Choose a random Hardhat wallet
  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
  const randomWallet = getRandomInt(50);
  const privateKeyHH = PRIVATEKEY[randomWallet];

  const forkedWallet = new ethers.Wallet(
    privateKeyHH,
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

// Gas Price Setup
const estGasPrice = await wssProvider.getGasPrice();
const gasPrice = ethers.utils.hexlify(estGasPrice);
const gasLimit = ethers.utils.hexlify(2000000);

const determineReward = async () => {
  const topTwoRewards = collect.find({ reward: { $ne:  "0" }}).sort({ reward: -1 }).limit(2);
  const topTwo = await topTwoRewards.toArray();
  const pairAaddress = topTwo[0].pair;
  const pairAtoken0 = topTwo[0].token0;
  const pairAtoken1 = topTwo[0].token1;
  const pairAbalance = topTwo[0].balance;
  const pairBaddress = topTwo[1].pair;
  const pairBtoken0 = topTwo[1].token0;
  const pairBtoken1 = topTwo[1].token1;
  const pairBbalance = topTwo[1].balance;

  // Filter Previous Claims Within a 60 Block Window
  const blockSpace = blockNumber - 60;
  const queryAddress = await claimsDB.findOne({pair: pairAaddress, block: {$gt: blockSpace}});
  if (queryAddress) { return; }
  const queryAddressB = await claimsDB.findOne({pair: pairBaddress, block: {$gt: blockSpace}});
  if (queryAddressB) { return; }

  const calcTargetRewards = await booBrewContract.convertMultiple([pairAtoken0, pairBtoken0], [pairAtoken1, pairBtoken1], [pairAbalance, pairBbalance], {gasPrice: gasPrice, gasLimit: gasLimit});
  const callTargetResult = await calcTargetRewards.wait();
  const gasUsed = callTargetResult.gasUsed; // Close Est. of Gas Used
  const booTokenBalance = await tokenContract.balanceOf(forkedWallet.address);
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


  const profitCalculation = ftmOut - gasCost.add(gasCost.div(3));
  const actualProfit = ftmOut - gasCost;

  if (profitCalculation > 0) { 
  logDebug("==========================================");
  logDebug("Profit in FTM:", actualProfit);

  const newClaimA = { pair: pairAaddress, block: blockNumber };
  const addClaimA = await claimsDB.insertOne( newClaimA );  
  const newClaimB = { pair: pairBaddress, block: blockNumber };
  const addClaimB = await claimsDB.insertOne( newClaimB );

  const booBrewContractLive = new ethers.Contract(
    CONTRACTS.BOOBREWCONTRACT,
    IBooBrew,
    searcherWallet
  );

  // const transactionPendingCount = await wssProvider.getTransactionCount(searcherWallet.address, "pending");
  // const transactionCount = await wssProvider.getTransactionCount(searcherWallet.address);
  //  if (transactionCount !== transactionPendingCount) { logError("Filtered"); return; }

  logTrace("Submitting Claim...");
  const claimBooReward = await booBrewContractLive.convertMultiple([pairAtoken0, pairBtoken0], [pairAtoken1, pairBtoken1], [pairAbalance, pairBbalance], {gasPrice: gasPrice, gasLimit: gasLimit});
  logTrace("Top Two Claim Submitted");
  const claimRect = await claimBooReward.wait();
  logInfo(`Boo Claimed!`)
  logInfo(`Transaction: https://ftmscan.com/tx/${claimRect.transactionHash}`);
  }
  return;
};

  try {
    await determineReward();
  } catch(e) {}
  return;
};

const rewardClaim1 = async (pairAddress, blockNumber) => {

  // Filter Previous Claims Within a 60 Block Window
  const blockSpace = blockNumber - 60;
  const queryAddress = await claimsDB.findOne({pair: pairAddress, block: {$gt: blockSpace}});
  if (queryAddress) { return; }

  // Choose a random Hardhat wallet
  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
  const randomWallet = getRandomInt(50);
  const privateKeyHH = PRIVATEKEY[randomWallet];

  const forkedWallet = new ethers.Wallet(
    privateKeyHH,
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

// Gas Price Setup
const estGasPrice = await wssProvider.getGasPrice();
const gasPrice = ethers.utils.hexlify(estGasPrice);
const gasLimit = ethers.utils.hexlify(2000000);

const determineReward = async () => {
  const targetPair = await collect.findOne( { pair: pairAddress } );
  const targetToken0 = targetPair.token0;
  const targetToken1 = targetPair.token1;
  const calcTargetRewards = await booBrewContract.convertMultiple([targetToken0], [targetToken1], [], {gasPrice: gasPrice, gasLimit: gasLimit});
  const callTargetResult = await calcTargetRewards.wait();
  const gasUsed = callTargetResult.gasUsed; // Close Est. of Gas Used
  const booTokenBalance = await tokenContract.balanceOf(forkedWallet.address);
  const booReward = parseInt(booTokenBalance);
  const gasCost = ethers.BigNumber.from(estGasPrice.mul(gasUsed));
  const pairQuery = { pair: pairAddress };
  const newBalance = { $set: { "reward": booReward } };
  await collect.updateOne(pairQuery, newBalance);

  // Find Value of BOO in FTM
  const routerContractLive = new ethers.Contract(
    CONTRACTS.SPOOKY,
    IPancakeswapV2RouterABI,
    searcherWallet
  );

  const booFTMPath = [TOKENS.BOO, TOKENS.WFTM];
  const calcAmountOut = await routerContractLive.getAmountsOut(booTokenBalance, booFTMPath);
  const ftmOut = calcAmountOut[1];

  const profitCalculation = ftmOut - gasCost.add(gasCost.div(2));
  const actualProfit = ftmOut - gasCost;

  if (profitCalculation > 0) { 
  logDebug("==========================================");
  logDebug("Profit in FTM:", actualProfit);

  const newClaim = { pair: pairAddress, block: blockNumber };
  const addClaim = await claimsDB.insertOne( newClaim );

  const booBrewContractLive = new ethers.Contract(
    CONTRACTS.BOOBREWCONTRACT,
    IBooBrew,
    searcherWallet
  );

  // const transactionPendingCount = await wssProvider.getTransactionCount(searcherWallet.address, "pending");
  // const transactionCount = await wssProvider.getTransactionCount(searcherWallet.address);
  //  if (transactionCount !== transactionPendingCount) { logError("Filtered"); return; }

  logTrace("Submitting Claim...");
  const claimBooReward = await booBrewContractLive.convertMultiple([targetToken0], [targetToken1], [], {gasPrice: gasPrice, gasLimit: gasLimit});
  logTrace("Claim Submitted");
  const claimRect = await claimBooReward.wait();
  logInfo(`Boo Claimed!`)
  logInfo(`Transaction: https://ftmscan.com/tx/${claimRect.transactionHash}`);
  }
};

  try {
    await determineReward();
  } catch(e) {}
  return;
};

const processBlock = async (blockNumber) => {

  const documentCount = await collect.countDocuments();

  for (var i = 1; i < documentCount; i++) {
    const findDocument = await collect.findOne({ _id: i });
    const pairAddress = findDocument.pair;
    const currentBalance = findDocument.balance;

    const lpContract = new ethers.Contract(
      pairAddress,
      ILiquidity,
      searcherWallet
  );

    const brewBalance = await lpContract.balanceOf(CONTRACTS.BOOBREWCONTRACT);
    const updatedBalance = brewBalance.toString();

  if (currentBalance !== updatedBalance){

    await hreProvider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.RPC_URL,
            blockNumer: blockNumber,
          },
        },
      ],
    });

    const pairQuery = { _id: i };
    const newBalance = { $set: { "balance": updatedBalance } };
    const updateBalance = await collect.updateOne(pairQuery, newBalance);

    try { 
      await rewardClaim1(pairAddress, blockNumber);
    } catch(e) {
      logFatal(`Block = ${blockNumber} error ${JSON.stringify(e)}`);
    }

    try { 
      await rewardClaim2(blockNumber);
    } catch(e) {
      logFatal(`Block = ${blockNumber} error ${JSON.stringify(e)}`);
    } 

    await hreProvider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.RPC_URL,
            blockNumer: blockNumber,
          },
        },
      ],
    });

    try { 
      await rewardClaim3(blockNumber);
    } catch(e) {
      logFatal(`Block = ${blockNumber} error ${JSON.stringify(e)}`);
    } 
  }
}

  // Pull Transactions from Latest Block
  const blockData = await wssProvider.getBlockWithTransactions(blockNumber);
  const transactions = blockData.transactions;
  const txAmount = transactions.length;

  for (var i = 0; i < txAmount; i++) {
    const processTX = transactions[i];
    const txHash = processTX.hash;

  // Process TX and Get Reciept
  const [tx, txRecp] = await Promise.all([
    wssProvider.getTransaction(txHash),
    await wssProvider.waitForTransaction(txHash),
  ]);
  if (tx === null) { return; } // Confirm TX is Valid
  if (txRecp === null) { return; } // Confirm TX is Complete

  // Clear Boo Rewards When Someone Else Claims Them
  if (match(tx.to, CONTRACTS.BOOBREWCONTRACT)) { 
    await clearRewards(tx);
   }

  // Update Rewards for Each Traded Liquidity Pair
  if (match(tx.to, CONTRACTS.SPOOKY)) {
    try {
      await addNewPair(tx);
      } catch(e) {} 
    }
  }

};


const main = async () => {

  logInfo(`Listening for New Blocks...\n`);

  // Pull New Block
  wssProvider.on("block", (blockNumber) =>
  processBlock(blockNumber).catch((e) => {
    logFatal(`Block = ${blockNumber} error ${JSON.stringify(e)}`);
    })
  );
  
};

main();