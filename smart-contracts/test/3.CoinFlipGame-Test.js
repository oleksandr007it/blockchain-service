require("@nomiclabs/hardhat-waffle");
const {expect} = require("chai");
const {ethers} = require("hardhat");

const crypto = require("crypto");

describe("Coin Flip Game", () => {
    let owner;
    let betSlips;
    let coinFlipGame;
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

        const CoinFlip = await ethers.getContractFactory("CoinFlip", {
            libraries: {
                SeedUtility: seedutility.address,
            },
        });

        coinFlipGame = await CoinFlip.deploy(betSlips.address, 97);
        await coinFlipGame.deployed();

        await betSlips.grantGameRole(coinFlipGame.address);
        await betSlips.grantCompleterRole(coinFlipGame.address);
    });

    it("is deployed", async () => {
        expect(await coinFlipGame.getBetSlipsAddress()).to.equal(betSlips.address);
        expect(await USDT.totalSupply()).to.equal(1000000000000);
        expect(await USDT.balanceOf(owner.address)).to.equal(1000000000000);
    });


    describe("Set and Get Rtp", () => {
        it("set and get Rtp", async () => {
          await expect(coinFlipGame.setRtp(95))
            .to.emit(coinFlipGame, 'rtpChangedEvent')
            .withArgs('coinflip', 95);
          expect(await coinFlipGame.getRtp()).to.equal(95);
    
          await expect(coinFlipGame.setRtp(97))
            .to.emit(coinFlipGame, 'rtpChangedEvent')
            .withArgs('coinflip', 97);
          expect(await coinFlipGame.getRtp()).to.equal(97);
        });
      });
    
      describe("Set betlimt and get game config", () => {
        it("set betlimit and get game config", async () => {
          await expect(coinFlipGame.setBetLimit(USDT.address, 20, 10000, 32))
            .to.emit(coinFlipGame, 'betLimitChangedEvent')
            .withArgs('coinflip', 'USDT', USDT.address, 20, 10000, 32);
    
          expect(await coinFlipGame.getGameConfig(USDT.address)).to.equal(`{"rtp":97,"betLimits": {"${USDT.address.toLowerCase()}": {"minAmount": 20,"maxAmount": 10000,"defaultAmount": 32}}}`);
    
          tx = await coinFlipGame.setBetLimit(USDT.address, 200, 20000, 50);
          await tx.wait();
    
          expect(await coinFlipGame.getGameConfig(USDT.address)).to.equal(`{"rtp":97,"betLimits": {"${USDT.address.toLowerCase()}": {"minAmount": 200,"maxAmount": 20000,"defaultAmount": 50}}}`);
        });
      });


    describe("debit and place, complete the BetSlip without permit", () => {
        it("When paused, place betSlip", async () => {
            var input_str = "Seed String One";
      
            seedHash = crypto.createHash('sha256')
              .update(input_str)
              .digest('hex');
      
            await expect(coinFlipGame.pauseGame())
              .to.emit(coinFlipGame, 'gameStateChangedEvent')
              .withArgs('coinflip', false);
      
            await expect(coinFlipGame.placeBet(200, "TAILX", seedHash, USDT.address))
              .to.be.revertedWith("Pausable: paused");
      
            await expect(coinFlipGame.unpauseGame())
              .to.emit(coinFlipGame, 'gameStateChangedEvent')
              .withArgs('coinflip', true);
        })

        it("validate the bet", async () => {
            let input_str = "8cf186a0e38d626c236527296c8e92adbc51fa06961f66b83f3e0d335dd5019e";

            seedHash = crypto.createHash('sha256')
                .update(input_str)
                .digest('hex');

            await expect(coinFlipGame.placeBet(200, "TAILX", seedHash, USDT.address))
                .to.be.revertedWith("The choice is invalid");

            await expect(coinFlipGame.placeBet(50000, "HEAD", seedHash, USDT.address))
                .to.be.revertedWith("The WagerAmount is invalid");

            await expect(coinFlipGame.placeBet(10, "TAIL", seedHash, USDT.address))
                .to.be.revertedWith("The WagerAmount is invalid");
        })


        it("debit the token amount coinFlip game", async () => {
            let input_str = "8cf186a0e38d626c236527296c8e92adbc51fa06961f66b83f3e0d335dd5019e";

            seedHash = crypto.createHash('sha256')
                .update(input_str)
                .digest('hex');

            tx = await coinFlipGame.setBetLimit(USDT.address, 1, 20000, 50);
            await tx.wait();

            await expect(coinFlipGame.placeBet(200, "TAIL", seedHash, USDT.address))
                .to.be.revertedWith("Insufficient allowance");

            tx = await USDT.approve(betSlips.address, 2000);
            await tx.wait();

            tx = await coinFlipGame.placeBet(20, "HEAD", seedHash, USDT.address);
            await tx.wait();

            expect(await USDT.balanceOf(betSlips.address)).to.equal(20);
            expect(await USDT.balanceOf(owner.address)).to.equal(999999999980);
        });


        it("player win with valid tail seed for coinFlip game", async () => {
            let tail_seed = "7df5bee0e1f04caa3b68ecf56fe9c3c7bfece75f44ff2bf448cf516e7c7ce0ab";

            seedHash = crypto.createHash('sha256')
                .update(tail_seed)
                .digest('hex');

            tx = await USDT.transfer(betSlips.address, 1000);
            await tx.wait();

            expect(await USDT.balanceOf(betSlips.address)).to.equal(1020);
            expect(await USDT.balanceOf(owner.address)).to.equal(999999998980);

            const placeTx = await coinFlipGame.placeBet(200, "TAIL", seedHash, USDT.address);
            await placeTx.wait();

            expect(await USDT.balanceOf(betSlips.address)).to.equal(1220);
            expect(await USDT.balanceOf(owner.address)).to.equal(999999998780);

            await expect(coinFlipGame.revealSeed(seedHash, tail_seed))
                .to.emit(betSlips, 'betSlipCompleted')
                .withArgs(2, owner.address, USDT.address, 'coinflip', 'TAIL', 200, seedHash, 'TAIL', 388, tail_seed, 194, 1);

            expect(await USDT.balanceOf(betSlips.address)).to.equal(832);
            expect(await USDT.balanceOf(owner.address)).to.equal(999999999168);

        });

        it("player win with valid head seed for coinFlip game", async () => {
            let head_seed = "3d4a04e1caafeb597c1c5e9bd9c2704b18153786c081c6d1c81aab9c42679910";

            seedHash = crypto.createHash('sha256')
                .update(head_seed)
                .digest('hex');

            expect(await USDT.balanceOf(betSlips.address)).to.equal(832);

            const placeTx = await coinFlipGame.placeBet(200, "HEAD", seedHash, USDT.address);
            await placeTx.wait();

            expect(await USDT.balanceOf(betSlips.address)).to.equal(1032);
            expect(await USDT.balanceOf(owner.address)).to.equal(999999998968);

            await expect(coinFlipGame.revealSeed(seedHash, head_seed))
                .to.emit(betSlips, 'betSlipCompleted')
                .withArgs(3, owner.address, USDT.address, 'coinflip', 'HEAD', 200, seedHash, 'HEAD', 388, head_seed, 194, 1);

            expect(await USDT.balanceOf(betSlips.address)).to.equal(644);
            expect(await USDT.balanceOf(owner.address)).to.equal(999999999356);
        });


        it("player lose the coinFlip game", async () => {
            let tail_seed = "66953fd3a4824a9d38c893b633564470b6cfd0a48d6655773e7246423ae519e7";

            seedHash = crypto.createHash('sha256')
                .update(tail_seed)
                .digest('hex');

            const placeTx = await coinFlipGame.placeBet(200, "HEAD", seedHash, USDT.address);
            await placeTx.wait();

            expect(await USDT.balanceOf(betSlips.address)).to.equal(844);
            expect(await USDT.balanceOf(owner.address)).to.equal(999999999156);

            await expect(coinFlipGame.revealSeed(seedHash, tail_seed))
                .to.emit(betSlips, 'betSlipCompleted')
                .withArgs(4, owner.address, USDT.address, 'coinflip', 'HEAD', 200, seedHash, 'TAIL', 0, tail_seed, 194, 1);

            expect(await USDT.balanceOf(betSlips.address)).to.equal(844);
            expect(await USDT.balanceOf(owner.address)).to.equal(999999999156);
        });

        it("complete the betslip with invalid seed", async () => {
            var input_str = "6953fd3a4824a9d38c893b6335644";

            seedHash = crypto.createHash('sha256')
                .update(input_str)
                .digest('hex');

            const placeTx = await coinFlipGame.placeBet(200, "HEAD", seedHash, USDT.address);
            await placeTx.wait();

            expect(await USDT.balanceOf(betSlips.address)).to.equal(1044);
            expect(await USDT.balanceOf(owner.address)).to.equal(999999998956);

            await expect(coinFlipGame.revealSeed(1 , input_str))
                .to.be.revertedWith("Invalid seed");

            expect(await USDT.balanceOf(betSlips.address)).to.equal(1044);
            expect(await USDT.balanceOf(owner.address)).to.equal(999999998956);
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
        
            const placeTx1 = await coinFlipGame.placeBet(200, "HEAD", seedHash1, USDT.address);
            await placeTx1.wait();
        
        
            var input_str2 = "Revocation test 2";
            seedHash2 = crypto.createHash('sha256')
                .update(input_str2)
                .digest('hex');
        
            tx2 = await USDT.approve(betSlips.address, 200);
            await tx2.wait();
        
            const placeTx2 = await coinFlipGame.placeBet(200, "HEAD", seedHash2, USDT.address);
            await placeTx2.wait();
            const completeTx1 = await coinFlipGame.revealSeed(seedHash2, input_str2);
            await completeTx1.wait();
        
        
            var input_str3 = "Revocation test 3";
            seedHash3 = crypto.createHash('sha256')
                .update(input_str3)
                .digest('hex');
        
            tx3 = await USDT.approve(betSlips.address, 200);
            await tx3.wait();
        
            const placeTx4 = await coinFlipGame.placeBet(200, "HEAD", seedHash3, USDT.address);
            await placeTx4.wait();
            await expect(coinFlipGame.revealSeed(seedHash2, input_str3))
                .to.be.revertedWith("Invalid seed");
        
            var seedHashes = [seedHash1, seedHash2, seedHash3];
            var reason = "Revoke Test";
            await expect(betSlips.revokeBetSlips(seedHashes, reason))
                .to.emit(betSlips, 'betSlipRevoked')
                .withArgs(`["${seedHashes[0]}", "${seedHashes[1]}", "${seedHashes[2]}"]`, reason);
        
            await expect(coinFlipGame.placeBet(200, "HEAD", seedHash1, USDT.address))
                .to.be.revertedWith("SeedHash is already used");                  // When betslips is revoked, placeBet
            await expect(coinFlipGame.revealSeed(seedHash2, input_str2))
                .to.be.revertedWith("Betslip is already terminated.");            // When betslips is completed, revealSeed
            await expect(coinFlipGame.revealSeed(seedHash3, input_str3))
                .to.be.revertedWith("Betslip is already terminated.");            // When betslips is revoked, revealSeed
        
            const betslip1 = await betSlips.getBetSlip(seedHash1);
            expect(await betslip1.status).to.equal(ethers.BigNumber.from("2")); // betSlips status: REVOKED
            const betslip2 = await betSlips.getBetSlip(seedHash2);
            expect(await betslip2.status).to.equal(ethers.BigNumber.from("1")); // betSlips status: COMPLETED
            const betslip3 = await betSlips.getBetSlip(seedHash3);
            expect(await betslip3.status).to.equal(ethers.BigNumber.from("2")); // betSlips status: REVOKED
        
            expect(await USDT.balanceOf(betSlips.address)).to.equal(1244);
            expect(await USDT.balanceOf(owner.address)).to.equal(999999998756);
        });
    });
});
