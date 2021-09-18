export class Notifier {
    private pubSub;
    private channel;

    constructor ({  pubSub }) {
        if (!pubSub)
            throw new Error('"PubSub" is required');
        this.pubSub = pubSub;
        this.channel = 'notifications';
    }

    async init() {
        try {
            await this.pubSub.connect();
            await this.pubSub.createChannel(this.channel);
        } catch (error) {
            console.error('Notifier initialization failed');
            console.error(error);
        }
    }

    notify(message) {
        try {
            this.pubSub.publish(this.channel, message);
        } catch (error) {
            console.error('Failed to notify');
            console.error(error)
        }
    }

    receive(messageHandler) {
        this.pubSub.subscribe(this.channel, messageHandler)
    }
}
