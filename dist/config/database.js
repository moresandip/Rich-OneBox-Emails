"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const elasticsearch_1 = require("@elastic/elasticsearch");
const index_1 = require("./index");
class DatabaseManager {
    constructor() {
        this.mongoConnection = null;
        this.elasticsearchClient = null;
    }
    static getInstance() {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }
    async connectMongoDB() {
        try {
            if (!this.mongoConnection) {
                await mongoose_1.default.connect(index_1.config.mongodb.uri);
                this.mongoConnection = mongoose_1.default.connection;
                this.mongoConnection.on('error', (error) => {
                    console.error('MongoDB connection error:', error);
                });
                this.mongoConnection.on('disconnected', () => {
                    console.log('MongoDB disconnected');
                });
                console.log('MongoDB connected successfully');
            }
        }
        catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            throw error;
        }
    }
    async connectElasticsearch() {
        try {
            if (!this.elasticsearchClient) {
                this.elasticsearchClient = new elasticsearch_1.Client({
                    node: index_1.config.elasticsearch.url,
                });
                await this.elasticsearchClient.ping();
                console.log('Elasticsearch connected successfully');
                await this.createEmailIndex();
            }
        }
        catch (error) {
            console.error('Failed to connect to Elasticsearch:', error);
            throw error;
        }
    }
    async createEmailIndex() {
        try {
            const indexExists = await this.elasticsearchClient.indices.exists({
                index: index_1.config.elasticsearch.index
            });
            if (!indexExists) {
                await this.elasticsearchClient.indices.create({
                    index: index_1.config.elasticsearch.index,
                    body: {
                        mappings: {
                            properties: {
                                id: { type: 'keyword' },
                                accountId: { type: 'keyword' },
                                messageId: { type: 'keyword' },
                                subject: {
                                    type: 'text',
                                    analyzer: 'standard'
                                },
                                from: { type: 'keyword' },
                                to: { type: 'keyword' },
                                cc: { type: 'keyword' },
                                bcc: { type: 'keyword' },
                                date: { type: 'date' },
                                body: {
                                    type: 'text',
                                    analyzer: 'standard'
                                },
                                htmlBody: {
                                    type: 'text',
                                    analyzer: 'standard'
                                },
                                folder: { type: 'keyword' },
                                isRead: { type: 'boolean' },
                                isFlagged: { type: 'boolean' },
                                labels: {
                                    type: 'nested',
                                    properties: {
                                        name: { type: 'keyword' },
                                        color: { type: 'keyword' }
                                    }
                                },
                                aiCategory: { type: 'keyword' },
                                createdAt: { type: 'date' },
                                updatedAt: { type: 'date' }
                            }
                        }
                    }
                });
                console.log(`Elasticsearch index '${index_1.config.elasticsearch.index}' created successfully`);
            }
        }
        catch (error) {
            console.error('Failed to create Elasticsearch index:', error);
            throw error;
        }
    }
    getElasticsearchClient() {
        if (!this.elasticsearchClient) {
            throw new Error('Elasticsearch client not initialized');
        }
        return this.elasticsearchClient;
    }
    getMongoConnection() {
        if (!this.mongoConnection) {
            throw new Error('MongoDB connection not initialized');
        }
        return this.mongoConnection;
    }
    async disconnect() {
        try {
            if (this.mongoConnection) {
                await mongoose_1.default.disconnect();
                this.mongoConnection = null;
            }
            if (this.elasticsearchClient) {
                await this.elasticsearchClient.close();
                this.elasticsearchClient = null;
            }
            console.log('Database connections closed');
        }
        catch (error) {
            console.error('Error closing database connections:', error);
        }
    }
}
exports.default = DatabaseManager;
//# sourceMappingURL=database.js.map