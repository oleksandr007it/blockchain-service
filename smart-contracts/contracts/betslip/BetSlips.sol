// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../interfaces/IBetSlips.sol";
import "../libraries/SeedUtility.sol";

contract BetSlips is IBetSlips, AccessControl, Ownable {
    uint256 public _betSlipsCount;

    mapping(string => BetSlip) _betSlips;

    bytes32 public constant GAME_ROLE = keccak256("GAME_ROLE");
    bytes32 public constant COMPLETER_ROLE = keccak256("COMPLETER_ROLE");

    constructor () {
        _betSlipsCount = 0;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    modifier onlyGameRole() {
        require(hasRole(GAME_ROLE, _msgSender()), "This is not Game Contract");
        _;
    }

    modifier onlyCompleterRole() {
        require(
            hasRole(COMPLETER_ROLE, _msgSender()),
            "This is not Bet Completer"
        );
        _;
    }

    function grantGameRole(address account) public onlyOwner {
        grantRole(GAME_ROLE, account);
    }

    function grantCompleterRole(address account) public onlyOwner {
        grantRole(COMPLETER_ROLE, account);
    }

    function getBetSlip(string memory seedHash)
        public
        view
        override
        returns (BetSlip memory)
    {
        return _betSlips[seedHash];
    }

    function debit(
        address player,
        address token,
        uint256 wagerAmount,
        string memory seedHash
    ) private {
        require(_betSlips[seedHash].betId == 0, "SeedHash is already used");

        require(
            IERC20(token).balanceOf(player) >= wagerAmount,
            "Insufficient balance"
        );

        require(
            IERC20(token).allowance(player, address(this)) >= wagerAmount,
            "Insufficient allowance"
        );

        IERC20(token).transferFrom(player, address(this), wagerAmount);
    }

    function debitWithPermit(
        address player,
        address token,
        uint256 wagerAmount,
        string memory seedHash,
        uint256 deadLine,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) private {
        require(_betSlips[seedHash].betId == 0, "SeedHash is already used");

        require(
            IERC20(token).balanceOf(player) >= wagerAmount,
            "Insufficient balance"
        );

        IERC20Permit(token).permit(
            player,
            address(this),
            wagerAmount,
            deadLine,
            v,
            r,
            s
        );

        IERC20(token).transferFrom(player, address(this), wagerAmount);
    }

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
    ) public override onlyGameRole {
        if (deadLine == 0 && v == 0 && r == 0 && s == 0)
            debit(player, token, wagerAmount, seedHash);
        else
            debitWithPermit(player, token, wagerAmount, seedHash, deadLine, v, r, s);

        _betSlipsCount++;
        
        BetSlip memory betSlip = BetSlip(
            _betSlipsCount,
            player,
            token,
            gameCode,
            playerGameChoice,
            "",
            wagerAmount,
            0,
            odds,
            seedHash,
            "",
            Status.PLACED,
            block.timestamp,
            0
        );

        _betSlips[seedHash] = betSlip;

        emit betSlipPlaced(
            betSlip.betId,
            betSlip.player,
            betSlip.token,
            betSlip.gameCode,
            betSlip.playerGameChoice,
            betSlip.wagerAmount,
            betSlip.seedHash,
            betSlip.odds,
            betSlip.status
        );
    }

    function completeBet(
        string memory seedHash,
        string memory seed,
        string memory playerGameChoice,
        string memory gameResult,
        uint256 returnAmount,
        uint256 odds
    ) public override onlyCompleterRole {
        require(_betSlips[seedHash].status == Status.PLACED, "Betslip is already terminated.");

        BetSlip memory betSlip = _betSlips[seedHash];
        
        betSlip.playerGameChoice = playerGameChoice;
        betSlip.gameResult = gameResult;
        betSlip.returnAmount = returnAmount;
        betSlip.seed = seed;
        betSlip.odds = odds;
        betSlip.completedAt = block.timestamp;
        betSlip.status = Status.COMPLETED;

        if (returnAmount > 0) {
            IERC20(betSlip.token).transfer(
                betSlip.player,
                betSlip.returnAmount
            );
        }

        _betSlips[seedHash] = betSlip;

        emit betSlipCompleted(
            betSlip.betId,
            betSlip.player,
            betSlip.token,
            betSlip.gameCode,
            betSlip.playerGameChoice,
            betSlip.wagerAmount,
            betSlip.seedHash,
            betSlip.gameResult,
            betSlip.returnAmount,
            betSlip.seed,
            betSlip.odds,
            betSlip.status
        );
    }

    function revokeBetSlips(string [] memory seedHashes, string memory reason)
        public
        override
        onlyOwner
    {
        BetSlip memory betSlip;
        string memory seedHashArray;

        for (uint8 i = 0; i < seedHashes.length; i++) {
            betSlip = _betSlips[seedHashes[i]];

            if (betSlip.status == Status.PLACED) {
                betSlip.status = Status.REVOKED;

                IERC20(betSlip.token).transfer(
                    betSlip.player,
                    betSlip.wagerAmount
                );

                _betSlips[seedHashes[i]] = betSlip;
            }
        }
        seedHashArray = SeedUtility.toJsonStrArray(seedHashes);

        emit betSlipRevoked(
            seedHashArray, 
            reason
        );
    }

    function withdrawERC20(address tokenERC20, uint256 amount)
        public
        onlyOwner
    {
        require(
            amount <= IERC20(tokenERC20).balanceOf(address(this)),
            "ERC20: amount is greater than currentBalance"
        );

        IERC20(tokenERC20).transfer(owner(), amount);
    }
}
