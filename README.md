# BooBrew $BOO Bounty Claim

This script was made to call the "ConvertMultiple" function on the BooBrewV3 contract that liquidates liquidity pools collected from swap fees on SpookySwap.

BooBrewV3 Contract: https://ftmscan.com/address/0x3b3fdc40582a957206aed119842f2313de9ee21b

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
npx hardhat run fullbuild.js --network localhost
```
