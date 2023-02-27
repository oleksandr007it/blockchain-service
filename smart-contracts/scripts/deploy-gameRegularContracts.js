const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const path = require('path');
const fs = require("fs");

async function main() {
  let configFilePath = path.join(__dirname, '../cache/deploy_config.json');
  let configData;
  try {
    const jsonString = fs.readFileSync(configFilePath);
    configData = JSON.parse(jsonString);
  } catch (err) {
    console.log(err);
    return;
  }

  let gameName;
  let rtpValue;
  let betSlipsAddress;
  let minBetLimit;
  let maxBetLimit;
  let defBetLimit;

  let blockchain = configData.blockchain;
  gameName = configData[blockchain].contract;
  rtpValue = configData[blockchain].rtpValue;
  betSlipsAddress = configData[blockchain].betSlipsAddress;
  minBetLimit = configData[blockchain].minBetLimit;
  maxBetLimit = configData[blockchain].maxBetLimit;
  defBetLimit = configData[blockchain].defBetLimit;

  const SeedUtility = await ethers.getContractFactory("SeedUtility");
  const seedutility = await SeedUtility.deploy();
  await seedutility.deployed();

  console.log("SeedUtility Address: ", seedutility.address);

  if (gameName == "BetSlips") {                             // in case of deploying BetSlips contract
    const BetSlips = await ethers.getContractFactory("BetSlips", {
      libraries: {
        SeedUtility: seedutility.address,
      }
    });
    
    const betSlips = await BetSlips.deploy();
    await betSlips.deployed();
  
    console.log("BetSlips Address: ", betSlips.address);
  } else {                                                  // in case of deploying normal contract
    betSlips = await hre.ethers.getContractAt("BetSlips", betSlipsAddress);
    console.log("BetSlips Address: ", betSlipsAddress);

    const GameContract = await ethers.getContractFactory(gameName, {
      libraries: {
        SeedUtility: seedutility.address,
      }
    });
    
    const gameContract = await GameContract.deploy(betSlipsAddress, rtpValue);
    await gameContract.deployed();
    console.log(`${gameName} Address: `, gameContract.address);

    await betSlips.grantGameRole(gameContract.address);
    await betSlips.grantCompleterRole(gameContract.address);

    let USDT_ADDRESS;
    if (blockchain == "aminxtestnet"){
      USDT_ADDRESS = "0xFFfffffF8d2EE523a2206206994597c13D831EC7";
    } else if (blockchain == "bscTestnet"){
      USDT_ADDRESS = "0xffbfe5fcbeced10b385601cc78fecfc33bee237b";
    } else if (blockchain == "polygonMumbai"){
      USDT_ADDRESS = "0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832";
    }

    const tx = await gameContract.setBetLimit(USDT_ADDRESS, BigNumber.from(minBetLimit), BigNumber.from(maxBetLimit), BigNumber.from(defBetLimit));
    await tx.wait();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
