const kafka = require("./kafka");
const config = require("../../config");
const {v4: uuidv4} = require('uuid');

const producer = kafka.producer()

const indentation = 2;

const MessagePublisher = {

    /**
     * My function description
     * @param {String} topic
     * @param {Message} message
     */
    async publishMessage(topic, message) {

        const header = message.header;
        header.messageProducerApp = config.name
        header.messageId = uuidv4()

        const record = {
            key: header.messageKey,
            value: JSON.stringify(message.body, null, indentation)
        }

        await producer.connect()

        return producer
            .send({
                topic,
                messages: [record]
            })
    }

}

module.exports.MessagePublisher = MessagePublisher