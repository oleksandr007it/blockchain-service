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

  const PlinkoGame = await ethers.getContractFactory("PlinkoGame", {
    libraries: {
      SeedUtility: seedutility.address,
    }
  });
  
  const plinkoGame = await PlinkoGame.deploy(betSlips.address, 97);
  await plinkoGame.deployed();

  await betSlips.grantGameRole(plinkoGame.address);
  await betSlips.grantCompleterRole(plinkoGame.address);

  console.log("PlinkoGame Address: ", plinkoGame.address);

  const tx = await plinkoGame.setBetLimit(USDT_ADDRESS, BigNumber.from(100000), BigNumber.from(10000000), BigNumber.from(2000000));
  await tx.wait();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
