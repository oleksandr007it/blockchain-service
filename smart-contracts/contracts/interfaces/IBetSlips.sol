// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

interface IBetSlips {
    enum Status {
        PLACED,
        COMPLETED,
        REVOKED
    }

    struct BetSlip {
        uint256 betId;
        address player;
        address token;
        string gameCode;
        string playerGameChoice;
        string gameResult;
        uint256 wagerAmount;
        uint256 returnAmount;
        uint256 odds;
        string seedHash;
        string seed;
        Status status;
        uint256 placedAt;
        uint256 completedAt;
    }

    event betSlipPlaced(
        uint256 betId,
        address player,
        address tokenAddress,
        string gameCode,
        string playerGameChoice,
        uint256 wagerAmount,
        string seedHash,
        uint256 odds,
        Status status
    );

    event betSlipCompleted(
        uint256 betId,
        address player,
        address tokenAddress,
        string gameCode,
        string playerGameChoice,
        uint256 wagerAmount,
        string seedHash,
        string gameResult,
        uint256 returnAmount,
        string seed,
        uint256 odds,
        Status status
    );

    event betSlipRevoked(
        string seedHashes,
        string reason
    );

    function getBetSlip(string memory seedHash)
        external
        returns (BetSlip memory);

    function placeBetSlip(
        address player,
        address token,
        uint256 wagerAmount,
        string memory gameCode,
        string memory playerGameChoice,
        string memory seedHash,
        uint256 odds,
        uint256 deadLine,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    function completeBet(
        string memory seedHash,
        string memory seed,
        string memory playerGameChoice,
        string memory gameResult,
        uint256 returnAmount,
        uint256 odds
    ) external;

    function revokeBetSlips(
        string [] memory seedHashes,
        string memory reason
    ) external;
}
