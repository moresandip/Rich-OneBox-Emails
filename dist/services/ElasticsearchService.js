"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElasticsearchService = void 0;
const database_1 = __importDefault(require("../config/database"));
const config_1 = require("../config");
class ElasticsearchService {
    constructor() {
        this.client = null;
        try {
            this.client = database_1.default.getInstance().getElasticsearchClient();
        }
        catch (error) {
            console.warn('Elasticsearch not available, service will be disabled:', error.message);
        }
    }
    async indexEmail(email) {
        if (!this.client) {
            console.log(`Elasticsearch not available, skipping email indexing: ${email.id}`);
            return;
        }
        try {
            await this.client.index({
                index: config_1.config.elasticsearch.index,
                id: email.id,
                body: {
                    id: email.id,
                    accountId: email.accountId,
                    messageId: email.messageId,
                    subject: email.subject,
                    from: email.from,
                    to: email.to,
                    cc: email.cc,
                    bcc: email.bcc,
                    date: email.date,
                    body: email.body,
                    htmlBody: email.htmlBody,
                    folder: email.folder,
                    isRead: email.isRead,
                    isFlagged: email.isFlagged,
                    labels: email.labels,
                    aiCategory: email.aiCategory,
                    createdAt: email.createdAt,
                    updatedAt: email.updatedAt
                }
            });
            console.log(`Indexed email: ${email.id}`);
        }
        catch (error) {
            console.error('Error indexing email:', error);
            throw error;
        }
    }
    async updateEmailCategory(emailId, category) {
        if (!this.client) {
            console.log(`Elasticsearch not available, skipping category update: ${emailId}`);
            return;
        }
        try {
            await this.client.update({
                index: config_1.config.elasticsearch.index,
                id: emailId,
                body: {
                    doc: {
                        aiCategory: category,
                        updatedAt: new Date()
                    }
                }
            });
            console.log(`Updated email category: ${emailId} -> ${category}`);
        }
        catch (error) {
            console.error('Error updating email category:', error);
            throw error;
        }
    }
    async searchEmails(filters, page = 1, limit = 20) {
        if (!this.client) {
            console.log('Elasticsearch not available, returning empty search results');
            return {
                emails: [],
                total: 0,
                page,
                limit
            };
        }
        try {
            const query = {
                bool: {
                    must: []
                }
            };
            if (filters.searchText) {
                query.bool.must.push({
                    multi_match: {
                        query: filters.searchText,
                        fields: ['subject^2', 'body', 'from', 'to']
                    }
                });
            }
            if (filters.accountId) {
                query.bool.must.push({
                    term: { accountId: filters.accountId }
                });
            }
            if (filters.folder) {
                query.bool.must.push({
                    term: { folder: filters.folder }
                });
            }
            if (filters.category) {
                query.bool.must.push({
                    term: { aiCategory: filters.category }
                });
            }
            if (filters.dateFrom || filters.dateTo) {
                const dateRange = {};
                if (filters.dateFrom)
                    dateRange.gte = filters.dateFrom;
                if (filters.dateTo)
                    dateRange.lte = filters.dateTo;
                query.bool.must.push({
                    range: { date: dateRange }
                });
            }
            if (filters.isRead !== undefined) {
                query.bool.must.push({
                    term: { isRead: filters.isRead }
                });
            }
            if (filters.isFlagged !== undefined) {
                query.bool.must.push({
                    term: { isFlagged: filters.isFlagged }
                });
            }
            const response = await this.client.search({
                index: config_1.config.elasticsearch.index,
                body: {
                    query,
                    sort: [
                        { date: { order: 'desc' } }
                    ],
                    from: (page - 1) * limit,
                    size: limit
                }
            });
            const emails = response.hits.hits.map((hit) => hit._source);
            const total = response.hits.total.value;
            return {
                emails,
                total,
                page,
                limit
            };
        }
        catch (error) {
            console.error('Error searching emails:', error);
            throw error;
        }
    }
    async getEmailStats(accountId) {
        if (!this.client) {
            console.log('Elasticsearch not available, returning empty stats');
            return {
                total: 0,
                byCategory: {},
                byFolder: {},
                recentActivity: 0
            };
        }
        try {
            const query = {
                bool: {
                    must: []
                }
            };
            if (accountId) {
                query.bool.must.push({
                    term: { accountId }
                });
            }
            const response = await this.client.search({
                index: config_1.config.elasticsearch.index,
                body: {
                    query,
                    aggs: {
                        byCategory: {
                            terms: { field: 'aiCategory' }
                        },
                        byFolder: {
                            terms: { field: 'folder' }
                        },
                        recentActivity: {
                            filter: {
                                range: {
                                    createdAt: {
                                        gte: 'now-7d'
                                    }
                                }
                            }
                        }
                    },
                    size: 0
                }
            });
            const byCategory = {};
            response.aggregations.byCategory.buckets.forEach((bucket) => {
                byCategory[bucket.key] = bucket.doc_count;
            });
            const byFolder = {};
            response.aggregations.byFolder.buckets.forEach((bucket) => {
                byFolder[bucket.key] = bucket.doc_count;
            });
            return {
                total: response.hits.total.value,
                byCategory,
                byFolder,
                recentActivity: response.aggregations.recentActivity.doc_count
            };
        }
        catch (error) {
            console.error('Error getting email stats:', error);
            throw error;
        }
    }
    async deleteEmail(emailId) {
        if (!this.client) {
            console.log(`Elasticsearch not available, skipping email deletion: ${emailId}`);
            return;
        }
        try {
            await this.client.delete({
                index: config_1.config.elasticsearch.index,
                id: emailId
            });
            console.log(`Deleted email from index: ${emailId}`);
        }
        catch (error) {
            console.error('Error deleting email from index:', error);
            throw error;
        }
    }
    async bulkIndexEmails(emails) {
        if (!this.client) {
            console.log(`Elasticsearch not available, skipping bulk indexing of ${emails.length} emails`);
            return;
        }
        try {
            const body = [];
            for (const email of emails) {
                body.push({
                    index: {
                        _index: config_1.config.elasticsearch.index,
                        _id: email.id
                    }
                });
                body.push({
                    id: email.id,
                    accountId: email.accountId,
                    messageId: email.messageId,
                    subject: email.subject,
                    from: email.from,
                    to: email.to,
                    cc: email.cc,
                    bcc: email.bcc,
                    date: email.date,
                    body: email.body,
                    htmlBody: email.htmlBody,
                    folder: email.folder,
                    isRead: email.isRead,
                    isFlagged: email.isFlagged,
                    labels: email.labels,
                    aiCategory: email.aiCategory,
                    createdAt: email.createdAt,
                    updatedAt: email.updatedAt
                });
            }
            if (body.length > 0) {
                await this.client.bulk({ body });
                console.log(`Bulk indexed ${emails.length} emails`);
            }
        }
        catch (error) {
            console.error('Error bulk indexing emails:', error);
            throw error;
        }
    }
}
exports.ElasticsearchService = ElasticsearchService;
//# sourceMappingURL=ElasticsearchService.js.map