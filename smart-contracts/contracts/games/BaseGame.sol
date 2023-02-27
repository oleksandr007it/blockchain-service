// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../libraries/SeedUtility.sol";

contract BaseGame is Ownable, Pausable {
  struct BetLimit {
        uint256 minAmount;
        uint256 maxAmount;
        uint256 defaultAmount;
    }

    mapping(address => BetLimit) _betLimits;

    address payable internal _betSlipsAddr;
    uint256 internal _rtp;
    string gameCode;

    event betLimitChangedEvent(
        string gameCode,
        string tokenSymbol,
        address tokenAddress,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 defaultAmount
    );

    event rtpChangedEvent(
        string gameCode,
        uint256 rtp
    );

    event gameStateChangedEvent(
        string gameCode,
        bool enabled
    );

    function setRtp(uint256 rtp) public onlyOwner {
        _rtp = rtp;
        emit rtpChangedEvent(gameCode, _rtp);
    }

    function getRtp() public view returns (uint256) {
        return _rtp;
    }

    function setBetSlipsAddress(address betSlipsAddr) public onlyOwner {
        _betSlipsAddr = payable(betSlipsAddr);
    }

    function getBetSlipsAddress() public view returns (address) {
        return _betSlipsAddr;
    }

    function setBetLimit(
        address tokenAddress,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 defaultAmount
    ) public onlyOwner {
        BetLimit memory betLimit = BetLimit(minAmount, maxAmount, defaultAmount);
        _betLimits[tokenAddress] = betLimit;
        string memory tokenSymbol = ERC20(tokenAddress).symbol();

        emit betLimitChangedEvent(gameCode, tokenSymbol, tokenAddress, minAmount, maxAmount, defaultAmount);
    }

    function getGameConfig(address token) public view returns (string memory) {
        string memory rtp = string(
            abi.encodePacked('{"rtp":', SeedUtility.uintToStr(_rtp), ",")
        );

        string memory betLimitsStr = string(abi.encodePacked('"betLimits": {'));

        BetLimit memory betLimit = _betLimits[token];

        string memory tokenStr = string(
            abi.encodePacked('"', SeedUtility.addressToStr(token), '": {')
        );

        string memory minStr = string(
            abi.encodePacked(
                '"minAmount": ',
                SeedUtility.uintToStr(betLimit.minAmount),
                ","
            )
        );

        string memory maxStr = string(
            abi.encodePacked(
                '"maxAmount": ',
                SeedUtility.uintToStr(betLimit.maxAmount),
                ","
            )
        );

        string memory defaultStr = string(
            abi.encodePacked(
                '"defaultAmount": ',
                SeedUtility.uintToStr(betLimit.defaultAmount),
                "}"
            )
        );

        betLimitsStr = string(
            abi.encodePacked(
                betLimitsStr,
                tokenStr,
                minStr,
                maxStr,
                defaultStr
            )
        );

        return string(abi.encodePacked(rtp, betLimitsStr, "}}"));
    }

    function pauseGame() public onlyOwner whenNotPaused {
        _pause();
        emit gameStateChangedEvent(gameCode, false);
    }

    function unpauseGame() public onlyOwner whenPaused {
       _unpause();
       emit gameStateChangedEvent(gameCode, true);
    }
}