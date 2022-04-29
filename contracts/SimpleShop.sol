// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;


contract SimpleShop {
    address public contractAddress;
    address public owner;

    constructor() {
        owner = msg.sender;
        contractAddress = address(this);
    }


    function getBalance() public view returns(uint) {
        return contractAddress.balance;
    }


}