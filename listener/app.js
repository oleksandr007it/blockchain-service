const config = require('./config');
const db = require('./db')
const {MessagePublisher, MessageConsumer, Message, MessageHeader} = require("./msg");
const express = require('express')
let Web3 = require('web3')
const rpcUrl = process.env.RPC_URL || config.rpc_url;
const diceContractAddress = process.env.DICE_CONTRACT_ADDRESS || config.dice_contract_address;
const coinFlipContractAddress = process.env.COINFLIP_CONTRACT_ADDRESS || config.coinFlip_contract_address;
const rouletteContractAddress = process.env.ROULETTE_CONTRACT_ADDRESS || config.roulette_contract_address;
const minesContractAddress = process.env.MINES_CONTRACT_ADDRESS || config.mines_contract_address;
const plinkoContractAddress = process.env.PLINKO_CONTRACT_ADDRESS || config.plinko_contract_address;
const circleContractAddress = process.env.CIRCLE_CONTRACT_ADDRESS || config.circle_contract_address;
const bombContractAddress = process.env.BOMB_CONTRACT_ADDRESS || config.bomb_contract_address;
const limboContractAddress = process.env.LIMBO_CONTRACT_ADDRESS || config.limbo_contract_address;
const hiloContractAddress = process.env.HILO_CONTRACT_ADDRESS || config.hilo_contract_address;
const balloonContractAddress = process.env.BALLOON_CONTRACT_ADDRESS || config.balloon_contract_address;
const betSlipContractAddress = process.env.BETSLIP_CONTRACT_ADDRESS || config.betSlip_contract_address;
const PORT = process.env.PORT || config.port;
const privateKey = process.env.PRIVATE_KEY || config.privateKey;
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
console.log("New web3 object initialized.");


let delay = config.scheduler.delay;
const app = express()
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// your contract ABI
const DiceGameABI = require('./abi/DiceGameAbi.json')
const CoinFlipGameABI = require('./abi/CoinFlipGameAbi.json')
const RouletteFlipGameABI = require('./abi/RouletteGameAbi.json')
const MinesGameABI = require('./abi/MinesGameAbi.json')
const PlinkoGameABI = require('./abi/PlinkoGameAbi.json')
const CircleGameABI = require('./abi/CircleGameAbi.json')
const BombGameABI = require('./abi/BombGameAbi.json')
const LimboGameABI = require('./abi/LimboGameAbi.json')
const HiloGameABI = require('./abi/HiloGameAbi.json')
const BalloonGameABI = require('./abi/BalloonGameAbi.json')
const BetSlipABI = require('./abi/BetSlipsAbi.json')
const ERC20ABI = require("./abi/AminoTokenAbi.json")

let gamesAddressMap = new Map();
gamesAddressMap.set(config.dice_game_code, diceContractAddress);
gamesAddressMap.set(config.coinFlip_game_code, coinFlipContractAddress);
gamesAddressMap.set(config.roulette_game_code, rouletteContractAddress);
gamesAddressMap.set(config.mines_game_code, minesContractAddress);
gamesAddressMap.set(config.plinko_game_code, plinkoContractAddress);
gamesAddressMap.set(config.circle_game_code, circleContractAddress);
gamesAddressMap.set(config.bomb_game_code, bombContractAddress);
gamesAddressMap.set(config.limbo_game_code, limboContractAddress);
gamesAddressMap.set(config.hilo_game_code, hiloContractAddress);
gamesAddressMap.set(config.balloon_game_code, balloonContractAddress);


let gamesABIMap = new Map();
gamesABIMap.set(config.dice_game_code, DiceGameABI);
gamesABIMap.set(config.coinFlip_game_code, CoinFlipGameABI);
gamesABIMap.set(config.roulette_game_code, RouletteFlipGameABI);
gamesABIMap.set(config.mines_game_code, MinesGameABI);
gamesABIMap.set(config.plinko_game_code, PlinkoGameABI);
gamesABIMap.set(config.circle_game_code, CircleGameABI);
gamesABIMap.set(config.bomb_game_code, BombGameABI);
gamesABIMap.set(config.limbo_game_code, LimboGameABI);
gamesABIMap.set(config.hilo_game_code, HiloGameABI);
gamesABIMap.set(config.balloon_game_code, BalloonGameABI);

