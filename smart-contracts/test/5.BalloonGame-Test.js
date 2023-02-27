require("@nomiclabs/hardhat-waffle");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const crypto = require("crypto");

const ERC20ABI = require('../abi/AminoTokenAbi.json');

describe("BalloonGame", () => {
  let owner;
  let betSlips;
  let balloonGame;
  let seedutility;
  let USDT;
  let tx;

  before(async () => {
    [owner] = await ethers.getSigners();

    contractFactory = await ethers.getContractFactory("Token");
    USDT = await contractFactory.deploy(1000000000000);

    const SeedUtility = await ethers.getContractFactory("SeedUtility");
    seedutility = await SeedUtility.deploy();
    await seedutility.deployed();

    const BetSlips = await ethers.getContractFactory("BetSlips", {
      libraries: {
        SeedUtility: seedutility.address,
      },
    });

    betSlips = await BetSlips.deploy();
    await betSlips.deployed();
    
    const BalloonGame = await ethers.getContractFactory("BalloonGame", {
      libraries: {
        SeedUtility: seedutility.address,
      },
    });
    
    balloonGame = await BalloonGame.deploy(betSlips.address, 97);
    await balloonGame.deployed();

    await betSlips.grantGameRole(balloonGame.address);
    await betSlips.grantCompleterRole(balloonGame.address);
  });

  it("is deployed", async () => {
    expect(await balloonGame.getBetSlipsAddress()).to.equal(betSlips.address);
    expect(await USDT.totalSupply()).to.equal(1000000000000);
    expect(await USDT.balanceOf(owner.address)).to.equal(1000000000000);
  });


  describe("Set and Get Rtp", () => {
    it("set and get Rtp", async () => {
      await expect(balloonGame.setRtp(95))
        .to.emit(balloonGame, 'rtpChangedEvent')
        .withArgs('balloon', 95);
      expect(await balloonGame.getRtp()).to.equal(95);

      await expect(balloonGame.setRtp(97))
        .to.emit(balloonGame, 'rtpChangedEvent')
        .withArgs('balloon', 97);
      expect(await balloonGame.getRtp()).to.equal(97);
    });
  });

  describe("Set betlimt and get game config", () => {
    it("set betlimit and get game config", async () => {
      await expect(balloonGame.setBetLimit(USDT.address, 20, 10000, 32))
        .to.emit(balloonGame, 'betLimitChangedEvent')
        .withArgs('balloon', 'USDT', USDT.address, 20, 10000, 32);

      expect(await balloonGame.getGameConfig(USDT.address)).to.equal(`{"rtp":97,"betLimits": {"${USDT.address.toLowerCase()}": {"minAmount": 20,"maxAmount": 10000,"defaultAmount": 32}}}`);

      tx = await balloonGame.setBetLimit(USDT.address, 200, 20000, 50);
      await tx.wait();

      expect(await balloonGame.getGameConfig(USDT.address)).to.equal(`{"rtp":97,"betLimits": {"${USDT.address.toLowerCase()}": {"minAmount": 200,"maxAmount": 20000,"defaultAmount": 50}}}`);
    });
  });


  describe("debit and place, complete the BetSlip without permit", () => {
    it("When paused, place betSlip", async () => {
      var input_str = "Seed String One";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      await expect(balloonGame.pauseGame())
        .to.emit(balloonGame, 'gameStateChangedEvent')
        .withArgs('balloon', false);

      await expect(balloonGame.placeBet(200, seedHash, USDT.address))
        .to.be.revertedWith("Pausable: paused");

      await expect(balloonGame.unpauseGame())
        .to.emit(balloonGame, 'gameStateChangedEvent')
        .withArgs('balloon', true);
    })

    it("validate the bet", async () => {
      var input_str = "Seed String One";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      await expect(balloonGame.placeBet(50000, seedHash, USDT.address))
        .to.be.revertedWith("The WagerAmount is invalid");

      await expect(balloonGame.placeBet(1, seedHash, USDT.address))
        .to.be.revertedWith("The WagerAmount is invalid");
    })

    it("debit the token amount", async () => {
      var input_str = "Seed String One";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      await expect(balloonGame.placeBet(200, seedHash, USDT.address))
        .to.be.revertedWith("Insufficient allowance");

      tx = await USDT.approve(betSlips.address, 200);
      await tx.wait();

      tx = await balloonGame.placeBet(200, seedHash, USDT.address);
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

      await expect(balloonGame.placeBet(200, seedHash, USDT.address))
        .to.emit(betSlips, 'betSlipPlaced')
        .withArgs(2, owner.address, USDT.address, "balloon", "", 200, seedHash, 0, 0);

      await expect(balloonGame.placeBet(200, seedHash, USDT.address))
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

      const placeTx = await balloonGame.placeBet(200, seedHash, USDT.address);
      await placeTx.wait();

      expect(await USDT.balanceOf(betSlips.address)).to.equal(1600);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999998400);

      expect(await balloonGame.revealSeed(seedHash, input_str, 3))
        .to.emit(betSlips, 'betSlipCompleted')
        .withArgs(3, owner.address, USDT.address, 'balloon', "3", 200, seedHash, "4", 386, input_str, 193, 1);

      expect(await USDT.balanceOf(betSlips.address)).to.equal(1214);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999998786);
    });

    it("complete the betslip with invalid seed", async () => {
      var input_str = "Valid Seed";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      tx = await USDT.approve(betSlips.address, 200);
      await tx.wait();

      const placeTx = await balloonGame.placeBet(200, seedHash, USDT.address);
      await placeTx.wait();

      expect(await USDT.balanceOf(betSlips.address)).to.equal(1414);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999998586);

      var invalid_str = "Invalid Seed";

      await expect(balloonGame.revealSeed(1, invalid_str, 2))
        .to.be.revertedWith("Invalid seed");

      expect(await USDT.balanceOf(betSlips.address)).to.equal(1414);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999998586);
    });
  });

  describe("revoke betslip contract", () => {
    it("revoke betslips", async () => {
      var input_str1 = "Revocation test 1";
      seedHash1 = crypto.createHash('sha256')
        .update(input_str1)
        .digest('hex');

      tx1 = await USDT.approve(betSlips.address, 200);
      await tx1.wait();

      const placeTx1 = await balloonGame.placeBet(200, seedHash1, USDT.address);
      await placeTx1.wait();


      var input_str2 = "Revocation test 2";
      seedHash2 = crypto.createHash('sha256')
        .update(input_str2)
        .digest('hex');

      tx2 = await USDT.approve(betSlips.address, 200);
      await tx2.wait();

      const placeTx2 = await balloonGame.placeBet(200, seedHash2, USDT.address);
      await placeTx2.wait();
      const completeTx1 = await balloonGame.revealSeed(seedHash2, input_str2, 4);
      await completeTx1.wait();


      var input_str3 = "Revocation test 3";
      seedHash3 = crypto.createHash('sha256')
        .update(input_str3)
        .digest('hex');

      tx3 = await USDT.approve(betSlips.address, 200);
      await tx3.wait();

      const placeTx4 = await balloonGame.placeBet(200, seedHash3, USDT.address);
      await placeTx4.wait();
      await expect(balloonGame.revealSeed(seedHash2, input_str3, 4))
        .to.be.revertedWith("Invalid seed");

      var seedHashes = [seedHash1, seedHash2, seedHash3];
      var reason = "Revoke Test";
      await expect(betSlips.revokeBetSlips(seedHashes, reason))
        .to.emit(betSlips, 'betSlipRevoked')
        .withArgs(`["${seedHashes[0]}", "${seedHashes[1]}", "${seedHashes[2]}"]`, reason);

      await expect(balloonGame.placeBet(200, seedHash1, USDT.address))
        .to.be.revertedWith("SeedHash is already used");                  // When betslips is revoked, placeBet
      await expect(balloonGame.revealSeed(seedHash2, input_str2, 4))
        .to.be.revertedWith("Betslip is already terminated.");            // When betslips is completed, revealSeed
      await expect(balloonGame.revealSeed(seedHash3, input_str3, 4))
        .to.be.revertedWith("Betslip is already terminated.");            // When betslips is revoked, revealSeed

      const betslip1 = await betSlips.getBetSlip(seedHash1);
      expect(await betslip1.status).to.equal(ethers.BigNumber.from("2")); // betSlips status: REVOKED
      const betslip2 = await betSlips.getBetSlip(seedHash2);
      expect(await betslip2.status).to.equal(ethers.BigNumber.from("1")); // betSlips status: COMPLETED
      const betslip3 = await betSlips.getBetSlip(seedHash3);
      expect(await betslip3.status).to.equal(ethers.BigNumber.from("2")); // betSlips status: REVOKED

      expect(await USDT.balanceOf(betSlips.address)).to.equal(1614);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999998386);
    });
  });
});