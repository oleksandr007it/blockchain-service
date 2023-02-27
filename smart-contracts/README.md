
# Basic Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
npx hardhat run scripts/deploy-contracts.js --network aminxtestnet

```
# Docker build images

```shell
docker build -f dockerfiles/Dockerfile.listener  -t blockchain-listener .
docker build -f dockerfiles/Dockerfile.facade  -t blockchain-facade .
```

# Upgrade Contract

1. Make the upgradaeble contract from the original one.
    - Add openzeppelin library below:
	    > import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
    - Add initialize function
	    > function initialize() initializer external{
	        __UUPSUpgradeable_init();
	    }
    - Add authorizeUpgrade function 
	    > function _authorizeUpgrade(address) internal override onlyOwner {}
2. Write "deploy-contract.js" file.
    Set the kind of proxy contract. Default is for Transparent, and { kind: 'uups' } is for UUPS.
    > const betSlips = await upgrades.deployProxy(BetSlips, { kind: 'uups' });
3. Deploy the proxy contract.
    > npx hardhat run scripts/deploy-contracts.js --network aminxtestnet
4. Upgrade the contract using the address of proxy contract.
    - In the file "upgrade-contracts.js", enter the UTILITY_ADDRESS, BETSLIP_ADDRESS, DICEGAME_ADDRESS and MINESGAME_ADDRESS  with the addresses of the deployed proxy contracts.
    - Once we have a new version of the contract code and we want to upgrade a proxy, we can use upgrades.upgradeProxy. It's no longer necessary to specify kind: 'uups' since it is now inferred from the proxy address.
	    > const betSlips = await upgrades.upgradeProxy(BETSLIP_ADDRESS, BetSlipsV2);
    - Run belowed command.
	    > npx hardhat run scripts/upgrade-contracts.js --network aminxtestnet
    
>  note: 
The files "BetSlipsV2.sol", "DiceGameV2.sol" and "MinesGameV2.sol"  are the upgraded contracts of "BetSlips.sol", "DiceGame.sol" and "MinesGame.sol".
    Once the proxy contract(the original contract) is deployed, it can be upgraded using the address of proxy contract every next time.


# Verify Contract

1. Flatten the source conntract file.
    - Run following command:
        > npx hardhat flatten "source file" >> "destination file"
    - Delete the comment lines "// SPDX-License-Identifier: MIT" remaining one line at the top of the flatten file.
2. Verify the contract using flatten file.
    - On contract creation, you will receive an address to check a pending transaction. If it does not redirect you to aminoxtestnet, go to aminoxtestnet.blockscout.alphacarbon.network, verify you are on the chain where the contract was deployed, and type the contract's address into the search bar. Your contract details should come up.
    - Select the Code tab to view the bytecode, click the Verify & Publish button. You will see several options for verification. Here, choose the option "Via flattened source code".
    - On the next window, you will set some options and informations and click the "Verify and Publish" button.
        * Contract Address: The 0x address supplied on contract creation. 
        * Contract Name: Name of the class whose constructor was called in the .sol file. For example, in contract MyContract c. {.. MyContract is the contract name. 
        * Include Nightly Builds: Yes if you want to show nightly builds.
        * Compiler: derived from the first line in the contract pragma solidity X.X.X. Use the corresponding compiler version rather than the nightly build.
        * EVM Version: default
        * Optimization: If you enabled optimization during compilation, check yes.
        * Optimization Runs: 200 is the Solidity Compiler default value. Only change if you changed this value while compiling.
        * Enter the Solidity Contract Code: You may need to flatten your solidity code if it utilizes a library or inherits dependencies from another contract. We recommend the POA solidity flattener or the truffle flattener.
        * Try to fetch constructor arguments automatically: If similar contracts exist these may be available.
        * ABI-encoded Constructor Arguments: See this page for more info.
        * Add Contract Libraries: Enter the name and 0x address for any required libraries called in the called in the .sol file.
    - If all goes well, you will see a checkmark  next to Code in the code tab, and an additional tab called Read Contract. The contract name will now appear in BlockScout with any transactions related to your contract.


# How to develop Game Contract
## 1. The main structure of DAPP project
```
    smart-contracts
    |
    +--> contracts
    |   |
    |   +--> betslip
    |   +--> games
    |   +--> interfaces
    |   +--> libraries
    |   +--> proxy
    |
    +--> scripts
    +--> test
    +--> hardhat.config.js
    
```
As you can see above the diagram, the hardhat smart-contract project consists of several folders and files such as contracts, scripts, test and hardhat.config.js.
- In the contracts folder, there are source files of smart contracts, which is composed of betslip, games, interfaces, libraries and proxy as shown above.
    * In the betslip folder, there is "BetSlips.sol" that can perform the placing bet for game.
    * In the games folder, there are game contract files such as StairsGame.sol, DiceGame.sol and so on.
    * In the interfaces folder, there are interface files related with betslips.
    * In the libraries folder, there is SeedUtility.sol that contains useful methods for contracts.
    * In the proxy folder, there are some proxy contract files for creating upgradeable contract in the AminoX testnet.
- In the scripts folder, there are script files for deployment of contracts.
- In the test folder, there are script files for test of contracts.
- Using the hardhat.config.js file, we can set the hardhat project configurations such as solidity compiler version, network settings and so on.

## 2. To create new game contract
We can implement creating new game contract in the contracts/games.
- The main structure of game contract
```
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;                     // setting solidity compiler version

import "../interfaces/IBetSlips.sol";
import "../games/BaseGame.sol";

