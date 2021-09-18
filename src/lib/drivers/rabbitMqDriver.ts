// const amqp = require('amqplib/callback_api');

import amqp from 'amqplib/callback_api';

import { PubSubDriverInterface } from "./pubSubDriverInterface";
import { parseMessage, formatMessage } from '../utils';


class RabbitMqDriver implements PubSubDriverInterface {
    private isReconnecting: boolean;
    private connection;
    private handlers;
    private channels;

    constructor() {
        this.isReconnecting = false;
        this.channels = [];
        this.handlers = [];
    }

    async connect() {
        const connectString = process.env.AMQP_URL || 'amqp://localhost:5673';

        try {
            this.connection = await new Promise((resolve, reject) => {
                amqp.connect(connectString, (error, connection) => {
                    if (error) return reject(error);

                    console.info(`Connected to RabbitMQ on ${connectString}`);
                    resolve(connection);
                });
            });
        } catch (error) {
            console.error(`Failed to connect to ${connectString}`);
            await new Promise(resolve => setTimeout(() => resolve, 5000));
            console.info('Trying to reconnect...');

            return this.connect();
        }

        this.connection.on('error', (error) => {
            if (error.message !== 'Connection closing') {
                console.error('[AMQP] conn error');
                console.error(error);
                this.isReconnecting = true;

                return setTimeout(this.connect.bind(this), 5000);
            }
        });
        this.connection.on('close', () => {
            console.warn('[AMQP] reconnecting started');
            this.isReconnecting = true;

            return setTimeout(this.connect.bind(this), 5000);
        });

        if (this.isReconnecting) {
            await this.recreateChannels();
            await this.reassignHandlers();
            console.info('Reconnected successfully.');
            this.isReconnecting = false;
        }

        return this.connection;
    }

    private async recreateChannels() {
        console.info('Recreating channels...');
        for (const channelName in this.channels) {
            if (!this.channels[channelName]) continue;
            await this.createChannel(channelName);
        }
        console.info('Recreating channels completed.');
    }

    private reassignHandlers() {
        console.info('Reassigning handlers...');
        for (const channelName in this.handlers) {
            if (!this.handlers[channelName]) continue;
            console.info(`For channel: "${channelName}"`);
            for (const handler of this.handlers[channelName]) {
                console.info(`Subscribing for handler: "${handler.name}"`);
                this.subscribe(channelName, handler, true);
            }
        }
        console.info('Reassign handlers completed.');
    }

    public async createChannel(channelName, pubsubMode = true) {
        this.channels[channelName] = await new Promise((resolve, reject) => {
            this.connection.createChannel((error, channel) => {
                if (error) {
                    console.error(`Failed to create channel "${channelName}"`);

                    return reject(error);
                }

                console.info(`Created channel "${channelName}"`);
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

            console.info(`Publishing message '${formattedMessage.slice(0, 40)}...' to channel "${exchange}"`);
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
        console.log('subscribe()');
        if (!this.channels[exchange]) throw Error(`Channel for queue ${exchange} not exists`);

        this.channels[exchange].assertQueue(exchange, { exclusive: true }, (error2, q) => {
            if (error2) throw error2;

            console.info(` [*] Waiting for messages for ${exchange}. To exit presolves CTRL+C`);
            this.channels[exchange].bindQueue(q.queue, exchange, '');

            this.channels[exchange].consume(q.queue, (message) => {
                this.messageHandler({ exchange, message, noAck: true }, messageHandler);
            }, { noAck: true });
        });
        if (!isReconnecting) this.handlers[exchange].push(messageHandler);
    }

    public close() {
        console.log('close()');
        this.connection.close();
        console.info('Closed connection.');
    }

    private messageHandler({ exchange, queue = null, message, noAck = false }, messageHandler) {
        const messageString = message.content.toString();

        console.info(` [x] Received "${messageString.slice(0, 40)}...`);
        if (typeof messageHandler === 'function') messageHandler(parseMessage(messageString));
        if (noAck) return;

        setTimeout(() => {
            console.info(' [x] Done');
            this.channels[queue].ack(message);
        }, 1000);
    }
}

export { RabbitMqDriver };
