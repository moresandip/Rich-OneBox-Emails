import { SlackNotification } from '../types';
export declare class SlackService {
    private client;
    constructor();
    sendNotification(notification: SlackNotification): Promise<boolean>;
    sendInterestedEmailAlert(email: any, aiSuggestion: any): Promise<boolean>;
    sendErrorAlert(error: string, context?: any): Promise<boolean>;
    sendSystemStatus(status: {
        totalAccounts: number;
        activeConnections: number;
        emailsProcessed: number;
        errors: number;
    }): Promise<boolean>;
}
//# sourceMappingURL=SlackService.d.ts.map