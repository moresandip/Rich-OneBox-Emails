# Deployment Guide for Rich OneBox Emails

This guide provides step-by-step instructions for deploying the Rich OneBox Emails application with frontend on Netlify and backend on Render.

## Architecture Overview

- **Frontend**: Static HTML/CSS/JavaScript hosted on Netlify
- **Backend**: Node.js/TypeScript API server hosted on Render
- **Database**: MongoDB Atlas (cloud)
- **Search**: Elasticsearch Cloud
- **Vector DB**: Qdrant Cloud
- **AI**: Google Gemini API

## Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **MongoDB Atlas**: Create cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
4. **Elasticsearch Cloud**: Create deployment at [elastic.co/cloud](https://elastic.co/cloud)
5. **Qdrant Cloud**: Create cluster at [qdrant.tech](https://qdrant.tech)
6. **Google AI API Key**: Get from [makersuite.google.com](https://makersuite.google.com)

## Step 1: Prepare Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Server Configuration
PORT=10000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rich-onebox-emails

# Elasticsearch
ELASTICSEARCH_URL=https://your-elasticsearch-url.cloud.elastic.co
ELASTICSEARCH_INDEX=emails

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_MODEL=gemini-1.5-flash
EMBEDDING_MODEL=text-embedding-004

# Slack Integration (Optional)
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_CHANNEL_ID=your-channel-id

# Webhook Configuration (Optional)
WEBHOOK_URL=https://webhook.site/your-unique-url

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Qdrant
QDRANT_URL=https://your-qdrant-url.qdrant.tech
QDRANT_COLLECTION_NAME=product_data

# Frontend URL (for CORS)
FRONTEND_URL=https://your-netlify-site.netlify.app
```

## Step 2: Deploy Backend to Render

1. **Connect Repository**:
   - Go to [render.com](https://render.com) and sign in
   - Click "New" → "Web Service"
   - Connect your GitHub/GitLab repository
   - Select the repository containing your Rich OneBox Emails project

2. **Configure Service**:
   - **Name**: `rich-onebox-emails-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Choose based on your needs (Starter/Free tier for testing)

3. **Environment Variables**:
   Add all the environment variables from your `.env` file to the Render service environment variables section.

4. **Deploy**:
   - Click "Create Web Service"
   - Wait for the build and deployment to complete
   - Note the service URL (e.g., `https://rich-onebox-emails-backend.onrender.com`)

## Step 3: Deploy Frontend to Netlify

1. **Connect Repository**:
   - Go to [netlify.com](https://netlify.com) and sign in
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub/GitLab repository
   - Select the repository containing your Rich OneBox Emails project

2. **Configure Build Settings**:
   - **Base directory**: Leave empty (root)
   - **Build command**: `echo 'No build step required'`
   - **Publish directory**: `public`
   - **Node version**: `18`

3. **Environment Variables**:
   - Add `NODE_VERSION=18`

4. **Deploy**:
   - Click "Deploy site"
   - Wait for deployment to complete
   - Note the site URL (e.g., `https://amazing-site.netlify.app`)

## Step 4: Update Frontend Configuration

1. **Update API URLs**:
   - In `netlify.toml`, replace `https://rich-onebox-emails-backend.onrender.com` with your actual Render backend URL
   - The frontend will automatically proxy API calls to your backend

2. **Update CORS**:
   - In your Render service environment variables, set `FRONTEND_URL` to your Netlify site URL

## Step 5: Configure External Services

### MongoDB Atlas
1. Create a cluster
2. Create a database user
3. Whitelist IP addresses (0.0.0.0/0 for testing, restrict for production)
4. Get connection string and update `MONGODB_URI`

### Elasticsearch Cloud
1. Create a deployment
2. Get the endpoint URL and API key
3. Update `ELASTICSEARCH_URL` with your endpoint
4. Configure authentication if required

### Qdrant Cloud
1. Create a cluster
2. Get the API key and URL
3. Update `QDRANT_URL` with your cluster URL
4. Set up authentication

## Step 6: Test Deployment

1. **Test Frontend**:
   - Visit your Netlify site URL
   - Check that the UI loads correctly

2. **Test Backend**:
   - Visit `https://your-render-url.onrender.com/health`
   - Should return JSON with status information

3. **Test API Integration**:
   - Check browser console for any CORS errors
   - Test API calls from frontend to backend

## Step 7: Configure Custom Domain (Optional)

### Netlify Custom Domain
1. Go to Site settings → Domain management
2. Add custom domain
3. Configure DNS records as instructed
4. Update `FRONTEND_URL` in Render environment variables

### Render Custom Domain
1. Go to Service settings → Custom Domains
2. Add your custom domain
3. Configure DNS records as instructed

## Monitoring and Maintenance

### Render Monitoring
- View logs in the Render dashboard
- Monitor resource usage
- Set up alerts for downtime

### Netlify Monitoring
- View deployment history
- Monitor site performance
- Set up build hooks for automated deployments

### Database Monitoring
- Use MongoDB Atlas dashboard for database metrics
- Monitor Elasticsearch cluster health
- Check Qdrant usage and performance

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure `FRONTEND_URL` is set correctly in Render
   - Check that the frontend URL matches exactly

2. **API Connection Failed**:
   - Verify backend URL in `netlify.toml`
   - Check Render service is running
   - Review environment variables

3. **Database Connection Failed**:
   - Verify MongoDB Atlas connection string
   - Check IP whitelisting
   - Ensure database user has correct permissions

4. **Build Failures**:
   - Check build logs in Render/Netlify
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version compatibility

### Debug Mode
Enable debug logging by setting `DEBUG=*` in environment variables.

## Security Considerations

1. **Environment Variables**:
   - Never commit secrets to version control
   - Use Render's environment variable management
   - Rotate API keys regularly

2. **Network Security**:
   - Configure firewalls in cloud providers
   - Use HTTPS everywhere
   - Implement rate limiting

3. **Data Security**:
   - Encrypt sensitive data at rest
   - Use secure connections to databases
   - Implement proper authentication

## Cost Optimization

1. **Render**:
   - Use free tier for development
   - Scale instance type based on usage
   - Set up auto-scaling if needed

2. **Netlify**:
   - Free tier includes generous limits
   - Monitor bandwidth usage
   - Use build minutes efficiently

3. **Databases**:
   - Start with smallest instances
   - Monitor usage and scale as needed
   - Set up automated backups

## Support

For deployment issues:
1. Check service logs
2. Verify configuration
3. Test individual components
4. Review this guide
5. Check official documentation:
   - [Render Docs](https://docs.render.com)
   - [Netlify Docs](https://docs.netlify.com)
   - [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)
   - [Elasticsearch Cloud Docs](https://www.elastic.co/guide/en/cloud/current/index.html)
