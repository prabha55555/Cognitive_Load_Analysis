# Assessment Question Generation Debugging Guide

## Issues Reported
1. ✅ **FIXED**: Export error - `CognitiveLoadMetrics` type mismatch
2. ⚠️ **INVESTIGATING**: Assessment shows placeholder/generic questions instead of topic-specific questions

## Fixes Applied

### 1. Export Error Fix
**Problem**: `AssessmentPhase.tsx` had wrong type for `onComplete` callback
- Expected: `CognitiveLoadMetrics`
- Actual: `AssessmentResponse[]`

**Solution**: Updated the interface
```typescript
interface AssessmentPhaseProps {
  participant: Participant;
  onComplete: (responses: AssessmentResponse[]) => void; // Fixed
  readingContent?: string;
  userNotes?: string;
}
```

### 2. Re-render Loop Fix
**Problem**: Component was mounting repeatedly, causing continuous console logs

**Solution**: Added `useRef` to track loading state
```typescript
const questionsLoadedRef = useRef(false);

useEffect(() => {
  if (questionsLoadedRef.current) {
    console.log('⏭️ Questions already loaded, skipping...');
    return;
  }
  // ... load questions
  questionsLoadedRef.current = true;
}, []); // Empty dependency array
```

## Debugging Placeholder Questions

### Expected Behavior
When you set a custom topic (e.g., "Quantum Computing"), the assessment should generate 5 specific questions about that topic using Gemini AI.

### What to Check

#### Step 1: Verify API Key
Check your `.env` file:
```env
VITE_GEMINI_QUESTIONS_API_KEY=AIza...
```

Open the browser console and look for:
```
🔑 Calling geminiService.generateAssessmentQuestions
   Topic: [YOUR TOPIC]
```

#### Step 2: Check for API Errors
Look for these log patterns:

**✅ SUCCESS Pattern:**
```
==========================================
🔄 LOADING ASSESSMENT QUESTIONS (FIRST TIME)
Topic: Quantum Computing
==========================================
🎯 ASSESSMENT GENERATION FOR CUSTOM TOPIC
Topic provided: Quantum Computing
Calling Gemini API with Questions API Key...
📡 RAW GEMINI RESPONSE:
[...]
✅ QUESTIONS LOADED SUCCESSFULLY
Number of questions: 5
  1. What is a qubit in Quantum Computing?... (easy)
  2. Why is Quantum Computing important?... (easy)
  [...]
==========================================
```

**❌ FALLBACK Pattern (means API failed):**
```
==========================================
❌ GEMINI API ERROR:
[Error details here]
==========================================
📋 USING FALLBACK QUESTIONS FOR: Quantum Computing
==========================================
```

If you see the FALLBACK pattern, check the error details.

### Common Issues

#### Issue 1: API Key Not Set
**Symptom**: 
```
❌ GEMINI API ERROR:
Error: API key not valid
```

**Solution**:
1. Check `.env` file has `VITE_GEMINI_QUESTIONS_API_KEY=AIza...`
2. Restart the dev server: `npm run dev`

#### Issue 2: 503 Service Overloaded
**Symptom**:
```
❌ GEMINI API ERROR:
Error: 503 Service Temporarily Overloaded
```

**Solution**: 
- Wait a few minutes and try again
- The system will automatically use fallback questions

#### Issue 3: Rate Limit
**Symptom**:
```
❌ GEMINI API ERROR:
Error: 429 Too Many Requests
```

**Solution**:
- Wait 1 minute
- Try again

#### Issue 4: Invalid JSON Response
**Symptom**:
```
❌ GEMINI API ERROR:
SyntaxError: Unexpected token
```

**Solution**:
- Check the RAW GEMINI RESPONSE in console
- The AI might have added extra text before/after the JSON
- This is already handled by the cleaning code, but if it persists, the AI model might be having issues

### Testing Steps

1. **Open Browser Console** (F12)
2. **Clear Console** (to see fresh logs)
3. **Start a new session**:
   - Enter participant info
   - Select a platform
   - Choose "Enter custom topic"
   - Enter a specific topic (e.g., "Neural Networks")
4. **Complete the research phase** (just click through)
5. **Watch the console** when assessment phase loads
6. **Look for the patterns** above

### What You Should See

**Console Output:**
```
==========================================
🎯 ASSESSMENT PHASE COMPONENT MOUNTED
Participant ID: participant_123456
Research Topic: Neural Networks
==========================================
🔄 LOADING ASSESSMENT QUESTIONS (FIRST TIME)
Topic: Neural Networks
==========================================
🎯 ASSESSMENT GENERATION FOR CUSTOM TOPIC
Topic provided: Neural Networks
Topic length: 15
Calling Gemini API with Questions API Key...
==========================================
📡 RAW GEMINI RESPONSE:
[
  {
    "id": "q1",
    "question": "What is the primary function of neurons in Neural Networks?",
    ...
  }
]
==========================================
✅ QUESTIONS LOADED SUCCESSFULLY
Number of questions: 5
  1. What is the primary function of neurons in... (easy)
  2. How do Neural Networks learn from data... (easy)
  3. What is backpropagation in Neural Networks... (medium)
  4. Why are activation functions important in... (medium)
  5. What are the main challenges when training... (hard)
==========================================
```

### If You See Generic Questions

If the questions look like:
- "What is Neural Networks?"
- "Why is Neural Networks important in modern society?"
- "How is Neural Networks applied in practical scenarios?"

This means **fallback questions were used**. Check the console for the API error.

### Verification in UI

The assessment screen should show:
- **Topic**: Your custom topic at the top
- **Questions**: Specific to your topic (not generic)
- **Progress**: 1/5, 2/5, etc.

### Files Modified
- ✅ `src/components/AssessmentPhase.tsx` - Fixed types and re-render loop
- ✅ `src/services/geminiService.ts` - Already has strong topic-specific prompts
- ✅ `src/config/api.ts` - Dual API key configuration

### Next Steps

1. **Test with console open**
2. **Share the console output** if you see errors
3. **Check if API key is valid** - try it in a test API call

## Quick Test

Run this in browser console on the app page:
```javascript
console.log('API Key:', import.meta.env.VITE_GEMINI_QUESTIONS_API_KEY?.substring(0, 10) + '...');
```

Should show: `AIza...` (not `undefined` or empty)
