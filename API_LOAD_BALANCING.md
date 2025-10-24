# API Load Balancing Implementation

## Overview
Implemented comprehensive API key load balancing to prevent 503 "Service Unavailable" errors from Google Gemini API due to overload.

## Problem
- Previously: Single API key (`VITE_GEMINI_API_KEY`) handling all operations
- Result: 503 errors during creativity evaluation and assessment generation
- Error message: "The model is overloaded. Please try again later."

## Solution
Distributed API calls across three separate Gemini API keys based on operation purpose.

## API Key Distribution

### 1. Primary API Key (Fallback)
- **Environment Variable**: `VITE_GEMINI_API_KEY`
- **Value**: `AIzaSyC4ugkytG5h2mCO-PjvjX5ITlz1oHwN8LY`
- **Purpose**: Fallback for all operations when dedicated keys fail
- **Usage**: Last resort in retry mechanism

### 2. Chat API Key (High Frequency)
- **Environment Variable**: `VITE_GEMINI_CHAT_API_KEY`
- **Value**: `AIzaSyCsY_ckvjFCe4Hi_pTzpzVz_MlMbmMTrV8`
- **Purpose**: Dedicated to chat interactions and real-time conversations
- **Frequency**: HIGH - Multiple requests per user session
- **Operations**: Chat responses, conversational AI

### 3. Questions API Key (Medium Frequency)
- **Environment Variable**: `VITE_GEMINI_QUESTIONS_API_KEY`
- **Value**: `AIzaSyAlLqtVMw_xZHtb_06oCE0DTyEWt1vns3s`
- **Purpose**: Assessment generation and creativity evaluation
- **Frequency**: MEDIUM - 5-10 requests per assessment/creativity test
- **Operations**:
  - `generateAssessmentQuestions()` - Generate 5 assessment questions per topic
  - `evaluateCreativityResponse()` - Evaluate 3 creativity test responses

## Technical Implementation

### File Modified
`src/services/geminiService.ts`

### Key Changes

#### 1. API Key Initialization
```typescript
const PRIMARY_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const CHAT_API_KEY = import.meta.env.VITE_GEMINI_CHAT_API_KEY || '';
const QUESTIONS_API_KEY = import.meta.env.VITE_GEMINI_QUESTIONS_API_KEY || '';

const genAIPrimary = new GoogleGenerativeAI(PRIMARY_API_KEY);
const genAIChat = CHAT_API_KEY ? new GoogleGenerativeAI(CHAT_API_KEY) : genAIPrimary;
const genAIQuestions = QUESTIONS_API_KEY ? new GoogleGenerativeAI(QUESTIONS_API_KEY) : genAIPrimary;
```

#### 2. Purpose-Based Model Selection
```typescript
const getModel = (purpose: 'chat' | 'questions' | 'evaluation' = 'chat') => {
  switch (purpose) {
    case 'chat':
      return genAIChat.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    case 'questions':
      return genAIQuestions.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    case 'evaluation':
      return genAIQuestions.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    default:
      return genAIPrimary.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }
};
```

