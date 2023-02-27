// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../interfaces/IBetSlips.sol";
import "./BaseGame.sol";

contract BombGame is BaseGame {

    mapping(string => bytes32) _playerChoices;

    constructor(address betSlipsAddr, uint256 rtp) {
        _betSlipsAddr = payable(betSlipsAddr);
        _rtp = rtp;
        gameCode = "bomb";
    }

    function placeBet(
        uint256 wagerAmount,
        string memory choice,
        string memory seedHash,
        address token
    ) public whenNotPaused{
        placeBetSlip(wagerAmount, choice, seedHash, token, 0, 0, 0, 0);
    }

    function placeBetWithPermit(
        uint256 wagerAmount,
        string memory choice,
        string memory seedHash,
        address token,
        uint256 deadLine,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public whenNotPaused{
        placeBetSlip(wagerAmount, choice, seedHash, token, deadLine, v, r, s);
    }

    function placeBetSlip(
        uint256 wagerAmount,
        string memory playerChoice,
        string memory seedHash,
        address token,
        uint256 deadLine,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) private {

        bytes32 gameChoice;

        if (
            keccak256(abi.encodePacked((playerChoice))) ==
            keccak256(abi.encodePacked(("RED")))
        ) {
            gameChoice = keccak256(abi.encodePacked(("RED")));
        } else if (
            keccak256(abi.encodePacked((playerChoice))) ==
            keccak256(abi.encodePacked(("BLUE")))
        ) {
            gameChoice = keccak256(abi.encodePacked(("BLUE")));
        } else {
            revert("The choice is invalid");
        }

        require(
            wagerAmount >= _betLimits[token].minAmount && wagerAmount <= _betLimits[token].maxAmount,
            "The WagerAmount is invalid"
        );

        uint256 odds = _rtp * 2;

        IBetSlips(_betSlipsAddr).placeBetSlip(
            msg.sender,
            token,
            wagerAmount,
            gameCode,
            playerChoice,
            seedHash,
            odds,
            deadLine,
            v,
            r,
            s
        );

        _playerChoices[seedHash] = gameChoice;
    }

    function revealSeed(string memory seedHash, string memory seed) public {
        require(SeedUtility.compareSeed(seedHash, seed) == true, "Invalid seed");

        IBetSlips.BetSlip memory betSlip = IBetSlips(_betSlipsAddr).getBetSlip(
            seedHash
        );

        uint256 resultNumber = SeedUtility.getHashNumberUsingAsciiNumber(seed) % 2;

        uint256 returnAmount = getReturnAmount(
            seedHash,
            betSlip.wagerAmount,
            betSlip.odds,
            resultNumber
        );

        string memory gameResult = getBombGameResult(
            resultNumber
        );

        IBetSlips(_betSlipsAddr).completeBet(
            seedHash,
            seed,
            betSlip.playerGameChoice,
            gameResult,
            returnAmount,
            betSlip.odds
        );
    }

    function getReturnAmount(
        string memory seedHash,
        uint256 wagerAmount,
        uint256 odds,
        uint256 resultNumber
    ) private view returns (uint256) {
        bytes32 playerChoice = _playerChoices[seedHash];

        uint256 returnAmount;

        if (playerChoice == keccak256(abi.encodePacked(("RED")))) {
            if (resultNumber > 0) {
                returnAmount = (wagerAmount * odds) / 100;
            } else {
                returnAmount = 0;
            }
        } else if (playerChoice == keccak256(abi.encodePacked(("BLUE")))) {
            if (resultNumber == 0) {
                returnAmount = (wagerAmount * odds) / 100;
            } else {
                returnAmount = 0;
            }
        }

        return returnAmount;
    }

    function getBombGameResult(uint256 resultNumber)
    private
    pure
    returns (string memory)
    {
        string memory gameResult;
        if (resultNumber > 0) {
            return "RED";
        } else if (resultNumber == 0)
        {
            return "BLUE";
        }

        return gameResult;
    }

}
