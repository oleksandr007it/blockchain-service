const {upgrades, ethers} = require("hardhat");


const BETSLIP_ADDRESS = "0xC23918B534041c3704E7fF1eE0BB2E7770629A19";


async function main() {
    const BetSlipsV2 = await ethers.getContractFactory("BetSlips");
    const betSlips = await upgrades.upgradeProxy(BETSLIP_ADDRESS, BetSlipsV2);
    console.log("betSlips upgraded: ", betSlips.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
