// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../interfaces/IBetSlips.sol";
import "./BaseGame.sol";

contract CircleGame is BaseGame {

    enum CircleGameChoice {
        BLUE,
        GREEN,
        RED,
        PURPLE,
        YELLOW
    }

    struct CircleGameItem {
        string name;
        uint256 probability;
        uint256 odds;
    }

    uint256 constant CHOICE_AMOUNT = 5;

    CircleGameItem[CHOICE_AMOUNT] circleGameItems;

    constructor(address betSlipsAddr, uint256 rtp) {
        _betSlipsAddr = payable(betSlipsAddr);
        _rtp = rtp;
        gameCode = "circle";
        initializeCircleGameItems();
    }

    function initializeCircleGameItems() private {
        circleGameItems[0] = CircleGameItem("BLUE", 33333333, 0);
        circleGameItems[1] = CircleGameItem("GREEN", 21666667, 80);
        circleGameItems[2] = CircleGameItem("RED", 33333333, 130);
        circleGameItems[3] = CircleGameItem("PURPLE", 10000000, 200);
        circleGameItems[4] = CircleGameItem("YELLOW", 1666667, 1000);
    }

    function revealSeed(
        string memory seedHash, 
        string memory seed
    ) public {
        require(SeedUtility.compareSeed(seedHash, seed) == true, "Invalid seed");

        IBetSlips.BetSlip memory betSlip = IBetSlips(_betSlipsAddr).getBetSlip(
            seedHash
        );
        
        uint256[] memory probabilities = new uint256[](CHOICE_AMOUNT);
        for(uint8 i = 0; i < CHOICE_AMOUNT; i++){
            probabilities[i] = circleGameItems[i].probability;
        }

        uint256 indexOfLukyColor = SeedUtility.getResultByProbabilities(seed, probabilities, 8);
        uint256 odds = circleGameItems[indexOfLukyColor].odds * _rtp / 100;
        uint256 returnAmount = betSlip.wagerAmount * odds / 100;
       
        IBetSlips(_betSlipsAddr).completeBet(
            seedHash,
            seed,
            betSlip.playerGameChoice,
            circleGameItems[indexOfLukyColor].name,
            returnAmount,
            odds
        );
    }

    function placeBet(
        uint256 wagerAmount,
        string memory seedHash,
        address token
    ) public whenNotPaused {
        placeBetSlip(wagerAmount, seedHash, token, 0, 0, 0, 0);
    }

    function placeBetWithPermit(
        uint256 wagerAmount,
        string memory seedHash,
        address token,
        uint256 deadLine,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public whenNotPaused {
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

        require(
            wagerAmount >= _betLimits[token].minAmount && wagerAmount <= _betLimits[token].maxAmount,
            "The WagerAmount is invalid"
        );

        IBetSlips(_betSlipsAddr).placeBetSlip(
            msg.sender,
            token,
            wagerAmount,
            gameCode,
            "",
            seedHash,
            0,
            deadLine,
            v,
            r,
            s
        );
    }
}