const USDT_ADDRESS = "0xFFfffffF8d2EE523a2206206994597c13D831EC7";

// It can work with any smart contract
const diceGame = new web3.eth.Contract(DiceGameABI, diceContractAddress);
const betSlip = new web3.eth.Contract(BetSlipABI, betSlipContractAddress);
const USDT = new web3.eth.Contract(ERC20ABI, USDT_ADDRESS);

const account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

app.get("/", async (req, res) => res.json({status: "OK"}))

app.get("/api/tmp/placebetslip/approve", async (req, res) => {
    const nonce = await web3.eth.getTransactionCount(account.address, 'latest');
    console.log("Nonce: ", nonce);

    await USDT.methods.approve(betSlipContractAddress, 1000000).send({
        from: account.address,
        gas: 211825
    })
        .on('transactionHash', function (hash) {
            console.log("Approve Transaction: ", hash);
        })
        .on('error', function (error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
            console.error(error);
        });

    await USDT.methods.allowance(account.address, betSlipContractAddress).call((error, result) => {
        return res.json({"status": result})
    });
})

app.get("/api/tmp/placebetslip/:hash/:number/:choice", async (req, res) => {

    let seedHash = req.params.hash;
    let number = req.params.number;
    let choice = req.params.choice;

    const gas = await diceGame.methods.placeBet(100000, number, choice, seedHash, USDT_ADDRESS).estimateGas({from: account.address});

    console.log("Gas for placeBet: ", gas);

    await diceGame.methods.placeBet(100000, number, choice, seedHash, USDT_ADDRESS).send({
        from: account.address,
        gas
    })
        .on('transactionHash', function (hash) {

            console.log("PlaceBet Transaction: ", hash);

            return res.json({
                "status": "PLACED",
                "Transaction URL": "https://aminoxtestnet.blockscout.alphacarbon.network/tx/" + hash
            })

        })
        .on('error', function (error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
            console.error(error);
        });

})

app.get("/api/tmp/getbetslip/:hash", async (req, res) => {

    let hash = req.params.hash;
    betSlip.methods.getBetSlip(hash).call((error, result) => {
        return res.json(result)
    });

})

app.get("/api/tmp/reveal/:gameCode/:seedHash/:seed", async (req, res) => {
    let gameCode = req.params.gameCode;
    let seedHash = req.params.seedHash;
    let seed = req.params.seed;
    await revealSeed(gameCode, seedHash, seed, null);
    return res.json({"status": "OK"})
})


setTimeout(function request() {

    db.getCurrentBlockHeight().then(async (currentBlockHeight) => {
        console.log("Current block height :", currentBlockHeight);
        if (process.env.CURRENT_BLOCK_HEIGHT && process.env.CURRENT_BLOCK_HEIGHT > currentBlockHeight) {
            await db.updateCurrentBlockHeight(currentBlockHeight, process.env.CURRENT_BLOCK_HEIGHT)
            currentBlockHeight = process.env.CURRENT_BLOCK_HEIGHT;
        }
        web3.eth.getBlockNumber().then(latestBlockHeight => {
            return latestBlockHeight;
        }).then(async latestBlockHeight => {
            if (latestBlockHeight > currentBlockHeight) {
                return await processingEvents(currentBlockHeight, latestBlockHeight);
            }
        }).then(async (latestBlockHeight) => {
                if (latestBlockHeight) {
                    console.log("Success processing all events latest block height = %s", latestBlockHeight)
                    await db.updateCurrentBlockHeight(currentBlockHeight, ++latestBlockHeight)
                    delay = config.scheduler.delay;
                }
                setTimeout(request, delay);
            }
        ).catch(
            (error) => {
                delay *= 2;
                console.error("Error processing events %s Set new delay = %s mc", error, delay)
                setTimeout(request, delay);
            }
        )
    });
}, delay)


