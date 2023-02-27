// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../interfaces/IBetSlips.sol";
import "./BaseGame.sol";

contract PlinkoGame is BaseGame {

    struct PlinkoGameChoice {
        uint256 blueBetAmount;
        uint256 amountOfBlueBalls;
        uint256 greenBetAmount;
        uint256 amountOfGreenBalls;
        uint256 redBetAmount;
        uint256 amountOfRedBalls;
    }

    struct PlinkoGameItem {
        string name;
        uint256 probability;
        uint256 odds;
    }

    uint256 constant ITEMS_AMOUNT = 15;

    PlinkoGameItem[ITEMS_AMOUNT] BLUE_GAME_ITEMS;
    PlinkoGameItem[ITEMS_AMOUNT] GREEN_GAME_ITEMS;
    PlinkoGameItem[ITEMS_AMOUNT] RED_GAME_ITEMS;

    mapping(string => PlinkoGameChoice) _playerChoices;

    constructor(address betSlipsAddr, uint256 rtp) {
        _betSlipsAddr = payable(betSlipsAddr);
        _rtp = rtp;
        gameCode = "plinko";
        initializePlinkoGameItems();
    }

    function initializePlinkoGameItems() private {
        uint256[ITEMS_AMOUNT] memory probabilities = [uint256(6104), 85449, 555420, 2221680, 6109619, 12219238, 18328857, 20947266, 18328857, 12219238, 6109619, 2221680, 555420, 85449, 6104];
        uint256[ITEMS_AMOUNT] memory blueOdds = [uint256(2720), 425, 169, 110, 101, 42, 93, 85, 93, 42, 101, 110, 169, 425, 2720];
        uint256[ITEMS_AMOUNT] memory greenOdds = [uint256(8502), 1700, 425, 255, 169, 93, 42, 16, 42, 93, 169, 255, 425, 1700, 8502];
        uint256[ITEMS_AMOUNT] memory redOdds = [uint256(85025), 4251, 849, 339, 169, 42, 16, 16, 16, 42, 169, 339, 849, 4251, 85025];
        
        for(uint8 i = 0; i < ITEMS_AMOUNT; i++) {
            BLUE_GAME_ITEMS[i] = PlinkoGameItem(string(abi.encodePacked("BLUE_", SeedUtility.uintToStr(i+1))), probabilities[i], blueOdds[i]);
            GREEN_GAME_ITEMS[i] = PlinkoGameItem(string(abi.encodePacked("GREEN_", SeedUtility.uintToStr(i+1))), probabilities[i], greenOdds[i]);
            RED_GAME_ITEMS[i] = PlinkoGameItem(string(abi.encodePacked("RED_", SeedUtility.uintToStr(i+1))), probabilities[i], redOdds[i]);
        }
    }

    function generateGameItems(string memory color, string memory seed, uint256 amountOfBalls)
        private
        view
        returns (PlinkoGameItem [] memory) 
    {
        uint256 i;
        uint256 index;
        string memory currentSeed = seed;
    
        PlinkoGameItem [] memory generatedGameItems = new PlinkoGameItem[](amountOfBalls);
        PlinkoGameItem [] memory plinkoGameItems = new PlinkoGameItem[](ITEMS_AMOUNT);

        currentSeed = string(abi.encodePacked(currentSeed, color));
        if (keccak256(abi.encodePacked((color))) ==
            keccak256(abi.encodePacked(("BLUE")))) {
            for (i = 0; i < ITEMS_AMOUNT; i++)
                plinkoGameItems[i] = BLUE_GAME_ITEMS[i];
        } else if (keccak256(abi.encodePacked((color))) ==
            keccak256(abi.encodePacked(("GREEN")))) {
            for (i = 0; i < ITEMS_AMOUNT; i++)
                plinkoGameItems[i] = GREEN_GAME_ITEMS[i];
        } else if (keccak256(abi.encodePacked((color))) ==
            keccak256(abi.encodePacked(("RED")))) {
            for (i = 0; i < ITEMS_AMOUNT; i++)
                plinkoGameItems[i] = RED_GAME_ITEMS[i];
        }

        uint256 [] memory probabilities = new uint256[](ITEMS_AMOUNT);
        for (i = 0; i < ITEMS_AMOUNT; i++)
            probabilities[i] = plinkoGameItems[i].probability;
        
        for (uint256 j = 0; j < amountOfBalls; j++) {
            index = SeedUtility.getResultByProbabilities(currentSeed, probabilities, 8);
            generatedGameItems[j] = plinkoGameItems[index];

            currentSeed = SeedUtility.bytes32ToString(sha256(abi.encodePacked(currentSeed)));
        }

        return generatedGameItems;
    }

    function revealSeed(
        string memory seedHash, 
        string memory seed
    ) public {
        require(SeedUtility.compareSeed(seedHash, seed) == true, "Invalid seed");

        IBetSlips.BetSlip memory betSlip = IBetSlips(_betSlipsAddr).getBetSlip(
            seedHash
        );

        uint256 i;
        PlinkoGameChoice memory playerGameChoice = _playerChoices[seedHash];
        uint256 totalBallsAmount = playerGameChoice.amountOfBlueBalls + 
                                    playerGameChoice.amountOfGreenBalls + 
                                    playerGameChoice.amountOfRedBalls;

        PlinkoGameItem [] memory blueGameItems = generateGameItems("BLUE", seed, playerGameChoice.amountOfBlueBalls);
        PlinkoGameItem [] memory greenGameItems = generateGameItems("GREEN", seed, playerGameChoice.amountOfGreenBalls);
        PlinkoGameItem [] memory redGameItems = generateGameItems("RED", seed, playerGameChoice.amountOfRedBalls);

        uint256 returnAmount = 0;

        for(i = 0; i < playerGameChoice.amountOfBlueBalls; i++) {
            // returnAmount = betAmount / amountOfBalls * odds (by color)
            returnAmount += (playerGameChoice.blueBetAmount * (blueGameItems[i].odds * _rtp / 100) / playerGameChoice.amountOfBlueBalls / 100);
        }

        for(i = 0; i < playerGameChoice.amountOfGreenBalls; i++) {
            returnAmount += (playerGameChoice.greenBetAmount * (greenGameItems[i].odds * _rtp / 100) / playerGameChoice.amountOfGreenBalls / 100);
        }

        for(i = 0; i < playerGameChoice.amountOfRedBalls; i++) {
            returnAmount += (playerGameChoice.redBetAmount * (redGameItems[i].odds * _rtp / 100) / playerGameChoice.amountOfRedBalls / 100);
        }

        uint256 odds = returnAmount * 100 / betSlip.wagerAmount;

        string [] memory gameItemsNameArray = new string[](totalBallsAmount);
        for(i = 0; i < playerGameChoice.amountOfBlueBalls; i++) {
            gameItemsNameArray[i] = blueGameItems[i].name;
        }

        for(i = 0; i < playerGameChoice.amountOfGreenBalls; i++) {
            uint256 shiftIndex = playerGameChoice.amountOfBlueBalls;
            gameItemsNameArray[shiftIndex+i] = greenGameItems[i].name;
        }

        for(i = 0; i < playerGameChoice.amountOfRedBalls; i++) {
            uint256 shiftIndex = playerGameChoice.amountOfBlueBalls + playerGameChoice.amountOfGreenBalls;
            gameItemsNameArray[shiftIndex+i] = redGameItems[i].name;
        }

        string memory gameItemsName = SeedUtility.toStrArray(gameItemsNameArray);

        IBetSlips(_betSlipsAddr).completeBet(
            seedHash,
            seed,
            betSlip.playerGameChoice,
            gameItemsName,
            returnAmount,
            odds
        );
    }

    function placeBet(
        uint256 blueBetAmount,
        uint256 amountOfBlueBalls,
        uint256 greenBetAmount,
        uint256 amountOfGreenBalls,
        uint256 redBetAmount,
        uint256 amountOfRedBalls,
        string memory seedHash,
        address token
    ) public whenNotPaused{
        placeBetSlip(
            blueBetAmount, amountOfBlueBalls, 
            greenBetAmount, amountOfGreenBalls, 
            redBetAmount, amountOfRedBalls,
            seedHash, token, 0, 0, 0, 0);
    }

    function placeBetWithPermit(
        uint256 blueBetAmount,
        uint256 amountOfBlueBalls,
        uint256 greenBetAmount,
        uint256 amountOfGreenBalls,
        uint256 redBetAmount,
        uint256 amountOfRedBalls,
        string memory seedHash,
        address token,
        uint256 deadLine,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public whenNotPaused{
        placeBetSlip(
            blueBetAmount, amountOfBlueBalls, 
            greenBetAmount, amountOfGreenBalls, 
            redBetAmount, amountOfRedBalls,
            seedHash, token, deadLine, v, r, s);
    }

    function placeBetSlip(
        uint256 blueBetAmount,
        uint256 amountOfBlueBalls,
        uint256 greenBetAmount,
        uint256 amountOfGreenBalls,
        uint256 redBetAmount,
        uint256 amountOfRedBalls,
        string memory seedHash,
        address token,
        uint256 deadLine,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) private {
        uint256 wagerAmount = blueBetAmount + greenBetAmount + redBetAmount;
        require(
            wagerAmount >= _betLimits[token].minAmount && wagerAmount <= _betLimits[token].maxAmount,
            "The WagerAmount is invalid"
        );

        uint256 totalAmountOfBalls = amountOfBlueBalls + amountOfGreenBalls + amountOfRedBalls;
        require(totalAmountOfBalls > 0, "Player must input amount of balls for one sector at least.");

        require(
            (blueBetAmount > 0 && amountOfBlueBalls > 0) || (blueBetAmount == 0 && amountOfBlueBalls == 0),
            "The playerChoice of blue sector is invalid"
        );

        require(
            (greenBetAmount > 0 && amountOfGreenBalls > 0) || (greenBetAmount == 0 && amountOfGreenBalls == 0),
            "The playerChoice of green sector is invalid"
        );

        require(
            (redBetAmount > 0 && amountOfRedBalls > 0) || (redBetAmount == 0 && amountOfRedBalls == 0),
            "The playerChoice of red sector is invalid"
        );

        _playerChoices[seedHash].blueBetAmount = blueBetAmount;
        _playerChoices[seedHash].amountOfBlueBalls = amountOfBlueBalls;
        _playerChoices[seedHash].greenBetAmount = greenBetAmount;
        _playerChoices[seedHash].amountOfGreenBalls = amountOfGreenBalls;
        _playerChoices[seedHash].redBetAmount = redBetAmount;
        _playerChoices[seedHash].amountOfRedBalls = amountOfRedBalls;

        string memory playerGameChoice = getPlinkoGameChoice(_playerChoices[seedHash]);

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

    function getPlinkoGameChoice(PlinkoGameChoice memory playerGameChoice)
        private
        pure
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(
                    '{"blueBetAmount":"',
                    SeedUtility.uintToStr(playerGameChoice.blueBetAmount),
                    '", "amountOfBlueBalls":"',
                    SeedUtility.uintToStr(playerGameChoice.amountOfBlueBalls),
                    '", "greenBetAmount":"',
                    SeedUtility.uintToStr(playerGameChoice.greenBetAmount),
                    '", "amountOfGreenBalls":"',
                    SeedUtility.uintToStr(playerGameChoice.amountOfGreenBalls),
                    '", "redBetAmount":"',
                    SeedUtility.uintToStr(playerGameChoice.redBetAmount),
                    '", "amountOfRedBalls":"',
                    SeedUtility.uintToStr(playerGameChoice.amountOfRedBalls),
                    '"}'
                )
            );
    }
}
