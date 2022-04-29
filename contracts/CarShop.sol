// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

contract CarShop {
    mapping (address => bool) buyers;
    uint256 public price = 2;
    string public nameCar = "Porsche Cayenne";
    address public owner;
    address public shopAddress;
    bool fullyPaid; // false

    event ItemFullyPaid(uint _price, address _shopAddress);

    constructor() {
        owner = msg.sender;
        shopAddress = address(this);
    }

    function getBuyer(address _addr) public view returns(bool) {
        require(owner == msg.sender, "You are not an owner!");

        return buyers[_addr];
    }

    function addBuyer(address _addr) public {
        require(owner == msg.sender, "You are not an owner!");
        buyers[_addr] = true;
    }

    function getBalance() public view returns(uint) {
        return shopAddress.balance;
    }

    function withdrawAll() public {
        require(owner == msg.sender && fullyPaid && shopAddress.balance > 0, "Rejected");

        address payable receiver = payable(msg.sender);

        receiver.transfer(shopAddress.balance);
    }

    function saleNewCar(string memory _newName) public{
        require(owner == msg.sender, "You are not an owner!");
        fullyPaid = false;
        nameCar=_newName;
    }

    function setNewPrice(uint256 newPrice) public{
        require(owner == msg.sender, "You are not an owner!");
        price=newPrice;
    }

    receive() external payable {
        require(buyers[msg.sender] && msg.value <= price && !fullyPaid, "Rejected");
        if(shopAddress.balance == price) {
            fullyPaid = true;
            emit ItemFullyPaid(price, shopAddress);
        }
    }
}