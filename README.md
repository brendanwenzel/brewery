# BooBrew $BOO Bounty Claim

SpookySwap collects protocol fees in the form of liquidity tokens and collects them in a contract they call "BooBrew".

This script was made to call the "ConvertMultiple" function on the BooBrewV3 contract. 

This function will liquidate the liquidity tokens in the BooBrew contract and then convert it all to the native SpookySwap token, $BOO.

In exchange for calling this funtion, the caller will receive 0.1% of the BOO collected. The rest will be converted to xBOO to buyback BOO tokens and reward stakers.

BooBrewV3 Contract: https://ftmscan.com/address/0x3b3fdc40582a957206aed119842f2313de9ee21b

This script will watch the SpookySwap router for new pairs being swapped to add to the database.

It will then watch each new block for changes in the LP tokens held by BooBrew.

If a change happens, the pair is run through a local Hardhat node to see if the rewards meet the profit thresholds in terms of FTM to run the convertMultiple function inside the BooBrew contract.

## Tools Used to Create This System:
- Node.js
- Ethers.js
- Hardhat Runtime Environment
- MongoDB Community Edition

### Node.js // Ethers.js

Install the dependencies with npm by issuing the following command

```shell
npm install
```

Copy the .env.example to .env and change the variables to your own.

The PRIVATE_KEY_LIVE should include the 0x prefix.

### Hardhat Runtime Environment

Hardhat is being used to simulate the bounty claim to determine how much rewards will be received from the claim.

Install HardHat - https://hardhat.org/getting-started#installation

I highly recommend giving the Hardhat documentation a read through prior to use to fully understand how it works.

Start a Hardhat Node on the Localhost with the following command on a screen to keep it running indefinitely.

```shell
screen -S hardhatNode
npx hardhat node
```

You can detach this screen once you verify that it's running properly. It should continue to run after being detached.

### MongoDB Community Edition

Install MongoDB - https://www.mongodb.com/docs/manual/administration/install-community/

MongoDB will be used to store all the liquidity pools being held by the BooBrew contract, as well as, the bounty reward information collected from Hardhat.

Once installed, there's nothing else to setup as MongoDB will create the database, collection and variables in the documents when they are populated by the script.

### Running the Script

Once you have everything setup, it's time to run the script with the following command.

```shell
cd scripts
npx hardhat run main.js --network localhost
```

### rewardsupdate.js

This script was made when there was a significant time period the main script was down. This one will update all the reward numbers and claim anything profitable in the meantime.

#### Support My Work

There are multiple ways to support my work and help me do more of this.

One is to make a donation on BNB, ETH or MATIC to 0x13e71e5507cF7292CF8202Cbde034Cd71ACbA63b

You can also hire me to customize a script for your needs. 

Telegram: @brendanwenzel
Twitter: @brendanwenzel
