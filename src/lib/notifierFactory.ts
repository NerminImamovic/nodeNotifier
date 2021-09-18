import { Notifier } from "./notifier";
import { PubSub } from "./pubSub";
import { RabbitMqDriver } from "./drivers/rabbitMqDriver";
import loggerFactory from "./loggerFactory";

export default () => {
    const logger = loggerFactory();

    const rabbitMqDriver = new RabbitMqDriver({ logger });

    const notifier = new Notifier({
        pubSub: new PubSub({
            driver: rabbitMqDriver,
        }),
        logger,
    });

    return notifier;
};
