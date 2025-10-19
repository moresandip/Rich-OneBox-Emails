import winston from 'winston';
import pino from 'pino';
import { config } from '../config';

export class LoggingService {
  private static instance: LoggingService;
  private winstonLogger: winston.Logger;
  private pinoLogger: pino.Logger;

  private constructor() {
    // Winston logger for application logs
    this.winstonLogger = winston.createLogger({
      level: config.nodeEnv === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'rich-onebox-emails' },
      transports: [
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      ]
    });

    // Pino logger for structured logging
    this.pinoLogger = pino({
      level: config.nodeEnv === 'production' ? 'info' : 'debug',
      transport: config.nodeEnv === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      } : undefined
    });

    // Add console transport for development
    if (config.nodeEnv !== 'production') {
      this.winstonLogger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }));
    }
  }

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  public getWinstonLogger(): winston.Logger {
    return this.winstonLogger;
  }

  public getPinoLogger(): pino.Logger {
    return this.pinoLogger;
  }

  // Application logging methods
  public info(message: string, meta?: any): void {
    this.winstonLogger.info(message, meta);
    this.pinoLogger.info(meta, message);
  }

  public error(message: string, error?: Error, meta?: any): void {
    this.winstonLogger.error(message, { error: error?.stack, ...meta });
    this.pinoLogger.error({ error: error?.stack, ...meta }, message);
  }

  public warn(message: string, meta?: any): void {
    this.winstonLogger.warn(message, meta);
    this.pinoLogger.warn(meta, message);
  }

  public debug(message: string, meta?: any): void {
    this.winstonLogger.debug(message, meta);
    this.pinoLogger.debug(meta, message);
  }

  // IMAP specific logging
  public logIMAPEvent(accountId: string, event: string, details?: any): void {
    this.info(`IMAP Event: ${event}`, {
      accountId,
      event,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  public logIMAPError(accountId: string, error: Error, context?: any): void {
    this.error(`IMAP Error for account ${accountId}`, error, {
      accountId,
      context,
      timestamp: new Date().toISOString()
    });
  }

  // Email processing logging
  public logEmailProcessed(emailId: string, accountId: string, category?: string): void {
    this.info(`Email processed`, {
      emailId,
      accountId,
      category,
      timestamp: new Date().toISOString()
    });
  }

  public logEmailError(emailId: string, error: Error, context?: any): void {
    this.error(`Email processing error`, error, {
      emailId,
      context,
      timestamp: new Date().toISOString()
    });
  }

  // AI service logging
  public logAICategorization(emailId: string, category: string, confidence: number): void {
    this.info(`AI Categorization completed`, {
      emailId,
      category,
      confidence,
      timestamp: new Date().toISOString()
    });
  }

  public logAIError(emailId: string, error: Error, context?: any): void {
    this.error(`AI processing error`, error, {
      emailId,
      context,
      timestamp: new Date().toISOString()
    });
  }

  // System monitoring logging
  public logSystemEvent(event: string, details?: any): void {
    this.info(`System Event: ${event}`, {
      event,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  public logPerformance(operation: string, duration: number, details?: any): void {
    this.info(`Performance: ${operation}`, {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  // Security logging
  public logSecurityEvent(event: string, details?: any): void {
    this.warn(`Security Event: ${event}`, {
      event,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  // Database logging
  public logDatabaseOperation(operation: string, collection: string, details?: any): void {
    this.debug(`Database Operation: ${operation}`, {
      operation,
      collection,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  public logDatabaseError(operation: string, error: Error, context?: any): void {
    this.error(`Database Error: ${operation}`, error, {
      operation,
      context,
      timestamp: new Date().toISOString()
    });
  }

  // API logging
  public logAPIRequest(method: string, path: string, statusCode: number, duration?: number): void {
    this.info(`API Request: ${method} ${path}`, {
      method,
      path,
      statusCode,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  public logAPIError(method: string, path: string, error: Error, context?: any): void {
    this.error(`API Error: ${method} ${path}`, error, {
      method,
      path,
      context,
      timestamp: new Date().toISOString()
    });
  }

  // Health check logging
  public logHealthCheck(service: string, status: 'healthy' | 'unhealthy', details?: any): void {
    const level = status === 'healthy' ? 'info' : 'error';
    this[level](`Health Check: ${service}`, {
      service,
      status,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  // Create child logger for specific modules
  public createChildLogger(module: string): pino.Logger {
    return this.pinoLogger.child({ module });
  }
}
