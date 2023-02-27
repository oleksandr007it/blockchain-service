// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../interfaces/IBetSlips.sol";
import "./BaseGame.sol";

contract DiceGame is BaseGame {

    enum DiceGameChoice {
        OVER,
        UNDER
    }

    struct DicePlayerChoice {
        DiceGameChoice choice;
        uint256 playerNumber;
    }

    mapping(string => DicePlayerChoice) _playerChoices;

    uint256 constant MIN_LUCKY_NUMBER = 0;
    uint256 constant MAX_LUCKY_NUMBER = 99;
    uint256 constant LUCKY_NUMBERS_AMOUNT = 100;

    constructor(address betSlipsAddr, uint256 rtp) {
        _betSlipsAddr = payable(betSlipsAddr);
        _rtp = rtp;
        gameCode = "dice";
    }

    function getOdds(uint256 playerNumber, uint8 diceChoice)
        private
        view
        returns (uint256)
    {
        uint256 probability = 1;

        if (diceChoice == uint8(DiceGameChoice.OVER)) {
            probability = MAX_LUCKY_NUMBER - playerNumber;
        } else if (diceChoice == uint8(DiceGameChoice.UNDER)) {
            probability = playerNumber - MIN_LUCKY_NUMBER;
        }

        uint256 odds = _rtp * LUCKY_NUMBERS_AMOUNT / probability;

        return odds;
    }

    function revealSeed(string memory seedHash, string memory seed) public {
        require(SeedUtility.compareSeed(seedHash, seed) == true, "Invalid seed");

        IBetSlips.BetSlip memory betSlip = IBetSlips(_betSlipsAddr).getBetSlip(
            seedHash
        );

        uint256 luckyNumber = SeedUtility.getHashNumberUsingAsciiNumber(seed) % 100;

        uint256 returnAmount = getReturnAmount(
            seedHash,
            betSlip.wagerAmount,
            betSlip.odds,
            luckyNumber
        );

        IBetSlips(_betSlipsAddr).completeBet(
            seedHash,
            seed,
            betSlip.playerGameChoice,
            SeedUtility.uintToStr(luckyNumber),
            returnAmount,
            betSlip.odds
        );
    }

    function placeBet(
        uint256 wagerAmount,
        uint256 playerNumber,
        string memory choice,
        string memory seedHash,
        address token
    ) public whenNotPaused{
        placeBetSlip(wagerAmount, playerNumber, choice, seedHash, token, 0, 0, 0, 0);
    }

    function placeBetWithPermit(
        uint256 wagerAmount,
        uint256 playerNumber,
        string memory choice,
        string memory seedHash,
        address token,
        uint256 deadLine,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public whenNotPaused{
        placeBetSlip(wagerAmount, playerNumber, choice, seedHash, token, deadLine, v, r, s);
    }

    function placeBetSlip(
        uint256 wagerAmount,
        uint256 playerNumber,
        string memory choice,
        string memory seedHash,
        address token,
        uint256 deadLine,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) private {

        DiceGameChoice gameChoice;

        if (
            keccak256(abi.encodePacked((choice))) ==
            keccak256(abi.encodePacked(("OVER")))
        ) {
            gameChoice = DiceGameChoice.OVER;
            require(playerNumber >= 4 && playerNumber <= 98, "Invalid Number");
        } else if (
            keccak256(abi.encodePacked((choice))) ==
            keccak256(abi.encodePacked(("UNDER")))
        ) {
            gameChoice = DiceGameChoice.UNDER;
            require(playerNumber >= 1 && playerNumber <= 95, "Invalid Number");
        } else {
            revert("The choice is invalid");
        }

        require(
            wagerAmount >= _betLimits[token].minAmount && wagerAmount <= _betLimits[token].maxAmount,
            "The WagerAmount is invalid"
        );

        uint256 odds = getOdds(playerNumber, uint8(gameChoice));

        string memory playerGameChoice = getDiceGameChoice(
            choice,
            playerNumber
        );

        IBetSlips(_betSlipsAddr).placeBetSlip(
            msg.sender,
            token,
            wagerAmount,
            gameCode,
            playerGameChoice,
            seedHash,
            odds,
            deadLine,
            v,
            r,
            s
        );

        _playerChoices[seedHash] = DicePlayerChoice(gameChoice, playerNumber);
    }

    function getReturnAmount(
        string memory seedHash,
        uint256 wagerAmount,
        uint256 odds,
        uint256 luckyNumber
    ) private view returns (uint256) {
        DicePlayerChoice memory playerChoice = _playerChoices[seedHash];

        uint256 returnAmount;

        if (playerChoice.choice == DiceGameChoice.OVER) {
            if (playerChoice.playerNumber < luckyNumber) {
                returnAmount = (wagerAmount * odds) / 100;
            } else {
                returnAmount = 0;
            }
        } else if (playerChoice.choice == DiceGameChoice.UNDER) {
            if (playerChoice.playerNumber > luckyNumber) {
                returnAmount = (wagerAmount * odds) / 100;
            } else {
                returnAmount = 0;
            }
        }

        return returnAmount;
    }

    function getDiceGameChoice(string memory choice, uint256 playerNumber)
        private
        pure
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(
                    '{"playerChoice":"',
                    choice,
                    '", "playerNumber":',
                    SeedUtility.uintToStr(playerNumber),
                    "}"
                )
            );
    }
}
