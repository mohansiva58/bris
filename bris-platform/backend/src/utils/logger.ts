import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import config from '../config';

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

// Tell winston about custom colors
winston.addColors(colors);

// Define format
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console format (colorized for development)
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf((info) => {
        const { timestamp, level, message, ...meta } = info;
        let log = `${timestamp} [${level}]: ${message}`;
        // Hide large stacks in console but show the error message
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }
        return log;
    })
);

// Define transports
const transports: winston.transport[] = [
    // Console transport
    new winston.transports.Console({
        format: consoleFormat,
    }),
];

// Add file transports in production
if (config.isProduction) {
    // Error log files
    transports.push(
        new DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxFiles: '14d',
            maxSize: '20m',
            format,
        })
    );

    // Combined log files
    transports.push(
        new DailyRotateFile({
            filename: 'logs/combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d',
            maxSize: '20m',
            format,
        })
    );
}

// Create logger instance
export const logger = winston.createLogger({
    level: config.logging.level,
    levels,
    format,
    transports,
    exitOnError: false,
});

// Create a stream for Morgan HTTP logging
export const stream = {
    write: (message: string) => {
        logger.http(message.trim());
    },
};

// Export convenience methods
export default logger;
