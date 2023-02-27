// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../interfaces/IBetSlips.sol";
import "../games/BaseGame.sol";

contract BalloonGame is BaseGame {

    mapping(string => uint8) _playerChoices;

    uint32[6] pumpProbabilities = [89814815, 71851852, 50259067, 30124224, 15062112, 6024845];

    constructor(address betSlipsAddr, uint256 rtp) {
        _betSlipsAddr = payable(betSlipsAddr);
        _rtp = rtp;
        gameCode = "balloon";
    }

    function getOdds(uint8 amountOfPumps)
        private
        view
        returns (uint256)
    {
        uint256 odds = _rtp * 100000000 / pumpProbabilities[amountOfPumps-1];
        
        return odds;
    }

    function revealSeed(
        string memory seedHash, 
        string memory seed, 
        uint8 amountOfPumps 
    ) public {
        require(SeedUtility.compareSeed(seedHash, seed) == true, "Invalid seed");
        require((amountOfPumps > 0 && amountOfPumps <= 6), "Invalid amount of pumps");

        IBetSlips.BetSlip memory betSlip = IBetSlips(_betSlipsAddr).getBetSlip(
            seedHash
        );

        _playerChoices[seedHash] = amountOfPumps;
        betSlip.playerGameChoice = SeedUtility.uintToStr(amountOfPumps);

        betSlip.odds = getOdds(amountOfPumps);

        uint256 balloonLimitHashNumber = SeedUtility.getHashNumber(seed) % (10**8);
        string memory gameResult = getGameResult(balloonLimitHashNumber);

        uint256 returnAmount;
        if (isWin(amountOfPumps, balloonLimitHashNumber)) {
            returnAmount = betSlip.odds * betSlip.wagerAmount / 100;
        } else {
            returnAmount = 0;
        }

        IBetSlips(_betSlipsAddr).completeBet(
            seedHash,
            seed,
            betSlip.playerGameChoice,
            gameResult,
            returnAmount,
            betSlip.odds
        );
    }

    function placeBet(
        uint256 wagerAmount,
        string memory seedHash,
        address token
    ) public whenNotPaused{
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

        string memory playerGameChoice = "";

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

    function isWin(
        uint8 amountOfPumps,
        uint256 balloonLimitHashNumber
    ) private view returns (bool) {
        return (pumpProbabilities[amountOfPumps-1] > balloonLimitHashNumber);
    }

    function getGameResult(uint256 balloonLimitHashNumber)
        private
        view
        returns (string memory)
    {
        uint8 i;
        for (i = 0; i < pumpProbabilities.length; i++) {
            if (pumpProbabilities[i] <= balloonLimitHashNumber) {
                break;
            }
        }
        if (i == pumpProbabilities.length)
            i--;
        return SeedUtility.uintToStr(i+1);
    }
}
