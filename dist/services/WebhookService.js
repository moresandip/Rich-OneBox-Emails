"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
class WebhookService {
    constructor() {
        this.webhookUrl = config_1.config.webhook.url;
    }
    async sendWebhook(payload) {
        try {
            if (!this.webhookUrl) {
                console.log('Webhook URL not configured, skipping webhook');
                return false;
            }
            const response = await axios_1.default.post(this.webhookUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Rich-OneBox-Emails/1.0'
                },
                timeout: 10000
            });
            if (response.status >= 200 && response.status < 300) {
                console.log('Webhook sent successfully');
                return true;
            }
            else {
                console.error('Webhook failed with status:', response.status);
                return false;
            }
        }
        catch (error) {
            console.error('Error sending webhook:', error);
            return false;
        }
    }
    async sendInterestedEmailWebhook(email, aiSuggestion) {
        const payload = {
            event: 'email.interested',
            data: {
                emailId: email.id,
                messageId: email.messageId,
                from: email.from,
                subject: email.subject,
                body: email.body.substring(0, 500),
                date: email.date,
                accountId: email.accountId,
                aiCategory: aiSuggestion.category,
                confidence: aiSuggestion.confidence,
                reasoning: aiSuggestion.reasoning
            },
            timestamp: new Date()
        };
        return await this.sendWebhook(payload);
    }
    async sendEmailCategorizedWebhook(email, category) {
        const payload = {
            event: 'email.categorized',
            data: {
                emailId: email.id,
                messageId: email.messageId,
                from: email.from,
                subject: email.subject,
                category: category,
                accountId: email.accountId
            },
            timestamp: new Date()
        };
        return await this.sendWebhook(payload);
    }
    async sendNewEmailWebhook(email) {
        const payload = {
            event: 'email.new',
            data: {
                emailId: email.id,
                messageId: email.messageId,
                from: email.from,
                subject: email.subject,
                body: email.body.substring(0, 500),
                date: email.date,
                accountId: email.accountId,
                folder: email.folder
            },
            timestamp: new Date()
        };
        return await this.sendWebhook(payload);
    }
    async sendSystemEventWebhook(event, data) {
        const payload = {
            event: `system.${event}`,
            data: data,
            timestamp: new Date()
        };
        return await this.sendWebhook(payload);
    }
    async sendErrorWebhook(error, context) {
        const payload = {
            event: 'system.error',
            data: {
                error: error,
                context: context,
                timestamp: new Date()
            },
            timestamp: new Date()
        };
        return await this.sendWebhook(payload);
    }
    setWebhookUrl(url) {
        this.webhookUrl = url;
        console.log('Webhook URL updated:', url);
    }
    getWebhookUrl() {
        return this.webhookUrl;
    }
}
exports.WebhookService = WebhookService;
//# sourceMappingURL=WebhookService.js.map