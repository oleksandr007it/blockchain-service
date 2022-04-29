const hre = require("hardhat");

async function main() {
    const BetSlips = await hre.ethers.getContractFactory("BetSlips");
    const betSlips = await BetSlips.deploy();
    await betSlips.deployed();
    console.log("betSlips.address=" + betSlips.address);

    // const ThrowDice = await hre.ethers.getContractFactory("ThrowDice");
    // const throwDice = await ThrowDice.deploy(betSlips.address);
    //
    // await throwDice.deployed();
    // console.log("throwDice.address=" + throwDice.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
