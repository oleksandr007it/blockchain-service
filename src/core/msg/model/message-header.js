class MessageHeader {
    /**
     * Used to serialize/deserialize messages e.g AccountTransactionCompletedEvent
     * @type {string}
     */
    messageType;

    /**
     * Value used for events ordering.
     * In most cases it will be the user identifier since we want all the operations
     * for a single user to  be in the correct order
     *
     * @type {string}
     */
    messageKey;

    /**
     * Used to uniquely identify the message.
     * Will be generated on producer side and can be used by consumer for idempotency
     *
     * @type {string}
     */
    messageId;

    /**
     * The id of the tenant
     *
     * @type {string}
     */
    tenantId;

    /**
     * The name of the application that published the event
     *
     * @type {string}
     */
    messageProducerApp;

    /**
     * Used for tracing the request chain in logs between different services.
     * Also known as correlation id
     *
     * @type {string}
     */
    traceId;
}

module.exports.MessageHeader = MessageHeader