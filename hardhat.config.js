require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ganache");

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

module.exports = {
  solidity: "0.8.4",
  networks: {
    aminxtestnet: {
      url: `https://aminoxtestnet.node.alphacarbon.network`,
      chainId: 13370,
      accounts: [
        `6bf8bc0621c53eb141371538360732fdc6481ab45491381a2cc66bff94cfd0a9`,
        `f31d0790864027f05ad80d9ddfa203e49a709658edb2a1b601305c3d0508a5fb`
      ],
    },
    alphacarbon: {
      url: `https://leucine0.node.alphacarbon.network`,
      accounts: [`f5fa6d6aa1d301c008a98e96cc99e0d6031a3180a0d490c388d48136d72bc7ce`],
    },
    local: {
      url: `http://localhost:9933`,
      accounts: [`5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133`],
    },
  },
};
