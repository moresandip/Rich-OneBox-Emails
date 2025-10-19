import { Request, Response } from 'express';
import { EmailMessageModel } from '../models/EmailMessage';
import { EmailAccountModel } from '../models/EmailAccount';
import { ElasticsearchService } from '../services/ElasticsearchService';
import { GeminiAIService } from '../services/GeminiAIService';
import { SearchFilters, EmailCategory, EmailMessage } from '../types';

export class EmailController {
  private elasticsearchService: ElasticsearchService;
  private aiService: GeminiAIService;

  constructor() {
    this.elasticsearchService = new ElasticsearchService();
    this.aiService = new GeminiAIService();
  }

  public async getEmails(req: Request, res: Response): Promise<void> {
    try {
      const {
        accountId,
        folder,
        category,
        dateFrom,
        dateTo,
        isRead,
        isFlagged,
        searchText,
        page = 1,
        limit = 20
      } = req.query;

      const filters: SearchFilters = {
        accountId: accountId as string,
        folder: folder as string,
        category: category as EmailCategory,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        isRead: isRead ? isRead === 'true' : undefined,
        isFlagged: isFlagged ? isFlagged === 'true' : undefined,
        searchText: searchText as string
      };

      const result = await this.elasticsearchService.searchEmails(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting emails:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch emails'
      });
    }
  }

  public async getEmailById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const email = await EmailMessageModel.findById(id);

      if (!email) {
        res.status(404).json({
          success: false,
          error: 'Email not found'
        });
        return;
      }

      res.json({
        success: true,
        data: email
      });
    } catch (error) {
      console.error('Error getting email by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch email'
      });
    }
  }

  public async updateEmail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const email = await EmailMessageModel.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      );

      if (!email) {
        res.status(404).json({
          success: false,
          error: 'Email not found'
        });
        return;
      }

      // Update Elasticsearch
      const emailObj = email.toObject();
      await this.elasticsearchService.indexEmail({ ...emailObj, id: (emailObj._id as any).toString() } as EmailMessage);

      res.json({
        success: true,
        data: email
      });
    } catch (error) {
      console.error('Error updating email:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update email'
      });
    }
  }

  public async deleteEmail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const email = await EmailMessageModel.findByIdAndDelete(id);
      if (!email) {
        res.status(404).json({
          success: false,
          error: 'Email not found'
        });
        return;
      }

      // Remove from Elasticsearch
      await this.elasticsearchService.deleteEmail(id);

      res.json({
        success: true,
        message: 'Email deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting email:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete email'
      });
    }
  }

  public async categorizeEmail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const email = await EmailMessageModel.findById(id);

      if (!email) {
        res.status(404).json({
          success: false,
          error: 'Email not found'
        });
        return;
      }

      const emailObj = email.toObject();
      const aiSuggestion = await this.aiService.categorizeEmail({ ...emailObj, id: (emailObj._id as any).toString() } as EmailMessage);
      
      if (aiSuggestion) {
        email.aiCategory = aiSuggestion.category;
        await email.save();

        // Update Elasticsearch
        await this.elasticsearchService.updateEmailCategory(email.id, aiSuggestion.category);

        res.json({
          success: true,
          data: {
            email: email,
            aiSuggestion: aiSuggestion
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to categorize email'
        });
      }
    } catch (error) {
      console.error('Error categorizing email:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to categorize email'
      });
    }
  }

  public async generateSuggestedReply(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const email = await EmailMessageModel.findById(id);

      if (!email) {
        res.status(404).json({
          success: false,
          error: 'Email not found'
        });
        return;
      }

      const emailObj = email.toObject();
      const suggestedReply = await this.aiService.generateSuggestedReply({ ...emailObj, id: (emailObj._id as any).toString() } as EmailMessage);

      if (suggestedReply) {
        res.json({
          success: true,
          data: {
            suggestedReply: suggestedReply,
            originalEmail: {
              id: email.id,
              from: email.from,
              subject: email.subject,
              body: email.body
            }
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to generate suggested reply'
        });
      }
    } catch (error) {
      console.error('Error generating suggested reply:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate suggested reply'
      });
    }
  }

  public async getEmailStats(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.query;
      const stats = await this.elasticsearchService.getEmailStats(accountId as string);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting email stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch email stats'
      });
    }
  }

  public async searchEmails(req: Request, res: Response): Promise<void> {
    try {
      const { q, accountId, folder, category, page = 1, limit = 20 } = req.query;

      const filters: SearchFilters = {
        searchText: q as string,
        accountId: accountId as string,
        folder: folder as string,
        category: category as EmailCategory
      };

      const result = await this.elasticsearchService.searchEmails(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error searching emails:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search emails'
      });
    }
  }
}
