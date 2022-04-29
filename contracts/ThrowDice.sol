// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./IBetSlips.sol";

contract ThrowDice is Ownable {
    enum DiceChoice {
        OVER,
        UNDER
    }

    address payable public betSlipsAddr;

    uint256 private _rtp = 97;

    uint256 constant MIN_LUCKY_NUMBER = 0;
    uint256 constant MAX_LUCKY_NUMBER = 99;
    uint256 constant LUCKY_NUMBERS_AMOUNT = 100;

    constructor(address _betSlipsAddr) {
        betSlipsAddr = payable(_betSlipsAddr);
    }

    function setRtp(uint256 rtp) public onlyOwner {
        _rtp = rtp;
    }

    function getRtp() public view returns (uint256) {
        return _rtp;
    }

    function getOdds(uint256 playerNumber, uint8 diceChoice)
        public
        view
        returns (uint256)
    {
        uint256 probability = 1;

        if (diceChoice == uint8(DiceChoice.OVER)) {
            probability = MAX_LUCKY_NUMBER - playerNumber;
        } else if (diceChoice == uint8(DiceChoice.UNDER)) {
            probability = playerNumber - MIN_LUCKY_NUMBER;
        }

        uint256 odds = (_rtp * LUCKY_NUMBERS_AMOUNT) / probability;

        return odds;
    }

    function revealSeed(
        uint256 betSlipId,
        address player,
        string memory seed
    ) public {
        IBetSlips(betSlipsAddr).completeBet(betSlipId, seed);
    }

    function placeBet(
        uint256 betAmount,
        uint256 playerNumber,
        string memory choice,
        string memory seedHash,
        address token
    ) public {
        require(
            (keccak256(abi.encodePacked((choice))) ==
                keccak256(abi.encodePacked(("OVER")))) ||
                (keccak256(abi.encodePacked((choice))) ==
                    keccak256(abi.encodePacked(("UNDER")))),
            "The choice is invalid."
        );

        DiceChoice diceChoice;

        if (
            keccak256(abi.encodePacked((choice))) ==
            keccak256(abi.encodePacked(("OVER")))
        ) {
            diceChoice = DiceChoice.OVER;
            require(playerNumber >= 4 && playerNumber <= 98, "Invalid Number");
        } else if (
            keccak256(abi.encodePacked((choice))) ==
            keccak256(abi.encodePacked(("UNDER")))
        ) {
            diceChoice = DiceChoice.UNDER;
            require(playerNumber >= 1 && playerNumber <= 95, "Invalide Number");
        }

        IBetSlips.GameChoice memory playerGameChoice = IBetSlips.GameChoice(
            choice,
            playerNumber
        );

        uint256 odds = getOdds(playerNumber, uint8(diceChoice));

        IBetSlips(betSlipsAddr).depositAndPlaceBetSlip(
            msg.sender,
            token,
            betAmount,
            "dice",
            playerGameChoice,
            seedHash,
            odds
        );
    }

    function placeBetWithPermit(
        uint256 betAmount,
        uint256 playerNumber,
        string memory choice,
        string memory seedHash,
        address token,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        require(
            (keccak256(abi.encodePacked((choice))) ==
                keccak256(abi.encodePacked(("OVER")))) ||
                (keccak256(abi.encodePacked((choice))) ==
                    keccak256(abi.encodePacked(("UNDER")))),
            "The choice is invalid."
        );

        DiceChoice diceChoice;

        if (
            keccak256(abi.encodePacked((choice))) ==
            keccak256(abi.encodePacked(("OVER")))
        ) {
            diceChoice = DiceChoice.OVER;
            require(playerNumber >= 1 && playerNumber <= 95, "Invalid Number");
        } else if (
            keccak256(abi.encodePacked((choice))) ==
            keccak256(abi.encodePacked(("UNDER")))
        ) {
            diceChoice = DiceChoice.UNDER;
            require(playerNumber >= 4 && playerNumber <= 98, "Invalide Number");
        }

        IBetSlips.GameChoice memory playerGameChoice = IBetSlips.GameChoice(
            choice,
            playerNumber
        );

        uint256 odds = getOdds(playerNumber, uint8(diceChoice));

        IBetSlips(betSlipsAddr).depositAndPlaceBetSlipWithPermit(
            msg.sender,
            token,
            betAmount,
            "dice",
            playerGameChoice,
            seedHash,
            odds,
            deadline,
            v,
            r,
            s
        );
    }
}
