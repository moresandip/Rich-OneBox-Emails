import { Request, Response } from 'express';
import { EmailAccountModel } from '../models/EmailAccount';
import { IMAPService } from '../services/IMAPService';
import { SlackService } from '../services/SlackService';
import { WebhookService } from '../services/WebhookService';
import Joi from 'joi';

const accountSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  imapHost: Joi.string().required(),
  imapPort: Joi.number().port().required(),
  secure: Joi.boolean().default(true)
});

export class AccountController {
  private imapService: IMAPService;
  private slackService: SlackService;
  private webhookService: WebhookService;

  constructor() {
    this.imapService = new IMAPService();
    this.slackService = new SlackService();
    this.webhookService = new WebhookService();
  }

  public async getAccounts(req: Request, res: Response): Promise<void> {
    try {
      const accounts = await EmailAccountModel.find({ isActive: true });
      
      res.json({
        success: true,
        data: accounts
      });
    } catch (error) {
      console.error('Error getting accounts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch accounts'
      });
    }
  }

  public async getAccountById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const account = await EmailAccountModel.findById(id);

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
    } catch (error) {
      console.error('Error getting account by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch account'
      });
    }
  }

  public async createAccount(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = accountSchema.validate(req.body);
      
      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message
        });
        return;
      }

      // Check if account already exists
      const existingAccount = await EmailAccountModel.findOne({ email: value.email });
      if (existingAccount) {
        res.status(409).json({
          success: false,
          error: 'Account with this email already exists'
        });
        return;
      }

      const account = new EmailAccountModel(value);
      await account.save();

      // Add to IMAP service
      await this.imapService.addAccount(account.toObject());

      // Send notifications
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
    } catch (error) {
      console.error('Error creating account:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create account'
      });
    }
  }

  public async updateAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const account = await EmailAccountModel.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      );

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
    } catch (error) {
      console.error('Error updating account:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update account'
      });
    }
  }

  public async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const account = await EmailAccountModel.findById(id);
      if (!account) {
        res.status(404).json({
          success: false,
          error: 'Account not found'
        });
        return;
      }

      // Remove from IMAP service
      await this.imapService.removeAccount(id);

      // Soft delete
      await EmailAccountModel.findByIdAndUpdate(id, { isActive: false });

      // Send notifications
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
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete account'
      });
    }
  }

  public async testConnection(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const account = await EmailAccountModel.findById(id);

      if (!account) {
        res.status(404).json({
          success: false,
          error: 'Account not found'
        });
        return;
      }

      // Test IMAP connection
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
    } catch (error) {
      console.error('Error testing connection:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test connection'
      });
    }
  }

  public async getConnectionStatus(req: Request, res: Response): Promise<void> {
    try {
      const connectionStatus = this.imapService.getConnectionStatus();
      
      res.json({
        success: true,
        data: connectionStatus
      });
    } catch (error) {
      console.error('Error getting connection status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get connection status'
      });
    }
  }

  public async syncAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const account = await EmailAccountModel.findById(id);

      if (!account) {
        res.status(404).json({
          success: false,
          error: 'Account not found'
        });
        return;
      }

      // Trigger manual sync
      await this.imapService.addAccount(account.toObject());

      res.json({
        success: true,
        message: 'Account sync initiated'
      });
    } catch (error) {
      console.error('Error syncing account:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sync account'
      });
    }
  }
}