contract BalloonGame is BaseGame {          // inherited from the BaseGame
    mapping(string => uint8) _playerChoices; // contain the info related with player choices in the game

    constructor(address betSlipsAddr, uint256 rtp) {  // declare the constructor of contract using betslip contract address and rtp value
        _betSlipsAddr = payable(betSlipsAddr);
        _rtp = rtp;
        gameCode = "balloon";
    }

    function getOdds(uint8 amountOfPumps)   // get odds value
        private
        view
        returns (uint256)
    {
        ...
    }

    function getReturnAmount(uint256 balloonLimitHashNumber)    //get return amount
        private
        view
        returns (uint256)
    {
        ...        
    }

    function revealSeed(                // when the game is completed, it will be invoked
        string memory seedHash, 
        string memory seed, 
        uint8 amountOfPumps 
    ) public {
        require(SeedUtility.compareSeed(seedHash, seed) == true, "Invalid seed");
        require((amountOfPumps > 0 && amountOfPumps <= 6), "Invalid amount of pumps");

        betSlip.odds = getOdds();
        returnAmount = getReturnAmount();

        ...

        IBetSlips(_betSlipsAddr).completeBet(
            seedHash,
            seed,
            betSlip.playerGameChoice,
            gameResult,
            returnAmount,
            betSlip.odds
        );
    }

    function placeBet(                  // place bet amount in the game
        uint256 wagerAmount,
        string memory seedHash,
        address token
    ) public whenNotPaused{
        placeBetSlip(wagerAmount, seedHash, token, 0, 0, 0, 0);
    }

    function placeBetWithPermit(        // place bet amount in the game
        uint256 wagerAmount,
        string memory seedHash,
        address token,
        uint256 deadLine,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public whenNotPaused{
        placeBetSlip(wagerAmount, seedHash, token, deadLine, v, r, s);
    }

    function placeBetSlip(
        uint256 wagerAmount,
        string memory seedHash,
        address token,
        uint256 deadLine,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) private {
        uint256 minAmount = _betLimits[token].minAmount;
        uint256 maxAmount = _betLimits[token].maxAmount;

        require(
            wagerAmount >= minAmount && wagerAmount <= maxAmount,
            "The WagerAmount is invalid"
        );

        IBetSlips(_betSlipsAddr).placeBetSlip(
            msg.sender,
            token,
            wagerAmount,
            gameCode,
            playerGameChoice,
            seedHash,
            0,
            deadLine,
            v,
            r,
            s
        );
    }
}

```
- As you can see above, all of the game contracts are inherited from the BaseGame contract that contains information such as rtp, betlimit values and so on.
- Game contract has some functionalities that can place bet amount when the game starts, check the game win/lose, and also calculate the reward amount, then send reward amount to players when the game is finished.
## 3. To deploy the new contract
- Using individual deployment script
    > npx hardhat run scripts/deploy_BalloonGame.js --network [blockchain network]
- Using automatic script
    * At the first time, we should deploy the betslips contract, so that its address will be used when the game contract is deployed. Once Betslips contract is deployed, its address will be automatically used for deployment of game contract.
    > node scripts/automatic-deployAndVerifyContract.js -f BetSlips -n [blockchain network]
    * Then, we can deploy the game contract.
    > node scripts/automatic-deployAndVerifyContract.js -f DiceGame -n [blockchain network]
    * Using the following command, it can be shown how to use the automatic script.
    > node scripts/automatic-deployAndVerifyContract.js -h
## 4. To test for the new contract
- The main structure of test file

```
require("@nomiclabs/hardhat-waffle");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const crypto = require("crypto");

describe("DiceGame", () => {
  let owner;
  let betSlips;
  let diceGame;
  let seedutility;
  let USDT;
  let tx;

  before(async () => {      // Deploy the contract in order to test
    [owner] = await ethers.getSigners();
    
    // deploy the token for test
    contractFactory = await ethers.getContractFactory("Token");
    USDT = await contractFactory.deploy(1000000000000);

    // deploy the SeedUtility contract
    const SeedUtility = await ethers.getContractFactory("SeedUtility");
    seedutility = await SeedUtility.deploy();
    await seedutility.deployed();

    // deploy the BetSlips contract based on the address of SeedUtility contract
    const BetSlips = await ethers.getContractFactory("BetSlips", {
      libraries: {
        SeedUtility: seedutility.address,
      },
    });

    betSlips = await BetSlips.deploy();
    await betSlips.deployed();

    // deploy the Game contract based on the address of SeedUtility contract, BetSlips contract and rtp
    const DiceGame = await ethers.getContractFactory("DiceGame", {
      libraries: {
        SeedUtility: seedutility.address,
      },
    });

    diceGame = await DiceGame.deploy(betSlips.address, 97);
    await diceGame.deployed();

    // grant game role and completer role to game contract
    await betSlips.grantGameRole(diceGame.address);
    await betSlips.grantCompleterRole(diceGame.address);
  });

  it("is deployed", async () => {
    expect(await diceGame.getBetSlipsAddress()).to.equal(betSlips.address);
    expect(await USDT.totalSupply()).to.equal(1000000000000);
    expect(await USDT.balanceOf(owner.address)).to.equal(1000000000000);
  });

    // test for functionalities of the contract
  describe("Set and Get Rtp", () => { 
    it("set and get Rtp", async () => {
      await expect(diceGame.setRtp(95))
        .to.emit(diceGame, 'rtpChangedEvent')
        .withArgs('dice', 95);
      expect(await diceGame.getRtp()).to.equal(95);

      await expect(diceGame.setRtp(97))
        .to.emit(diceGame, 'rtpChangedEvent')
        .withArgs('dice', 97);
      expect(await diceGame.getRtp()).to.equal(97);
    });
  });

  ...
});
```

It can be implemented to test for the new contract.
> npx hardhat test test/1.DiceGame-Test.js
- https://hardhat.org/hardhat-runner/docs/guides/test-contracts
- https://hardhat.org/tutorial/testing-contracts