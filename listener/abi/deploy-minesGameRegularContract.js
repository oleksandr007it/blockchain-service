const hre = require("hardhat");
const { BigNumber } = require("ethers");

const USDT_ADDRESS = "0xFFfffffF8d2EE523a2206206994597c13D831EC7";
const BETSLIP_ADDRESS = "0x9e4bAA9eE9B583fd8A392Bc3b3a5281FfCD6a575";
const SEEDUTILITY_ADDRESS = "0xf7487Efa051660b31f1a3E40c310882AE33a916b";

async function main() {

  const MinesGame = await hre.ethers.getContractFactory("MinesGame", {
    libraries: {
      SeedUtility: SEEDUTILITY_ADDRESS,
    }
  });
  
  const minesGame = await MinesGame.deploy(BETSLIP_ADDRESS, 97);
  await minesGame.deployed();

  const BetSlips = await hre.ethers.getContractFactory("BetSlips");
  const betSlips = await BetSlips.attach(BETSLIP_ADDRESS);
  
  await betSlips.grantGameRole(minesGame.address);
  await betSlips.grantCompleterRole(minesGame.address);

  console.log("MinesGame Address: ", minesGame.address);

  const tx1 = await minesGame.setBetLimit(USDT_ADDRESS, BigNumber.from(100000), BigNumber.from(10000000), BigNumber.from(2000000));
  await tx1.wait();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
