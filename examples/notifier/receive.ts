import { notifierFactory } from "../../src/lib/notifierFactory";

async function main() {
    const notifier = notifierFactory();

    await notifier.init();

    notifier.receive(customMessageHandler);
}

function customMessageHandler(message) {
    console.log(`Via notificator received ${JSON.stringify(message)}`);
}

main();
