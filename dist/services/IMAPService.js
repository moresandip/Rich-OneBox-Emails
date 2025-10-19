"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IMAPService = void 0;
const imap_1 = __importDefault(require("imap"));
const mailparser_1 = require("mailparser");
const events_1 = require("events");
const types_1 = require("../types");
const EmailMessage_1 = require("../models/EmailMessage");
const EmailAccount_1 = require("../models/EmailAccount");
const ElasticsearchService_1 = require("./ElasticsearchService");
const GeminiAIService_1 = require("./GeminiAIService");
const SlackService_1 = require("./SlackService");
const WebhookService_1 = require("./WebhookService");
const config_1 = require("../config");
class IMAPService extends events_1.EventEmitter {
    constructor() {
        super();
        this.connections = new Map();
        this.isRunning = false;
        this.idleWatchdogs = new Map();
        this.elasticsearchService = new ElasticsearchService_1.ElasticsearchService();
        this.aiService = new GeminiAIService_1.GeminiAIService();
        this.slackService = new SlackService_1.SlackService();
        this.webhookService = new WebhookService_1.WebhookService();
    }
    async start() {
        if (this.isRunning) {
            console.log('IMAP service is already running');
            return;
        }
        this.isRunning = true;
        console.log('Starting IMAP service...');
        try {
            const accounts = await EmailAccount_1.EmailAccountModel.find({ isActive: true });
            for (const account of accounts) {
                await this.connectAccount(account);
            }
            console.log(`IMAP service started with ${accounts.length} accounts`);
        }
        catch (error) {
            console.error('Failed to start IMAP service:', error);
            this.isRunning = false;
            throw error;
        }
    }
    async stop() {
        if (!this.isRunning) {
            return;
        }
        console.log('Stopping IMAP service...');
        this.isRunning = false;
        for (const [accountId, watchdog] of this.idleWatchdogs) {
            clearTimeout(watchdog);
        }
        this.idleWatchdogs.clear();
        for (const [accountId, connection] of this.connections) {
            try {
                connection.end();
                console.log(`Disconnected account: ${accountId}`);
            }
            catch (error) {
                console.error(`Error disconnecting account ${accountId}:`, error);
            }
        }
        this.connections.clear();
        console.log('IMAP service stopped');
    }
    async connectAccount(account) {
        return new Promise((resolve, reject) => {
            const imap = new imap_1.default({
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
                    await this.syncAccountEmails(account._id.toString(), imap);
                    this.setupIdleMode(account._id.toString(), imap);
                    resolve();
                }
                catch (error) {
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
    async syncAccountEmails(accountId, imap) {
        return new Promise((resolve, reject) => {
            imap.openBox('INBOX', true, (err, box) => {
                if (err) {
                    reject(err);
                    return;
                }
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
                        }
                        catch (error) {
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
    setupIdleMode(accountId, imap) {
        const startIdle = () => {
            if (!this.isRunning)
                return;
            console.log(`Setting up real-time monitoring for account ${accountId}`);
            const checkInterval = setInterval(() => {
                if (!this.isRunning) {
                    clearInterval(checkInterval);
                    return;
                }
                this.checkForNewEmails(accountId, imap);
            }, 30000);
            imap.checkInterval = checkInterval;
        };
        imap.on('mail', async (numNewMsgs) => {
            console.log(`New mail detected for account ${accountId}: ${numNewMsgs} messages`);
            try {
                const searchCriteria = ['UNSEEN'];
                imap.search(searchCriteria, async (err, results) => {
                    if (err) {
                        console.error('Search error:', err);
                        return;
                    }
                    if (results.length === 0)
                        return;
                    const fetch = imap.fetch(results, { bodies: '', struct: true });
                    fetch.on('message', async (msg, seqno) => {
                        try {
                            const emailData = await this.parseEmailMessage(msg);
                            await this.processEmail(accountId, emailData);
                        }
                        catch (error) {
                            console.error(`Error processing new email ${seqno}:`, error);
                        }
                    });
                });
            }
            catch (error) {
                console.error('Error handling new mail:', error);
            }
        });
        imap.on('expunge', (seqno) => {
            console.log(`Message ${seqno} expunged for account ${accountId}`);
        });
        imap.on('error', (err) => {
            console.error(`IMAP connection error for account ${accountId}:`, err);
            if (imap.checkInterval) {
                clearInterval(imap.checkInterval);
            }
            setTimeout(() => {
                if (this.isRunning) {
                    this.reconnectAccount(accountId);
                }
            }, 10000);
        });
        imap.on('end', () => {
            console.log(`IMAP connection ended for account ${accountId}`);
            if (imap.checkInterval) {
                clearInterval(imap.checkInterval);
            }
            this.connections.delete(accountId);
        });
        startIdle();
    }
    async checkForNewEmails(accountId, imap) {
        try {
            console.log(`Checking for new emails for account ${accountId}`);
        }
        catch (error) {
            console.error(`Error checking for new emails for account ${accountId}:`, error);
        }
    }
    async reconnectAccount(accountId) {
        try {
            const account = await EmailAccount_1.EmailAccountModel.findById(accountId);
            if (account && this.isRunning) {
                console.log(`Reconnecting account: ${account.email}`);
                await this.connectAccount(account);
            }
        }
        catch (error) {
            console.error(`Error reconnecting account ${accountId}:`, error);
        }
    }
    async parseEmailMessage(msg) {
        return new Promise((resolve, reject) => {
            let buffer = '';
            msg.on('body', (stream, info) => {
                stream.on('data', (chunk) => {
                    buffer += chunk.toString('utf8');
                });
                stream.once('end', async () => {
                    try {
                        const parsed = await (0, mailparser_1.simpleParser)(buffer);
                        const emailData = {
                            messageId: parsed.messageId || '',
                            subject: parsed.subject || '',
                            from: parsed.from?.text || parsed.from?.address || '',
                            to: Array.isArray(parsed.to) ? parsed.to.map((addr) => addr.text || addr.address || '').filter(Boolean) : [parsed.to?.text || parsed.to?.address || ''],
                            cc: Array.isArray(parsed.cc) ? parsed.cc.map((addr) => addr.text || addr.address || '').filter(Boolean) : parsed.cc?.text ? [parsed.cc.text] : undefined,
                            bcc: Array.isArray(parsed.bcc) ? parsed.bcc.map((addr) => addr.text || addr.address || '').filter(Boolean) : parsed.bcc?.text ? [parsed.bcc.text] : undefined,
                            date: parsed.date || new Date(),
                            body: parsed.text || '',
                            htmlBody: parsed.html || undefined,
                            folder: 'INBOX'
                        };
                        resolve(emailData);
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            });
            msg.once('error', (err) => {
                reject(err);
            });
        });
    }
    async processEmail(accountId, emailData) {
        try {
            const existingEmail = await EmailMessage_1.EmailMessageModel.findOne({
                messageId: emailData.messageId
            });
            if (existingEmail) {
                console.log(`Email ${emailData.messageId} already exists, skipping...`);
                return;
            }
            const email = new EmailMessage_1.EmailMessageModel({
                ...emailData,
                accountId,
                isRead: false,
                isFlagged: false,
                labels: [],
                aiCategory: types_1.EmailCategory.UNCATEGORIZED
            });
            await email.save();
            const emailObj = email.toObject();
            const emailWithId = { ...emailObj, id: emailObj._id.toString() };
            await this.elasticsearchService.indexEmail(emailWithId);
            const aiSuggestion = await this.aiService.categorizeEmail(emailWithId);
            if (aiSuggestion) {
                email.aiCategory = aiSuggestion.category;
                await email.save();
                await this.elasticsearchService.updateEmailCategory(emailObj._id.toString(), aiSuggestion.category);
                if (aiSuggestion.category === types_1.EmailCategory.INTERESTED) {
                    await this.slackService.sendNotification({
                        channel: config_1.config.slack.channelId,
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
                            emailId: emailObj._id.toString(),
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
        }
        catch (error) {
            console.error('Error processing email:', error);
        }
    }
    async addAccount(accountData) {
        try {
            const account = new EmailAccount_1.EmailAccountModel(accountData);
            await account.save();
            if (this.isRunning) {
                await this.connectAccount(account);
            }
            console.log(`Added new email account: ${account.email}`);
        }
        catch (error) {
            console.error('Error adding email account:', error);
            throw error;
        }
    }
    async removeAccount(accountId) {
        try {
            const connection = this.connections.get(accountId);
            if (connection) {
                connection.end();
                this.connections.delete(accountId);
            }
            await EmailAccount_1.EmailAccountModel.findByIdAndUpdate(accountId, { isActive: false });
            console.log(`Removed email account: ${accountId}`);
        }
        catch (error) {
            console.error('Error removing email account:', error);
            throw error;
        }
    }
    getConnectionStatus() {
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
exports.IMAPService = IMAPService;
//# sourceMappingURL=IMAPService.js.map