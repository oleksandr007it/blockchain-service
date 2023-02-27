require("@nomiclabs/hardhat-waffle");
const {expect} = require("chai");
const {ethers} = require("hardhat");

const crypto = require("crypto");

describe("Stairs Game", () => {
    let owner;
    let betSlips;
    let stairsGame;
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

        const StairsGame = await ethers.getContractFactory("StairsGame", {
            libraries: {
                SeedUtility: seedutility.address,
            },
        });
        
        stairsGame = await StairsGame.deploy(betSlips.address, 97);
        await stairsGame.deployed();

        await betSlips.grantGameRole(stairsGame.address);
        await betSlips.grantCompleterRole(stairsGame.address);
    });

    it("is deployed", async () => {
        expect(await stairsGame.getBetSlipsAddress()).to.equal(betSlips.address);
        expect(await USDT.totalSupply()).to.equal(1000000000000);
        expect(await USDT.balanceOf(owner.address)).to.equal(1000000000000);
    });


    describe("Set and Get Rtp", () => {
        it("set and get Rtp", async () => {
            await expect(stairsGame.setRtp(95))
                .to.emit(stairsGame, 'rtpChangedEvent')
                .withArgs('stairs', 95);
            expect(await stairsGame.getRtp()).to.equal(95);
        
            await expect(stairsGame.setRtp(97))
                .to.emit(stairsGame, 'rtpChangedEvent')
                .withArgs('stairs', 97);
            expect(await stairsGame.getRtp()).to.equal(97);
        });
    });
    
    describe("Set betlimt and get game config", () => {
        it("set betlimit and get game config", async () => {
            await expect(stairsGame.setBetLimit(USDT.address, 20, 10000, 32))
                .to.emit(stairsGame, 'betLimitChangedEvent')
                .withArgs('stairs', 'USDT', USDT.address, 20, 10000, 32);

            expect(await stairsGame.getGameConfig(USDT.address)).to.equal(`{"rtp":97,"betLimits": {"${USDT.address.toLowerCase()}": {"minAmount": 20,"maxAmount": 10000,"defaultAmount": 32}}}`);

            tx = await stairsGame.setBetLimit(USDT.address, 200, 20000, 50);
            await tx.wait();
    
            expect(await stairsGame.getGameConfig(USDT.address)).to.equal(`{"rtp":97,"betLimits": {"${USDT.address.toLowerCase()}": {"minAmount": 200,"maxAmount": 20000,"defaultAmount": 50}}}`);
        });
    });

    describe("debit and place, complete the BetSlip without permit", () => {
        it("When paused, place betSlip", async () => {
            var input_str = "Seed String One";
      
            seedHash = crypto.createHash('sha256')
              .update(input_str)
              .digest('hex');
      
            await expect(stairsGame.pauseGame())
              .to.emit(stairsGame, 'gameStateChangedEvent')
              .withArgs('stairs', false);
      
            await expect(stairsGame.placeBet(20, 3, seedHash, USDT.address))
              .to.be.revertedWith("Pausable: paused");
      
            await expect(stairsGame.unpauseGame())
              .to.emit(stairsGame, 'gameStateChangedEvent')
              .withArgs('stairs', true);
        })

        it("validate the bet", async () => {
            let input_str = "8cf186a0e38d626c236527296c8e92adbc51fa06961f66b83f3e0d335dd5019e";

            seedHash = crypto.createHash('sha256')
                .update(input_str)
                .digest('hex');

            await expect(stairsGame.placeBet(200, 10, seedHash, USDT.address))
                .to.be.revertedWith("The FlowersAmount is invalid");

            await expect(stairsGame.placeBet(200, 0, seedHash, USDT.address))
                .to.be.revertedWith("The FlowersAmount is invalid");

            await expect(stairsGame.placeBet(50000, 2, seedHash, USDT.address))
                .to.be.revertedWith("The WagerAmount is invalid");

            await expect(stairsGame.placeBet(10, 1, seedHash, USDT.address))
                .to.be.revertedWith("The WagerAmount is invalid");
        })

        it("debit the token amount stairs game", async () => {
            let input_str = "8cf186a0e38d626c236527296c8e92adbc51fa06961f66b83f3e0d335dd5019e";

            seedHash = crypto.createHash('sha256')
                .update(input_str)
                .digest('hex');

            tx = await stairsGame.setBetLimit(USDT.address, 1, 20000, 50);
            await tx.wait();

            await expect(stairsGame.placeBet(200, 1, seedHash, USDT.address))
                .to.be.revertedWith("Insufficient allowance");

            tx = await USDT.approve(betSlips.address, 20000);
            await tx.wait();

            tx = await stairsGame.placeBet(20, 3, seedHash, USDT.address);
            await tx.wait();
            //console.log(await betSlips.getBetSlip(seedHash));
            expect(await USDT.balanceOf(betSlips.address)).to.equal(20);
            expect(await USDT.balanceOf(owner.address)).to.equal(999999999980);
        });


        it("player made invalid choice", async () => {
            let tail_seed = "7df5bee0e1f04caa3b68ecf56fe9c3c7bfece75f44ff2bf448cf516e7c7ce0ab";

            seedHash = crypto.createHash('sha256')
                .update(tail_seed)
                .digest('hex');

            tx = await USDT.transfer(betSlips.address, 50000);
            await tx.wait();

            expect(await USDT.balanceOf(betSlips.address)).to.equal(50020);
            expect(await USDT.balanceOf(owner.address)).to.equal(999999949980);

            const placeTx = await stairsGame.placeBet(20, 3, seedHash, USDT.address);
            await placeTx.wait();

            expect(await USDT.balanceOf(betSlips.address)).to.equal(50040);
            expect(await USDT.balanceOf(owner.address)).to.equal(999999949960);

            let selectedUserStairsArray = [2, 1, 2, 2, 4, 9];
            await expect(stairsGame.revealSeed(seedHash, tail_seed, selectedUserStairsArray))
                .to.be.revertedWith("Invalid playerChoice");
            ;
        });

        it("player win for all levels", async () => {
            let seed = "7df5bee0e1f04caa3b68ecf56fe9c3c7bfece75f44ff2bf448cf516e7c7ce0ac";

            seedHash = crypto.createHash('sha256')
                .update(seed)
                .digest('hex');

            const placeTx = await stairsGame.placeBet(20, 3, seedHash, USDT.address);
            await placeTx.wait();

            expect(await USDT.balanceOf(betSlips.address)).to.equal(50060);
            expect(await USDT.balanceOf(owner.address)).to.equal(999999949940);

            let selectedUserStairsArray = [1, 1, 1, 3, 4, 4];
            await expect(stairsGame.revealSeed(seedHash, seed, selectedUserStairsArray))
                .to.emit(betSlips, 'betSlipCompleted')
                .withArgs(3, owner.address, USDT.address, 'stairs', '{"amountOfFlowers":"3", "playerSelectedStairs":[1, 1, 1, 3, 4, 4]}', 20, seedHash, '[[1,2], [1,5], [1,6], [2,2], [2,4], [2,6], [3,3], [3,4], [3,5], [4,1], [4,2], [4,4], [5,1], [5,2], [5,3], [6,1], [6,2], [6,3]]', 7760, seed, 38800, 1);
            expect(await USDT.balanceOf(betSlips.address)).to.equal(42300);
            expect(await USDT.balanceOf(owner.address)).to.equal(999999957700);
        });


        it("check odds", async () => {
            let seed = "7df5bee0e1f04caa3b68ecf56fe9c3c7bfece75f44ff2bf448cf516e7c7ce0acc";

            seedHash = crypto.createHash('sha256')
                .update(seed)
                .digest('hex');

            const placeTx = await stairsGame.placeBet(20, 3, seedHash, USDT.address);
            await placeTx.wait();
            let selectedUserStairsArray = [1];
            await expect(stairsGame.revealSeed(seedHash, seed, selectedUserStairsArray))
                .to.emit(betSlips, 'betSlipCompleted')
                .withArgs(4, owner.address, USDT.address, 'stairs', '{"amountOfFlowers":"3", "playerSelectedStairs":[1]}', 20, seedHash, '[[1,1], [1,3], [1,5], [2,2], [2,3], [2,6], [3,1], [3,3], [3,4], [4,1], [4,2], [4,3], [5,1], [5,2], [5,3], [6,1], [6,2], [6,4]]', 0, seed, 194, 1);
            //console.log(await betSlips.getBetSlip(seedHash))
        });

        it("player lose for third levels", async () => {
            let seed = "7df5bee0e1f04caa3b68ecf56fe9c3c7bfece75f44ff2bf448cf516e7c7ce0mm";

            seedHash = crypto.createHash('sha256')
                .update(seed)
                .digest('hex');

            const placeTx = await stairsGame.placeBet(20, 2, seedHash, USDT.address);
            await placeTx.wait();

            expect(await USDT.balanceOf(betSlips.address)).to.equal(42340);
            expect(await USDT.balanceOf(owner.address)).to.equal(999999957660);

            let selectedUserStairsArray = [1, 1, 1];
            await expect(stairsGame.revealSeed(seedHash, seed, selectedUserStairsArray))
                .to.emit(betSlips, 'betSlipCompleted')
                .withArgs(5, owner.address, USDT.address, 'stairs', '{"amountOfFlowers":"2", "playerSelectedStairs":[1, 1, 1]}', 20, seedHash, '[[1,3], [1,4], [2,4], [2,6], [3,1], [3,3], [4,1], [4,2], [5,1], [5,4], [6,2], [6,4]]', 0, seed, 363, 1);
            expect(await USDT.balanceOf(betSlips.address)).to.equal(42340);
            expect(await USDT.balanceOf(owner.address)).to.equal(999999957660);
        });

        describe("revoke betslip contract", () => {
            it("revoke betslips", async () => {
                var input_str1 = "Revocation test 1";
                seedHash1 = crypto.createHash('sha256')
                .update(input_str1)
                .digest('hex');
        
                tx1 = await USDT.approve(betSlips.address, 200);
                await tx1.wait();
        
                const placeTx1 = await stairsGame.placeBet(200, 2, seedHash1, USDT.address);
                await placeTx1.wait();
        
        
                var input_str2 = "Revocation test 2";
                seedHash2 = crypto.createHash('sha256')
                .update(input_str2)
                .digest('hex');
        
                tx2 = await USDT.approve(betSlips.address, 200);
                await tx2.wait();
        
                const placeTx2 = await stairsGame.placeBet(200, 2, seedHash2, USDT.address);
                await placeTx2.wait();
                const completeTx1 = await stairsGame.revealSeed(seedHash2, input_str2, [1, 1, 1]);
                await completeTx1.wait();
        
        
                var input_str3 = "Revocation test 3";
                seedHash3 = crypto.createHash('sha256')
                .update(input_str3)
                .digest('hex');
        
                tx3 = await USDT.approve(betSlips.address, 200);
                await tx3.wait();
        
                const placeTx4 = await stairsGame.placeBet(200, 2, seedHash3, USDT.address);
                await placeTx4.wait();
                await expect(stairsGame.revealSeed(seedHash2, input_str3, [1, 1, 1]))
                .to.be.revertedWith("Invalid seed");
        
                var seedHashes = [seedHash1, seedHash2, seedHash3];
                var reason = "Revoke Test";
                await expect(betSlips.revokeBetSlips(seedHashes, reason))
                .to.emit(betSlips, 'betSlipRevoked')
                .withArgs(`["${seedHashes[0]}", "${seedHashes[1]}", "${seedHashes[2]}"]`, reason);
        
                await expect(stairsGame.placeBet(200, 2, seedHash1, USDT.address))
                .to.be.revertedWith("SeedHash is already used");                  // When betslips is revoked, placeBet
                await expect(stairsGame.revealSeed(seedHash2, input_str2, [1, 1, 1]))
                .to.be.revertedWith("Betslip is already terminated.");            // When betslips is completed, revealSeed
                await expect(stairsGame.revealSeed(seedHash3, input_str3, [1, 1, 1]))
                .to.be.revertedWith("Betslip is already terminated.");            // When betslips is revoked, revealSeed
        
                const betslip1 = await betSlips.getBetSlip(seedHash1);
                expect(await betslip1.status).to.equal(ethers.BigNumber.from("2")); // betSlips status: REVOKED
                const betslip2 = await betSlips.getBetSlip(seedHash2);
                expect(await betslip2.status).to.equal(ethers.BigNumber.from("1")); // betSlips status: COMPLETED
                const betslip3 = await betSlips.getBetSlip(seedHash3);
                expect(await betslip3.status).to.equal(ethers.BigNumber.from("2")); // betSlips status: REVOKED
        
                expect(await USDT.balanceOf(betSlips.address)).to.equal(42540);
                expect(await USDT.balanceOf(owner.address)).to.equal(999999957460);
            });
        });
    });
});