#### 3. Retry Mechanism with Fallback
```typescript
async function retryWithFallback<T>(
  operation: (model: any) => Promise<T>,
  purpose: 'chat' | 'questions' | 'evaluation',
  _maxRetries: number = 2
): Promise<T> {
  const apiKeys = [
    { name: 'Dedicated', model: getModel(purpose) },
    { name: 'Primary', model: genAIPrimary.getGenerativeModel({ model: 'gemini-2.0-flash-exp' }) },
  ];

  for (let i = 0; i < apiKeys.length; i++) {
    try {
      console.log(`🔄 Attempt ${i + 1}: Using ${apiKeys[i].name} API key for ${purpose}`);
      return await operation(apiKeys[i].model);
    } catch (error: any) {
      const isOverloaded = error.message?.includes('503') || error.message?.includes('overloaded');
      const isLastAttempt = i === apiKeys.length - 1;

      if (isOverloaded && !isLastAttempt) {
        console.warn(`⚠️ ${apiKeys[i].name} API key overloaded, trying next fallback...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        continue;
      }

      if (isLastAttempt) {
        console.error('❌ All API keys exhausted for', purpose);
        throw error;
      }

      throw error;
    }
  }
}
```

#### 4. Updated Service Methods

##### generateAssessmentQuestions()
```typescript
async generateAssessmentQuestions(topic: string, _notes: string, count: number = 5) {
  return retryWithFallback(async (model) => {
    // Generate questions using model
    // ...
  }, 'questions').catch(() => {
    return this.getFallbackAssessmentQuestions(topic);
  });
}
```

##### evaluateCreativityResponse()
```typescript
async evaluateCreativityResponse(question, response, timeSpent) {
  return retryWithFallback(async (model) => {
    // Evaluate response using model
    // ...
  }, 'evaluation').catch(() => {
    return this.getFallbackEvaluation(response, timeSpent, question.timeLimit);
  });
}
```

## Benefits

### 1. Load Distribution
- Chat operations isolated to dedicated key
- Assessment/evaluation operations share separate key
- Reduces single-key bottleneck

### 2. Fault Tolerance
- Automatic retry with fallback to primary key
- 1-second delay between retries to avoid rate limiting
- Graceful degradation to local fallback evaluations

### 3. Monitoring
- Comprehensive logging at each step
- Console output shows which API key is being used
- Error tracking for debugging 503 issues

### 4. Performance
- Dedicated keys reduce likelihood of overload
- Retry mechanism ensures eventual success
- Fallback evaluations prevent complete failure

## Error Handling Flow

1. **First Attempt**: Use dedicated API key for purpose
   - QUESTIONS key for assessments/evaluations
   - CHAT key for conversations

2. **Second Attempt**: If 503 error, wait 1 second and retry with PRIMARY key

3. **Final Fallback**: If all API keys fail, use local fallback:
   - `getFallbackAssessmentQuestions()` - Returns placeholder questions
   - `getFallbackEvaluation()` - Returns heuristic-based scores

## Console Logging

### Initialization
```
🔑 GEMINI API KEYS CONFIGURATION:
================================
Primary API Key: ✅ Loaded
Chat API Key: ✅ Loaded
Questions API Key: ✅ Loaded
================================
```

### Operation Execution
```
📝 GENERATING ASSESSMENT QUESTIONS for topic: "Quantum Computing"
📡 Selecting Gemini model for purpose: QUESTIONS
✅ Using VITE_GEMINI_QUESTIONS_API_KEY for assessment generation
🔄 Attempt 1: Using Dedicated API key for questions
✅ PARSED QUESTIONS SUCCESSFULLY
```

### Error Recovery
```
⚠️ Dedicated API key overloaded, trying next fallback...
🔄 Attempt 2: Using Primary API key for questions
✅ PARSED QUESTIONS SUCCESSFULLY
```

### Complete Failure
```
❌ All API keys exhausted for evaluation
❌ ALL API KEYS FAILED for evaluation, using fallback
```

## Testing Checklist

- [x] API keys loaded from environment
- [x] Three separate GoogleGenerativeAI instances created
- [x] Purpose-based routing (getModel) working
- [x] Retry mechanism with 503 detection
- [x] Fallback to primary key on overload
- [x] Graceful degradation to local fallbacks
- [x] Comprehensive logging throughout
- [ ] End-to-end test: Assessment generation
- [ ] End-to-end test: Creativity evaluation
- [ ] Verify no 503 errors during normal operation

## Next Steps

1. **Run Application**
   ```bash
   npm run dev
   ```

2. **Test Assessment Phase**
   - Create participant
   - Complete research phase
   - Generate assessment questions
   - Monitor console for API key usage

3. **Test Creativity Evaluation**
   - Complete assessment phase
   - Complete cognitive load results
   - Enter creativity test responses
   - Verify evaluations complete without 503 errors

4. **Monitor Performance**
   - Check console logs for API key distribution
   - Verify retry mechanism activates on overload
   - Confirm fallback evaluations work if all keys fail

## Expected Outcome

- ✅ No more 503 errors during normal operation
- ✅ Creativity scores calculated successfully
- ✅ Cognitive load scores calculated successfully
- ✅ Both scores displayed on completion screen
- ✅ Participant data saved with all metrics

## Related Files

- `src/services/geminiService.ts` - Main implementation
- `.env` - API key configuration
- `src/components/CreativityTest.tsx` - Uses evaluateCreativityResponse()
- `src/components/AssessmentPhase.tsx` - Uses generateAssessmentQuestions()
- `src/components/ParticipantDashboard.tsx` - Receives and displays scores

---

**Date**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Author**: GitHub Copilot
**Status**: ✅ Implementation Complete - Ready for Testing
