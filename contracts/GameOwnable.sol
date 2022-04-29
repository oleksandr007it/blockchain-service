// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract GameOwnable {
    address public owner;
    address public proxy;

    event OwnerSet(address indexed oldOwner, address indexed newOwner);
    event ProxySet(address indexed oldProxy, address indexed newProxy);

    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
    */
    constructor() {
        owner = msg.sender;
    }


    /**
     * @dev Throws if called by any account other than the owner.
    */
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    /**
     * @dev modifier to check if caller is proxy
    */
    modifier onlyProxy() {
        require(msg.sender == proxy, "Caller is not proxy");
        _;
    }

    /**
     * @dev Return owner address
     * @return address of owner
     */
    function getOwner() public view returns (address) {
        return owner;
    }

    /**
     * @dev Change proxy
     * @param newProxy address of new proxy
     */
    function changeProxy(address newProxy) public onlyOwner {
        emit ProxySet(proxy,newProxy);
        proxy = newProxy;
    }

    /**
     * @dev Return the flag of miner
     * @return flag of miner
     */
    function getProxy() public view returns (address) {
        return proxy;
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
    */
    function transferOwnership(address newOwner) public onlyOwner {
        if (newOwner != address(0)) {
            emit OwnerSet(owner, newOwner);
            owner = newOwner;
        }
    }
}