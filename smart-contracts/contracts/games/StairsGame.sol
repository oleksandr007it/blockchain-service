// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../interfaces/IBetSlips.sol";
import "../games/BaseGame.sol";

contract StairsGame is BaseGame {

    struct StairsPlayerChoice {
        uint8 amountOfFlowersByLevel;
        uint8[] playerSelectedStairs;
    }

    uint8 public constant AMOUNT_OF_STAIRS = 30;

    uint8[] private countOfStairsByLevel;

    mapping(string => StairsPlayerChoice) _playerChoices;

    constructor(address betSlipsAddr, uint256 rtp) {
        countOfStairsByLevel = [6, 6, 5, 5, 4, 4];
        _betSlipsAddr = payable(betSlipsAddr);
        _rtp = rtp;
        gameCode = "stairs";
    }

    function getOdds(uint8 countOfFlowersByLevel, uint256 userLevelProgress) 
        private 
        view 
        returns (uint256) 
    {
        uint256 odds;
        uint256 denominator;
        uint256 numerator;
        uint256 proDenominator = 1;
        uint256 proNumerator = 1;

        for (uint8 i = 0; i < userLevelProgress; i++) {
            denominator = countOfStairsByLevel[i];
            numerator = countOfStairsByLevel[i] - countOfFlowersByLevel;
            
            proDenominator *= denominator;
            proNumerator *= numerator;
        }
        odds = _rtp * proDenominator / proNumerator;

        return odds;
    }

    function placeBet(
        uint256 wagerAmount,
        uint8 amountOfFlowers,
        string memory seedHash,
        address token
    ) public whenNotPaused{
        placeBetSlip(wagerAmount, amountOfFlowers, seedHash, token, 0, 0, 0, 0);
    }

    function placeBetWithPermit(
        uint256 wagerAmount,
        uint8 amountOfFlowersByLevel,
        string memory seedHash,
        address token,
        uint256 deadLine,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public whenNotPaused{
        placeBetSlip(wagerAmount, amountOfFlowersByLevel, seedHash, token, deadLine, v, r, s);
    }

    function placeBetSlip(
        uint256 wagerAmount,
        uint8 amountOfFlowersByLevel,
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
            amountOfFlowersByLevel > 0 && amountOfFlowersByLevel <= 3,
            "The FlowersAmount is invalid"
        );

        string memory playerGameChoice = SeedUtility.uintToStr(amountOfFlowersByLevel);

        _playerChoices[seedHash].amountOfFlowersByLevel = amountOfFlowersByLevel;

        IBetSlips(_betSlipsAddr).placeBetSlip(
            msg.sender,
            token,
            wagerAmount,
            'stairs',
            playerGameChoice,
            seedHash,
            0,
            deadLine,
            v,
            r,
            s
        );
    }


    function revealSeed(
        string memory seedHash,
        string memory seed,
        uint8[] memory playerSelectedStairs
    ) public {
        require(SeedUtility.compareSeed(seedHash, seed) == true, "Invalid seed");


        IBetSlips.BetSlip memory betSlip = IBetSlips(_betSlipsAddr).getBetSlip(
            seedHash
        );

        _playerChoices[seedHash].playerSelectedStairs = playerSelectedStairs;

        betSlip.playerGameChoice = getStairsGameChoice(
            _playerChoices[seedHash].amountOfFlowersByLevel,
            _playerChoices[seedHash].playerSelectedStairs
        );

        betSlip.odds = getOdds(_playerChoices[seedHash].amountOfFlowersByLevel, playerSelectedStairs.length);

        uint8[] memory flowersPositions = generateFlowersForEachLevel(_playerChoices[seedHash].amountOfFlowersByLevel, seed);

        uint256 returnAmount = getReturnAmount(
            seedHash,
            betSlip.wagerAmount,
            betSlip.odds,
            flowersPositions
        );

        string memory flowers;
        flowers = getFlowerPositions(flowersPositions);

        IBetSlips(_betSlipsAddr).completeBet(
            seedHash,
            seed,
            betSlip.playerGameChoice,
            flowers,
            returnAmount,
            betSlip.odds
        );
    }

    function getReturnAmount(
        string memory seedHash,
        uint256 wagerAmount,
        uint256 odds,
        uint8[] memory flowersPositions
    ) private view returns (uint256) {
        StairsPlayerChoice memory playerChoice = _playerChoices[seedHash];
        uint256 returnAmount;
        bool winFlag = true;

        uint8 shiftIndex = 0;
        for (uint8 j = 0; j < playerChoice.playerSelectedStairs.length; j++) {
            require(playerChoice.playerSelectedStairs[j] <= countOfStairsByLevel[j], "Invalid playerChoice");

            if (flowersPositions[playerChoice.playerSelectedStairs[j] + shiftIndex] > 0) {
                winFlag = false;
                break;
            }
            shiftIndex = shiftIndex + countOfStairsByLevel[j];
        }

        if (winFlag) {
            returnAmount = (wagerAmount * odds) / 100;
        }
        else {
            returnAmount = 0;
        }

        return returnAmount;
    }

    function generateFlowersForEachLevel(uint8 amountOfFlowersByLevel, string memory seed)
        private
        view
        returns (uint8[] memory) 
    {
        uint8[] memory flowersPositions = new uint8[](AMOUNT_OF_STAIRS + 1);
        string memory currentSeed = seed;
        uint8 count = 0;
        uint8 shiftIndex = 1;
        for (uint8 i = 0; i < countOfStairsByLevel.length; i++)
        {
            while (count < amountOfFlowersByLevel) {
                uint256 curRndNumber = SeedUtility.getHashNumberUsingAsciiNumber(currentSeed);
                uint256 index = curRndNumber % countOfStairsByLevel[i];
                index = index + shiftIndex;
                if (flowersPositions[index] == 0) {
                    flowersPositions[index] = 1;
                    count++;
                }
                currentSeed = SeedUtility.bytes32ToString(sha256(abi.encodePacked(currentSeed)));
            }
            shiftIndex = shiftIndex + countOfStairsByLevel[i];
            count = 0;
        }

        return flowersPositions;
    }

    function getStairsGameChoice(uint8 amountOfFlowers, uint8[] memory selectedStairs)
        private
        pure
        returns (string memory)
    {
        string memory selectedStairsString;

        selectedStairsString = string(abi.encodePacked("["));
        for (uint8 i = 0; i < selectedStairs.length; i++) {
            if (i == 0) {
                selectedStairsString = string(abi.encodePacked(
                        selectedStairsString,
                        SeedUtility.uintToStr(selectedStairs[i]
                        )));
            }
            else {
                selectedStairsString = string(abi.encodePacked(
                        selectedStairsString,
                        ", ",
                        SeedUtility.uintToStr(selectedStairs[i]
                        )));
            }
        }
        selectedStairsString = string(abi.encodePacked(selectedStairsString, abi.encodePacked("]")));

        return
        string(
            abi.encodePacked(
                '{"amountOfFlowers":"',
                SeedUtility.uintToStr(amountOfFlowers),
                '", "playerSelectedStairs":',
                selectedStairsString,
                "}"
            )
        );
    }

    function getFlowerPositions(uint8[] memory flowersPositions)
        private
        view
        returns (string memory)
    {
        string memory flowerPositionsString;
        uint256 countOfFlowers = 0;
        uint256 indexOfLevel = 0;
        bool firstFlag = true;

        flowerPositionsString = string(abi.encodePacked("["));
        for (uint8 i = 1; i < AMOUNT_OF_STAIRS+1; i++) {
            if (flowersPositions[i] == 1) {
                if (firstFlag) {
                    flowerPositionsString = string(abi.encodePacked(flowerPositionsString, abi.encodePacked("[")));
                    firstFlag = false;
                } else {
                    flowerPositionsString = string(abi.encodePacked(flowerPositionsString, abi.encodePacked(", [")));
                }

                flowerPositionsString = string(abi.encodePacked(
                            flowerPositionsString,
                            SeedUtility.uintToStr(indexOfLevel+1
                            )));
                
                flowerPositionsString = string(abi.encodePacked(
                            flowerPositionsString,
                            abi.encodePacked(",")));
                
                flowerPositionsString = string(abi.encodePacked(
                            flowerPositionsString,
                            SeedUtility.uintToStr(countOfFlowers+1
                            )));

                flowerPositionsString = string(abi.encodePacked(flowerPositionsString, abi.encodePacked("]")));
            }

            countOfFlowers++;
            if (countOfFlowers == countOfStairsByLevel[indexOfLevel]) {
                countOfFlowers = 0;
                indexOfLevel++;
            }
        }
        flowerPositionsString = string(abi.encodePacked(flowerPositionsString, abi.encodePacked("]")));

        return flowerPositionsString;
    }
}
