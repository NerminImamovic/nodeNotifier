import { PubSubDriverInterface } from "./drivers/pubSubDriverInterface";

export class PubSub implements PubSubDriverInterface {
    private driver: PubSubDriverInterface;
    private connection;

    constructor({ driver }: { driver: PubSubDriverInterface }) {
        if (!driver) throw new Error('"driver" is required');
        this.driver = driver;
    }

    async connect() {
        this.connection = await this.driver.connect();

        return this.connection;
    }

    createChannel(channel: string) {
        return this.driver.createChannel(channel);
    }

    publish(channel: string, message: any) {
        return this.driver.publish(channel, message);
    }

    async subscribe(channel: string, handler: any) {
        return this.driver.subscribe(channel, handler);
    }
}
