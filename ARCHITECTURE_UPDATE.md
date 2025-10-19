# Architecture Update - Rich OneBox Emails

## 🎯 Updated Architecture Overview

The Rich OneBox Emails system has been updated to match the exact specifications provided, implementing a modern, production-ready email aggregator with advanced AI capabilities.

## 🏗️ Core Architecture Components

### 1. **IMAP Sync Service** (Real-Time Email Synchronization)
- **IMAP IDLE Implementation**: Uses persistent IMAP connections with IDLE mode
- **Watchdog System**: 29-minute watchdog to maintain connections (prevents 30-minute timeouts)
- **Connection Management**: Automatic reconnection on connection loss
- **Multi-Account Support**: Concurrent connections to multiple IMAP accounts
- **30-Day History**: Fetches last 30 days of emails on initial sync

### 2. **Persistence Layer** (Dual Database Architecture)
- **MongoDB**: Metadata storage for email accounts and system data
- **Elasticsearch**: Full-text search and advanced filtering
- **Qdrant Vector Database**: RAG implementation for AI context retrieval

### 3. **API/Web Integration Layer** (Node.js/TypeScript)
- **Express.js**: RESTful API with comprehensive endpoints
- **Socket.IO**: Real-time WebSocket communication
- **TypeScript**: Strong typing and error prevention

## 🔧 Technical Implementation Details

### IMAP IDLE with Watchdog
```typescript
// 29-minute watchdog to prevent 30-minute IMAP timeouts
private setupIdleWatchdog(accountId: string, imap: Imap): void {
  const watchdog = setTimeout(() => {
    if (this.isRunning && this.connections.has(accountId)) {
      console.log(`IDLE watchdog triggered for account ${accountId}`);
      this.refreshIdleConnection(accountId, imap);
    }
  }, 29 * 60 * 1000); // 29 minutes
}
```

### Gemini AI Integration
```typescript
// System instruction for email categorization
const systemInstruction = `You are an expert email classifier. Your task is to analyze the provided email text and categorize it into one of the following labels: Interested, Meeting Booked, Not Interested, Spam, or Out of Office.`;
```

### RAG Implementation with Qdrant
```typescript
// Vector search for context retrieval
const relevantContext = await this.qdrantService.searchSimilar(
  emailEmbedding,
  3 // Top 3 most relevant chunks
);
```

## 📊 Database Architecture

### MongoDB Collections
- **EmailAccount**: IMAP account configurations
- **EmailMessage**: Email metadata and content
- **SystemLogs**: Application and error logs

### Elasticsearch Index
```json
{
  "mappings": {
    "properties": {
      "subject": { "type": "text" },
      "body": { "type": "text" },
      "accountId": { "type": "keyword" },
      "folder": { "type": "keyword" },
      "aiCategory": { "type": "keyword" },
      "date": { "type": "date" }
    }
  }
}
```

### Qdrant Vector Database
- **Collection**: `product_data`
- **Vector Size**: 768 (Gemini embedding dimension)
- **Distance Metric**: Cosine similarity
- **Payload**: Text content and metadata

## 🤖 AI Services Architecture

### Gemini AI Service
- **Categorization**: 5-category email classification
- **Embeddings**: Text-to-vector conversion for RAG
- **Reply Generation**: Context-aware response suggestions
- **Sentiment Analysis**: Email tone and intent analysis

### RAG Pipeline
1. **Query Embedding**: Convert incoming email to vector
2. **Vector Search**: Find similar product data in Qdrant
3. **Context Retrieval**: Extract relevant product information
4. **Prompt Assembly**: Combine context with original email
5. **Response Generation**: Generate contextual reply using Gemini

## 🔄 Real-Time Processing Flow

### Email Processing Pipeline
1. **IMAP IDLE Detection**: New email arrives
2. **Email Parsing**: Extract metadata and content
3. **Elasticsearch Indexing**: Store for search
4. **AI Categorization**: Gemini API classification
5. **Vector Storage**: Store embeddings in Qdrant
6. **Notification**: Slack/webhook for interested emails
7. **Real-Time Update**: WebSocket to frontend

### Connection Management
- **IDLE Mode**: Persistent connections with event listeners
- **Watchdog**: Automatic connection refresh every 29 minutes
- **Error Handling**: Graceful reconnection on failures
- **Health Monitoring**: Connection status tracking

## 🛠️ Infrastructure Services

