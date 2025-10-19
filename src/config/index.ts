import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rich-onebox-emails'
  },
  
  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    index: process.env.ELASTICSEARCH_INDEX || 'emails'
  },
  
  imap: {
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: parseInt(process.env.IMAP_PORT || '993', 10),
    secure: process.env.IMAP_SECURE === 'true'
  },
  
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-004'
  },
  
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || '',
    channelId: process.env.SLACK_CHANNEL_ID || ''
  },
  
  webhook: {
    url: process.env.WEBHOOK_URL || ''
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key'
  },
  
  qdrant: {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    collectionName: process.env.QDRANT_COLLECTION_NAME || 'product_data'
  }
};
