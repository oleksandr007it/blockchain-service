const config = require('./config');
const hre = require("hardhat");
const log4js = require("log4js");
const db = require('./core/db')
const express = require('express')
const axios = require('axios').default;
let Web3 = require('web3')


const web3 = new Web3(config.rpc_url)

const app = express()
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// your contract ABI
const ThrowDiceABI = require('./abi/ThrowDiceAbi.json')
const BetSlipABI = require('./abi/BetSlipsAbi.json')

// It can work with any smart contract
//const throwDice= new web3.eth.Contract(ThrowDiceABI, config.dice_contract_address);
const betSlip = new web3.eth.Contract(BetSlipABI, config.betSlip_contract_address);

app.get("/", async (req, res) => res.json({status: "OK"}))

const privateKey = config.privateKey;
const account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;


app.get("/api/test", async (req, res) => {

    // using the callback
    betSlip.methods.placeBetSlip("DICE_GAME", "OVER", 10).send({
        from: account.address,
        gas: 211825,
        gasPrice: 298101
    })
        .on('transactionHash', function (hash) {
            console.log(hash);
        })
        .on('confirmation', function (confirmationNumber, receipt) {
            //  console.log(confirmationNumber);
        })
        .on('receipt', function (receipt) {
            // receipt example
            //    console.log(receipt);
        })
        .on('error', function (error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
            console.error(error);
        });

    return res.json({"status": "game001"})
})


setInterval(() => {
    db.getCurrentBlockHeight(function (error, currentBlockHeight) {
        console.log(currentBlockHeight);
        web3.eth.getBlockNumber().then(async latestBlockHeight => {
                if (latestBlockHeight > currentBlockHeight) {
                    await manageEvents(currentBlockHeight, latestBlockHeight, 'betSlipPlaced')
                    await db.updateCurrentBlockHeight(currentBlockHeight, ++latestBlockHeight);
                }
            }
        ).catch(function (error) {
            console.log(error);
        });
    });

}, 1000)


async function manageEvents(currentBlockHeight, latestBlockHeight, eventName) {
    console.log("latest: ", latestBlockHeight, "currentBlockHeight: ", currentBlockHeight);
    const events = await betSlip.getPastEvents(
        eventName,
        {fromBlock: currentBlockHeight, toBlock: latestBlockHeight}
    );

    await revealSeedByEvent(events);
};


async function revealSeedByEvent(data_events) {
  //  console.log(data_events);

    for (let i = 0; i < data_events.length; i++) {
        let seedHashId = data_events[i]['returnValues']['betSlipPlacedId'];
        let fromAddress = data_events[i]['returnValues']['fromAddress'];
        let gameCode = data_events[i]['returnValues']['gameCode'];
        console.log("seedHashId :", seedHashId, "- fromAddress:", fromAddress, "- gameCode:", gameCode);
        //call to seed server
        getSeedByHash(fromAddress, seedHashId).then(function (response) {
                console.log(response);
                // reveal seed from ThrowDice

            }
        ).catch(function (error) {
            console.log(error);
        });

    }
    ;
};

//{ seedHash: '12345', seed: '1234' }

setInterval(() => {
    getSeedByHash("123", "12345")
        .then(function (response) {
                console.log(response.data);
            }
        ).catch(function (error) {
        console.log(error);
    });
    betSlip.methods.placeBetSlip("dice", "OVER", 10).send({
        from: account.address,
        gas: 211825,
        gasPrice: 298101
    })
        .on('transactionHash', function (hash) {
            console.log(hash);
        })
        .on('error', function (error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
            console.error(error);
        });
}, 3000)

// Want to use async/await? Add the `async` keyword to your outer function/method.
async function getSeedByHash(playerId, seedHash) {
    try {
        return await axios.get(config.seed_service_url + '/api/players/' + playerId + '/seeds/' + seedHash);
    } catch (error) {
        console.log('Error', error.message);
        throw new Error(error.code);
    }
}


app.get("/api/test2", async (req, res) => {

    betSlip.methods.getBetSlip(120).call(function (error, result) {
        console.log(result);
    });

    return res.json({"status": "game00199"})
})

app.listen(config.port, () => {
    console.log(`Blockchain service is listening at http://localhost:${config.port}`)
}).on('uncaughtException', function (req, res, route, err) {
    if (!res.headersSent) {
        return res.send(500, {ok: false});
    }
    res.write('\n');
    res.end();
});
