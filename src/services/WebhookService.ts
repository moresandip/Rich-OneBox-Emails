import axios from 'axios';
import { WebhookPayload } from '../types';
import { config } from '../config';

export class WebhookService {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = config.webhook.url;
  }

  public async sendWebhook(payload: WebhookPayload): Promise<boolean> {
    try {
      if (!this.webhookUrl) {
        console.log('Webhook URL not configured, skipping webhook');
        return false;
      }

      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Rich-OneBox-Emails/1.0'
        },
        timeout: 10000 // 10 second timeout
      });

      if (response.status >= 200 && response.status < 300) {
        console.log('Webhook sent successfully');
        return true;
      } else {
        console.error('Webhook failed with status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error sending webhook:', error);
      return false;
    }
  }

  public async sendInterestedEmailWebhook(email: any, aiSuggestion: any): Promise<boolean> {
    const payload: WebhookPayload = {
      event: 'email.interested',
      data: {
        emailId: email.id,
        messageId: email.messageId,
        from: email.from,
        subject: email.subject,
        body: email.body.substring(0, 500), // Truncate for webhook
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

  public async sendEmailCategorizedWebhook(email: any, category: string): Promise<boolean> {
    const payload: WebhookPayload = {
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

  public async sendNewEmailWebhook(email: any): Promise<boolean> {
    const payload: WebhookPayload = {
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

  public async sendSystemEventWebhook(event: string, data: any): Promise<boolean> {
    const payload: WebhookPayload = {
      event: `system.${event}`,
      data: data,
      timestamp: new Date()
    };

    return await this.sendWebhook(payload);
  }

  public async sendErrorWebhook(error: string, context?: any): Promise<boolean> {
    const payload: WebhookPayload = {
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

  public setWebhookUrl(url: string): void {
    this.webhookUrl = url;
    console.log('Webhook URL updated:', url);
  }

  public getWebhookUrl(): string {
    return this.webhookUrl;
  }
}