### Docker Compose Services
```yaml
services:
  elasticsearch:    # Full-text search
  mongodb:          # Metadata storage
  qdrant:           # Vector database for RAG
```

### Logging Architecture
- **Winston**: Application logs with file rotation
- **Pino**: Structured JSON logging
- **Log Levels**: Debug, Info, Warn, Error
- **Log Files**: Combined and error-specific logs

## 📡 API Endpoints

### Email Management
- `GET /api/emails` - List with filtering
- `GET /api/emails/search` - Elasticsearch search
- `POST /api/emails/:id/categorize` - AI categorization
- `POST /api/emails/:id/suggest-reply` - RAG reply generation

### Account Management
- `GET /api/accounts` - List accounts
- `POST /api/accounts` - Add new account
- `POST /api/accounts/:id/test` - Test IMAP connection

### System Management
- `GET /api/system/status` - Health check
- `POST /api/system/start-imap` - Start IMAP service
- `POST /api/system/stop-imap` - Stop IMAP service

## 🔒 Security & Performance

### Security Features
- **Environment Variables**: Secure configuration
- **Input Validation**: Joi schema validation
- **Connection Security**: TLS/SSL for IMAP
- **Error Handling**: Comprehensive error management

### Performance Optimizations
- **Connection Pooling**: Efficient IMAP connections
- **Vector Indexing**: Fast similarity search
- **Elasticsearch**: Optimized search queries
- **WebSocket**: Low-latency real-time updates

## 🚀 Deployment Architecture

### Development
```bash
# Quick setup
./scripts/setup.sh
npm run dev
```

### Production
```bash
# Docker deployment
docker-compose up -d
npm start

# PM2 cluster mode
pm2 start ecosystem.config.js
```

### Monitoring
- **Health Checks**: `/health` endpoint
- **System Status**: `/api/system/status`
- **Logging**: Structured logs with rotation
- **Metrics**: Performance and error tracking

## 📈 Scalability Considerations

### Horizontal Scaling
- **Load Balancer**: Multiple app instances
- **Database Clusters**: MongoDB replica sets
- **Elasticsearch Cluster**: Distributed search
- **Vector Database**: Qdrant clustering

### Vertical Scaling
- **Resource Optimization**: Memory and CPU tuning
- **Connection Limits**: IMAP connection management
- **Cache Implementation**: Redis for session storage
- **Queue Processing**: Background job processing

## 🎯 Key Features Implemented

### ✅ Real-Time Email Synchronization
- IMAP IDLE mode (no polling)
- Watchdog connection maintenance
- Multi-account concurrent processing
- 30-day email history sync

### ✅ Searchable Storage
- Elasticsearch full-text search
- Advanced filtering capabilities
- Real-time indexing
- Optimized query performance

### ✅ AI-Based Categorization
- Gemini API integration
- 5-category classification
- Confidence scoring
- Real-time processing

### ✅ Slack & Webhook Integration
- Real-time notifications
- External automation triggers
- Error alerts
- System status updates

### ✅ Frontend Interface
- Modern responsive design
- Real-time WebSocket updates
- Advanced search and filtering
- Interactive email viewer

### ✅ AI-Powered Suggested Replies
- RAG implementation
- Vector database integration
- Context-aware responses
- Product data integration

## 🔧 Configuration

### Environment Variables
```env
# AI Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
EMBEDDING_MODEL=text-embedding-004

# Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=product_data

# IMAP Configuration
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_SECURE=true
```

### Docker Services
- **Elasticsearch**: Port 9200
- **MongoDB**: Port 27017
- **Qdrant**: Port 6333 (REST), 6334 (gRPC)
- **Application**: Port 3000

## 📚 Documentation

- **README.md**: Complete setup guide
- **DEPLOYMENT.md**: Production deployment
- **postman-collection.json**: API testing
- **ARCHITECTURE_UPDATE.md**: This document

## 🎉 Conclusion

The updated architecture provides a robust, scalable, and production-ready email aggregator that meets all specified requirements:

- **Real-Time Performance**: IMAP IDLE with watchdog
- **AI Integration**: Gemini API with RAG
- **Vector Search**: Qdrant for context retrieval
- **Comprehensive Logging**: Winston and Pino
- **Production Ready**: Docker, PM2, monitoring

The system is ready for immediate deployment and can handle real-world email processing workloads with high performance and reliability.
