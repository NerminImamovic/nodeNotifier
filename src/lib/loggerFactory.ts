import winston from 'winston'

export default () => {
  // severity levels
  const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  }

  // the current severity based on the current NODE_ENV
  const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment
      ? 'debug'
      : 'warn';
  }

  // colors for each level
  const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
  }

  winston.addColors(colors)

  // customizing the log format
  const format = winston.format.combine(
    // message timestamp with the preferred format
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    // colorizing the logs
    winston.format.colorize({ all: true }),
    // format the message showing the timestamp, the level and the message
    winston.format.printf(
      (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    )
  )

  // transports the logger must use to print out messages.
  const transports = [
    // use the console to print the messages
    new winston.transports.Console(),
    // print error level messages inside the error.log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    // print all messages inside the all.log file
    new winston.transports.File({ filename: 'logs/all.log' }),
  ];

  return winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
  });
};
