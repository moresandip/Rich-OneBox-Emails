# Rich OneBox Emails

A feature-rich email aggregator with AI-powered categorization, real-time synchronization, and intelligent reply suggestions.

## Features

### ✅ Implemented Features

1. **Real-Time Email Synchronization**
   - Sync multiple IMAP accounts in real-time (minimum 2)
   - Fetch last 30 days of emails
   - Persistent IMAP connections with IDLE mode (no cron jobs)
   - Real-time updates via WebSocket

2. **Searchable Storage using Elasticsearch**
   - Locally hosted Elasticsearch instance with Docker
   - Full-text search across emails
   - Advanced filtering by folder, account, category, date range
   - Efficient indexing and querying

3. **AI-Based Email Categorization**
   - Categorizes emails into: Interested, Meeting Booked, Not Interested, Spam, Out of Office
   - Uses Google Gemini API for intelligent categorization
   - Confidence scoring for AI predictions
   - Real-time categorization of new emails

4. **Slack & Webhook Integration**
   - Slack notifications for interested emails
   - Webhook triggers for external automation
   - Configurable notification channels
   - Error alerts and system status updates

5. **Frontend Interface**
   - Modern, responsive web interface
   - Real-time email display with WebSocket updates
   - Advanced search and filtering
   - Email categorization display
   - Interactive email viewer

6. **AI-Powered Suggested Replies**
   - RAG (Retrieval-Augmented Generation) implementation
   - Context-aware reply suggestions
   - Product and outreach agenda integration
   - Intelligent response generation

## Tech Stack

- **Backend**: Node.js, TypeScript, Express.js
- **Database**: MongoDB, Elasticsearch, Qdrant Vector DB
- **Real-time**: Socket.IO, IMAP IDLE with watchdog
- **AI**: Google Gemini API with embeddings
- **Frontend**: HTML5, Tailwind CSS, JavaScript
- **Infrastructure**: Docker, Docker Compose

## Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- OpenAI API key
- Slack Bot Token (optional)
- IMAP email accounts

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RichOneBoxEmails
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database
   MONGODB_URI=mongodb://localhost:27017/rich-onebox-emails

   # Elasticsearch
   ELASTICSEARCH_URL=http://localhost:9200
   ELASTICSEARCH_INDEX=emails

# AI Configuration (Gemini API)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
EMBEDDING_MODEL=text-embedding-004

   # Slack Integration
   SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
   SLACK_CHANNEL_ID=your-channel-id

   # Webhook Configuration
   WEBHOOK_URL=https://webhook.site/your-unique-url

   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key
   ```

4. **Start infrastructure services**
   ```bash
   docker-compose up -d
   ```

5. **Build and start the application**
   ```bash
   npm run build
   npm start
   ```

   For development:
   ```bash
   npm run dev
   ```

## API Endpoints

### Email Management
- `GET /api/emails` - Get emails with filtering
- `GET /api/emails/search` - Search emails
- `GET /api/emails/:id` - Get specific email
- `PUT /api/emails/:id` - Update email
- `DELETE /api/emails/:id` - Delete email
- `POST /api/emails/:id/categorize` - Categorize email with AI
- `POST /api/emails/:id/suggest-reply` - Generate AI reply suggestion

### Account Management
- `GET /api/accounts` - Get all email accounts
- `POST /api/accounts` - Add new email account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Remove account
- `POST /api/accounts/:id/test` - Test IMAP connection
- `POST /api/accounts/:id/sync` - Manual sync account

### System Management
- `GET /api/system/status` - Get system status
- `POST /api/system/start-imap` - Start IMAP service
- `POST /api/system/stop-imap` - Stop IMAP service

## Usage

### 1. Add Email Accounts

```bash
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@gmail.com",
    "password": "your-app-password",
    "imapHost": "imap.gmail.com",
    "imapPort": 993,
    "secure": true
  }'
