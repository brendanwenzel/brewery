const hre = require("hardhat");
const ethers = hre.ethers;
require("dotenv").config();
const chalk = require("chalk");

const wssProvider = new ethers.providers.WebSocketProvider(process.env.RPC_URL_WSS);
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

const IBooBrew = require("/home/liquidity/src/abi/IBooBrew.json");
const rpcProvider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
const TOKENS = {
  WFTM: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
  USDC: "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75",
  BOO: "0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE",
};

const forkNetwork = async (txHash) => {

  const [tx, txRecp] = await Promise.all([
    wssProvider.getTransaction(txHash),
    wssProvider.getTransactionReceipt(txHash),
  ]);

  if (tx === null) { return; } // Confirm TX is Valid

  if (!match(tx.to, "0xF491e7B69E4244ad4002BC14e878a34207E38c29")) { return; } // SpookySwap Router

  const blockToFork = await wssProvider.getBlockNumber();    
  const hreProvider = hre.network.provider;

  const forkedWallet = new ethers.Wallet(
    process.env.PRIVATE_KEY,
    rpcProvider
  );
  const signerKey = forkedWallet.connect(rpcProvider);


  const booBrewContract = new ethers.Contract(
    "0x3B3fdC40582a957206Aed119842F2313DE9eE21b",
    IBooBrew,
    forkedWallet
  );

  const tokenContract = new ethers.Contract(
    TOKENS.BOO,
    [
        'function balanceOf(address account) public view returns (uint256)',
    ],
    signerKey
);

//  const blockNum = await rpcProvider.getBlockNumber();
//  const strLogPrefix = `Block # = ${blockNum}`;
//  logTrace(strLogPrefix);

  // Get Information from Database
  const documentCount = await collect.countDocuments();

  for (let i = 1; i <= documentCount; i++) {

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

  const rewardCalculation = async (i) => {
  
// Target Pair (TP) for Reward Calculation
  const targetPair = await collect.findOne( { $and: [ { _id: i }, { balance: { $gt: 0 } } ] } );
  const targetAddress = targetPair.pair;
  const targetToken0 = targetPair.token0;
  const targetToken1 = targetPair.token1;
  const targetBalanceRaw = targetPair.balance;
  const targetBalance = JSON.stringify(targetBalanceRaw);

  const estGasPrice = await wssProvider.getGasPrice();
  const gasPrice = ethers.utils.hexlify(estGasPrice);
  const gasLimit = ethers.utils.hexlify(2000000);
  const calcTargetRewards = await booBrewContract.convertMultiple([targetToken0], [targetToken1], [], {gasPrice: gasPrice, gasLimit: gasLimit});
  const callTargetResult = await calcTargetRewards.wait();
  const booTokenBalance = await tokenContract.balanceOf(searcherWallet.address);
  const booReward = parseInt(booTokenBalance);

  const queryDocument = { _id: i };
  const newPairData = { $set: { reward: booReward } };
  const result = await collect.updateOne(queryDocument, newPairData);
  const booTokenRewardFormat = ethers.utils.formatUnits(booTokenBalance);
  logInfo(`Updated Pair: ${targetAddress} with new reward ${booTokenRewardFormat}`);

  return booTokenRewardFormat;
  };
  try {
  const rewardFunc = await rewardCalculation(i);
  // logInfo(`Boo Profit: ${rewardFunc}`);
  } catch(e) {}
  // Add TP Reward to Document

  }

  // process.exit(1);
  return;

};

const middleMan = async (txHash) => {

  try {
    const sendtoForkNetwork = forkNetwork(txHash);
  } catch (e) {}

};

const main = async () => {

  const origLog = console.log;
  console.log = function (obj, ...placeholders) {
    if (typeof obj === "string")
      placeholders.unshift(obj);
    else {
 
      placeholders.unshift(obj);
      placeholders.unshift("[" + new Date().toISOString() + "] %j");
    }

    origLog.apply(this, placeholders);
  };

  logInfo(`Listening to mempool...\n`);

  wssProvider.on("pending", (txHash) =>
  middleMan(txHash).catch((e) => {
    logFatal(`txhash=${txHash} error`);
    })
  );
  
};

main();