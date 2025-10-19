import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { EventEmitter } from 'events';
import { EmailAccount, EmailMessage, EmailCategory } from '../types';
import { EmailMessageModel } from '../models/EmailMessage';
import { EmailAccountModel } from '../models/EmailAccount';
import { ElasticsearchService } from './ElasticsearchService';
import { GeminiAIService } from './GeminiAIService';
import { SlackService } from './SlackService';
import { WebhookService } from './WebhookService';
import { config } from '../config';

export class IMAPService extends EventEmitter {
  private connections: Map<string, Imap> = new Map();
  private elasticsearchService: ElasticsearchService;
  private aiService: GeminiAIService;
  private slackService: SlackService;
  private webhookService: WebhookService;
  private isRunning: boolean = false;
  private idleWatchdogs: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    this.elasticsearchService = new ElasticsearchService();
    this.aiService = new GeminiAIService();
    this.slackService = new SlackService();
    this.webhookService = new WebhookService();
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('IMAP service is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting IMAP service...');

    try {
      // Get all active email accounts
      const accounts = await EmailAccountModel.find({ isActive: true });
      
      for (const account of accounts) {
        await this.connectAccount(account);
      }

      console.log(`IMAP service started with ${accounts.length} accounts`);
    } catch (error) {
      console.error('Failed to start IMAP service:', error);
      this.isRunning = false;
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping IMAP service...');
    this.isRunning = false;

    // Clear all watchdogs
    for (const [accountId, watchdog] of this.idleWatchdogs) {
      clearTimeout(watchdog);
    }
    this.idleWatchdogs.clear();

    for (const [accountId, connection] of this.connections) {
      try {
        connection.end();
        console.log(`Disconnected account: ${accountId}`);
      } catch (error) {
        console.error(`Error disconnecting account ${accountId}:`, error);
      }
    }

    this.connections.clear();
    console.log('IMAP service stopped');
  }

