require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ganache");
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-etherscan");
require('@openzeppelin/hardhat-upgrades');
require('solidity-coverage');
require('./scripts/.env');

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

module.exports = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 50,
      },
    },
  },
  networks: {
    aminxtestnet: {
      url: `https://aminoxtestnet.node.alphacarbon.network`,
      chainId: 13370,
      accounts: [
        `0x${process.env.PRIVATE_KEY1}`,
        `0x${process.env.PRIVATE_KEY2}`
      ],
    },
    alphacarbon: {
      url: `https://leucine0.node.alphacarbon.network`,
      accounts: [`0x${process.env.PRIVATE_KEY3}`],
    },
    local: {
      url: `http://localhost:9933`,
      accounts: [`0x${process.env.PRIVATE_KEY4}`],
      gas: "auto",
    },
    bscTestnet: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545`,
      chainId: 97,
      accounts: [`0x${process.env.PRIVATE_KEY1}`],
    },
    polygonMumbai: {
      url: `https://rpc-mumbai.maticvigil.com`,
      chainId: 80001,
      accounts: [`0x${process.env.PRIVATE_KEY1}`],
    },
  },
  etherscan: {
    apiKey: {
      bscTestnet: process.env.BSCTESTNET_API_KEY,
      polygonMumbai: process.env.POLYGONMUMBAI_API_KEY
    }
  },
};
