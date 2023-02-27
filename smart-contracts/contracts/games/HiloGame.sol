// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../interfaces/IBetSlips.sol";
import "./BaseGame.sol";

contract HiloGame is BaseGame {

    struct CARD {
        uint8 rank;
        uint8 suit;
        string friendlyName;
    }

    uint256 constant RANK_AMOUNT = 13;
    uint256 constant SUIT_AMOUNT = 4;
    uint256 constant CARD_AMOUNT = RANK_AMOUNT * SUIT_AMOUNT;

    mapping(string => string[]) _playerChoices;
    CARD[] allCards;

    constructor(address betSlipsAddr, uint256 rtp) {
        string[RANK_AMOUNT] memory rankName = ["ACE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "JACK", "QUEEN", "KING"];
        string[SUIT_AMOUNT] memory suitName = ["SPADE", "HEART", "DIAMOND", "CLUB"];
        CARD memory card;

        for (uint8 i = 0; i < SUIT_AMOUNT; i++)
            for (uint8 j = 0; j < RANK_AMOUNT; j++)
            {
                card = CARD(j, i, string(abi.encodePacked(rankName[j], "_OF_", suitName[i])));
                allCards.push(card);
            }

        _betSlipsAddr = payable(betSlipsAddr);
        _rtp = rtp;
        gameCode = "hilo";
    }

    function revealSeed(string memory seedHash, string memory seed, string[] memory playerChoices) public {
        require(SeedUtility.compareSeed(seedHash, seed) == true, "Invalid seed");

        IBetSlips.BetSlip memory betSlip = IBetSlips(_betSlipsAddr).getBetSlip(
            seedHash
        );

        _playerChoices[seedHash] = playerChoices;
        betSlip.playerGameChoice = getHiloGameChoice(playerChoices);

        CARD[] memory generatedCards = generateCardArray(uint8(playerChoices.length+1), seed);
        uint256 odds = getOdds(playerChoices, generatedCards);
        bool winFlag = isWin(playerChoices, generatedCards);

        uint256 returnAmount;
        if (winFlag) {
            returnAmount = betSlip.wagerAmount * odds / 100;
        } else {
            returnAmount = 0;
        }

        string memory friendlyCardNameArray;

        for(uint8 i = 0; i < generatedCards.length; i++)
        {
            if (i == 0)
                friendlyCardNameArray = string(abi.encodePacked("[", generatedCards[i].friendlyName));
            else
                friendlyCardNameArray = string(abi.encodePacked(friendlyCardNameArray, ", ", generatedCards[i].friendlyName));
        }
        friendlyCardNameArray = string(abi.encodePacked(friendlyCardNameArray, "]"));

        IBetSlips(_betSlipsAddr).completeBet(
            seedHash,
            seed,
            betSlip.playerGameChoice,
            friendlyCardNameArray,
            returnAmount,
            odds
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

    function getOdds(string [] memory playerChoices, CARD[] memory generatedCards)
        private
        view
        returns (uint256)
    {
        uint256 odds = 1;
        uint256 cardNumber;
        uint256 amountOfLuckyCard = 1;
        bool firstFlag = false;

        for(uint8 i = 0; i < playerChoices.length; i++)
        {
            cardNumber = generatedCards[i].rank;
          
            if (
                keccak256(abi.encodePacked((playerChoices[i]))) ==
                keccak256(abi.encodePacked(("OVER")))
            ) {
                amountOfLuckyCard = RANK_AMOUNT - cardNumber - 1;
            } else if (
                keccak256(abi.encodePacked((playerChoices[i]))) ==
                keccak256(abi.encodePacked(("UNDER")))
            ) {
                amountOfLuckyCard = cardNumber;
            } else if (
                keccak256(abi.encodePacked((playerChoices[i]))) ==
                keccak256(abi.encodePacked(("SKIP")))
            ) {
                continue;
            }
            
            // If card rank is ACE or KING, amountOfLuckyCard should be 1.
            if (amountOfLuckyCard == 0)
                amountOfLuckyCard = 1; 

            // If hiloChoice = "OVER" and cardNumber = 4, then amountOfLuckyCard = 8, 
            // (cardNumber ranged 0~12, so the amount of numbers greater than 4 equals 8).
            // Therefore, odds = (97*13)/8 = 157.
            //_rtp = 97, not 0.97, so odds should be divided by 100 by the number of times multiplied the _rtp except first case.
            if (!firstFlag) {
                odds *= (_rtp * RANK_AMOUNT / amountOfLuckyCard);
                firstFlag = true;
            } else {
                odds *= (_rtp * RANK_AMOUNT / amountOfLuckyCard);
                odds /= 100;
            }
        }

        return odds;
    }

    function generateCardArray (uint8 amountOfCards, string memory seed)
        private
        view 
        returns (CARD[] memory) 
    {
        CARD[] memory generatedCards = new CARD[](amountOfCards);
        string memory currentSeed = seed;

        for(uint8 i = 0; i < amountOfCards; i++)
        {
            uint8 indexOfCard = uint8(SeedUtility.getHashNumberUsingAsciiNumber(currentSeed) % CARD_AMOUNT);
            generatedCards[i] = allCards[indexOfCard];
            currentSeed = SeedUtility.bytes32ToString(sha256(abi.encodePacked(currentSeed)));
        }

        return generatedCards;
    }

    function isWin (string [] memory playerChoices, CARD[] memory generatedCards)
        private
        pure
        returns (bool)
    {
        uint256 lastCardNumber;
        uint256 previousLastCardNumber;

        for(uint256 i = playerChoices.length-1; i >= 0; i--) {
            lastCardNumber = generatedCards[i+1].rank;
            previousLastCardNumber = generatedCards[i].rank;

            if (
                keccak256(abi.encodePacked((playerChoices[i]))) ==
                keccak256(abi.encodePacked(("OVER")))
            ) {
                if (previousLastCardNumber == 12) { // 12 : King
                    return (previousLastCardNumber == lastCardNumber);
                }
                return (previousLastCardNumber < lastCardNumber);
            } else if (
                keccak256(abi.encodePacked((playerChoices[i]))) ==
                keccak256(abi.encodePacked(("UNDER")))
            ) {
                if (previousLastCardNumber == 0) { // 0 : Ace
                    return (previousLastCardNumber == lastCardNumber);
                }
                return (previousLastCardNumber > lastCardNumber);
            } else if (
                keccak256(abi.encodePacked((playerChoices[i]))) ==
                keccak256(abi.encodePacked(("SKIP")))
            ) {
                continue;
            }
        }
        return false;
    }

    function getHiloGameChoice(string [] memory playerChoices)
        private
        pure
        returns (string memory)
    {
        string memory hiloGameChoice;

        for(uint8 i = 0; i < playerChoices.length; i++) {
            if (i == 0)
                hiloGameChoice = string(abi.encodePacked("[", playerChoices[i]));
            else
                hiloGameChoice = string(abi.encodePacked(hiloGameChoice, ", ", playerChoices[i]));
        }
        hiloGameChoice = string(abi.encodePacked(hiloGameChoice, "]"));

        return hiloGameChoice;
    }
}
