require("@nomiclabs/hardhat-waffle");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { upgrades } = require("hardhat");

const crypto = require("crypto");

const USDT_ADDRESS = "0xFFfffffF8d2EE523a2206206994597c13D831EC7";
const ERC20ABI = require('../abi/AminoTokenAbi.json');

describe("DiceGame", () => {
  let owner;
  let betSlips;
  let diceGame;
  let seedutility;
  let USDT;
  let tx;

  before(async () => {
    [owner] = await ethers.getSigners();

    USDT = new ethers.Contract(USDT_ADDRESS, ERC20ABI, owner);

    const SeedUtility = await ethers.getContractFactory("SeedUtility");
    seedutility = await SeedUtility.deploy();
    await seedutility.deployed();

    const BetSlips = await ethers.getContractFactory("BetSlips");
    const BetSlipsV2 = await ethers.getContractFactory("BetSlipsV2");

    const BetSlips_instance = await upgrades.deployProxy(BetSlips, {kind: 'uups'});
    await BetSlips_instance.deployed();
    betSlips = await upgrades.upgradeProxy(BetSlips_instance.address, BetSlipsV2);
    
    const DiceGame = await ethers.getContractFactory("DiceGame", {
      libraries: {
        SeedUtility: seedutility.address,
      },
    });
    const DiceGameV2 = await ethers.getContractFactory("DiceGameV2", {
      libraries: {
        SeedUtility: seedutility.address,
      },
    });
    const DiceGame_instance = await upgrades.deployProxy(DiceGame, [betSlips.address, 97], {unsafeAllowLinkedLibraries: true, kind: 'uups'});
    await DiceGame_instance.deployed();
    diceGame = await upgrades.upgradeProxy(DiceGame_instance.address, DiceGameV2, {unsafeAllowLinkedLibraries: true});

    await betSlips.grantGameRole(diceGame.address);
    await betSlips.grantCompleterRole(diceGame.address);
  });

  it("is deployed", async () => {
    expect(await diceGame.getBetSlipsAddress()).to.equal(betSlips.address);
    expect(await USDT.totalSupply()).to.equal(11000000000000);
    expect(await USDT.balanceOf(owner.address)).to.equal(1000000000000);
  });


  describe("Set Rtp and Get Odds", () => {
    it("set rtp", async () => {
      tx = await diceGame.setRtp(95);
      await tx.wait();
      expect(await diceGame.getRtp()).to.equal(95);

      tx = await diceGame.setRtp(97);
      await tx.wait();
      expect(await diceGame.getRtp()).to.equal(97);
    });

    it("get odds", async () => {
      expect(await diceGame.getOdds(98, 0)).to.equal(9700);
      expect(await diceGame.getOdds(80, 0)).to.equal(511);
      expect(await diceGame.getOdds(50, 0)).to.equal(198);
      expect(await diceGame.getOdds(25, 0)).to.equal(131);
      expect(await diceGame.getOdds(4, 0)).to.equal(102);

      expect(await diceGame.getOdds(1, 1)).to.equal(9700);
      expect(await diceGame.getOdds(25, 1)).to.equal(388);
      expect(await diceGame.getOdds(50, 1)).to.equal(194);
      expect(await diceGame.getOdds(80, 1)).to.equal(121);
      expect(await diceGame.getOdds(95, 1)).to.equal(102);
    });
  });


  describe("Set betlimt and get game config", () => {
    it("set betlimit and get game config", async () => {
      await expect(diceGame.setBetLimit(USDT_ADDRESS, 20, 10000, 32))
        .to.emit(diceGame, 'betLimitSet')
        .withArgs(USDT_ADDRESS, 20, 10000, 32);

      expect(await diceGame.getGameConfig(USDT_ADDRESS)).to.equal(`{"rtp":97,"betLimits": {"0xffffffff8d2ee523a2206206994597c13d831ec7": {"min": 20,"max": 10000,"default": 32}}}`);

      await expect(diceGame.setBetLimit("0x96961D1440D6C38D3241b154865dA7D06C971a2c", 20, 10000, 32))
        .to.emit(diceGame, 'betLimitSet')
        .withArgs("0x96961D1440D6C38D3241b154865dA7D06C971a2c", 20, 10000, 32);

      expect(await diceGame.getGameConfig("0x96961d1440d6c38d3241b154865da7d06c971a2c")).to.equal(`{"rtp":97,"betLimits": {"0x96961d1440d6c38d3241b154865da7d06c971a2c": {"min": 20,"max": 10000,"default": 32}}}`);

      tx = await diceGame.setBetLimit(USDT_ADDRESS, 200, 20000, 50);
      await tx.wait();

      expect(await diceGame.getGameConfig(USDT_ADDRESS)).to.equal(`{"rtp":97,"betLimits": {"0xffffffff8d2ee523a2206206994597c13d831ec7": {"min": 200,"max": 20000,"default": 50}}}`);
    });
  });


  describe("debit and place, complete the BetSlip without permit", () => {
    it("validate the bet", async () => {
      var input_str = "Seed String One";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      await expect(diceGame.placeBet(200, 42, "OVERUNDER", seedHash, USDT_ADDRESS))
        .to.be.revertedWith("The choice is invalid");

      await expect(diceGame.placeBet(50000, 42, "OVER", seedHash, USDT_ADDRESS))
        .to.be.revertedWith("The WagerAmount is invalid");

      await expect(diceGame.placeBet(10, 42, "UNDER", seedHash, USDT_ADDRESS))
        .to.be.revertedWith("The WagerAmount is invalid");
    })

    it("debit the token amount", async () => {
      var input_str = "Seed String One";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      await expect(diceGame.placeBet(200, 42, "OVER", seedHash, USDT_ADDRESS))
        .to.be.revertedWith("Insufficient allowance");

      tx = await USDT.approve(betSlips.address, 200);
      await tx.wait();

      tx = await diceGame.placeBet(200, 42, "OVER", seedHash, USDT_ADDRESS);
      await tx.wait();

      expect(await USDT.balanceOf(betSlips.address)).to.equal(200);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999999800);
    });

    it("place the betslip", async () => {
      var input_str = "Seed String Two";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      tx = await USDT.approve(betSlips.address, 200);
      await tx.wait();

      await expect(diceGame.placeBet(200, 42, "OVER", seedHash, USDT_ADDRESS))
        .to.emit(betSlips, 'betSlipPlaced')
        .withArgs((await betSlips.getBetSlip(seedHash)), [999999999800, 999999999600, 6]);

      await expect(diceGame.placeBet(200, 42, "OVER", seedHash, USDT_ADDRESS))
        .to.be.revertedWith("SeedHash is already used");

      expect(await USDT.balanceOf(betSlips.address)).to.equal(400);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999999600);
    });

    it("complete the betslip valid seed", async () => {
      var input_str = "Seed String Three";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      tx = await USDT.approve(betSlips.address, 200);
      await tx.wait();

      tx = await USDT.transfer(betSlips.address, 1000);
      await tx.wait();

      expect(await USDT.balanceOf(betSlips.address)).to.equal(1400);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999998600);

      const placeTx = await diceGame.placeBet(200, 42, "OVER", seedHash, USDT_ADDRESS);
      await placeTx.wait();

      expect(await USDT.balanceOf(betSlips.address)).to.equal(1600);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999998400);

      await expect(diceGame.revealSeed(seedHash, input_str))
        .to.emit(betSlips, 'betSlipCompleted')
        .withArgs((await betSlips.getBetSlip(seedHash)), [999999998400, 999999998740, 6]);

      expect(await USDT.balanceOf(betSlips.address)).to.equal(1260);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999998740);
    });

    it("complete the betslip with invalid seed", async () => {
      var input_str = "Valid Seed";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      tx = await USDT.approve(betSlips.address, 200);
      await tx.wait();

      const placeTx = await diceGame.placeBet(200, 42, "OVER", seedHash, USDT_ADDRESS);
      await placeTx.wait();

      expect(await USDT.balanceOf(betSlips.address)).to.equal(1460);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999998540);

      var invalid_str = "Invalid Seed";

      await expect(diceGame.revealSeed(1, invalid_str))
        .to.be.revertedWith("Invalid seed");

      expect(await USDT.balanceOf(betSlips.address)).to.equal(1460);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999998540);
    });
  });
});