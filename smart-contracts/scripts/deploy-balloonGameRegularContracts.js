const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

const USDT_ADDRESS = "0xFFfffffF8d2EE523a2206206994597c13D831EC7";

async function main() {
  const SeedUtility = await ethers.getContractFactory("SeedUtility");
  const seedutility = await SeedUtility.deploy();
  await seedutility.deployed();

  console.log("SeedUtility Address: ", seedutility.address);

  const BetSlips = await ethers.getContractFactory("BetSlips", {
    libraries: {
      SeedUtility: seedutility.address,
    }
  });
  
  const betSlips = await BetSlips.deploy();
  await betSlips.deployed();

  console.log("BetSlips Address: ", betSlips.address);

  const BalloonGame = await ethers.getContractFactory("BalloonGame", {
    libraries: {
      SeedUtility: seedutility.address,
    }
  });
  
  const balloonGame = await BalloonGame.deploy(betSlips.address, 97);
  await balloonGame.deployed();

  await betSlips.grantGameRole(balloonGame.address);
  await betSlips.grantCompleterRole(balloonGame.address);

  console.log("BalloonGame Address: ", balloonGame.address);

  const tx = await balloonGame.setBetLimit(USDT_ADDRESS, BigNumber.from(100000), BigNumber.from(10000000), BigNumber.from(2000000));
  await tx.wait();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
