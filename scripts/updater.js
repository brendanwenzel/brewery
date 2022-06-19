import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { formatUnits, parseUnits } from "@ethersproject/units";
import { ethers } from "ethers";

import { CONTRACTS, ipcProvider, TOKENS, wftmContract, wssProvider, searcherWallet, signerKey, provider, pancakeswapV2Contract, booBrewContract } from "./src/constants.js";
import { logDebug, logError, logFatal, logInfo, logSuccess, logTrace } from "./src/logging.js";
import { calcSandwichOptimalIn, calcSandwichState, binarySearch } from "./src/numeric.js";
import { parseUniv2RouterTx, parseTokenCode } from "./src/parse.js";
import { getUniv2ExactWethTokenMinRecv, getUniv2PairAddress, getUniv2Reserve, getUniv2DataGivenIn} from "./src/pcv2.js";
import { match, stringifyBN } from "./src/utils.js";

const { MongoClient } = require('mongodb');

// Initialize MongoDB and Collection
const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);
const db = client.db("liquidity");
const collect = db.collection("spooky");
try {
  await client.connect();
  logInfo("MongoDB Connected");
} catch (e) {
  console.error(e);
}



const updater = async (txHash, tx) => {
  if (!match(tx.to, CONTRACTS.BOO_BREW)) { return; } // BooBrew Contract
  const routerDataDecoded = parseUniv2RouterTx(tx.data);
  if (routerDataDecoded === null) { return; }
  const { token0, token1, LPamounts } = routerDataDecoded;
  const tokenAmount = token0.length;
  const ILiquidity = require("./src/abi/ILiquidityPair.json");

  for (var i = 0; i < tokenAmount; i++) {
    const pairAddress = getUniv2PairAddress(token0[i], token1[i]);;

    const lpContract = new ethers.Contract(
      pairAddress,
      ILiquidity,
      signerKey
    );
    
    const tokenBalance = await lpContract.balanceOf(CONTRACTS.BOO_BREW);
    const lpBalance = tokenBalance.toString();
    const queryPairData = { pair: pairAddress };
    const newPairData = { $set: { balance: lpBalance } };
    const result = await collect.updateOne(queryPairData, newPairData);
    const resetRewards = { $set: { reward: "0" } };
    const reset = await collect.updateOne(queryPairData, resetRewards);

    logInfo(`Reset Pair: ${pairAddress} with 0 Reward`);
    
    logDebug("==========================================");

  }

    return;

};

const middleMan = async (blockNumber) => {

  const blockData = await wssProvider.getBlockWithTransactions(blockNumber);
  const transactions = blockData.transactions;
  const txAmount = transactions.length;
  // const transaction1 = transactions[0];
  // logDebug(JSON.stringify(transaction1));
  // process.exit(1);
  for (var i = 0; i < txAmount; i++) {

    const processTX = transactions[i];
    const txHash = processTX.hash;
    const sendtoForkNetwork = updater(txHash, processTX);

  }

};

const main = async () => {
  wssProvider.on("block", (blockNumber) =>
  middleMan(blockNumber).catch((e) => {
  })
);
}

main();
