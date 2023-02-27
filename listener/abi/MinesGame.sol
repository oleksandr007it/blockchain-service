// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../interfaces/IBetSlips.sol";
import "../games/BaseGame.sol";

contract MinesGame is BaseGame {

    struct MinesPlayerChoice {
        uint8 amountOfMines;
        uint8[] selectedCellsArray;
    }

    uint8 public constant AMOUNT_OF_CELLS = 25;

    mapping(string => MinesPlayerChoice) _playerChoices;

    constructor(address betSlipsAddr, uint256 rtp) {
        _betSlipsAddr = payable(betSlipsAddr);
        _rtp = rtp;
    }

    function getOdds(uint8 amountOfMines, uint256 selectedCounts)
        private
        view
        returns (uint256)
    {
        uint256 proDenominator = 1;
        uint256 proNumerator = 1;
        uint256 denominator = AMOUNT_OF_CELLS;
        uint256 numerator = AMOUNT_OF_CELLS - amountOfMines;

        for(uint8 i = 0; i < selectedCounts; i++) {
            proNumerator *= numerator;
            proDenominator *= denominator;
            numerator--;
            denominator--;
        }

        uint256 odds = ((_rtp * 10) * proDenominator / proNumerator + 5) / 10;
        
        return odds;
    }

    function revealSeed(
        string memory seedHash, 
        string memory seed, 
        uint8[] memory selectedCoordinates
    ) public {
        require(SeedUtility.compareSeed(seedHash, seed) == true, "Invalid seed");
        require((selectedCoordinates.length > 0 && selectedCoordinates.length < 24), "Invalid selected cells");

        string memory minesPositions;

        IBetSlips.BetSlip memory betSlip = IBetSlips(_betSlipsAddr).getBetSlip(
            seedHash
        );

        _playerChoices[seedHash].selectedCellsArray = selectedCoordinates;

        betSlip.playerGameChoice = getMinesGameChoice(
            _playerChoices[seedHash].amountOfMines,
            _playerChoices[seedHash].selectedCellsArray
        );

        betSlip.odds = getOdds(_playerChoices[seedHash].amountOfMines, selectedCoordinates.length);
        
        uint8[] memory minesArray = generateMineOrderNumbers(_playerChoices[seedHash].amountOfMines, seed);

        uint256 returnAmount = getReturnAmount(
            seedHash,
            betSlip.wagerAmount,
            betSlip.odds,
            minesArray
        );

        for(uint8 i = 0; i < minesArray.length; i++) {
            if (i == 0)
                minesPositions = string(abi.encodePacked("[ ", SeedUtility.uintToStr(minesArray[i])));
            else
                minesPositions = string(abi.encodePacked(minesPositions, ", ", SeedUtility.uintToStr(minesArray[i])));
        }
        minesPositions = string(abi.encodePacked(minesPositions, " ]"));

        IBetSlips(_betSlipsAddr).completeBet(
            seedHash,
            seed,
            betSlip.playerGameChoice,
            minesPositions,
            returnAmount,
            betSlip.odds
        );
    }

    function placeBet(
        uint256 wagerAmount,
        uint8 amountOfMines,
        string memory seedHash,
        address token
    ) public {
        placeBetSlip(wagerAmount, amountOfMines, seedHash, token, 0, 0, 0, 0);
    }

    function placeBetWithPermit(
        uint256 wagerAmount,
        uint8 amountOfMines,
        string memory seedHash,
        address token,
        uint256 deadLine,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        placeBetSlip(wagerAmount, amountOfMines, seedHash, token, deadLine, v, r, s);
    }

    function placeBetSlip(
        uint256 wagerAmount,
        uint8 amountOfMines,
        string memory seedHash,
        address token,
        uint256 deadLine,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) private {

        uint8[] memory selectedCells;
        uint256 minAmount = _betLimits[token].min;
        uint256 maxAmount = _betLimits[token].max;

        require(
            wagerAmount >= minAmount && wagerAmount <= maxAmount,
            "The WagerAmount is invalid"
        );

        require(
            amountOfMines > 0 && amountOfMines <= 24,
            "The MinesAmount is invalid"
        );

        string memory playerGameChoice = getMinesGameChoice(
            amountOfMines,
            selectedCells
        );

        _playerChoices[seedHash].amountOfMines = amountOfMines;

        IBetSlips(_betSlipsAddr).placeBetSlip(
            msg.sender,
            token,
            wagerAmount,
            "mines",
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
        uint8[] memory minesPositions
    ) private view returns (uint256) {
        MinesPlayerChoice memory playerChoice = _playerChoices[seedHash];

        uint256 returnAmount;
        bool winFlag = true;

        for (uint8 i = 0; i < minesPositions.length; i++) {
            for (uint8 j = 0; j < playerChoice.selectedCellsArray.length; j++) {
                if (minesPositions[i] == playerChoice.selectedCellsArray[j]) {
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

    function generateMineOrderNumbers (uint8 amountOfMines, string memory seed)
        private
        pure 
        returns (uint8[] memory) 
    {
        uint8[] memory minesSeries = new uint8[](amountOfMines);
        bool[] memory seeds = new bool[](AMOUNT_OF_CELLS+1);
        string memory currentSeed = seed;
        uint8 count = 0;

        for (uint8 i = 0; i < AMOUNT_OF_CELLS - 1; i++)
            seeds[i] = false;

        while (count < amountOfMines) {
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
                minesSeries[count] = i;
                count++;
            }

        return minesSeries;
    }

    function getMinesGameChoice(uint8 amountOfMines, uint8[] memory selectedCells)
        private
        pure
        returns (string memory)
    {
        string memory selectedCellString;

        selectedCellString = string(abi.encodePacked("["));
        for (uint8 i = 0; i < selectedCells.length; i++) {
            if (i == 0) {
                selectedCellString = string(abi.encodePacked(
                    selectedCellString, 
                    SeedUtility.uintToStr(selectedCells[i]
                )));
            }
            else {
                selectedCellString = string(abi.encodePacked(
                    selectedCellString, 
                    ", ",
                    SeedUtility.uintToStr(selectedCells[i]
                )));
            }
        }
        selectedCellString = string(abi.encodePacked(selectedCellString, abi.encodePacked("]")));
        
        return
            string(
                abi.encodePacked(
                    '{"amountOfMines":"',
                    SeedUtility.uintToStr(amountOfMines),
                    '", "playerSelectedCells":',
                    selectedCellString,
                    "}"
                )
            );
    }
}
