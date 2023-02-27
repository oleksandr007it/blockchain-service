const {upgrades, ethers} = require("hardhat");

const SEEDUTILITY_ADDRESS = "0xb29ECC16bBb361da9497a9Bf4F5a27f8F5AbDDa1";
const DICEGAME_ADDRESS = "0xB8136c789386ff5B0EB482ba28934D5A92d4ddDC";

async function main() {

    const DiceGameV2 = await ethers.getContractFactory("DiceGame", {
        libraries: {
            SeedUtility: SEEDUTILITY_ADDRESS,
        },
    });
    const diceGame = await upgrades.upgradeProxy(DICEGAME_ADDRESS, DiceGameV2, {unsafeAllowLinkedLibraries: true});
    console.log("diceGame upgraded");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
