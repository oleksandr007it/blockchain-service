// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

interface IBetSlips {
    enum Status {
        PLACED,
        COMPLETED,
        REVOKED
    }

    struct GameChoice {
        string choice;
        uint256 playerNumber;
    }

    struct BetSlip {
        uint256 id;
        address player;
        address token;
        string gameCode;
        GameChoice playerGameChoice;
        uint256 gameResult;
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
        uint256 betSlipPlacedId,
        address indexed fromAddress,
        string indexed gameCode
    );

    event betSlipCompleted(
        uint256 betSlipPlacedId,
        address indexed fromAddress,
        string indexed gameCode,
        uint256 returnAmount
    );

    event tokenReceived(address from, address token, uint256 value);

    function getBetSlip(uint256 index) external returns (BetSlip memory);

    function depositAndPlaceBetSlip(
        address player,
        address token,
        uint256 betAmount,
        string memory gameCode,
        GameChoice memory playerGameChoice,
        string memory seedHash,
        uint256 odds
    ) external returns (bool);

    function depositAndPlaceBetSlipWithPermit(
        address player,
        address token,
        uint256 betAmount,
        string memory gameCode,
        GameChoice memory playerGameChoice,
        string memory seedHash,
        uint256 odds,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (bool);

    function completeBet(uint256 index, string memory seed)
        external
        returns (bool);
}
