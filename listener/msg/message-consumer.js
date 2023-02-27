const kafka = require("./kafka");
const consumer = kafka.consumer({groupId: 'blockchain-service'})


const MessageConsumer = {

    /**
     * My function description
     * @param {String} topic
     */
    async subscribeOnTopic(topic) {
        await consumer.connect()
        await consumer.subscribe({topic, fromBeginning: true})
        return consumer;
    }

}

module.exports.MessageConsumer = MessageConsumer