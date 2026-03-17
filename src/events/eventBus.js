const rabbitMQ = require('../config/rabbitmq');
const logger = require('../utils/logger');

class EventBus {
    constructor() {
        this.exchange = 'stockpro.events';
    }

    async init() {
        try {
            const channel = rabbitMQ.getChannel();
            await channel.assertExchange(this.exchange, 'topic', { durable: true });
            logger.info(`EventBus configured on exchange: ${this.exchange}`);
        } catch (error) {
            logger.error({ err: error }, 'Failed to initialize EventBus');
            throw error;
        }
    }

    async publish(routingKey, payload) {
        try {
            const channel = rabbitMQ.getChannel();
            const message = Buffer.from(JSON.stringify(payload));
            const published = channel.publish(this.exchange, routingKey, message, { persistent: true });
            
            if (published) {
                logger.info({ routingKey }, 'Event published successfully');
            } else {
                logger.warn({ routingKey }, 'Event publish buffer full');
            }
        } catch (error) {
            logger.error({ err: error, routingKey }, 'Failed to publish event');
        }
    }

    async subscribe(queueName, routingKey, callback) {
        try {
            const channel = rabbitMQ.getChannel();
            await channel.assertQueue(queueName, { durable: true });
            await channel.bindQueue(queueName, this.exchange, routingKey);

            logger.info({ queueName, routingKey }, 'Subscribed to event');

            channel.consume(queueName, async (msg) => {
                if (msg !== null) {
                    try {
                        const content = JSON.parse(msg.content.toString());
                        logger.debug({ routingKey, content }, 'Event received');
                        await callback(content);
                        channel.ack(msg); // Acknowledge successful processing
                    } catch (error) {
                        logger.error({ err: error, routingKey }, 'Error processing event');
                        // Nack and requeue or send to DLQ (Dead Letter Queue) depending on logic
                        channel.nack(msg, false, false); 
                    }
                }
            });
        } catch (error) {
            logger.error({ err: error, queueName, routingKey }, 'Failed to subscribe to event');
            throw error;
        }
    }
}

module.exports = new EventBus();
