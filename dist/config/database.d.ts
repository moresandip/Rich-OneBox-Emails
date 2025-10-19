import mongoose from 'mongoose';
import { Client } from '@elastic/elasticsearch';
declare class DatabaseManager {
    private static instance;
    private mongoConnection;
    private elasticsearchClient;
    private constructor();
    static getInstance(): DatabaseManager;
    connectMongoDB(): Promise<void>;
    connectElasticsearch(): Promise<void>;
    private createEmailIndex;
    getElasticsearchClient(): Client;
    getMongoConnection(): mongoose.Connection;
    disconnect(): Promise<void>;
}
export default DatabaseManager;
//# sourceMappingURL=database.d.ts.map