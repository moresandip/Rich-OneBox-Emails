import { WebClient } from '@slack/web-api';
import { SlackNotification } from '../types';
import { config } from '../config';

export class SlackService {
  private client: WebClient;

  constructor() {
    this.client = new WebClient(config.slack.botToken);
  }

  public async sendNotification(notification: SlackNotification): Promise<boolean> {
    try {
      if (!config.slack.botToken || !config.slack.channelId) {
        console.log('⚙️ Slack not configured, skipping notification');
        return false;
      }

      const result = await this.client.chat.postMessage({
        channel: notification.channel,
        text: notification.text,
        attachments: notification.attachments,
        unfurl_links: false,
        unfurl_media: false,
      });

      if (result.ok) {
        console.log('✅ Slack notification sent successfully');
        return true;
      } else {
        console.error('❌ Failed to send Slack notification:', result.error);
        return false;
      }
    } catch (error) {
      console.error('⚠️ Error sending Slack notification:', error);
      return false;
    }
  }

  public async sendInterestedEmailAlert(email: any, aiSuggestion: any): Promise<boolean> {
    const notification: SlackNotification = {
      channel: config.slack.channelId,
      text: `🎯 *New Interested Email Detected!*`,
      attachments: [
        {
          color: 'good',
          title: email.subject,
          title_link: '#',
          fields: [
            { title: 'From', value: email.from, short: true },
            { title: 'Account', value: email.accountId, short: true },
            { title: 'AI Category', value: aiSuggestion.category, short: true },
            { title: 'Confidence', value: `${(aiSuggestion.confidence * 100).toFixed(1)}%`, short: true },
            { title: 'Date', value: new Date(email.date).toLocaleString(), short: true },
            { title: 'Folder', value: email.folder, short: true },
          ],
          footer: 'Rich OneBox Emails',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    return await this.sendNotification(notification);
  } // ✅ FIXED: properly closed method

  public async sendErrorAlert(error: string, context?: any): Promise<boolean> {
    const notification: SlackNotification = {
      channel: config.slack.channelId,
      text: `⚠️ *System Error Alert*`,
      attachments: [
        {
          color: 'danger',
          title: 'Error Details',
          text: error,
          fields: context
            ? [
                {
                  title: 'Context',
                  value: JSON.stringify(context, null, 2),
                  short: false,
                },
              ]
            : [],
          footer: 'Rich OneBox Emails',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    return await this.sendNotification(notification);
  }

  public async sendSystemStatus(status: {
    totalAccounts: number;
    activeConnections: number;
    emailsProcessed: number;
    errors: number;
  }): Promise<boolean> {
    const notification: SlackNotification = {
      channel: config.slack.channelId,
      text: `📊 *System Status Report*`,
      attachments: [
        {
          color: status.errors > 0 ? 'warning' : 'good',
          title: 'Current Status',
          fields: [
            { title: 'Total Accounts', value: status.totalAccounts.toString(), short: true },
            { title: 'Active Connections', value: status.activeConnections.toString(), short: true },
            { title: 'Emails Processed', value: status.emailsProcessed.toString(), short: true },
            { title: 'Errors', value: status.errors.toString(), short: true },
          ],
          footer: 'Rich OneBox Emails',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    return await this.sendNotification(notification);
  }
}
