# Deployment Guide - Rich OneBox Emails

This guide will help you deploy the Rich OneBox Emails application in various environments.

## Quick Start

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- Git

### Local Development Setup

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd RichOneBoxEmails
   
   # On Windows
   scripts\setup.bat
   
   # On Linux/Mac
   ./scripts/setup.sh
   ```

2. **Configure Environment**
   ```bash
   # Edit .env file with your settings
   nano .env
   ```

3. **Start the Application**
   ```bash
   # For development
   npm run dev
   
   # For production
   npm start
   ```

4. **Test the API**
   ```bash
   node scripts/test-api.js
   ```

## Environment Configuration

### Required Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/rich-onebox-emails

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX=emails

# AI Configuration (Required for categorization)
OPENAI_API_KEY=your_openai_api_key_here
AI_MODEL=gpt-3.5-turbo

# Slack Integration (Optional)
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_CHANNEL_ID=your-channel-id

# Webhook Configuration (Optional)
WEBHOOK_URL=https://webhook.site/your-unique-url

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### IMAP Configuration Examples

#### Gmail
```env
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_SECURE=true
```

#### Outlook/Office 365
```env
IMAP_HOST=outlook.office365.com
IMAP_PORT=993
IMAP_SECURE=true
```

#### Yahoo
```env
IMAP_HOST=imap.mail.yahoo.com
IMAP_PORT=993
IMAP_SECURE=true
```

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Start Infrastructure**
   ```bash
   docker-compose up -d
   ```

2. **Build and Run Application**
   ```bash
   npm run build
   npm start
   ```

### Using Docker Only

1. **Build Application Image**
   ```bash
   docker build -t rich-onebox-emails .
   ```

2. **Run with External Services**
   ```bash
   docker run -p 3000:3000 \
     -e MONGODB_URI=mongodb://host.docker.internal:27017/rich-onebox-emails \
     -e ELASTICSEARCH_URL=http://host.docker.internal:9200 \
     rich-onebox-emails
   ```

## Production Deployment

### Using PM2 (Recommended)

1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Create PM2 Configuration**
   ```json
   {
     "apps": [{
       "name": "rich-onebox-emails",
       "script": "dist/index.js",
       "instances": "max",
       "exec_mode": "cluster",
       "env": {
         "NODE_ENV": "production",
         "PORT": 3000
       }
     }]
   }
   ```

3. **Start with PM2**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### Using Docker in Production

1. **Create Production Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY dist/ ./dist/
   EXPOSE 3000
   CMD ["node", "dist/index.js"]
   ```

2. **Build and Deploy**
   ```bash
   docker build -t rich-onebox-emails:latest .
   docker run -d -p 3000:3000 --name rich-onebox-emails rich-onebox-emails:latest
   ```

## Cloud Deployment

### AWS Deployment

1. **Using AWS ECS**
   - Create ECS cluster
   - Define task definition with MongoDB and Elasticsearch
   - Deploy application container

2. **Using AWS EC2**
   - Launch EC2 instance
   - Install Docker and Docker Compose
   - Follow local deployment steps

### Google Cloud Platform

1. **Using Google Cloud Run**
   - Build container image
   - Deploy to Cloud Run
   - Configure external databases

2. **Using Google Kubernetes Engine**
   - Create GKE cluster
   - Deploy with Helm charts
   - Configure persistent volumes

### Azure Deployment

1. **Using Azure Container Instances**
   - Build and push container
   - Deploy to ACI
   - Configure external databases

2. **Using Azure Kubernetes Service**
   - Create AKS cluster
   - Deploy with Kubernetes manifests
   - Configure ingress and services

## Database Setup

### MongoDB Setup

