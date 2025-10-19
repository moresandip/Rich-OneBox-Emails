import { Client } from '@elastic/elasticsearch';
import { EmailMessage, SearchFilters } from '../types';
import DatabaseManager from '../config/database';
import { config } from '../config';

export class ElasticsearchService {
  private client: Client;

  constructor() {
    this.client = DatabaseManager.getInstance().getElasticsearchClient();
  }

  public async indexEmail(email: EmailMessage): Promise<void> {
    try {
      await this.client.index({
        index: config.elasticsearch.index,
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
    } catch (error) {
      console.error('Error indexing email:', error);
      throw error;
    }
  }

  public async updateEmailCategory(emailId: string, category: string): Promise<void> {
    try {
      await this.client.update({
        index: config.elasticsearch.index,
        id: emailId,
        body: {
          doc: {
            aiCategory: category,
            updatedAt: new Date()
          }
        }
      });
      console.log(`Updated email category: ${emailId} -> ${category}`);
    } catch (error) {
      console.error('Error updating email category:', error);
      throw error;
    }
  }

  public async searchEmails(filters: SearchFilters, page: number = 1, limit: number = 20): Promise<{
    emails: EmailMessage[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const query: any = {
        bool: {
          must: []
        }
      };

      // Text search
      if (filters.searchText) {
        query.bool.must.push({
          multi_match: {
            query: filters.searchText,
            fields: ['subject^2', 'body', 'from', 'to']
          }
        });
      }

      // Account filter
      if (filters.accountId) {
        query.bool.must.push({
          term: { accountId: filters.accountId }
        });
      }

      // Folder filter
      if (filters.folder) {
        query.bool.must.push({
          term: { folder: filters.folder }
        });
      }

      // Category filter
      if (filters.category) {
        query.bool.must.push({
          term: { aiCategory: filters.category }
        });
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const dateRange: any = {};
        if (filters.dateFrom) dateRange.gte = filters.dateFrom;
        if (filters.dateTo) dateRange.lte = filters.dateTo;
        
        query.bool.must.push({
          range: { date: dateRange }
        });
      }

      // Read status filter
      if (filters.isRead !== undefined) {
        query.bool.must.push({
          term: { isRead: filters.isRead }
        });
      }

      // Flagged status filter
      if (filters.isFlagged !== undefined) {
        query.bool.must.push({
          term: { isFlagged: filters.isFlagged }
        });
      }

      const response = await this.client.search({
        index: config.elasticsearch.index,
        body: {
          query,
          sort: [
            { date: { order: 'desc' } }
          ],
          from: (page - 1) * limit,
          size: limit
        }
      });

      const emails = response.body.hits.hits.map((hit: any) => hit._source);
      const total = response.body.hits.total.value;

      return {
        emails,
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('Error searching emails:', error);
      throw error;
    }
  }

  public async getEmailStats(accountId?: string): Promise<{
    total: number;
    byCategory: Record<string, number>;
    byFolder: Record<string, number>;
    recentActivity: number;
  }> {
    try {
      const query: any = {
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
        index: config.elasticsearch.index,
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

      const byCategory: Record<string, number> = {};
      response.body.aggregations.byCategory.buckets.forEach((bucket: any) => {
        byCategory[bucket.key] = bucket.doc_count;
      });

      const byFolder: Record<string, number> = {};
      response.body.aggregations.byFolder.buckets.forEach((bucket: any) => {
        byFolder[bucket.key] = bucket.doc_count;
      });

      return {
        total: response.body.hits.total.value,
        byCategory,
        byFolder,
        recentActivity: response.body.aggregations.recentActivity.doc_count
      };
    } catch (error) {
      console.error('Error getting email stats:', error);
      throw error;
    }
  }

  public async deleteEmail(emailId: string): Promise<void> {
    try {
      await this.client.delete({
        index: config.elasticsearch.index,
        id: emailId
      });
      console.log(`Deleted email from index: ${emailId}`);
    } catch (error) {
      console.error('Error deleting email from index:', error);
      throw error;
    }
  }

  public async bulkIndexEmails(emails: EmailMessage[]): Promise<void> {
    try {
      const body = [];
      
      for (const email of emails) {
        body.push({
          index: {
            _index: config.elasticsearch.index,
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
    } catch (error) {
      console.error('Error bulk indexing emails:', error);
      throw error;
    }
  }
}
