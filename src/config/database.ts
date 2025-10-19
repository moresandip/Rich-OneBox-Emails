import mongoose from 'mongoose';
import { Client } from '@elastic/elasticsearch';
import { config } from './index';

class DatabaseManager {
  private static instance: DatabaseManager;
  private mongoConnection: mongoose.Connection | null = null;
  private elasticsearchClient: Client | null = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async connectMongoDB(): Promise<void> {
    try {
      if (!this.mongoConnection) {
        await mongoose.connect(config.mongodb.uri);
        this.mongoConnection = mongoose.connection;
        
        this.mongoConnection.on('error', (error) => {
          console.error('MongoDB connection error:', error);
        });

        this.mongoConnection.on('disconnected', () => {
          console.log('MongoDB disconnected');
        });

        console.log('MongoDB connected successfully');
      }
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  public async connectElasticsearch(): Promise<void> {
    try {
      if (!this.elasticsearchClient) {
        this.elasticsearchClient = new Client({
          node: config.elasticsearch.url,
        });

        // Test connection
        await this.elasticsearchClient.ping();
        console.log('Elasticsearch connected successfully');

        // Create index if it doesn't exist
        await this.createEmailIndex();
      }
    } catch (error) {
      console.error('Failed to connect to Elasticsearch:', error);
      throw error;
    }
  }

  private async createEmailIndex(): Promise<void> {
    try {
      const indexExists = await this.elasticsearchClient!.indices.exists({
        index: config.elasticsearch.index
      });

      if (!indexExists) {
        await this.elasticsearchClient!.indices.create({
          index: config.elasticsearch.index,
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
        console.log(`Elasticsearch index '${config.elasticsearch.index}' created successfully`);
      }
    } catch (error) {
      console.error('Failed to create Elasticsearch index:', error);
      throw error;
    }
  }

  public getElasticsearchClient(): Client {
    if (!this.elasticsearchClient) {
      throw new Error('Elasticsearch client not initialized');
    }
    return this.elasticsearchClient;
  }

  public getMongoConnection(): mongoose.Connection {
    if (!this.mongoConnection) {
      throw new Error('MongoDB connection not initialized');
    }
    return this.mongoConnection;
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.mongoConnection) {
        await mongoose.disconnect();
        this.mongoConnection = null;
      }
      if (this.elasticsearchClient) {
        await this.elasticsearchClient.close();
        this.elasticsearchClient = null;
      }
      console.log('Database connections closed');
    } catch (error) {
      console.error('Error closing database connections:', error);
    }
  }
}

export default DatabaseManager;