  private async connectAccount(account: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: account.email,
        password: account.password,
        host: account.imapHost,
        port: account.imapPort,
        tls: account.secure,
        tlsOptions: { rejectUnauthorized: false },
        keepalive: {
          interval: 10000,
          idleInterval: 300000,
          forceNoop: true
        }
      });

      imap.once('ready', async () => {
        console.log(`Connected to ${account.email}`);
        this.connections.set(account._id.toString(), imap);

        try {
          // Initial sync - fetch last 30 days of emails
          await this.syncAccountEmails(account._id.toString(), imap);
          
          // Set up IDLE mode for real-time updates
          this.setupIdleMode(account._id.toString(), imap);
          
          resolve();
        } catch (error) {
          console.error(`Error setting up account ${account.email}:`, error);
          reject(error);
        }
      });

      imap.once('error', (error) => {
        console.error(`IMAP error for ${account.email}:`, error);
        this.connections.delete(account._id.toString());
        reject(error);
      });

      imap.once('end', () => {
        console.log(`IMAP connection ended for ${account.email}`);
        this.connections.delete(account._id.toString());
      });

      imap.connect();
    });
  }

  private async syncAccountEmails(accountId: string, imap: Imap): Promise<void> {
    return new Promise((resolve, reject) => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        // Calculate date 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const searchCriteria = ['SINCE', thirtyDaysAgo];
        
        imap.search(searchCriteria, (err, results) => {
          if (err) {
            reject(err);
            return;
          }

          if (results.length === 0) {
            console.log(`No new emails found for account ${accountId}`);
            resolve();
            return;
          }

          console.log(`Found ${results.length} emails to sync for account ${accountId}`);

          const fetch = imap.fetch(results, { bodies: '', struct: true });
          let processedCount = 0;

          fetch.on('message', async (msg, seqno) => {
            try {
              const emailData = await this.parseEmailMessage(msg);
              await this.processEmail(accountId, emailData);
              processedCount++;
              
              if (processedCount % 10 === 0) {
                console.log(`Processed ${processedCount}/${results.length} emails for account ${accountId}`);
              }
            } catch (error) {
              console.error(`Error processing email ${seqno}:`, error);
            }
          });

          fetch.once('error', (err) => {
            console.error('Fetch error:', err);
            reject(err);
          });

          fetch.once('end', () => {
            console.log(`Completed sync for account ${accountId}: ${processedCount} emails processed`);
            resolve();
          });
        });
      });
    });
  }

  private setupIdleMode(accountId: string, imap: Imap): void {
    const startIdle = () => {
      if (!this.isRunning) return;

      imap.idle((err) => {
        if (err) {
          console.error(`IDLE error for account ${accountId}:`, err);
          setTimeout(() => startIdle(), 5000); // Retry after 5 seconds
          return;
        }

        console.log(`IDLE mode active for account ${accountId}`);
        
        // Set up watchdog to maintain IDLE connection (every 29 minutes)
        this.setupIdleWatchdog(accountId, imap);
      });
    };

    imap.on('mail', async (numNewMsgs) => {
      console.log(`New mail detected for account ${accountId}: ${numNewMsgs} messages`);
      
      try {
        // Fetch new messages
        const searchCriteria = ['UNSEEN'];
        imap.search(searchCriteria, async (err, results) => {
          if (err) {
            console.error('Search error:', err);
            return;
          }

          if (results.length === 0) return;

          const fetch = imap.fetch(results, { bodies: '', struct: true });
          
          fetch.on('message', async (msg, seqno) => {
            try {
              const emailData = await this.parseEmailMessage(msg);
              await this.processEmail(accountId, emailData);
            } catch (error) {
              console.error(`Error processing new email ${seqno}:`, error);
            }
          });
        });
      } catch (error) {
        console.error('Error handling new mail:', error);
      }
    });

    imap.on('expunge', (seqno) => {
      console.log(`Message ${seqno} expunged for account ${accountId}`);
    });

    imap.on('error', (err) => {
      console.error(`IMAP connection error for account ${accountId}:`, err);
      this.clearIdleWatchdog(accountId);
      // Attempt to reconnect
      setTimeout(() => {
        if (this.isRunning) {
          this.reconnectAccount(accountId);
        }
      }, 10000);
    });

    imap.on('end', () => {
      console.log(`IMAP connection ended for account ${accountId}`);
      this.clearIdleWatchdog(accountId);
      this.connections.delete(accountId);
    });

    startIdle();
  }

  private setupIdleWatchdog(accountId: string, imap: Imap): void {
    // Clear existing watchdog if any
    this.clearIdleWatchdog(accountId);
    
    // Set up new watchdog (29 minutes to avoid 30-minute timeout)
    const watchdog = setTimeout(() => {
      if (this.isRunning && this.connections.has(accountId)) {
        console.log(`IDLE watchdog triggered for account ${accountId}, refreshing connection`);
        this.refreshIdleConnection(accountId, imap);
      }
    }, 29 * 60 * 1000); // 29 minutes

    this.idleWatchdogs.set(accountId, watchdog);
  }

  private clearIdleWatchdog(accountId: string): void {
    const watchdog = this.idleWatchdogs.get(accountId);
    if (watchdog) {
      clearTimeout(watchdog);
      this.idleWatchdogs.delete(accountId);
    }
  }

  private refreshIdleConnection(accountId: string, imap: Imap): void {
    try {
      // Send DONE to exit IDLE mode
      imap.end();
      
      // Wait a moment then restart the connection
      setTimeout(() => {
        if (this.isRunning) {
          this.reconnectAccount(accountId);
        }
      }, 2000);
    } catch (error) {
      console.error(`Error refreshing IDLE connection for account ${accountId}:`, error);
    }
  }

  private async reconnectAccount(accountId: string): Promise<void> {
    try {
      const account = await EmailAccountModel.findById(accountId);
      if (account && this.isRunning) {
        console.log(`Reconnecting account: ${account.email}`);
        await this.connectAccount(account);
      }
    } catch (error) {
      console.error(`Error reconnecting account ${accountId}:`, error);
    }
  }

  private async parseEmailMessage(msg: any): Promise<Partial<EmailMessage>> {
    return new Promise((resolve, reject) => {
      let buffer = '';

      msg.on('body', (stream, info) => {
        stream.on('data', (chunk) => {
          buffer += chunk.toString('utf8');
        });

        stream.once('end', async () => {
          try {
            const parsed = await simpleParser(buffer);
            
            const emailData: Partial<EmailMessage> = {
              messageId: parsed.messageId || '',
              subject: parsed.subject || '',
              from: parsed.from?.text || '',
              to: parsed.to?.text ? [parsed.to.text] : [],
              cc: parsed.cc?.text ? [parsed.cc.text] : undefined,
              bcc: parsed.bcc?.text ? [parsed.bcc.text] : undefined,
              date: parsed.date || new Date(),
              body: parsed.text || '',
              htmlBody: parsed.html || undefined,
              folder: 'INBOX'
            };

            resolve(emailData);
          } catch (error) {
            reject(error);
          }
        });
      });

      msg.once('error', (err) => {
        reject(err);
      });
    });
  }

  private async processEmail(accountId: string, emailData: Partial<EmailMessage>): Promise<void> {
    try {
      // Check if email already exists
      const existingEmail = await EmailMessageModel.findOne({
        messageId: emailData.messageId
      });

      if (existingEmail) {
        console.log(`Email ${emailData.messageId} already exists, skipping...`);
        return;
      }

      // Create email document
      const email = new EmailMessageModel({
        ...emailData,
        accountId,
        isRead: false,
        isFlagged: false,
        labels: [],
        aiCategory: EmailCategory.UNCATEGORIZED
      });

      await email.save();

      // Index in Elasticsearch
      await this.elasticsearchService.indexEmail(email.toObject());

      // AI categorization
      const aiSuggestion = await this.aiService.categorizeEmail(email.toObject());
      
      if (aiSuggestion) {
        email.aiCategory = aiSuggestion.category;
        await email.save();

        // Update Elasticsearch
        await this.elasticsearchService.updateEmailCategory(email.id, aiSuggestion.category);

        // Send notifications for interested emails
        if (aiSuggestion.category === EmailCategory.INTERESTED) {
          await this.slackService.sendNotification({
            channel: config.slack.channelId,
            text: `🎯 New interested email from ${email.from}: ${email.subject}`,
            attachments: [{
              color: 'good',
              fields: [
                { title: 'From', value: email.from, short: true },
                { title: 'Subject', value: email.subject, short: true },
                { title: 'AI Category', value: aiSuggestion.category, short: true },
                { title: 'Confidence', value: `${(aiSuggestion.confidence * 100).toFixed(1)}%`, short: true }
              ]
            }]
          });

          await this.webhookService.sendWebhook({
            event: 'email.interested',
            data: {
              emailId: email.id,
              from: email.from,
              subject: email.subject,
              category: aiSuggestion.category,
              confidence: aiSuggestion.confidence
            },
            timestamp: new Date()
          });
        }
      }

      console.log(`Processed email: ${email.subject} from ${email.from}`);
    } catch (error) {
      console.error('Error processing email:', error);
    }
  }

  public async addAccount(accountData: Partial<EmailAccount>): Promise<void> {
    try {
      const account = new EmailAccountModel(accountData);
      await account.save();

      if (this.isRunning) {
        await this.connectAccount(account);
      }

      console.log(`Added new email account: ${account.email}`);
    } catch (error) {
      console.error('Error adding email account:', error);
      throw error;
    }
  }

  public async removeAccount(accountId: string): Promise<void> {
    try {
      const connection = this.connections.get(accountId);
      if (connection) {
        connection.end();
        this.connections.delete(accountId);
      }

      await EmailAccountModel.findByIdAndUpdate(accountId, { isActive: false });
      console.log(`Removed email account: ${accountId}`);
    } catch (error) {
      console.error('Error removing email account:', error);
      throw error;
    }
  }

  public getConnectionStatus(): Array<{ accountId: string; isConnected: boolean }> {
    const status = [];
    for (const [accountId, connection] of this.connections) {
      status.push({
        accountId,
        isConnected: connection.state === 'authenticated'
      });
    }
    return status;
  }
}
