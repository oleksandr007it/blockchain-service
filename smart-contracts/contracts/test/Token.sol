// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20{
    constructor(uint256 _max_supply) ERC20("USDT", "USDT"){
        _mint(msg.sender,_max_supply);
    }
}