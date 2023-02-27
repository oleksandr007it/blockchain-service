// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../interfaces/IBetSlips.sol";
import "../games/BaseGame.sol";

contract MinesGame is BaseGame {

    struct MinesPlayerChoice {
        uint8 amountOfBombs;
        uint8[] revealedCells;
    }

    uint8 public constant AMOUNT_OF_CELLS = 25;

    mapping(string => MinesPlayerChoice) _playerChoices;

    constructor(address betSlipsAddr, uint256 rtp) {
        _betSlipsAddr = payable(betSlipsAddr);
        _rtp = rtp;
        gameCode = "mines";
    }

    function getOdds(uint8 amountOfBombs, uint256 selectedCounts)
        private
        view
        returns (uint256)
    {
        uint256 proDenominator = 1;
        uint256 proNumerator = 1;
        uint256 denominator = AMOUNT_OF_CELLS;
        uint256 numerator = AMOUNT_OF_CELLS - amountOfBombs;

        for(uint8 i = 0; i < selectedCounts; i++) {
            proNumerator *= numerator;
            proDenominator *= denominator;
            numerator--;
            denominator--;
        }

        uint256 odds = _rtp * proDenominator / proNumerator;
        
        return odds;
    }

    function revealSeed(
        string memory seedHash, 
        string memory seed, 
        uint8[] memory revealedCells
    ) public {
        require(SeedUtility.compareSeed(seedHash, seed) == true, "Invalid seed");
        require((revealedCells.length > 0 && revealedCells.length < 24), "Invalid selected cells");

        string memory bombPositionString;

        IBetSlips.BetSlip memory betSlip = IBetSlips(_betSlipsAddr).getBetSlip(
            seedHash
        );

        _playerChoices[seedHash].revealedCells = revealedCells;

        for(uint8 i = 0; i < revealedCells.length; i++)
        {
            if (i == 0)
                betSlip.playerGameChoice = string(abi.encodePacked("[", SeedUtility.uintToStr(revealedCells[i])));
            else
                betSlip.playerGameChoice = string(abi.encodePacked(betSlip.playerGameChoice, ", ", SeedUtility.uintToStr(revealedCells[i])));
        }
        betSlip.playerGameChoice = string(abi.encodePacked(betSlip.playerGameChoice , "]"));

        betSlip.odds = getOdds(_playerChoices[seedHash].amountOfBombs, revealedCells.length);
        
        uint8[] memory bombPositions = generateBombPositions(_playerChoices[seedHash].amountOfBombs, seed);

        uint256 returnAmount = getReturnAmount(
            seedHash,
            betSlip.wagerAmount,
            betSlip.odds,
            bombPositions
        );

        for(uint8 i = 0; i < bombPositions.length; i++) {
            if (i == 0)
                bombPositionString = string(abi.encodePacked("[ ", SeedUtility.uintToStr(bombPositions[i])));
            else
                bombPositionString = string(abi.encodePacked(bombPositionString, ", ", SeedUtility.uintToStr(bombPositions[i])));
        }
        bombPositionString = string(abi.encodePacked(bombPositionString, " ]"));

        IBetSlips(_betSlipsAddr).completeBet(
            seedHash,
            seed,
            betSlip.playerGameChoice,
            bombPositionString,
            returnAmount,
            betSlip.odds
        );
    }

    function placeBet(
        uint256 wagerAmount,
        uint8 amountOfBombs,
        string memory seedHash,
        address token
    ) public whenNotPaused{
        placeBetSlip(wagerAmount, amountOfBombs, seedHash, token, 0, 0, 0, 0);
    }

    function placeBetWithPermit(
        uint256 wagerAmount,
        uint8 amountOfBombs,
        string memory seedHash,
        address token,
        uint256 deadLine,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public whenNotPaused{
        placeBetSlip(wagerAmount, amountOfBombs, seedHash, token, deadLine, v, r, s);
    }

    function placeBetSlip(
        uint256 wagerAmount,
        uint8 amountOfBombs,
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

        require(
            amountOfBombs > 0 && amountOfBombs <= 24,
            "The BombsAmount is invalid"
        );

        string memory playerGameChoice;
        if (amountOfBombs == 1) {
           playerGameChoice = "1 bomb";
        } else {
           playerGameChoice = string(abi.encodePacked(SeedUtility.uintToStr(amountOfBombs), " bombs"));
        }

        _playerChoices[seedHash].amountOfBombs = amountOfBombs;

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

    function getReturnAmount(
        string memory seedHash,
        uint256 wagerAmount,
        uint256 odds,
        uint8[] memory bombPositions
    ) private view returns (uint256) {
        MinesPlayerChoice memory playerChoice = _playerChoices[seedHash];

        uint256 returnAmount;
        bool winFlag = true;

        for (uint8 i = 0; i < bombPositions.length; i++) {
            for (uint8 j = 0; j < playerChoice.revealedCells.length; j++) {
                if (bombPositions[i] == playerChoice.revealedCells[j]) {
                    winFlag = false;
                    break;
                }
            }
            if (!winFlag)
                break;
        }

        if (winFlag) {
            returnAmount = (wagerAmount * odds) / 100;
        }
        else { 
            returnAmount = 0;
        }

        return returnAmount;
    }

    function generateBombPositions(uint8 amountOfBombs, string memory seed)
        private
        pure 
        returns (uint8[] memory) 
    {
        uint8[] memory bombSeries = new uint8[](amountOfBombs);
        bool[] memory seeds = new bool[](AMOUNT_OF_CELLS+1);
        string memory currentSeed = seed;
        uint8 count = 0;

        for (uint8 i = 0; i < AMOUNT_OF_CELLS - 1; i++)
            seeds[i] = false;

        while (count < amountOfBombs) {
            uint256 curRndNumber = SeedUtility.getHashNumberUsingAsciiNumber(currentSeed);
            uint256 index = curRndNumber % AMOUNT_OF_CELLS + 1;
            if (!seeds[index]) {
                seeds[index] = true;
                count++;
            }
            currentSeed = SeedUtility.bytes32ToString(sha256(abi.encodePacked(currentSeed)));
        }

        count = 0;

        for (uint8 i = 0; i < AMOUNT_OF_CELLS + 1 ; i++)
            if (seeds[i]){
                bombSeries[count] = i;
                count++;
            }

        return bombSeries;
    }
}
