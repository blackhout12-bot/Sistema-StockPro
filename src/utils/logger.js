// src/utils/logger.js — Logger estructurado con pino
const pino = require('pino');

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' } }
        : undefined,
    redact: ['req.headers.authorization', 'body.password', 'body.password_hash'],
});

module.exports = logger;
