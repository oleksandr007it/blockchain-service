const { upgrades, ethers } = require("hardhat");
const { BigNumber } = require("ethers");

const SEEDUTILITY_ADDRESS = "0xcf1EAaF41159143915f7439ba97d5b04D294Ed93";
const BETSLIP_ADDRESS = "0x8868cD2a8743ba5D3e575592369e42B094F9A47b";
const DICEGAME_ADDRESS = "0x5976e5c71238534C4B356cFCC3CD2Ce667d9c888";
const MINESGAME_ADDRESS = "0xCf10556327E76184f673Ed469E64B4900EA6dCD3";

async function main() {
  const BetSlipsV2 = await ethers.getContractFactory("BetSlips");
  const betSlips = await upgrades.upgradeProxy(BETSLIP_ADDRESS, BetSlipsV2);
  console.log("betSlips upgraded");

  const DiceGameV2 = await ethers.getContractFactory("DiceGame", {
    libraries: {
      SeedUtility: SEEDUTILITY_ADDRESS,
    },
  });
  const diceGame = await upgrades.upgradeProxy(DICEGAME_ADDRESS, DiceGameV2, {unsafeAllowLinkedLibraries: true});
  console.log("diceGame upgraded");

  await betSlips.grantGameRole(diceGame.address);
  await betSlips.grantCompleterRole(diceGame.address);

  const MinesGameV2 = await ethers.getContractFactory("MinesGameV2", {
    libraries: {
      SeedUtility: SEEDUTILITY_ADDRESS,
    },
  });
  const minesGame = await upgrades.upgradeProxy(MINESGAME_ADDRESS, MinesGameV2, {unsafeAllowLinkedLibraries: true});
  console.log("minesGame upgraded");

  await betSlips.grantGameRole(minesGame.address);
  await betSlips.grantCompleterRole(minesGame.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
