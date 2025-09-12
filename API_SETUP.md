# API Setup Guide

## Overview

The Cognitive Load Analysis platform supports multiple AI assistants and search platforms. To use the AI features, you need to configure API keys.

## Required API Keys

### 1. OpenAI ChatGPT API Key

**Required for:** ChatGPT Interface

**How to get it:**
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the generated key

**Environment Variable:** `VITE_OPENAI_API_KEY`

### 2. xAI Grok API Key

**Required for:** Grok Interface

**How to get it:**
1. Visit [xAI Console](https://console.x.ai/)
2. Sign in or create an account
3. Navigate to API keys section
4. Generate a new API key
5. Copy the generated key

**Environment Variable:** `VITE_GROK_API_KEY`

### 3. Google Search API Key (Optional)

**Required for:** Enhanced Google Search features

**How to get it:**
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Custom Search API
4. Create credentials (API key)
5. Create a Custom Search Engine at [Google Programmable Search Engine](https://programmablesearchengine.google.com/)

**Environment Variables:**
- `VITE_GOOGLE_SEARCH_API_KEY`
- `VITE_GOOGLE_SEARCH_ENGINE_ID`

## Setup Instructions

### Step 1: Create Environment File

Create a file named `.env` in the project root directory:

```bash
# In the Cognitive_Load_Analysis directory
touch .env
```

### Step 2: Add API Keys

Add your API keys to the `.env` file:

```env
# API Keys for Cognitive Load Analysis Platform

# OpenAI ChatGPT API Key
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here

# xAI Grok API Key
VITE_GROK_API_KEY=your-grok-api-key-here

# Environment Configuration
VITE_ENVIRONMENT=development
VITE_API_BASE_URL=http://localhost:3000

# Optional: Google Custom Search API
VITE_GOOGLE_SEARCH_API_KEY=your-google-search-api-key-here
VITE_GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id-here
```

### Step 3: Restart Development Server

After adding the API keys, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## Verification

### Check API Key Status

The platform includes a built-in API key status checker:

1. Start the application
2. Go to platform selection
3. Try to select ChatGPT or Grok
4. If API keys are missing, you'll see a setup guide

### Manual Verification

You can also check the browser console for API key status messages.

## Troubleshooting

### Common Issues

1. **"API key is required" error**
   - Make sure the `.env` file is in the project root
   - Verify the environment variable names start with `VITE_`
   - Restart the development server

2. **"Invalid API key" error**
   - Check that the API key is copied correctly
   - Verify the API key is active and has proper permissions
   - Ensure you have sufficient credits/quota

3. **Environment variables not loading**
   - Make sure the `.env` file starts with `VITE_`
   - Check that there are no spaces around the `=` sign
   - Restart the development server

### API Key Security

- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore`
- Use different API keys for development and production
- Regularly rotate your API keys

## Platform Features

### ChatGPT Interface
- Direct Q&A with AI assistant
- Context-aware responses
- Conversation history
- Research topic specialization

### Grok Interface
- Real-time knowledge access
- Current events awareness
- Trend analysis
- Multi-modal understanding

### Google Search Interface
- Traditional web search
- Enhanced analytics tracking
- No API key required for basic functionality
- Optional API key for enhanced features

## Cost Considerations

### OpenAI ChatGPT
- Pay-per-use pricing
- Costs depend on model and usage
- Free tier available for testing

### xAI Grok
- Pay-per-use pricing
- Costs depend on model and usage
- Check xAI pricing for current rates

### Google Search
- Free tier available
- Paid tier for higher usage
- Custom Search API has quotas

## Support

If you encounter issues with API setup:

1. Check the browser console for error messages
2. Verify your API keys are valid
3. Ensure you have sufficient credits/quota
4. Check the respective API documentation for updates

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_OPENAI_API_KEY` | Yes | OpenAI ChatGPT API key |
| `VITE_GROK_API_KEY` | Yes | xAI Grok API key |
| `VITE_GOOGLE_SEARCH_API_KEY` | No | Google Custom Search API key |
| `VITE_GOOGLE_SEARCH_ENGINE_ID` | No | Google Custom Search Engine ID |
| `VITE_ENVIRONMENT` | No | Environment (development/production) |
| `VITE_API_BASE_URL` | No | Base URL for API calls |
