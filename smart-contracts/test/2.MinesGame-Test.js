require("@nomiclabs/hardhat-waffle");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const crypto = require("crypto");

describe("MinesGame", () => {
  let owner;
  let betSlips;
  let minesGame;
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
    
    const MinesGame = await ethers.getContractFactory("MinesGame", {
      libraries: {
        SeedUtility: seedutility.address,
      },
    });
    
    minesGame = await MinesGame.deploy(betSlips.address, 97);
    await minesGame.deployed();

    await betSlips.grantGameRole(minesGame.address);
    await betSlips.grantCompleterRole(minesGame.address);
  });

  it("is deployed", async () => {
    expect(await minesGame.getBetSlipsAddress()).to.equal(betSlips.address);
    expect(await USDT.totalSupply()).to.equal(1000000000000);
    expect(await USDT.balanceOf(owner.address)).to.equal(1000000000000);
  });


  describe("Set and Get Rtp", () => {
    it("set and get Rtp", async () => {
      await expect(minesGame.setRtp(95))
        .to.emit(minesGame, 'rtpChangedEvent')
        .withArgs('mines', 95);
      expect(await minesGame.getRtp()).to.equal(95);

      await expect(minesGame.setRtp(97))
        .to.emit(minesGame, 'rtpChangedEvent')
        .withArgs('mines', 97);
      expect(await minesGame.getRtp()).to.equal(97);
    });
  });

  describe("Set betlimt and get game config", () => {
    it("set betlimit and get game config", async () => {
      await expect(minesGame.setBetLimit(USDT.address, 20, 10000, 32))
        .to.emit(minesGame, 'betLimitChangedEvent')
        .withArgs('mines', 'USDT', USDT.address, 20, 10000, 32);

      expect(await minesGame.getGameConfig(USDT.address)).to.equal(`{"rtp":97,"betLimits": {"${USDT.address.toLowerCase()}": {"minAmount": 20,"maxAmount": 10000,"defaultAmount": 32}}}`);

      tx = await minesGame.setBetLimit(USDT.address, 200, 20000, 50);
      await tx.wait();

      expect(await minesGame.getGameConfig(USDT.address)).to.equal(`{"rtp":97,"betLimits": {"${USDT.address.toLowerCase()}": {"minAmount": 200,"maxAmount": 20000,"defaultAmount": 50}}}`);
    });
  });


  describe("debit and place, complete the BetSlip without permit", () => {
    it("When paused, place betSlip", async () => {
      var input_str = "Seed String One";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      await expect(minesGame.pauseGame())
        .to.emit(minesGame, 'gameStateChangedEvent')
        .withArgs('mines', false);

      await expect(minesGame.placeBet(200, 42, seedHash, USDT.address))
        .to.be.revertedWith("Pausable: paused");

      await expect(minesGame.unpauseGame())
        .to.emit(minesGame, 'gameStateChangedEvent')
        .withArgs('mines', true);
    })

    it("validate the bet", async () => {
      var input_str = "Seed String One";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      await expect(minesGame.placeBet(200, 42, seedHash, USDT.address))
        .to.be.revertedWith("The BombsAmount is invalid");

      await expect(minesGame.placeBet(50000, 4, seedHash, USDT.address))
        .to.be.revertedWith("The WagerAmount is invalid");

      await expect(minesGame.placeBet(1, 2, seedHash, USDT.address))
        .to.be.revertedWith("The WagerAmount is invalid");
    })

    it("debit the token amount", async () => {
      var input_str = "Seed String One";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      await expect(minesGame.placeBet(200, 4, seedHash, USDT.address))
        .to.be.revertedWith("Insufficient allowance");

      tx = await USDT.approve(betSlips.address, 200);
      await tx.wait();

      tx = await minesGame.placeBet(200, 4, seedHash, USDT.address);
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

      await expect(minesGame.placeBet(200, 4, seedHash, USDT.address))
        .to.emit(betSlips, 'betSlipPlaced')
        .withArgs(2, owner.address, USDT.address, "mines", "4 bombs", 200, seedHash, 0, 0);

      await expect(minesGame.placeBet(200, 4, seedHash, USDT.address))
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

      const placeTx = await minesGame.placeBet(200, 4, seedHash, USDT.address);
      await placeTx.wait();

      expect(await USDT.balanceOf(betSlips.address)).to.equal(1600);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999998400);

      expect(await minesGame.revealSeed(seedHash, input_str, [1, 5, 9]))
        .to.emit(betSlips, 'betSlipCompleted')
        .withArgs(3, owner.address, USDT.address, 'mines', [1, 5, 9], 200, seedHash, [7, 9, 16, 24], 334, input_str, 167, 1);

      expect(await USDT.balanceOf(betSlips.address)).to.equal(1266);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999998734);
    });

    it("complete the betslip with invalid seed", async () => {
      var input_str = "Valid Seed";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      tx = await USDT.approve(betSlips.address, 200);
      await tx.wait();

      const placeTx = await minesGame.placeBet(200, 4, seedHash, USDT.address);
      await placeTx.wait();

      expect(await USDT.balanceOf(betSlips.address)).to.equal(1466);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999998534);

      var invalid_str = "Invalid Seed";

      await expect(minesGame.revealSeed(1, invalid_str, [1, 5, 9]))
        .to.be.revertedWith("Invalid seed");

      expect(await USDT.balanceOf(betSlips.address)).to.equal(1466);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999998534);
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

      const placeTx1 = await minesGame.placeBet(200, 4, seedHash1, USDT.address);
      await placeTx1.wait();


      var input_str2 = "Revocation test 2";
      seedHash2 = crypto.createHash('sha256')
        .update(input_str2)
        .digest('hex');

      tx2 = await USDT.approve(betSlips.address, 200);
      await tx2.wait();

      const placeTx2 = await minesGame.placeBet(200, 4, seedHash2, USDT.address);
      await placeTx2.wait();
      const completeTx1 = await minesGame.revealSeed(seedHash2, input_str2, [1, 5, 9]);
      await completeTx1.wait();


      var input_str3 = "Revocation test 3";
      seedHash3 = crypto.createHash('sha256')
        .update(input_str3)
        .digest('hex');

      tx3 = await USDT.approve(betSlips.address, 200);
      await tx3.wait();

      const placeTx4 = await minesGame.placeBet(200, 4, seedHash3, USDT.address);
      await placeTx4.wait();
      await expect(minesGame.revealSeed(seedHash2, input_str3, [1, 5, 9]))
        .to.be.revertedWith("Invalid seed");

      var seedHashes = [seedHash1, seedHash2, seedHash3];
      var reason = "Revoke Test";
      await expect(betSlips.revokeBetSlips(seedHashes, reason))
        .to.emit(betSlips, 'betSlipRevoked')
        .withArgs(`["${seedHashes[0]}", "${seedHashes[1]}", "${seedHashes[2]}"]`, reason);

      await expect(minesGame.placeBet(200, 4, seedHash1, USDT.address))
        .to.be.revertedWith("SeedHash is already used");                  // When betslips is revoked, placeBet
      await expect(minesGame.revealSeed(seedHash2, input_str2, [1, 5, 9]))
        .to.be.revertedWith("Betslip is already terminated.");            // When betslips is completed, revealSeed
      await expect(minesGame.revealSeed(seedHash3, input_str3, [1, 5, 9]))
        .to.be.revertedWith("Betslip is already terminated.");            // When betslips is revoked, revealSeed

      const betslip1 = await betSlips.getBetSlip(seedHash1);
      expect(await betslip1.status).to.equal(ethers.BigNumber.from("2")); // betSlips status: REVOKED
      const betslip2 = await betSlips.getBetSlip(seedHash2);
      expect(await betslip2.status).to.equal(ethers.BigNumber.from("1")); // betSlips status: COMPLETED
      const betslip3 = await betSlips.getBetSlip(seedHash3);
      expect(await betslip3.status).to.equal(ethers.BigNumber.from("2")); // betSlips status: REVOKED

      expect(await USDT.balanceOf(betSlips.address)).to.equal(1666);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999998334);
    });
  });
});