import pino from 'pino';

const transport = pino.transport({
    target: 'pino-pretty',
    level: process.env.LOG_LEVEL || 'info',
});

const logger = pino(transport);

export default logger;