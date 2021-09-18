import notifierFactory from "../../src/lib/notifierFactory";
import loggerFactory from "../../src/lib/loggerFactory";

const logger = loggerFactory();

async function main() {
    const notifier = notifierFactory();

    await notifier.init();

    notifier.receive(customMessageHandler);
}

function customMessageHandler(message) {
    logger.info(`Via notificator received ${JSON.stringify(message)}`);
}

main();
