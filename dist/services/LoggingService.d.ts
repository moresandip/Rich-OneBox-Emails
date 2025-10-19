import winston from 'winston';
import pino from 'pino';
export declare class LoggingService {
    private static instance;
    private winstonLogger;
    private pinoLogger;
    private constructor();
    static getInstance(): LoggingService;
    getWinstonLogger(): winston.Logger;
    getPinoLogger(): pino.Logger;
    info(message: string, meta?: any): void;
    error(message: string, error?: Error, meta?: any): void;
    warn(message: string, meta?: any): void;
    debug(message: string, meta?: any): void;
    logIMAPEvent(accountId: string, event: string, details?: any): void;
    logIMAPError(accountId: string, error: Error, context?: any): void;
    logEmailProcessed(emailId: string, accountId: string, category?: string): void;
    logEmailError(emailId: string, error: Error, context?: any): void;
    logAICategorization(emailId: string, category: string, confidence: number): void;
    logAIError(emailId: string, error: Error, context?: any): void;
    logSystemEvent(event: string, details?: any): void;
    logPerformance(operation: string, duration: number, details?: any): void;
    logSecurityEvent(event: string, details?: any): void;
    logDatabaseOperation(operation: string, collection: string, details?: any): void;
    logDatabaseError(operation: string, error: Error, context?: any): void;
    logAPIRequest(method: string, path: string, statusCode: number, duration?: number): void;
    logAPIError(method: string, path: string, error: Error, context?: any): void;
    logHealthCheck(service: string, status: 'healthy' | 'unhealthy', details?: any): void;
    createChildLogger(module: string): pino.Logger;
}
//# sourceMappingURL=LoggingService.d.ts.map