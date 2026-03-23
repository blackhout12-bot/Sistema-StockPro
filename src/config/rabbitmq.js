const amqp = require('amqplib');
const logger = require('../utils/logger');

class RabbitMQConnection {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    }

    async connect() {
        if (this.connection) return this.connection;

        try {
            this.connection = await amqp.connect(this.url);
            this.connection.on('error', (err) => {
                logger.error({ err }, 'RabbitMQ connection error');
                this.connection = null;
                setTimeout(() => this.connect(), 5000); // Reconnect logic
            });

            this.connection.on('close', () => {
                logger.warn('RabbitMQ connection closed. Reconnecting...');
                this.connection = null;
                setTimeout(() => this.connect(), 5000);
            });

            this.channel = await this.connection.createChannel();
            logger.info('🐇 RabbitMQ connected successfully');
            return this.connection;
        } catch (error) {
            logger.error({ err: error.message }, 'Failed to connect to RabbitMQ');
            setTimeout(() => this.connect(), 5000);
        }
    }

    getChannel() {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not initialized');
        }
        return this.channel;
    }

    async close() {
        try {
            if (this.channel) {
                await this.channel.close();
                this.channel = null;
            }
            if (this.connection) {
                await this.connection.close();
                this.connection = null;
            }
            logger.info('🐇 RabbitMQ gracefully disconnected');
        } catch (error) {
            logger.error({ err: error.message }, 'Failed closing RabbitMQ gracefully');
        }
    }
}

const rabbitMQ = new RabbitMQConnection();

process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, closing RabbitMQ...');
    await rabbitMQ.close();
});

process.on('SIGINT', async () => {
    logger.info('Received SIGINT, closing RabbitMQ...');
    await rabbitMQ.close();
});

module.exports = rabbitMQ;
