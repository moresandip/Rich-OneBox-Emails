"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountController = void 0;
const EmailAccount_1 = require("../models/EmailAccount");
const IMAPService_1 = require("../services/IMAPService");
const SlackService_1 = require("../services/SlackService");
const WebhookService_1 = require("../services/WebhookService");
const joi_1 = __importDefault(require("joi"));
const accountSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required(),
    imapHost: joi_1.default.string().required(),
    imapPort: joi_1.default.number().port().required(),
    secure: joi_1.default.boolean().default(true)
});
class AccountController {
    constructor() {
        this.imapService = new IMAPService_1.IMAPService();
        this.slackService = new SlackService_1.SlackService();
        this.webhookService = new WebhookService_1.WebhookService();
    }
    async getAccounts(req, res) {
        try {
            const accounts = await EmailAccount_1.EmailAccountModel.find({ isActive: true });
            res.json({
                success: true,
                data: accounts
            });
        }
        catch (error) {
            console.error('Error getting accounts:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch accounts'
            });
        }
    }
    async getAccountById(req, res) {
        try {
            const { id } = req.params;
            const account = await EmailAccount_1.EmailAccountModel.findById(id);
            if (!account) {
                res.status(404).json({
                    success: false,
                    error: 'Account not found'
                });
                return;
            }
            res.json({
                success: true,
                data: account
            });
        }
        catch (error) {
            console.error('Error getting account by ID:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch account'
            });
        }
    }
    async createAccount(req, res) {
        try {
            const { error, value } = accountSchema.validate(req.body);
            if (error) {
                res.status(400).json({
                    success: false,
                    error: error.details[0].message
                });
                return;
            }
            const existingAccount = await EmailAccount_1.EmailAccountModel.findOne({ email: value.email });
            if (existingAccount) {
                res.status(409).json({
                    success: false,
                    error: 'Account with this email already exists'
                });
                return;
            }
            const account = new EmailAccount_1.EmailAccountModel(value);
            await account.save();
            await this.imapService.addAccount(account.toObject());
            await this.slackService.sendNotification({
                channel: process.env.SLACK_CHANNEL_ID || '',
                text: `✅ New email account added: ${account.email}`
            });
            await this.webhookService.sendSystemEventWebhook('account.added', {
                accountId: account.id,
                email: account.email,
                imapHost: account.imapHost
            });
            res.status(201).json({
                success: true,
                data: account
            });
        }
        catch (error) {
            console.error('Error creating account:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create account'
            });
        }
    }
    async updateAccount(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const account = await EmailAccount_1.EmailAccountModel.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true });
            if (!account) {
                res.status(404).json({
                    success: false,
                    error: 'Account not found'
                });
                return;
            }
            res.json({
                success: true,
                data: account
            });
        }
        catch (error) {
            console.error('Error updating account:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update account'
            });
        }
    }
    async deleteAccount(req, res) {
        try {
            const { id } = req.params;
            const account = await EmailAccount_1.EmailAccountModel.findById(id);
            if (!account) {
                res.status(404).json({
                    success: false,
                    error: 'Account not found'
                });
                return;
            }
            await this.imapService.removeAccount(id);
            await EmailAccount_1.EmailAccountModel.findByIdAndUpdate(id, { isActive: false });
            await this.slackService.sendNotification({
                channel: process.env.SLACK_CHANNEL_ID || '',
                text: `❌ Email account removed: ${account.email}`
            });
            await this.webhookService.sendSystemEventWebhook('account.removed', {
                accountId: account.id,
                email: account.email
            });
            res.json({
                success: true,
                message: 'Account deleted successfully'
            });
        }
        catch (error) {
            console.error('Error deleting account:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete account'
            });
        }
    }
    async testConnection(req, res) {
        try {
            const { id } = req.params;
            const account = await EmailAccount_1.EmailAccountModel.findById(id);
            if (!account) {
                res.status(404).json({
                    success: false,
                    error: 'Account not found'
                });
                return;
            }
            const connectionStatus = this.imapService.getConnectionStatus();
            const accountStatus = connectionStatus.find(status => status.accountId === id);
            res.json({
                success: true,
                data: {
                    accountId: id,
                    isConnected: accountStatus?.isConnected || false,
                    lastChecked: new Date()
                }
            });
        }
        catch (error) {
            console.error('Error testing connection:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to test connection'
            });
        }
    }
    async getConnectionStatus(req, res) {
        try {
            const connectionStatus = this.imapService.getConnectionStatus();
            res.json({
                success: true,
                data: connectionStatus
            });
        }
        catch (error) {
            console.error('Error getting connection status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get connection status'
            });
        }
    }
    async syncAccount(req, res) {
        try {
            const { id } = req.params;
            const account = await EmailAccount_1.EmailAccountModel.findById(id);
            if (!account) {
                res.status(404).json({
                    success: false,
                    error: 'Account not found'
                });
                return;
            }
            await this.imapService.addAccount(account.toObject());
            res.json({
                success: true,
                message: 'Account sync initiated'
            });
        }
        catch (error) {
            console.error('Error syncing account:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to sync account'
            });
        }
    }
}
exports.AccountController = AccountController;
//# sourceMappingURL=AccountController.js.map