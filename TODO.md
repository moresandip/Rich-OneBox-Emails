# Deployment TODO for Rich OneBox Emails Backend on Render

## Current Status
- Repository: https://github.com/moresandip/Rich-OneBox-Emails.git
- Render account: Available
- render.yaml: Configured for deployment

## Deployment Steps

### 1. Connect Repository to Render
- Go to [render.com](https://render.com) and sign in
- Click "New" → "Web Service"
- Connect your GitHub repository: `moresandip/Rich-OneBox-Emails`
- Render will automatically detect the `render.yaml` file

### 2. Configure Service (Should be auto-filled from render.yaml)
- **Name**: rich-onebox-emails-backend
- **Runtime**: Node
- **Build Command**: npm run build
- **Start Command**: npm start
- **Instance Type**: Choose based on needs (Starter/Free for testing)

### 3. Set Environment Variables
Add the following environment variables in Render dashboard:
- NODE_ENV: production
- PORT: 10000
- MONGODB_URI: [Your MongoDB Atlas connection string]
- ELASTICSEARCH_URL: [Your Elasticsearch Cloud URL]
- GEMINI_API_KEY: [Your Google Gemini API key]
- OPENAI_API_KEY: [Your OpenAI API key]
- SLACK_BOT_TOKEN: [Your Slack bot token] (optional)
- SLACK_CHANNEL_ID: [Your Slack channel ID] (optional)
- WEBHOOK_URL: [Your webhook URL] (optional)
- JWT_SECRET: [Your JWT secret]
- QDRANT_URL: [Your Qdrant Cloud URL]
- FRONTEND_URL: [Your Netlify frontend URL, if deployed]

### 4. Deploy
- Click "Create Web Service"
- Wait for build and deployment to complete
- Note the service URL (e.g., https://rich-onebox-emails-backend.onrender.com)

### 5. Test Deployment
- Visit the backend URL + /health endpoint
- Check logs in Render dashboard for any errors
- Verify environment variables are set correctly

### 6. Update Frontend (if needed)
- Update netlify.toml with the actual Render backend URL
- Redeploy frontend on Netlify if necessary

## Prerequisites Checklist
- [ ] MongoDB Atlas cluster created and connection string ready
- [ ] Elasticsearch Cloud deployment ready
- [ ] Qdrant Cloud cluster ready
- [ ] Google Gemini API key obtained
- [ ] OpenAI API key (optional)
- [ ] Slack tokens (optional)
- [ ] JWT secret generated
- [ ] Frontend deployed on Netlify (optional for backend deployment)

## Notes
- Ensure all API keys and secrets are securely stored in Render environment variables
- Monitor the build logs for any dependency issues
- The free tier on Render has limitations; upgrade if needed for production