```

### 2. View Emails

Visit `http://localhost:3000` to access the web interface.

### 3. Search Emails

```bash
curl "http://localhost:3000/api/emails/search?q=meeting&category=interested"
```

### 4. Categorize Email

```bash
curl -X POST http://localhost:3000/api/emails/{email-id}/categorize
```

### 5. Generate Reply Suggestion

```bash
curl -X POST http://localhost:3000/api/emails/{email-id}/suggest-reply
```

## Features in Detail

### Real-Time Synchronization
- Uses IMAP IDLE mode for real-time email detection
- No polling or cron jobs required
- Automatic reconnection on connection loss
- Supports multiple concurrent accounts

### AI Categorization
- Intelligent email analysis using OpenAI
- Categories: Interested, Meeting Booked, Not Interested, Spam, Out of Office
- Confidence scoring for predictions
- Automatic categorization of new emails

### Search & Filtering
- Full-text search across email content
- Filter by account, folder, category, date range
- Elasticsearch-powered fast search
- Real-time search suggestions

### WebSocket Integration
- Real-time updates for new emails
- Live categorization notifications
- Interested email alerts
- Connection status monitoring

## Configuration

### IMAP Settings
- Gmail: `imap.gmail.com:993` (SSL)
- Outlook: `outlook.office365.com:993` (SSL)
- Yahoo: `imap.mail.yahoo.com:993` (SSL)

### Slack Integration
1. Create a Slack app at https://api.slack.com/apps
2. Generate a bot token
3. Add the bot to your channel
4. Set `SLACK_BOT_TOKEN` and `SLACK_CHANNEL_ID` in `.env`

### Webhook Integration
1. Use https://webhook.site for testing
2. Set `WEBHOOK_URL` in `.env`
3. Webhooks are sent for interested emails and system events

## Development

### Project Structure
```
src/
├── config/          # Configuration files
├── controllers/     # API controllers
├── models/         # Database models
├── services/       # Business logic services
├── types/          # TypeScript type definitions
├── app.ts          # Express application setup
└── index.ts        # Application entry point
```

### Key Services
- `IMAPService`: Real-time email synchronization
- `ElasticsearchService`: Search and indexing
- `AIService`: Email categorization and reply suggestions
- `SlackService`: Notifications
- `WebhookService`: External integrations

## Testing with Postman

Import the following collection for API testing:

```json
{
  "info": {
    "name": "Rich OneBox Emails API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Add Email Account",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"test@gmail.com\",\n  \"password\": \"app-password\",\n  \"imapHost\": \"imap.gmail.com\",\n  \"imapPort\": 993,\n  \"secure\": true\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/accounts",
          "host": ["{{base_url}}"],
          "path": ["api", "accounts"]
        }
      }
    }
  ]
}
```

## Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### System Status
```bash
curl http://localhost:3000/api/system/status
```

## Troubleshooting

### Common Issues

1. **IMAP Connection Failed**
   - Check email credentials
   - Enable "Less secure app access" or use app passwords
   - Verify IMAP settings

2. **Elasticsearch Connection Failed**
   - Ensure Docker is running
   - Check Elasticsearch logs: `docker logs rich-onebox-elasticsearch`

3. **AI Categorization Not Working**
   - Verify OpenAI API key
   - Check API quota and billing

4. **Slack Notifications Not Sending**
   - Verify bot token and channel ID
   - Check bot permissions

## Performance Optimization

- Elasticsearch indexing for fast search
- Connection pooling for IMAP
- WebSocket for real-time updates
- Efficient database queries with proper indexing

## Security Considerations

- Environment variables for sensitive data
- JWT for authentication (future enhancement)
- Input validation and sanitization
- Rate limiting (future enhancement)

## Future Enhancements

- User authentication and authorization
- Advanced email templates
- Email scheduling
- Analytics dashboard
- Mobile app integration
- Advanced AI features

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please create an issue in the repository.
