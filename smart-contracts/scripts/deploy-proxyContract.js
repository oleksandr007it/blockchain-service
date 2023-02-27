const hre = require("hardhat");

const IMPL_ADDRESS = "0x35fbF26847B8EF69ba506fE8d46A6388ca66f104";

async function main() {
  const Proxy = await ethers.getContractFactory("DiceGameProxy");
  const proxy = await Proxy.deploy(IMPL_ADDRESS, []);
  await proxy.deployed();

  console.log("Proxy Address: ", proxy.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });