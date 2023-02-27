import config from "../config/index.js";
import Web3 from "web3";
// your contract ABI
import DiceGameABI from "../abi/DiceGameAbi.json" assert {type: "json"};

const rpcUrl = process.env.RPC_URL || config.rpc_url;
const diceContractAddress = process.env.DICE_CONTRACT_ADDRESS || config.dice_contract_address;
const betSlipContractAddress = process.env.BETSLIP_CONTRACT_ADDRESS || config.betSlip_contract_address;
const privateKey = process.env.PRIVATE_KEY || config.privateKey;
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
console.log("New web3 object initialized.");

let gamesMap = new Map();
gamesMap.set(config.dice_game_code, diceContractAddress);

// It can work with any smart contract
const diceGame = new web3.eth.Contract(DiceGameABI, diceContractAddress);

const account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

// TODO: Make resolvers more extendable in terms of new games/tokens etc. Was implemented to provide FE an API asap
export const resolvers = {

    Query: {
        getBlockchainMetadata(parent, {gameCode}, context, info) {
            return {
                chainId: config.chainId,
                contracts: [
                    {
                        name: "dice",
                        address: diceContractAddress
                    },
                    {
                        name: "betslip",
                        address: betSlipContractAddress
                    },
                ].filter(contract => {
                    if (gameCode) {
                        return contract.name === gameCode || contract.name === "betslip";
                    } else {
                        return true;
                    }
                }),
                tokens: [
                    {
                        symbol: "USDT",
                        digits: 6,
                        address: config.usdtAddress
                    }
                ]
            }
        },
        async getGameConfig(parent, {gameCode}, context, info) {

            // TODO: This is dirty fix of the breaking change for the game contract. It should all be deleted and used via properties

            // let configJson = await diceGame.methods.getGameConfig(config.usdtAddress).call((error, result) => {
            //     return result;
            // });

            // let gameConfig = JSON.parse(configJson);

            return {
                rtp: 0.97,
                tokenConfigs: [
                    {
                        token: {
                            symbol: "USDT",
                            digits: 6,
                            address: config.usdtAddress
                        },
                        betAmount: {
                            minAmount: 2000000,
                            maxAmount: 10000000000,
                            defaultAmount: 32000000
                        }
                    }
                ]
            }
        },
    }
};