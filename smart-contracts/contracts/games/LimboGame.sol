// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../interfaces/IBetSlips.sol";
import "./BaseGame.sol";

contract LimboGame is BaseGame {

    uint256 constant MAX_GAME_RESULT_ODDS = 100 * 100;                  // 100.00 -> 10000

    mapping(string => uint256) _playerChoices;

    constructor(address betSlipsAddr, uint256 rtp) {
        _betSlipsAddr = payable(betSlipsAddr);
        _rtp = rtp;
        gameCode = "limbo";
    }

    function revealSeed(
        string memory seedHash, 
        string memory seed
    ) public {
        require(SeedUtility.compareSeed(seedHash, seed) == true, "Invalid seed");

        IBetSlips.BetSlip memory betSlip = IBetSlips(_betSlipsAddr).getBetSlip(
            seedHash
        );
        
        betSlip.playerGameChoice = SeedUtility.uintToStr(_playerChoices[seedHash]);

        uint256 gameResult = getGameResult(seed);

        betSlip.odds = _playerChoices[seedHash];

        uint256 returnAmount = getReturnAmount(gameResult, betSlip.wagerAmount, _playerChoices[seedHash]);
         
        IBetSlips(_betSlipsAddr).completeBet(
            seedHash,
            seed,
            betSlip.playerGameChoice,
            SeedUtility.uintToStr(gameResult),
            returnAmount,
            betSlip.odds
        );
    }

    function placeBet(
        uint256 wagerAmount,
        uint256 target,
        string memory seedHash,
        address token
    ) public whenNotPaused {
        placeBetSlip(wagerAmount, target, seedHash, token, 0, 0, 0, 0);
    }

    function placeBetWithPermit(
        uint256 wagerAmount,
        uint256 target,
        string memory seedHash,
        address token,
        uint256 deadLine,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public whenNotPaused {
        placeBetSlip(wagerAmount, target, seedHash, token, deadLine, v, r, s);
    }

    function placeBetSlip(
        uint256 wagerAmount,
        uint256 playerChoice,
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

        require(playerChoice > 100 && playerChoice <= MAX_GAME_RESULT_ODDS, "The PlayerChoice is invalid");

        IBetSlips(_betSlipsAddr).placeBetSlip(
            msg.sender,
            token,
            wagerAmount,
            gameCode,
            SeedUtility.uintToStr(playerChoice),
            seedHash,
            0,
            deadLine,
            v,
            r,
            s
        );

        _playerChoices[seedHash] = playerChoice;
    }

    function isInstantCrash(string memory seed)
        private
        view
        returns(bool)
    {
        uint256 rnd = SeedUtility.getHashNumber(seed) % (10**8);
        return (rnd < (100-_rtp)*(10**6));
    }

    function getGameResult(string memory seed) 
        private
        view
        returns(uint256)
    {
        if (isInstantCrash(seed)) {
            return 1 * 100;                                     // 1.00 -> 100
        }

        string memory subSeed = SeedUtility.substring(seed, 0, 52 / 4);
        uint256 h = SeedUtility.strToUint(subSeed);
        uint256 e = 2**52;
        uint256 result = (100 * e - h) / (e - h);               // remove division by 100, ex: 1.31 -> 131

        return (result > MAX_GAME_RESULT_ODDS ? MAX_GAME_RESULT_ODDS : result);
    }

    function getReturnAmount(
        uint256 gameResult, 
        uint256 wagerAmount, 
        uint256 playerGameChoice
    ) private pure returns (uint256) {
        return (gameResult >= playerGameChoice ? (wagerAmount * playerGameChoice / 100) : 0);
    }
}
