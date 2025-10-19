import { EmailMessage, SearchFilters } from '../types';
export declare class ElasticsearchService {
    private client;
    constructor();
    indexEmail(email: EmailMessage): Promise<void>;
    updateEmailCategory(emailId: string, category: string): Promise<void>;
    searchEmails(filters: SearchFilters, page?: number, limit?: number): Promise<{
        emails: EmailMessage[];
        total: number;
        page: number;
        limit: number;
    }>;
    getEmailStats(accountId?: string): Promise<{
        total: number;
        byCategory: Record<string, number>;
        byFolder: Record<string, number>;
        recentActivity: number;
    }>;
    deleteEmail(emailId: string): Promise<void>;
    bulkIndexEmails(emails: EmailMessage[]): Promise<void>;
}
//# sourceMappingURL=ElasticsearchService.d.ts.map