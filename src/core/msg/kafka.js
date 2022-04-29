const {Kafka} = require('kafkajs')
const config = require("../../config");

const kafka = new Kafka({
    clientId: config.kafka.clientId,
    brokers: config.kafka.bootstrapServers,
})

module.exports = kafka