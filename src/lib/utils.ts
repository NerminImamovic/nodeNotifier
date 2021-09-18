const formatMessage = (message) => {
    return typeof message === 'string'
        ? message
        : JSON.stringify(message);
}

const parseMessage = (message) => {
    try {
        return JSON.parse(message);
    } catch(error) {
        console.warn(`message ${message} cannot be parsed`);

        return message;
    }
}

export {
    formatMessage,
    parseMessage
}