const run = async () => {
    let consumer = await MessageConsumer.subscribeOnTopic(config.kafka.topics.gameEvents)

    await consumer.run({
        eachMessage: async ({topic, partition, message, heartbeat}) => {
            console.log({
                key: message.key.toString(),
                value: message.value.toString()
            })
            if ((message.headers.message_type) && (message.headers.message_type.toString() === config.kafka.messageTypes.singlePlayerGameCompletedEvent)) {
                let messageValue;
                try {
                    messageValue = JSON.parse(message.value.toString());
                } catch (error) {
                    console.error('Error parse message from kafka: %s', error);
                }

                console.log("gameCode", messageValue.gameCode);
                console.log("seedHash", messageValue.seedHash);
                console.log("seed", messageValue.seed);
                if (messageValue.gameCode && messageValue.seedHash && messageValue.seed) {
                    console.log("Start to revealSeed");

                    await revealSeed(messageValue.gameCode, messageValue.seedHash, messageValue.seed, messageValue.playerGameChoice);
                } else {
                    console.log("Seed and seedHash must not be null when revealing the seed!");
                }
            }
        },
    })
}

run().catch(error => console.error('Error consumer: %s', error))

async function processingEvents(currentBlockHeight, latestBlockHeight) {
    try {
        await processingBetSlipPlacedEvents(currentBlockHeight, latestBlockHeight);
        await processingBetSlipCompletedEvents(currentBlockHeight, latestBlockHeight);
        return latestBlockHeight;
    } catch (error) {
        console.error('Error manageEvents: %s', error);
        throw new Error(error);
    }
};

async function processingBetSlipCompletedEvents(currentBlockHeight, latestBlockHeight) {
    let eventName = config.completed_event_name;
    console.log("Search events", eventName, " from blocks current:", currentBlockHeight, "to latest:", latestBlockHeight);

    const dataEvents = await betSlip.getPastEvents(
        eventName,
        {fromBlock: currentBlockHeight, toBlock: latestBlockHeight}
    );
    await getAndPublishForEachBetSlipCompleted(dataEvents);
}

async function processingBetSlipPlacedEvents(currentBlockHeight, latestBlockHeight) {
    let eventName = config.placed_event_name;
    console.log("Search events", eventName, " from blocks current:", currentBlockHeight, "to latest:", latestBlockHeight);
    const dataEvents = await betSlip.getPastEvents(
        eventName,
        {fromBlock: currentBlockHeight, toBlock: latestBlockHeight}
    );
    await getAndPublishForEachBetSlipPlacedEvent(dataEvents);
}

async function getAndPublishForEachBetSlipCompleted(dataEvents) {
    for (const event of dataEvents) {

        let gameCode = event.returnValues.gameCode;
        let seedHash = event.returnValues.seedHash;
        let fromAddress = event.returnValues.player;

        console.log("Processing BetSlipCompleted event seedHash:", seedHash, "- fromAddress:", fromAddress, "- gameCode:", gameCode);
        let blockData = await web3.eth.getBlock(event.blockNumber)
        await publishBetslipCompletedEventMessage(event.returnValues, blockData.timestamp, event.transactionHash);
    }
}

async function publishBetslipCompletedEventMessage(event, timestamp, transactionHash) {
    try {
        const header = new MessageHeader();
        header.messageType = config.kafka.messageTypes.betslipCompletedEvent;

        // TODO: Each token need to have it's own value here
        let tokenDecimals = 6;

        let message = new Message();
        message.headers = header
        message.key = event.player
        message.value = {
            betId: event.betId,
            playerId: event.player,
            tokenAddress: event.tokenAddress,
            tokenDecimals: tokenDecimals,
            gameCode: event.gameCode,
            gameResult: event.gameResult,
            playerGameChoice: event.playerGameChoice,
            wagerAmount: event.wagerAmount / Math.pow(10, tokenDecimals),
            returnAmount: event.returnAmount / Math.pow(10, tokenDecimals),
            odds: event.odds / 100,
            seedHash: event.seedHash,
            seed: event.seed,
            transactionHash: transactionHash,
            completedAt: toDateTime(timestamp)
        }

        await MessagePublisher.publishMessage(config.kafka.topics.betSlipEvents, message)
        console.log(`Message has been successfully sent to ${config.kafka.topics.betSlipEvents}`)

    } catch (error) {
        console.error(`Message was not published to Kafka: ${error.message}`, error);
        throw new Error(error);
    }
}

