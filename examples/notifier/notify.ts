import notifierFactory from "../../src/lib/notifierFactory";

async function main() {
    let iterator = 0;

    const notifier = notifierFactory();

    await notifier.init();

    setInterval(() => {
        notifier.notify({ text: `iteration ${iterator}` });
        ++iterator;
    }, 5000);
}

main();
