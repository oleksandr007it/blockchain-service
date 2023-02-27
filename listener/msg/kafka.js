const {Kafka} = require('kafkajs')
const config = require("../config");

const kafka = new Kafka({
    clientId: config.kafka.clientId,
    brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS || config.kafka.bootstrapServers],
})

module.exports = kafka