// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "./GameInterface.sol";
import "./GameOwnable.sol";

/**
 * @title ac GameInterface
 * @dev Game unified interface
 */
contract Game001 is GameInterface, GameOwnable {

    constructor(){
        owner = msg.sender;
    }
    event SetRandom(uint256 blockNumber, uint256 seed, uint256 random);

    function setRandom(uint256 blockNumber, uint256 seed, uint256 random) override external {
        emit SetRandom(blockNumber, seed, random);
    }
}