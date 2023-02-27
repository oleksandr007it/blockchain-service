const { upgrades, ethers } = require("hardhat");
const { BigNumber } = require("ethers");

const USDT_ADDRESS = "0xFFfffffF8d2EE523a2206206994597c13D831EC7";

async function main() {
  const SeedUtility = await ethers.getContractFactory("SeedUtility");
  const seedutility = await SeedUtility.deploy();
  await seedutility.deployed();

  console.log("SeedUtility Address: ", seedutility.address);

  const BetSlips = await ethers.getContractFactory("BetSlips");
  const betSlips = await upgrades.deployProxy(BetSlips, { kind: 'uups' });
  await betSlips.deployed();

  console.log("BetSlips Address: ", betSlips.address);

  const DiceGame = await ethers.getContractFactory("DiceGame", {
    libraries: {
      SeedUtility: seedutility.address,
    }
  });
  
  const diceGame = await upgrades.deployProxy(DiceGame, [betSlips.address, 97], {unsafeAllowLinkedLibraries: true, kind: 'uups'});
  await diceGame.deployed();

  await betSlips.grantGameRole(diceGame.address);
  await betSlips.grantCompleterRole(diceGame.address);

  console.log("DiceGame Address: ", diceGame.address);

  const tx1 = await diceGame.setBetLimit(USDT_ADDRESS, BigNumber.from(100000), BigNumber.from(10000000), BigNumber.from(2000000));
  await tx1.wait();


  const MinesGame = await ethers.getContractFactory("MinesGame", {
    libraries: {
      SeedUtility: seedutility.address,
    }
  });
  
  const minesGame = await upgrades.deployProxy(MinesGame, [betSlips.address, 97], {unsafeAllowLinkedLibraries: true, kind: 'uups'});
  await minesGame.deployed();

  await betSlips.grantGameRole(minesGame.address);
  await betSlips.grantCompleterRole(minesGame.address);

  console.log("MinesGame Address: ", minesGame.address);

  const tx2 = await minesGame.setBetLimit(USDT_ADDRESS, BigNumber.from(100000), BigNumber.from(10000000), BigNumber.from(2000000));
  await tx2.wait();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
