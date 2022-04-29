require("@nomiclabs/hardhat-waffle");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const crypto = require("crypto");

hash = crypto.getHashes();

const toWei = (value) => ethers.utils.parseEther(value.toString());

const fromWei = (value) =>
  ethers.utils.formatEther(
    typeof value === "string" ? value : value.toString()
  );

const getBalance = ethers.provider.getBalance;

describe("ThrowDice", () => {
  let owner;
  let user;
  let betSlips;
  let throwDice;
  let token;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    const BetSlips = await ethers.getContractFactory("BetSlips");
    betSlips = await BetSlips.deploy();
    await betSlips.deployed();

    const ThrowDice = await ethers.getContractFactory("ThrowDice");
    throwDice = await ThrowDice.deploy(betSlips.address);
    await throwDice.deployed();

    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("Test Token", "TKN", 100000);
    await token.deployed();
  });


  it("is deployed", async () => {
    expect(await throwDice.betSlipsAddr()).to.equal(betSlips.address);
    expect(await token.totalSupply()).to.equal(100000);
    expect(await token.balanceOf(owner.address)).to.equal(100000);
  });


  describe("Set Rtp and Get Odds", () => {
    it("set rtp", async () => {
      await throwDice.setRtp(95);
      expect(await throwDice.getRtp()).to.equal(95);

      await throwDice.setRtp(97);
      expect(await throwDice.getRtp()).to.equal(97);
    });

    it("get odds", async () => {
      expect(await throwDice.getOdds(98, 0)).to.equal(9700);
      expect(await throwDice.getOdds(80, 0)).to.equal(510);
      expect(await throwDice.getOdds(50, 0)).to.equal(197);
      expect(await throwDice.getOdds(25, 0)).to.equal(131);
      expect(await throwDice.getOdds(4, 0)).to.equal(102);

      expect(await throwDice.getOdds(1, 1)).to.equal(9700);
      expect(await throwDice.getOdds(25, 1)).to.equal(388);
      expect(await throwDice.getOdds(50, 1)).to.equal(194);
      expect(await throwDice.getOdds(80, 1)).to.equal(121);
      expect(await throwDice.getOdds(95, 1)).to.equal(102);
    });
  });


  describe("deposit and place, complete the BetSlip without permit", () => {
    it("deposit the token amount", async () => {
      await token.approve(betSlips.address, 200);

      var input_str = "I am converting string to hash.";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      await expect(throwDice.placeBet(200, 42, "OVER", seedHash, token.address))
        .to.emit(betSlips, 'tokenReceived')
        .withArgs(owner.address, token.address, 200);

      expect(await throwDice.betSlipsAddr()).to.equal(betSlips.address);
      expect(await token.balanceOf(betSlips.address)).to.equal(200);
    })

    it("place the betslip", async () => {
      await token.approve(betSlips.address, 200);

      var input_str = "I am converting string to hash.";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      await expect(throwDice.placeBet(200, 42, "OVER", seedHash, token.address))
        .to.emit(betSlips, 'betSlipPlaced')
        .withArgs(1, owner.address, "dice");
    })

    it("complete the betslip", async () => {
      await token.approve(betSlips.address, 200);

      var input_str = "I am converting string to hash.";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      const placeTx = await throwDice.placeBet(200, 42, "OVER", seedHash, token.address);
      await placeTx.wait();

      await expect(throwDice.revealSeed(1, owner.address, seedHash))
        .to.emit(betSlips, 'betSlipCompleted')
        .withArgs(1, owner.address, "dice", 340);
    })
  })
});