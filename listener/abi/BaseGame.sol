// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../libraries/SeedUtility.sol";

contract BaseGame is Ownable {
  struct BetLimit {
        uint256 min;
        uint256 max;
        uint256 defaultValue;
    }

    mapping(address => BetLimit) _betLimits;

    address payable internal _betSlipsAddr;
    uint256 internal _rtp;

    event betLimitSet(
        address token,
        uint256 min,
        uint256 max,
        uint256 defaultValue
    );

    function setRtp(uint256 rtp) public onlyOwner {
        _rtp = rtp;
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
        address token,
        uint256 min,
        uint256 max,
        uint256 defaultValue
    ) public onlyOwner {
        BetLimit memory betLimit = BetLimit(min, max, defaultValue);
        _betLimits[token] = betLimit;

        emit betLimitSet(token, min, max, defaultValue);
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
                '"min": ',
                SeedUtility.uintToStr(betLimit.min),
                ","
            )
        );

        string memory maxStr = string(
            abi.encodePacked(
                '"max": ',
                SeedUtility.uintToStr(betLimit.max),
                ","
            )
        );

        string memory defaultStr = string(
            abi.encodePacked(
                '"default": ',
                SeedUtility.uintToStr(betLimit.defaultValue),
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
}