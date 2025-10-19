"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailController = void 0;
const EmailMessage_1 = require("../models/EmailMessage");
const ElasticsearchService_1 = require("../services/ElasticsearchService");
const GeminiAIService_1 = require("../services/GeminiAIService");
class EmailController {
    constructor() {
        this.elasticsearchService = new ElasticsearchService_1.ElasticsearchService();
        this.aiService = new GeminiAIService_1.GeminiAIService();
    }
    async getEmails(req, res) {
        try {
            const { accountId, folder, category, dateFrom, dateTo, isRead, isFlagged, searchText, page = 1, limit = 20 } = req.query;
            const filters = {
                accountId: accountId,
                folder: folder,
                category: category,
                dateFrom: dateFrom ? new Date(dateFrom) : undefined,
                dateTo: dateTo ? new Date(dateTo) : undefined,
                isRead: isRead ? isRead === 'true' : undefined,
                isFlagged: isFlagged ? isFlagged === 'true' : undefined,
                searchText: searchText
            };
            const result = await this.elasticsearchService.searchEmails(filters, parseInt(page), parseInt(limit));
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('Error getting emails:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch emails'
            });
        }
    }
    async getEmailById(req, res) {
        try {
            const { id } = req.params;
            const email = await EmailMessage_1.EmailMessageModel.findById(id);
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
        }
        catch (error) {
            console.error('Error getting email by ID:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch email'
            });
        }
    }
    async updateEmail(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const email = await EmailMessage_1.EmailMessageModel.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true });
            if (!email) {
                res.status(404).json({
                    success: false,
                    error: 'Email not found'
                });
                return;
            }
            const emailObj = email.toObject();
            await this.elasticsearchService.indexEmail({ ...emailObj, id: emailObj._id.toString() });
            res.json({
                success: true,
                data: email
            });
        }
        catch (error) {
            console.error('Error updating email:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update email'
            });
        }
    }
    async deleteEmail(req, res) {
        try {
            const { id } = req.params;
            const email = await EmailMessage_1.EmailMessageModel.findByIdAndDelete(id);
            if (!email) {
                res.status(404).json({
                    success: false,
                    error: 'Email not found'
                });
                return;
            }
            await this.elasticsearchService.deleteEmail(id);
            res.json({
                success: true,
                message: 'Email deleted successfully'
            });
        }
        catch (error) {
            console.error('Error deleting email:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete email'
            });
        }
    }
    async categorizeEmail(req, res) {
        try {
            const { id } = req.params;
            const email = await EmailMessage_1.EmailMessageModel.findById(id);
            if (!email) {
                res.status(404).json({
                    success: false,
                    error: 'Email not found'
                });
                return;
            }
            const emailObj = email.toObject();
            const aiSuggestion = await this.aiService.categorizeEmail({ ...emailObj, id: emailObj._id.toString() });
            if (aiSuggestion) {
                email.aiCategory = aiSuggestion.category;
                await email.save();
                await this.elasticsearchService.updateEmailCategory(email.id, aiSuggestion.category);
                res.json({
                    success: true,
                    data: {
                        email: email,
                        aiSuggestion: aiSuggestion
                    }
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to categorize email'
                });
            }
        }
        catch (error) {
            console.error('Error categorizing email:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to categorize email'
            });
        }
    }
    async generateSuggestedReply(req, res) {
        try {
            const { id } = req.params;
            const email = await EmailMessage_1.EmailMessageModel.findById(id);
            if (!email) {
                res.status(404).json({
                    success: false,
                    error: 'Email not found'
                });
                return;
            }
            const emailObj = email.toObject();
            const suggestedReply = await this.aiService.generateSuggestedReply({ ...emailObj, id: emailObj._id.toString() });
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
            }
            else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to generate suggested reply'
                });
            }
        }
        catch (error) {
            console.error('Error generating suggested reply:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate suggested reply'
            });
        }
    }
    async getEmailStats(req, res) {
        try {
            const { accountId } = req.query;
            const stats = await this.elasticsearchService.getEmailStats(accountId);
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            console.error('Error getting email stats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch email stats'
            });
        }
    }
    async searchEmails(req, res) {
        try {
            const { q, accountId, folder, category, page = 1, limit = 20 } = req.query;
            const filters = {
                searchText: q,
                accountId: accountId,
                folder: folder,
                category: category
            };
            const result = await this.elasticsearchService.searchEmails(filters, parseInt(page), parseInt(limit));
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('Error searching emails:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to search emails'
            });
        }
    }
}
exports.EmailController = EmailController;
//# sourceMappingURL=EmailController.js.map