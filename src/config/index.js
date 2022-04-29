const nconf = require('nconf');

const conf = nconf.argv()
    .env()
    .file({file: './config/config.json'}).defaults(
        {
            "app": {
                "name": "blockchain-service",
                "port": "8081",
                "dice_contract_address": "0x970951a12F975E6762482ACA81E57D5A2A4e73F4",
                "betSlip_contract_address": "0x5CC307268a1393AB9A764A20DACE848AB8275c46",
                "privateKey": "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133",
                "rpc_url": "http://localhost:9933",
                "seed_service_url": "http://localhost:8080",
                "db": {
                    "host": "localhost",
                    "port": 5432,
                    "user": "htegaming",
                    "password": "htegaming",
                    "schema": "blockchain_service",
                    "pool": {
                        "max": 10,
                        "connectionTimeout": 2000,
                        "idle": 30000
                    }
                }
            }
        }
    );

module.exports = conf.get("app");