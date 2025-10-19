import { WebhookPayload } from '../types';
export declare class WebhookService {
    private webhookUrl;
    constructor();
    sendWebhook(payload: WebhookPayload): Promise<boolean>;
    sendInterestedEmailWebhook(email: any, aiSuggestion: any): Promise<boolean>;
    sendEmailCategorizedWebhook(email: any, category: string): Promise<boolean>;
    sendNewEmailWebhook(email: any): Promise<boolean>;
    sendSystemEventWebhook(event: string, data: any): Promise<boolean>;
    sendErrorWebhook(error: string, context?: any): Promise<boolean>;
    setWebhookUrl(url: string): void;
    getWebhookUrl(): string;
}
//# sourceMappingURL=WebhookService.d.ts.map