#### Local MongoDB
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Using MongoDB Atlas (Cloud)
# Update MONGODB_URI in .env
```

#### MongoDB Atlas (Recommended for Production)
1. Create MongoDB Atlas account
2. Create cluster
3. Get connection string
4. Update `MONGODB_URI` in environment

### Elasticsearch Setup

#### Local Elasticsearch
```bash
# Using Docker
docker run -d -p 9200:9200 -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  elasticsearch:8.11.0
```

#### Elasticsearch Cloud (Recommended for Production)
1. Create Elasticsearch Cloud account
2. Create deployment
3. Get connection details
4. Update `ELASTICSEARCH_URL` in environment

## Security Considerations

### Production Security Checklist

- [ ] Change default JWT secret
- [ ] Use HTTPS in production
- [ ] Configure firewall rules
- [ ] Enable database authentication
- [ ] Use environment variables for secrets
- [ ] Implement rate limiting
- [ ] Add input validation
- [ ] Enable CORS properly
- [ ] Use secure IMAP connections
- [ ] Monitor and log security events

### SSL/TLS Configuration

1. **Using Nginx Reverse Proxy**
   ```nginx
   server {
       listen 443 ssl;
       server_name your-domain.com;
       
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

2. **Using Let's Encrypt**
   ```bash
   # Install certbot
   sudo apt install certbot python3-certbot-nginx
   
   # Get certificate
   sudo certbot --nginx -d your-domain.com
   ```

## Monitoring and Logging

### Application Monitoring

1. **Health Checks**
   ```bash
   curl http://localhost:3000/health
   curl http://localhost:3000/api/system/status
   ```

2. **Log Monitoring**
   ```bash
   # Using PM2
   pm2 logs rich-onebox-emails
   
   # Using Docker
   docker logs rich-onebox-emails
   ```

### Database Monitoring

1. **MongoDB Monitoring**
   - Use MongoDB Compass for GUI
   - Monitor connection count
   - Check query performance

2. **Elasticsearch Monitoring**
   - Use Kibana for monitoring
   - Monitor cluster health
   - Check index performance

## Backup and Recovery

### Database Backups

1. **MongoDB Backup**
   ```bash
   # Create backup
   mongodump --uri="mongodb://localhost:27017/rich-onebox-emails" --out=./backup
   
   # Restore backup
   mongorestore --uri="mongodb://localhost:27017/rich-onebox-emails" ./backup
   ```

2. **Elasticsearch Backup**
   ```bash
   # Create snapshot repository
   curl -X PUT "localhost:9200/_snapshot/backup_repo" -H 'Content-Type: application/json' -d'
   {
     "type": "fs",
     "settings": {
       "location": "/backup/elasticsearch"
     }
   }'
   
   # Create snapshot
   curl -X PUT "localhost:9200/_snapshot/backup_repo/snapshot_1"
   ```

### Application Backup

1. **Code Backup**
   ```bash
   # Git backup
   git push origin main
   
   # File system backup
   tar -czf rich-onebox-emails-backup.tar.gz .
   ```

## Troubleshooting

### Common Issues

1. **IMAP Connection Failed**
   - Check email credentials
   - Verify IMAP settings
   - Enable app passwords for Gmail
   - Check firewall settings

2. **Elasticsearch Connection Failed**
   - Verify Elasticsearch is running
   - Check connection URL
   - Verify network connectivity

3. **MongoDB Connection Failed**
   - Check MongoDB is running
   - Verify connection string
   - Check authentication

4. **AI Categorization Not Working**
   - Verify OpenAI API key
   - Check API quota
   - Verify network connectivity

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm start

# Check specific service
DEBUG=imap:* npm start
DEBUG=elasticsearch:* npm start
```

### Performance Optimization

1. **Database Optimization**
   - Add proper indexes
   - Optimize queries
   - Monitor slow queries

2. **Application Optimization**
   - Use connection pooling
   - Implement caching
   - Optimize memory usage

## Scaling

### Horizontal Scaling

1. **Load Balancer Setup**
   ```nginx
   upstream rich_onebox_emails {
       server 127.0.0.1:3000;
       server 127.0.0.1:3001;
       server 127.0.0.1:3002;
   }
   ```

2. **Database Scaling**
   - Use MongoDB replica sets
   - Use Elasticsearch cluster
   - Implement read replicas

### Vertical Scaling

1. **Increase Resources**
   - More CPU cores
   - More RAM
   - Faster storage

2. **Optimize Configuration**
   - Tune JVM settings for Elasticsearch
   - Optimize MongoDB configuration
   - Adjust Node.js memory limits

## Maintenance

### Regular Maintenance Tasks

1. **Database Maintenance**
   - Clean old emails
   - Optimize indexes
   - Monitor disk usage

2. **Application Maintenance**
   - Update dependencies
   - Monitor performance
   - Check logs for errors

3. **Security Maintenance**
   - Update security patches
   - Rotate secrets
   - Review access logs

### Update Procedure

1. **Backup Current Version**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Update Application**
   ```bash
   git pull origin main
   npm install
   npm run build
   pm2 restart rich-onebox-emails
   ```

3. **Verify Update**
   ```bash
   node scripts/test-api.js
   ```

## Support

For deployment issues:

1. Check the logs
2. Verify configuration
3. Test individual components
4. Review this guide
5. Create an issue in the repository

## Additional Resources

- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [MongoDB Production Notes](https://docs.mongodb.com/manual/administration/production-notes/)
- [Elasticsearch Production Deployment](https://www.elastic.co/guide/en/elasticsearch/reference/current/setup.html)
- [Docker Production Best Practices](https://docs.docker.com/develop/dev-best-practices/)

