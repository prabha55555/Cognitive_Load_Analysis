# Gemini Model Update - Configuration Guide

## Changes Made

### 1. Switched to `gemini-1.5-flash-latest`

**Why?**
- `gemini-1.5-flash-latest` is the correct model name for v1beta API
- Has better rate limits on the free tier compared to 2.0-flash
- More stable and reliable for general QA chatbot use
- Better suited for conversational interactions
- Lower chance of hitting quota limits

**Files Updated:**
- `src/config/api.ts` - Updated all Gemini model configurations

### 2. Rate Limits Comparison

#### gemini-2.0-flash (OLD)
- Free tier: Very limited requests per day
- Prone to quota exhaustion
- Better for advanced use cases

#### gemini-1.5-flash-latest (NEW)
- Free tier: 15 requests per minute
- 1,500 requests per day
- 1 million tokens per minute
- Better for chatbot applications
- Stable and well-supported

## Setup Instructions

### Step 1: Update Your API Key

Replace `YOUR_NEW_API_KEY_HERE` in `.env` with your new Gemini API key:

```env
VITE_GEMINI_API_KEY=AIzaSy...your-new-key-here
```

### Step 2: Restart the Development Server

The frontend will automatically pick up the new configuration:

```bash
# The Vite dev server should hot-reload automatically
# If not, restart it manually
```

### Step 3: Test the Chatbot

1. Refresh your browser
2. Start a new session
3. Select ChatGPT platform
4. Try sending a message
5. The chatbot should now use `gemini-1.5-flash` model

## Benefits of gemini-1.5-flash-latest

✅ **Higher Rate Limits**: 15 RPM vs very limited in 2.0-flash free tier
✅ **More Stable**: Better uptime and reliability
✅ **Optimized for Chat**: Designed for conversational AI
✅ **Faster Responses**: Lower latency
✅ **Better Free Tier**: More generous quotas
✅ **Well Supported**: Stable model name with `-latest` suffix

## Monitoring Usage

Track your API usage at:
- https://ai.dev/usage?tab=rate-limit
- https://aistudio.google.com/app/apikey

## Troubleshooting

### Still Getting 429 Errors?

1. **Wait 1 minute** - Rate limits reset every minute
2. **Check your quota** - Visit the usage dashboard
3. **Verify API key** - Make sure it's from a fresh Google account
4. **Check model name** - Should be `gemini-1.5-flash-latest` in logs

### API Key Not Working?

1. Ensure the key starts with `AIza`
2. Check that the key is enabled in Google AI Studio
3. Verify no billing issues on the account
4. Try generating a new key

## Additional Notes

- The configuration now uses `gemini-1.5-flash-latest` for all Gemini API calls
- This includes chat interactions, question generation, and creativity evaluation
- The model is optimized for general-purpose QA chatbot use cases
- You can monitor the model being used in the browser console logs
- The `-latest` suffix ensures you always get the most recent stable version of the 1.5 flash model
