// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

/**
 * @title ac GameInterface
 * @dev Game unified interface
 */
interface GameInterface {
    function setRandom(uint256 blockNumber, uint256 seed, uint256 random) external;
}