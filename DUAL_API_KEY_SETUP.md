# Dual API Key Configuration Guide

## Overview
The system now uses **two separate Gemini API keys** to prevent rate limiting and 503 "overloaded" errors:

1. **CHAT API Key** - For chatbot interactions (frequent use)
2. **QUESTIONS API Key** - For question generation & evaluation (occasional use)

---

## Benefits

### ✅ **Separate Rate Limits**
- Chat queries won't affect question generation quota
- Question generation won't affect chat quota
- Better load distribution across API keys

### ✅ **Automatic Retry Logic**
- Retries up to 3 times with exponential backoff (1s, 2s, 4s)
- Only retries for retryable errors (503, 429, 500, 502, 504)
- Shows user-friendly retry messages

### ✅ **Graceful Fallback**
- After max retries, provides intelligent fallback responses
- Continues to work even when API is down
- Clear error messages to users

---

## Configuration

### 1. Get API Keys
Visit: https://makersuite.google.com/app/apikey

You can:
- Create **2 separate API keys** (recommended for production)
- Use **1 API key** for both (simpler setup)

### 2. Create `.env` File

Copy `.env.example` to `.env`:
```bash
copy .env.example .env
```

### 3. Add Your API Keys

**Option A: Separate Keys (Recommended)**
```env
# Main API Key (fallback)
VITE_GEMINI_API_KEY=AIzaSy...your_main_key

# Chat API Key (for chatbot - frequent use)
VITE_GEMINI_CHAT_API_KEY=AIzaSy...your_chat_key

# Questions API Key (for generation - occasional use)
VITE_GEMINI_QUESTIONS_API_KEY=AIzaSy...your_questions_key
```

**Option B: Single Key (Simpler)**
```env
# Use same key for everything
VITE_GEMINI_API_KEY=AIzaSy...your_single_key
```

---

## How It Works

### API Key Usage

| Feature | API Key Used | Frequency | Notes |
|---------|-------------|-----------|-------|
| Chatbot queries | `GEMINI_CHAT` | High (every chat message) | Falls back to main key |
| Assessment questions | `GEMINI_QUESTIONS` | Low (once per session) | Falls back to main key |
| Creativity questions | `GEMINI_QUESTIONS` | Low (once per session) | Falls back to main key |
| Creativity evaluation | `GEMINI_QUESTIONS` | Low (once per session) | Falls back to main key |

### Automatic Fallback Chain

```
Primary Key → Retry (3 attempts) → Fallback Response
```

**Chat API:**
```
VITE_GEMINI_CHAT_API_KEY 
  ↓ (if not set)
VITE_GEMINI_API_KEY
  ↓ (if fails)
Retry 3 times with delays
  ↓ (if all fail)
Enhanced fallback response
```

**Questions API:**
```
VITE_GEMINI_QUESTIONS_API_KEY
  ↓ (if not set)
VITE_GEMINI_API_KEY
  ↓ (if fails)
Fallback questions/evaluations
```

---

## Error Handling

### Retryable Errors (Auto-Retry)
- `503` - Service Unavailable / Overloaded
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error
- `502` - Bad Gateway
- `504` - Gateway Timeout
- Network timeouts
- Connection errors

### Non-Retryable Errors (Immediate Fallback)
- `401` - Unauthorized (bad API key)
- `400` - Bad Request (invalid input)
- Other client errors

### User Messages

**During Retry:**
```
⏳ The AI service is experiencing high demand. 
   Retrying in 2 seconds... (Attempt 2/3)
```

**After Retries Exhausted:**
```
⚠️ The AI service is temporarily unavailable. 
   Here's a helpful response based on our knowledge base:
   [Fallback content]
```

---

## Console Logging

### Chat API
```
🔑 Using CHAT API key for chatbot interaction
📡 Gemini Chat API Response Status: 200
✅ Gemini Chat API Response received
```

### Questions API
```
🔑 Generating assessment questions using QUESTIONS API key
🔑 Generating creativity questions using QUESTIONS API key
🔑 Evaluating response using QUESTIONS API key
```

### Error Handling
```
❌ Gemini attempt 1 failed: Error: The model is overloaded
⏳ Retrying in 1000ms... (Attempt 2/4)
🔄 Using fallback response after retries exhausted
```

---

## Model Information

All services use the same Gemini model:
- **Model**: `gemini-2.0-flash`
- **Chat Temperature**: 0.7 (balanced)
- **Questions Temperature**: 0.8 (more creative)
- **Chat Max Tokens**: 2048
- **Questions Max Tokens**: 4096

---

## Testing

### 1. Test With Single Key
```env
VITE_GEMINI_API_KEY=your_key_here
```

### 2. Test With Separate Keys
```env
VITE_GEMINI_API_KEY=your_fallback_key
VITE_GEMINI_CHAT_API_KEY=your_chat_key
VITE_GEMINI_QUESTIONS_API_KEY=your_questions_key
```

### 3. Test Error Handling
- Use invalid API key → Should show auth error
- Spam chat queries → Should retry on rate limits
- No API key → Should use fallback responses

---

## Troubleshooting

### Problem: Still getting 503 errors
**Solution:**
1. Get multiple API keys from Google AI Studio
2. Set separate keys in `.env`
3. Clear browser cache and restart dev server

### Problem: "API authentication failed"
**Solution:**
1. Verify API key starts with `AIza`
2. Check key has no extra spaces
3. Ensure `.env` file is in project root
4. Restart dev server after changing `.env`

### Problem: Fallback responses instead of AI
**Solution:**
1. Check console logs for error details
2. Verify API keys are valid
3. Check API quota: https://console.cloud.google.com/apis/dashboard
4. Ensure you're not hitting rate limits

---

## API Key Best Practices

### Development
- Use 1 API key for simplicity
- Monitor console logs for errors

### Production
- Use 2 separate API keys
- Set up monitoring/alerts for rate limits
- Rotate keys if hitting quotas
- Consider upgrading to paid tier for higher limits

---

## Summary

✅ **Implemented:**
- Dual API key system (chat + questions)
- Automatic retry with exponential backoff
- Graceful fallback responses
- User-friendly error messages
- Comprehensive logging

✅ **Next Steps:**
1. Copy `.env.example` to `.env`
2. Add your Gemini API key(s)
3. Test the application
4. Monitor console logs for any issues

The system will now handle API overload errors much better! 🎉
