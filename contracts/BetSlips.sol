// SPDX-License-Identifier: MIT


pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


// File: contracts/BetSlips.sol
pragma solidity ^0.8.4;


contract BetSlips {
    enum Status {INIT, PLACED, PAYOFF}
    address public owner;
    uint256 betSlipId;
    address public betSlipsAddress;

    struct BetSlip {
        uint256 betAmount;
        uint256 returnAmount;
        string gameCode;
        string playerChoice;
        string gameResult;
        uint256 createdDate;
        uint256 lastModifiedDate;
        string from;
        Status currentStatus;
    }

    mapping(uint256 => BetSlip) betSlips;

    event betSlipPlaced(
        uint256 betSlipPlacedId,
        string indexed fromAddress,
        string indexed gameCode,
        uint createdDate
    );

    event betSlipChanged(
        uint256 betSlipPlacedId,
        string indexed fromAddress,
        string indexed gameCode,
        string gameResult
    );

    event tokensReceived(
        address from,
        address token,
        uint256 value
    );

    receive() external payable {}

    constructor() {
        owner = msg.sender;
        betSlipsAddress = address(this);
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function getBetSlip(uint256 index) public view returns (BetSlip memory) {
        return betSlips[index];
    }

    function setBetSlip(uint256 index, string memory gameResult) public returns (BetSlip memory) {
        BetSlip memory betSlip = betSlips[index];
        betSlip.gameResult = gameResult;
        betSlip.lastModifiedDate = block.timestamp;
        betSlips[index] = betSlip;
        emit betSlipChanged(index, betSlips[index].from, betSlips[index].gameCode, betSlips[index].gameResult);

        return betSlips[index];
    }

    function placeBetSlip(string memory gameCode, string memory playerChoice, uint256 amount) public returns (bool) {
        BetSlip memory newBetSlip = BetSlip(
            amount, 0, gameCode, playerChoice, "", 123, 321, "123123431", Status.PLACED
        );
        betSlips[betSlipId] = newBetSlip;
        emit betSlipPlaced(betSlipId, betSlips[betSlipId].from, gameCode, betSlips[betSlipId].createdDate);
        betSlipId++;
        return true;
    }

    function depositAndPlaceBetSlipWithPermit(string memory gameCode,
        string memory playerChoice,
        address token,
        uint256 amount,
        uint256 approval, uint256 deadline, uint8 v, bytes32 r, bytes32 s
    ) external returns (bool) {
        require(approval >= amount, "value is greater than approval");

        //Should give permissions
        IERC20Permit(token).permit(msg.sender, address(this), approval, deadline, v, r, s);
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "ERC20: transferFrom token failed");
        emit tokensReceived(msg.sender, token, amount);
        placeBetSlip(gameCode, playerChoice, amount);
        return true;
    }

    function depositAndPlaceBetSlip(string memory gameCode, string memory playerChoice, address token, uint256 amount) external returns (bool) {
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "ERC20: transferFrom token failed");
        emit tokensReceived(msg.sender, token, amount);
        placeBetSlip(gameCode, playerChoice, amount);
        return true;
    }

    function withdrawERC20(address tokenERC20, uint256 amount) public onlyOwner() {
        require(amount <= IERC20(tokenERC20).balanceOf(address(this)), "ERC20: amount is greater than currentBalance");
        IERC20(tokenERC20).transferFrom(address(this), owner, amount);
    }
}