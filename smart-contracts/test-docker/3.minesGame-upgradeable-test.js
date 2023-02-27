require("@nomiclabs/hardhat-waffle");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { upgrades } = require("hardhat");

const crypto = require("crypto");

const USDT_ADDRESS = "0xFFfffffF8d2EE523a2206206994597c13D831EC7";
const ERC20ABI = require('../abi/AminoTokenAbi.json');

describe("MinesGame", () => {
  let owner;
  let betSlips;
  let minesGame;
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
    
    const MinesGame = await ethers.getContractFactory("MinesGame", {
      libraries: {
        SeedUtility: seedutility.address,
      },
    });
    const MinesGameV2 = await ethers.getContractFactory("MinesGameV2", {
      libraries: {
        SeedUtility: seedutility.address,
      },
    });
    const MinesGame_instance = await upgrades.deployProxy(MinesGame, [betSlips.address, 97], {unsafeAllowLinkedLibraries: true, kind: 'uups'});
    await MinesGame_instance.deployed();
    minesGame = await upgrades.upgradeProxy(MinesGame_instance.address, MinesGameV2, {unsafeAllowLinkedLibraries: true});

    await betSlips.grantGameRole(minesGame.address);
    await betSlips.grantCompleterRole(minesGame.address);
  });

  it("is deployed", async () => {
    expect(await minesGame.getBetSlipsAddress()).to.equal(betSlips.address);
    expect(await USDT.totalSupply()).to.equal(11000000000000);
    expect(await USDT.balanceOf(owner.address)).to.equal(1000000000000);
  });


  describe("Set Rtp and Get Odds", () => {
    it("set rtp", async () => {
      tx = await minesGame.setRtp(95);
      await tx.wait();
      expect(await minesGame.getRtp()).to.equal(95);

      tx = await minesGame.setRtp(97);
      await tx.wait();
      expect(await minesGame.getRtp()).to.equal(97);
    });

    it("get odds", async () => {
      expect(await minesGame.getOdds(5, 3)).to.equal(196);
      expect(await minesGame.getOdds(5, 9)).to.equal(1180);
      expect(await minesGame.getOdds(5, 15)).to.equal(20451);

      expect(await minesGame.getOdds(10, 4)).to.equal(899);
      expect(await minesGame.getOdds(10, 8)).to.equal(16303);
      expect(await minesGame.getOdds(10, 12)).to.equal(1108635);
    });
  });


  describe("Set betlimt and get game config", () => {
    it("set betlimit and get game config", async () => {
      await expect(minesGame.setBetLimit(USDT_ADDRESS, 20, 10000, 32))
        .to.emit(minesGame, 'betLimitSet')
        .withArgs(USDT_ADDRESS, 20, 10000, 32);

      expect(await minesGame.getGameConfig(USDT_ADDRESS)).to.equal(`{"rtp":97,"betLimits": {"0xffffffff8d2ee523a2206206994597c13d831ec7": {"min": 20,"max": 10000,"default": 32}}}`);

      await expect(minesGame.setBetLimit("0x96961D1440D6C38D3241b154865dA7D06C971a2c", 20, 10000, 32))
        .to.emit(minesGame, 'betLimitSet')
        .withArgs("0x96961D1440D6C38D3241b154865dA7D06C971a2c", 20, 10000, 32);

      expect(await minesGame.getGameConfig("0x96961d1440d6c38d3241b154865da7d06c971a2c")).to.equal(`{"rtp":97,"betLimits": {"0x96961d1440d6c38d3241b154865da7d06c971a2c": {"min": 20,"max": 10000,"default": 32}}}`);

      tx = await minesGame.setBetLimit(USDT_ADDRESS, 200, 20000, 50);
      await tx.wait();

      expect(await minesGame.getGameConfig(USDT_ADDRESS)).to.equal(`{"rtp":97,"betLimits": {"0xffffffff8d2ee523a2206206994597c13d831ec7": {"min": 200,"max": 20000,"default": 50}}}`);
    });
  });


  describe("debit and place, complete the BetSlip without permit", () => {
    it("validate the bet", async () => {
      var input_str = "Seed String One";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      await expect(minesGame.placeBet(200, 42, seedHash, USDT_ADDRESS))
        .to.be.revertedWith("The MinesAmount is invalid");

      await expect(minesGame.placeBet(50000, 4, seedHash, USDT_ADDRESS))
        .to.be.revertedWith("The WagerAmount is invalid");

      await expect(minesGame.placeBet(1, 2, seedHash, USDT_ADDRESS))
        .to.be.revertedWith("The WagerAmount is invalid");
    })

    it("debit the token amount", async () => {
      var input_str = "Seed String One";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      await expect(minesGame.placeBet(200, 4, seedHash, USDT_ADDRESS))
        .to.be.revertedWith("Insufficient allowance");

      tx = await USDT.approve(betSlips.address, 200);
      await tx.wait();

      tx = await minesGame.placeBet(200, 4, seedHash, USDT_ADDRESS);
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

      await expect(minesGame.placeBet(200, 4, seedHash, USDT_ADDRESS))
        .to.emit(betSlips, 'betSlipPlaced')
        .withArgs((await betSlips.getBetSlip(seedHash)), [999999999800, 999999999600, 6]);
      
      await expect(minesGame.placeBet(200, 4, seedHash, USDT_ADDRESS))
        .to.be.revertedWith("SeedHash is already used");

      expect(await USDT.balanceOf(betSlips.address)).to.equal(400);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999999600);
    });

    it("complete the betslip valid seed", async () => {
      var input_str = "705a13a4-b5ef-49e9-87d6-85068765a712";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');
      
      tx = await USDT.approve(betSlips.address, 200);
      await tx.wait();

      tx = await USDT.transfer(betSlips.address, 1000);
      await tx.wait();

      expect(await USDT.balanceOf(betSlips.address)).to.equal(1400);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999998600);

      const placeTx = await minesGame.placeBet(200, 4, seedHash, USDT_ADDRESS);
      await placeTx.wait();

      expect(await USDT.balanceOf(betSlips.address)).to.equal(1600);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999998400);

      expect(await minesGame.revealSeed(seedHash, input_str, [1, 5, 10]))
        .to.emit(betSlips, 'betSlipCompleted')
        .withArgs((await betSlips.getBetSlip(seedHash)), [999999998400, 999999998200, 6]);
      
      expect(await USDT.balanceOf(betSlips.address)).to.equal(1600);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999998400);
    });

    it("complete the betslip with invalid seed", async () => {
      var input_str = "Valid Seed";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      tx = await USDT.approve(betSlips.address, 200);
      await tx.wait();

      const placeTx = await minesGame.placeBet(200, 4, seedHash, USDT_ADDRESS);
      await placeTx.wait();

      expect(await USDT.balanceOf(betSlips.address)).to.equal(1464);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999998536);

      var invalid_str = "Invalid Seed";

      await expect(minesGame.revealSeed(1, invalid_str, [1, 5, 10]))
        .to.be.revertedWith("Invalid seed");

      expect(await USDT.balanceOf(betSlips.address)).to.equal(1464);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999998536);
    });
  });
});