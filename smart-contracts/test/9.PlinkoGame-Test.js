require("@nomiclabs/hardhat-waffle");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const crypto = require("crypto");

const ERC20ABI = require('../abi/AminoTokenAbi.json');

describe("PlinkoGame", () => {
  let owner;
  let betSlips;
  let plinkoGame;
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
    
    const PlinkoGame = await ethers.getContractFactory("PlinkoGame", {
      libraries: {
        SeedUtility: seedutility.address,
      },
    });

    plinkoGame = await PlinkoGame.deploy(betSlips.address, 97);
    await plinkoGame.deployed();

    await betSlips.grantGameRole(plinkoGame.address);
    await betSlips.grantCompleterRole(plinkoGame.address);
  });

  it("is deployed", async () => {
    expect(await plinkoGame.getBetSlipsAddress()).to.equal(betSlips.address);
    expect(await USDT.totalSupply()).to.equal(1000000000000);
    expect(await USDT.balanceOf(owner.address)).to.equal(1000000000000);
  });


  describe("Set and Get Rtp", () => {
    it("set and get Rtp", async () => {
      await expect(plinkoGame.setRtp(95))
        .to.emit(plinkoGame, 'rtpChangedEvent')
        .withArgs('plinko', 95);
      expect(await plinkoGame.getRtp()).to.equal(95);

      await expect(plinkoGame.setRtp(97))
        .to.emit(plinkoGame, 'rtpChangedEvent')
        .withArgs('plinko', 97);
      expect(await plinkoGame.getRtp()).to.equal(97);
    });
  });

  describe("Set betlimt and get game config", () => {
    it("set betlimit and get game config", async () => {
      await expect(plinkoGame.setBetLimit(USDT.address, 20, 10000, 32))
        .to.emit(plinkoGame, 'betLimitChangedEvent')
        .withArgs('plinko', 'USDT', USDT.address, 20, 10000, 32);

      expect(await plinkoGame.getGameConfig(USDT.address)).to.equal(`{"rtp":97,"betLimits": {"${USDT.address.toLowerCase()}": {"minAmount": 20,"maxAmount": 10000,"defaultAmount": 32}}}`);

      tx = await plinkoGame.setBetLimit(USDT.address, 200, 20000, 50);
      await tx.wait();

      expect(await plinkoGame.getGameConfig(USDT.address)).to.equal(`{"rtp":97,"betLimits": {"${USDT.address.toLowerCase()}": {"minAmount": 200,"maxAmount": 20000,"defaultAmount": 50}}}`);
    });
  });


  describe("debit and place, complete the BetSlip without permit", () => {
    it("When paused, place betSlip", async () => {
      var input_str = "Seed String One";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      await expect(plinkoGame.pauseGame())
        .to.emit(plinkoGame, 'gameStateChangedEvent')
        .withArgs('plinko', false);

      await expect(plinkoGame.placeBet(200, 3, 300, 2, 400, 2, seedHash, USDT.address))
        .to.be.revertedWith("Pausable: paused");

      await expect(plinkoGame.unpauseGame())
        .to.emit(plinkoGame, 'gameStateChangedEvent')
        .withArgs('plinko', true);
    })

    it("validate the bet", async () => {
      var input_str = "Seed String One";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      await expect(plinkoGame.placeBet(0, 3, 0, 2, 10, 2, seedHash, USDT.address))
        .to.be.revertedWith("The WagerAmount is invalid");

      await expect(plinkoGame.placeBet(50000, 3, 10, 2, 10, 2, seedHash, USDT.address))
        .to.be.revertedWith("The WagerAmount is invalid");

      await expect(plinkoGame.placeBet(100, 3, 100, 2, 0, 2, seedHash, USDT.address))
        .to.be.revertedWith("The playerChoice of red sector is invalid");
    })

    it("debit the token amount", async () => {
      var input_str = "Seed String One";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      await expect(plinkoGame.placeBet(200, 3, 300, 2, 400, 2, seedHash, USDT.address))
        .to.be.revertedWith("Insufficient allowance");

      tx = await USDT.approve(betSlips.address, 900);
      await tx.wait();

      tx = await plinkoGame.placeBet(200, 3, 300, 2, 400, 2, seedHash, USDT.address);
      await tx.wait();

      expect(await USDT.balanceOf(betSlips.address)).to.equal(900);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999999100);
    });

    it("place the betslip", async () => {
      var input_str = "Seed String Two";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      tx = await USDT.approve(betSlips.address, 900);
      await tx.wait();

      await expect(plinkoGame.placeBet(200, 3, 300, 2, 400, 2, seedHash, USDT.address))
        .to.emit(betSlips, 'betSlipPlaced')
        .withArgs(2, owner.address, USDT.address, "plinko", 
        '{"blueBetAmount":"200", "amountOfBlueBalls":"3", "greenBetAmount":"300", "amountOfGreenBalls":"2", "redBetAmount":"400", "amountOfRedBalls":"2"}',
        900, seedHash, 0, 0);

      await expect(plinkoGame.placeBet(200, 3, 300, 2, 400, 2, seedHash, USDT.address))
        .to.be.revertedWith("SeedHash is already used");

      expect(await USDT.balanceOf(betSlips.address)).to.equal(1800);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999998200);
    });

    it("complete the betslip valid seed", async () => {
      var input_str = "Seed String Three";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      tx = await USDT.approve(betSlips.address, 900);
      await tx.wait();

      tx = await USDT.transfer(betSlips.address, 3000);
      await tx.wait();

      expect(await USDT.balanceOf(betSlips.address)).to.equal(4800);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999995200);

      const placeTx = await plinkoGame.placeBet(200, 3, 300, 2, 400, 2, seedHash, USDT.address);
      await placeTx.wait();

      expect(await USDT.balanceOf(betSlips.address)).to.equal(5700);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999994300);

      await expect(plinkoGame.revealSeed(seedHash, input_str))
        .to.emit(betSlips, 'betSlipCompleted')
        .withArgs(3, owner.address, USDT.address, 'plinko',
        '{"blueBetAmount":"200", "amountOfBlueBalls":"3", "greenBetAmount":"300", "amountOfGreenBalls":"2", "redBetAmount":"400", "amountOfRedBalls":"2"}',
        900, seedHash, '[BLUE_7, BLUE_9, BLUE_9, GREEN_10, GREEN_6, RED_9, RED_6]', 560, input_str, 62, 1);

      expect(await USDT.balanceOf(betSlips.address)).to.equal(5140);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999994860);
    });

    it("complete the betslip with invalid seed", async () => {
      var input_str = "Valid Seed";

      seedHash = crypto.createHash('sha256')
        .update(input_str)
        .digest('hex');

      tx = await USDT.approve(betSlips.address, 900);
      await tx.wait();

      const placeTx = await plinkoGame.placeBet(200, 3, 300, 2, 400, 2, seedHash, USDT.address);
      await placeTx.wait();

      expect(await USDT.balanceOf(betSlips.address)).to.equal(6040);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999993960);

      var invalid_str = "Invalid Seed";

      await expect(plinkoGame.revealSeed(1, invalid_str))
        .to.be.revertedWith("Invalid seed");

      expect(await USDT.balanceOf(betSlips.address)).to.equal(6040);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999993960);
    });
  });

  describe("revoke betslip contract", () => {
    it("revoke betslips", async () => {
      var input_str1 = "Revocation test 1";
      seedHash1 = crypto.createHash('sha256')
        .update(input_str1)
        .digest('hex');

      tx1 = await USDT.approve(betSlips.address, 900);
      await tx1.wait();

      const placeTx1 = await plinkoGame.placeBet(200, 3, 300, 2, 400, 2, seedHash1, USDT.address);
      await placeTx1.wait();


      var input_str2 = "Revocation test 2";
      seedHash2 = crypto.createHash('sha256')
        .update(input_str2)
        .digest('hex');

      tx2 = await USDT.approve(betSlips.address, 900);
      await tx2.wait();

      const placeTx2 = await plinkoGame.placeBet(200, 3, 300, 2, 400, 2, seedHash2, USDT.address);
      await placeTx2.wait();
      const completeTx1 = await plinkoGame.revealSeed(seedHash2, input_str2);
      await completeTx1.wait();


      var input_str3 = "Revocation test 3";
      seedHash3 = crypto.createHash('sha256')
        .update(input_str3)
        .digest('hex');

      tx3 = await USDT.approve(betSlips.address, 900);
      await tx3.wait();

      const placeTx4 = await plinkoGame.placeBet(200, 3, 300, 2, 400, 2, seedHash3, USDT.address);
      await placeTx4.wait();
      await expect(plinkoGame.revealSeed(seedHash2, input_str3))
        .to.be.revertedWith("Invalid seed");

      var seedHashes = [seedHash1, seedHash2, seedHash3];
      var reason = "Revoke Test";
      await expect(betSlips.revokeBetSlips(seedHashes, reason))
        .to.emit(betSlips, 'betSlipRevoked')
        .withArgs(`["${seedHashes[0]}", "${seedHashes[1]}", "${seedHashes[2]}"]`, reason);

      await expect(plinkoGame.placeBet(200, 3, 300, 2, 400, 2, seedHash1, USDT.address))
        .to.be.revertedWith("SeedHash is already used");                  // When betslips is revoked, placeBet
      await expect(plinkoGame.revealSeed(seedHash2, input_str2))
        .to.be.revertedWith("Betslip is already terminated.");            // When betslips is completed, revealSeed
      await expect(plinkoGame.revealSeed(seedHash3, input_str3))
        .to.be.revertedWith("Betslip is already terminated.");            // When betslips is revoked, revealSeed

      const betslip1 = await betSlips.getBetSlip(seedHash1);
      expect(await betslip1.status).to.equal(ethers.BigNumber.from("2")); // betSlips status: REVOKED
      const betslip2 = await betSlips.getBetSlip(seedHash2);
      expect(await betslip2.status).to.equal(ethers.BigNumber.from("1")); // betSlips status: COMPLETED
      const betslip3 = await betSlips.getBetSlip(seedHash3);
      expect(await betslip3.status).to.equal(ethers.BigNumber.from("2")); // betSlips status: REVOKED

      expect(await USDT.balanceOf(betSlips.address)).to.equal(6611);
      expect(await USDT.balanceOf(owner.address)).to.equal(999999993389);
    });
  });
});