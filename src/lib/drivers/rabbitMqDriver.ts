import amqp from 'amqplib/callback_api';

import { PubSubDriverInterface } from "./pubSubDriverInterface";
import { parseMessage, formatMessage } from '../utils';
import loggerFactory from '../loggerFactory';

class RabbitMqDriver implements PubSubDriverInterface {
    private isReconnecting: boolean;
    private connection;
    private handlers;
    private channels;
    private logger;

    constructor({ logger }) {
        this.isReconnecting = false;
        this.channels = [];
        this.handlers = [];
        this.logger = logger || loggerFactory;
    }

    async connect() {
        const connectString = process.env.AMQP_URL || 'amqp://localhost:5673';

        try {
            this.connection = await new Promise((resolve, reject) => {
                amqp.connect(connectString, (error, connection) => {
                    if (error) return reject(error);

                    this.logger.info(`Connected to RabbitMQ on ${connectString}`);
                    resolve(connection);
                });
            });
        } catch (error) {
            this.logger.error(`Failed to connect to ${connectString}`);
            await new Promise(resolve => setTimeout(() => resolve, 5000));
            this.logger.info('Trying to reconnect...');

            return this.connect();
        }

        this.connection.on('error', (error) => {
            if (error.message !== 'Connection closing') {
                this.logger.error('[AMQP] conn error');
                this.logger.error(error);
                this.isReconnecting = true;

                return setTimeout(this.connect.bind(this), 5000);
            }
        });
        this.connection.on('close', () => {
            this.logger.warn('[AMQP] reconnecting started');
            this.isReconnecting = true;

            return setTimeout(this.connect.bind(this), 5000);
        });

        if (this.isReconnecting) {
            await this.recreateChannels();
            await this.reassignHandlers();
            this.logger.info('Reconnected successfully.');
            this.isReconnecting = false;
        }

        return this.connection;
    }

    private async recreateChannels() {
        this.logger.info('Recreating channels...');

        for (const channelName in this.channels) {
            if (!this.channels[channelName]) continue;
            await this.createChannel(channelName);
        }
        this.logger.info('Recreating channels completed.');

    }

    private reassignHandlers() {
        this.logger.info('Reassigning handlers...');
        for (const channelName in this.handlers) {
            if (!this.handlers[channelName]) continue;
            this.logger.info(`For channel: "${channelName}"`);
            for (const handler of this.handlers[channelName]) {
                this.logger.info(`Subscribing for handler: "${handler.name}"`);
                this.subscribe(channelName, handler, true);
            }
        }
        this.logger.info('Reassign handlers completed.');
    }

    public async createChannel(channelName, pubsubMode = true) {
        this.channels[channelName] = await new Promise((resolve, reject) => {
            this.connection.createChannel((error, channel) => {
                if (error) {
                    this.logger.error(`Failed to create channel "${channelName}"`);

                    return reject(error);
                }

                this.logger.info(`Created channel "${channelName}"`);
                resolve(channel);
            });
        });

        this.channels[channelName].assertExchange(channelName, 'fanout', { durable: false });

        if (!this.handlers[channelName]) this.handlers[channelName] = [];

        return this.channels[channelName];
    }

    public publish(exchange, message) {
        try {
            const formattedMessage = formatMessage(message);

            this.logger.info(`Publishing message '${formattedMessage.slice(0, 40)}...' to channel "${exchange}"`);
            if (!this.channels[exchange]) throw Error(`Channel for exchange ${exchange} not exists`);
            this.channels[exchange].publish(exchange, '', Buffer.from(formattedMessage));
        } catch (error) {
            if (!this.isReconnecting && error.message === 'Channel closed') {
                this.isReconnecting = true;
                this.connect();
            }
            throw error;
        }
    }

    public subscribe(exchange, messageHandler, isReconnecting = false) {
        this.logger.info('subscribe()');
        if (!this.channels[exchange]) throw Error(`Channel for queue ${exchange} not exists`);

        this.channels[exchange].assertQueue(exchange, { exclusive: true }, (error, q) => {
            if (error) throw error;

            this.logger.info(` [*] Waiting for messages for ${exchange}. To exit press CTRL+C`);
            this.channels[exchange].bindQueue(q.queue, exchange, '');

            this.channels[exchange].consume(q.queue, (message) => {
                this.messageHandler({ exchange, message, noAck: true }, messageHandler);
            }, { noAck: true });
        });
        if (!isReconnecting) this.handlers[exchange].push(messageHandler);
    }

    public close() {
        this.logger.log('close()');
        this.connection.close();
        this.logger.info('Closed connection.');
    }

    private messageHandler({ exchange, queue = null, message, noAck = false }, messageHandler) {
        const messageString = message.content.toString();

        this.logger.info(` [x] Received "${messageString.slice(0, 40)}...`);
        if (typeof messageHandler === 'function') messageHandler(parseMessage(messageString));
        if (noAck) return;

        setTimeout(() => {
            this.logger.info(' [x] Done');
            this.channels[queue].ack(message);
        }, 1000);
    }
}

export { RabbitMqDriver };
