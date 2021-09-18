import { Notifier } from "./notifier";
import { PubSub } from "./pubSub";
import { RabbitMqDriver } from "./drivers/rabbitMqDriver";

const notifierFactory = () => {
    const rabbitMqDriver = new RabbitMqDriver();

    const notifier = new Notifier({
        pubSub: new PubSub({
            driver: rabbitMqDriver,
        }),
    });

    return notifier;
};

export { notifierFactory };
