const kafka = require("./kafka");
const { Partitioners } = require('kafkajs')
const producer =kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner })

const indentation = 2;

const MessagePublisher = {

    /**
     * My function description
     * @param {String} topic
     * @param {Message} message
     */
    async publishMessage(topic, message) {

        const record = {
            key: message.key,
            value: JSON.stringify(message.value, null, indentation),
            headers: {
                'message_type': message.headers.messageType
            }
        }

        await producer.connect()
        let response = await producer.send({topic, messages: [record]})
        await producer.disconnect()

        return response;
    }

}

module.exports.MessagePublisher = MessagePublisher