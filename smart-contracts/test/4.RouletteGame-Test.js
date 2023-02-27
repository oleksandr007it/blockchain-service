require("@nomiclabs/hardhat-waffle");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const crypto = require("crypto");

const ERC20ABI = require('../abi/AminoTokenAbi.json');

describe("RouletteGame", () => {
  let owner;
  let betSlips;
  let rouletteGame;
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
    
    const RouletteGame = await ethers.getContractFactory("RouletteGame", {
      libraries: {
        SeedUtility: seedutility.address,
      },
    });
    
    rouletteGame = await RouletteGame.deploy(betSlips.address, 97);
    await rouletteGame.deployed();

    await betSlips.grantGameRole(rouletteGame.address);
    await betSlips.grantCompleterRole(rouletteGame.address);
  });

  it("is deployed", async () => {
    expect(await rouletteGame.getBetSlipsAddress()).to.equal(betSlips.address);
    expect(await USDT.totalSupply()).to.equal(1000000000000);
    expect(await USDT.balanceOf(owner.address)).to.equal(1000000000000);
  });


  describe("Set and Get Rtp", () => {
    it("set and get Rtp", async () => {
      await expect(rouletteGame.setRtp(95))
        .to.emit(rouletteGame, 'rtpChangedEvent')
        .withArgs('roulette', 95);
      expect(await rouletteGame.getRtp()).to.equal(95);

      await expect(rouletteGame.setRtp(97))
        .to.emit(rouletteGame, 'rtpChangedEvent')
        .withArgs('roulette', 97);
      expect(await rouletteGame.getRtp()).to.equal(97);
    });
  });

  describe("Set betlimt and get game config", () => {
    it("set betlimit and get game config", async () => {
      await expect(rouletteGame.setBetLimit(USDT.address, 20, 10000, 32))
        .to.emit(rouletteGame, 'betLimitChangedEvent')
        .withArgs('roulette', 'USDT', USDT.address, 20, 10000, 32);

      expect(await rouletteGame.getGameConfig(USDT.address)).to.equal(`{"rtp":97,"betLimits": {"${USDT.address.toLowerCase()}": {"minAmount": 20,"maxAmount": 10000,"defaultAmount": 32}}}`);

      tx = await rouletteGame.setBetLimit(USDT.address, 200, 20000, 50);
      await tx.wait();

      expect(await rouletteGame.getGameConfig(USDT.address)).to.equal(`{"rtp":97,"betLimits": {"${USDT.address.toLowerCase()}": {"minAmount": 200,"maxAmount": 20000,"defaultAmount": 50}}}`);
    });
  });


  describe("debit and place, complete the BetSlip without permit", () => {
    it("When paused, place betSlip", async () => {
      var input_str = "Seed String One";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      await expect(rouletteGame.pauseGame())
        .to.emit(rouletteGame, 'gameStateChangedEvent')
        .withArgs('roulette', false);

      await expect(rouletteGame.placeBet(200, "RED", seedHash, USDT.address))
        .to.be.revertedWith("Pausable: paused");

      await expect(rouletteGame.unpauseGame())
        .to.emit(rouletteGame, 'gameStateChangedEvent')
        .withArgs('roulette', true);
    })

    it("validate the bet", async () => {
      var input_str = "Seed String One";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      await expect(rouletteGame.placeBet(200, "BROWN", seedHash, USDT.address))
        .to.be.revertedWith("The choice is invalid");

      await expect(rouletteGame.placeBet(50000, "RED", seedHash, USDT.address))
        .to.be.revertedWith("The WagerAmount is invalid");

      await expect(rouletteGame.placeBet(10, "GREEN", seedHash, USDT.address))
        .to.be.revertedWith("The WagerAmount is invalid");
    })

    it("debit the token amount", async () => {
      var input_str = "Seed String One";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      await expect(rouletteGame.placeBet(200, "RED", seedHash, USDT.address))
        .to.be.revertedWith("Insufficient allowance");

      tx = await USDT.approve(betSlips.address, 200);
      await tx.wait();

      tx = await rouletteGame.placeBet(200, "RED", seedHash, USDT.address);
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

      await expect(rouletteGame.placeBet(200, "RED", seedHash, USDT.address))
        .to.emit(betSlips, 'betSlipPlaced')
        .withArgs(2, owner.address, USDT.address, "roulette", "RED", 200, seedHash, 207, 0);

      await expect(rouletteGame.placeBet(200, "RED", seedHash, USDT.address))
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

      tx = await USDT.transfer(betSlips.address, 3000);
      await tx.wait();

      expect(await USDT.balanceOf(betSlips.address)).to.equal(3400);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999996600);

      const placeTx = await rouletteGame.placeBet(200, "YELLOW", seedHash, USDT.address);
      await placeTx.wait();

      expect(await USDT.balanceOf(betSlips.address)).to.equal(3600);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999996400);

      await expect(rouletteGame.revealSeed(seedHash, input_str))
        .to.emit(betSlips, 'betSlipCompleted')
        .withArgs(3, owner.address, USDT.address, 'roulette', "YELLOW", 200, seedHash, "YELLOW", 2910, input_str, 1455, 1);

      expect(await USDT.balanceOf(betSlips.address)).to.equal(690);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999999310);
    });

    it("complete the betslip with invalid seed", async () => {
      var input_str = "Valid Seed";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      tx = await USDT.approve(betSlips.address, 200);
      await tx.wait();

      const placeTx = await rouletteGame.placeBet(200, "RED", seedHash, USDT.address);
      await placeTx.wait();

      expect(await USDT.balanceOf(betSlips.address)).to.equal(890);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999999110);

      var invalid_str = "Invalid Seed";

      await expect(rouletteGame.revealSeed(1, invalid_str))
        .to.be.revertedWith("Invalid seed");

      expect(await USDT.balanceOf(betSlips.address)).to.equal(890);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999999110);
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

      const placeTx1 = await rouletteGame.placeBet(200, "RED", seedHash1, USDT.address);
      await placeTx1.wait();


      var input_str2 = "Revocation test 2";
      seedHash2 = crypto.createHash('sha256')
        .update(input_str2)
        .digest('hex');

      tx2 = await USDT.approve(betSlips.address, 200);
      await tx2.wait();

      const placeTx2 = await rouletteGame.placeBet(200, "RED", seedHash2, USDT.address);
      await placeTx2.wait();
      const completeTx1 = await rouletteGame.revealSeed(seedHash2, input_str2);
      await completeTx1.wait();


      var input_str3 = "Revocation test 3";
      seedHash3 = crypto.createHash('sha256')
        .update(input_str3)
        .digest('hex');

      tx3 = await USDT.approve(betSlips.address, 200);
      await tx3.wait();

      const placeTx4 = await rouletteGame.placeBet(200, "RED", seedHash3, USDT.address);
      await placeTx4.wait();
      await expect(rouletteGame.revealSeed(seedHash2, input_str3))
        .to.be.revertedWith("Invalid seed");

      var seedHashes = [seedHash1, seedHash2, seedHash3];
      var reason = "Revoke Test";
      await expect(betSlips.revokeBetSlips(seedHashes, reason))
        .to.emit(betSlips, 'betSlipRevoked')
        .withArgs(`["${seedHashes[0]}", "${seedHashes[1]}", "${seedHashes[2]}"]`, reason);

      await expect(rouletteGame.placeBet(200, "RED", seedHash1, USDT.address))
        .to.be.revertedWith("SeedHash is already used");                  // When betslips is revoked, placeBet
      await expect(rouletteGame.revealSeed(seedHash2, input_str2))
        .to.be.revertedWith("Betslip is already terminated.");            // When betslips is completed, revealSeed
      await expect(rouletteGame.revealSeed(seedHash3, input_str3))
        .to.be.revertedWith("Betslip is already terminated.");            // When betslips is revoked, revealSeed

      const betslip1 = await betSlips.getBetSlip(seedHash1);
      expect(await betslip1.status).to.equal(ethers.BigNumber.from("2")); // betSlips status: REVOKED
      const betslip2 = await betSlips.getBetSlip(seedHash2);
      expect(await betslip2.status).to.equal(ethers.BigNumber.from("1")); // betSlips status: COMPLETED
      const betslip3 = await betSlips.getBetSlip(seedHash3);
      expect(await betslip3.status).to.equal(ethers.BigNumber.from("2")); // betSlips status: REVOKED

      expect(await USDT.balanceOf(betSlips.address)).to.equal(1090);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999998910);
    });
  });
});