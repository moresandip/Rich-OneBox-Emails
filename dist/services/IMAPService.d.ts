import { EventEmitter } from 'events';
import { EmailAccount } from '../types';
export declare class IMAPService extends EventEmitter {
    private connections;
    private elasticsearchService;
    private aiService;
    private slackService;
    private webhookService;
    private isRunning;
    private idleWatchdogs;
    constructor();
    start(): Promise<void>;
    stop(): Promise<void>;
    private connectAccount;
    private syncAccountEmails;
    private setupIdleMode;
    private checkForNewEmails;
    private reconnectAccount;
    private parseEmailMessage;
    private processEmail;
    addAccount(accountData: Partial<EmailAccount>): Promise<void>;
    removeAccount(accountId: string): Promise<void>;
    getConnectionStatus(): Array<{
        accountId: string;
        isConnected: boolean;
    }>;
}
//# sourceMappingURL=IMAPService.d.ts.map