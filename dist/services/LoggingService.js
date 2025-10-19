"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingService = void 0;
const winston_1 = __importDefault(require("winston"));
const pino_1 = __importDefault(require("pino"));
const config_1 = require("../config");
class LoggingService {
    constructor() {
        this.winstonLogger = winston_1.default.createLogger({
            level: config_1.config.nodeEnv === 'production' ? 'info' : 'debug',
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
            defaultMeta: { service: 'rich-onebox-emails' },
            transports: [
                new winston_1.default.transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                    maxsize: 5242880,
                    maxFiles: 5
                }),
                new winston_1.default.transports.File({
                    filename: 'logs/combined.log',
                    maxsize: 5242880,
                    maxFiles: 5
                })
            ]
        });
        this.pinoLogger = (0, pino_1.default)({
            level: config_1.config.nodeEnv === 'production' ? 'info' : 'debug',
            transport: config_1.config.nodeEnv === 'development' ? {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname'
                }
            } : undefined
        });
        if (config_1.config.nodeEnv !== 'production') {
            this.winstonLogger.add(new winston_1.default.transports.Console({
                format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
            }));
        }
    }
    static getInstance() {
        if (!LoggingService.instance) {
            LoggingService.instance = new LoggingService();
        }
        return LoggingService.instance;
    }
    getWinstonLogger() {
        return this.winstonLogger;
    }
    getPinoLogger() {
        return this.pinoLogger;
    }
    info(message, meta) {
        this.winstonLogger.info(message, meta);
        this.pinoLogger.info(meta, message);
    }
    error(message, error, meta) {
        this.winstonLogger.error(message, { error: error?.stack, ...meta });
        this.pinoLogger.error({ error: error?.stack, ...meta }, message);
    }
    warn(message, meta) {
        this.winstonLogger.warn(message, meta);
        this.pinoLogger.warn(meta, message);
    }
    debug(message, meta) {
        this.winstonLogger.debug(message, meta);
        this.pinoLogger.debug(meta, message);
    }
    logIMAPEvent(accountId, event, details) {
        this.info(`IMAP Event: ${event}`, {
            accountId,
            event,
            timestamp: new Date().toISOString(),
            ...details
        });
    }
    logIMAPError(accountId, error, context) {
        this.error(`IMAP Error for account ${accountId}`, error, {
            accountId,
            context,
            timestamp: new Date().toISOString()
        });
    }
    logEmailProcessed(emailId, accountId, category) {
        this.info(`Email processed`, {
            emailId,
            accountId,
            category,
            timestamp: new Date().toISOString()
        });
    }
    logEmailError(emailId, error, context) {
        this.error(`Email processing error`, error, {
            emailId,
            context,
            timestamp: new Date().toISOString()
        });
    }
    logAICategorization(emailId, category, confidence) {
        this.info(`AI Categorization completed`, {
            emailId,
            category,
            confidence,
            timestamp: new Date().toISOString()
        });
    }
    logAIError(emailId, error, context) {
        this.error(`AI processing error`, error, {
            emailId,
            context,
            timestamp: new Date().toISOString()
        });
    }
    logSystemEvent(event, details) {
        this.info(`System Event: ${event}`, {
            event,
            timestamp: new Date().toISOString(),
            ...details
        });
    }
    logPerformance(operation, duration, details) {
        this.info(`Performance: ${operation}`, {
            operation,
            duration,
            timestamp: new Date().toISOString(),
            ...details
        });
    }
    logSecurityEvent(event, details) {
        this.warn(`Security Event: ${event}`, {
            event,
            timestamp: new Date().toISOString(),
            ...details
        });
    }
    logDatabaseOperation(operation, collection, details) {
        this.debug(`Database Operation: ${operation}`, {
            operation,
            collection,
            timestamp: new Date().toISOString(),
            ...details
        });
    }
    logDatabaseError(operation, error, context) {
        this.error(`Database Error: ${operation}`, error, {
            operation,
            context,
            timestamp: new Date().toISOString()
        });
    }
    logAPIRequest(method, path, statusCode, duration) {
        this.info(`API Request: ${method} ${path}`, {
            method,
            path,
            statusCode,
            duration,
            timestamp: new Date().toISOString()
        });
    }
    logAPIError(method, path, error, context) {
        this.error(`API Error: ${method} ${path}`, error, {
            method,
            path,
            context,
            timestamp: new Date().toISOString()
        });
    }
    logHealthCheck(service, status, details) {
        const level = status === 'healthy' ? 'info' : 'error';
        this[level](`Health Check: ${service}`, {
            service,
            status,
            timestamp: new Date().toISOString(),
            ...details
        });
    }
    createChildLogger(module) {
        return this.pinoLogger.child({ module });
    }
}
exports.LoggingService = LoggingService;
//# sourceMappingURL=LoggingService.js.map