async function getAndPublishForEachBetSlipPlacedEvent(dataEvents) {
    try {
        for (const event of dataEvents) {
            let seedHash = event.returnValues.seedHash;
            let fromAddress = event.returnValues.player;
            let gameCode = event.returnValues.gameCode;
            console.log("Processing BetSlipPlacedEvent event seedHash:", seedHash, "- fromAddress:", fromAddress, "- gameCode:", gameCode);
            let blockData = await web3.eth.getBlock(event.blockNumber)
            await publishBetslipPlacedEventMessage(event.returnValues, blockData.timestamp, event.transactionHash);
        }
    } catch (error) {
        console.error("Error processing event :", error)
    }
}


async function publishBetslipPlacedEventMessage(event, timestamp, transactionHash) {
    try {
        const header = new MessageHeader();
        header.messageType = config.kafka.messageTypes.betslipPlacedEvent;
        let message = new Message();
        message.headers = header
        message.key = event.player

        // TODO: Each token need to have it's own value here
        let tokenDecimals = 6;

        message.value = {
            betId: event.betId,
            playerId: event.player,
            tokenAddress: event.tokenAddress,
            tokenDecimals: tokenDecimals,
            gameCode: event.gameCode,
            playerGameChoice: event.playerGameChoice,
            wagerAmount: event.wagerAmount / Math.pow(10, tokenDecimals),
            seedHash: event.seedHash,
            placedAt: toDateTime(timestamp),
            transactionHash: transactionHash
        }

        await MessagePublisher.publishMessage(config.kafka.topics.betSlipEvents, message)
        console.log(`Message has been successfully sent to ${config.kafka.topics.betSlipEvents}`)

    } catch (error) {
        console.error(`Message was not published to Kafka: ${error.message}`, error);
        throw new Error(error);
    }
}

function toDateTime(secs) {
    let t = new Date(1970, 0, 1); // Epoch
    t.setUTCSeconds(secs);
    return t;
}

async function revealSeed(gameCode, seedHash, seed, playerGameChoice) {
    try {

        let contractAddress = gamesAddressMap.get(gameCode);
        let gameAbi = gamesABIMap.get(gameCode);
        let game = new web3.eth.Contract(gameAbi, contractAddress);

        console.log("Reveal seed by gameCode: ", gameCode);

        if (gameCode === "mines") {
            let bombPositions = playerGameChoice.split(",").map(Number)

            const gas = await game.methods.revealSeed(seedHash, seed, bombPositions).estimateGas({from: account.address});

            console.log("Gas for revealSeed: ", gas);

            await game.methods.revealSeed(seedHash, seed, bombPositions).send({
                from: account.address,
                gas
            });
        } else if (gameCode === "hilo") {
            let playerChoices = playerGameChoice.split(",");

            const gas = await game.methods.revealSeed(seedHash, seed, playerChoices).estimateGas({from: account.address});

            console.log("Gas for revealSeed: ", gas);

            await game.methods.revealSeed(seedHash, seed, playerChoices).send({
                from: account.address,
                gas
            });
        } else if (gameCode === "balloon") {

            const gas = await game.methods.revealSeed(seedHash, seed, parseInt(playerGameChoice)).estimateGas({from: account.address});

            console.log("Gas for revealSeed: ", gas);

            await game.methods.revealSeed(seedHash, seed, parseInt(playerGameChoice)).send({
                from: account.address,
                gas
            });

        } else {
            const gas = await game.methods.revealSeed(seedHash, seed).estimateGas({from: account.address});

            console.log("Gas for revealSeed: ", gas);

            await game.methods.revealSeed(seedHash, seed).send({
                from: account.address,
                gas
            });
        }

    } catch (error) {
        console.error("Error reveal seed by GameCode %s", error);
    }
}

app.listen(PORT, () => {
    console.log(`Blockchain service is listening at http://localhost:${PORT}`)
    console.log("DiceContractAddress :", diceContractAddress)
    console.log("BetSlipContractAddress :", betSlipContractAddress)
}).on('uncaughtException', function (req, res, route, err) {
    if (!res.headersSent) {
        return res.send(500, {ok: false});
    }
    res.write('\n');
    res.end();
});
