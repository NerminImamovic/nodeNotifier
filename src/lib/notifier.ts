import loggerFactory from "./loggerFactory";

export class Notifier {
    private pubSub;
    private channel;
    private logger;

    constructor ({ pubSub, logger }) {
        if (!pubSub)
            throw new Error('"PubSub" is required');
        this.pubSub = pubSub;
        this.channel = 'notifications';
        this.logger = logger || loggerFactory();
    }

    async init() {
        try {
            await this.pubSub.connect();
            await this.pubSub.createChannel(this.channel);
        } catch (error) {
            this.logger.error('Notification initialization failed');
            this.logger.error(error);
        }
    }

    notify(message) {
        try {
            this.pubSub.publish(this.channel, message);
        } catch (error) {
            this.logger.error('Failed to notify');
            this.logger.error(error);
        }
    }

    receive(messageHandler) {
        this.pubSub.subscribe(this.channel, messageHandler)
    }
}
