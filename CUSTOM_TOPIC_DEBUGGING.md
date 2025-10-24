# Custom Topic Debugging Guide

## Issue
When a custom topic is entered through the Admin Dashboard, the assessment questions were not being generated specifically for that custom topic.

## Root Cause Analysis
The topic flows through the application correctly:
1. AdminDashboard → Sets `participant.researchTopic` to custom topic
2. ParticipantDashboard → Passes `participant` to AssessmentPhase
3. AssessmentPhase → Uses `participant.researchTopic` to generate questions
4. geminiService → Generates questions based on the topic

The issue was lack of visibility into the data flow and insufficient logging.

## Changes Implemented

### 1. Enhanced geminiService.ts
**Location**: `src/services/geminiService.ts`

**Changes**:
- Added ultra-specific prompt emphasizing the exact topic name multiple times
- Added emoji indicators (🎯 📚 ⚠️ 📊 🧠) for better readability
- Enhanced logging showing:
  - Topic received
  - Topic length
  - Raw Gemini response (first 500 chars)
  - Cleaned JSON (first 300 chars)
  - Each generated question with topic verification
  - Warnings if questions don't mention the topic
- Improved JSON extraction with boundary detection
- Better validation of topic relevance

**Key Code**:
```typescript
const prompt = `You are an expert educational assessment designer. Create ${count} multiple-choice questions SPECIFICALLY AND EXCLUSIVELY about: "${topic}"

🎯 CRITICAL REQUIREMENTS:
1. EVERY question must be DIRECTLY about "${topic}" - use the exact topic name in questions
2. Questions MUST test knowledge of "${topic}" concepts, applications, and principles
...
```

### 2. Enhanced AssessmentPhase.tsx
**Location**: `src/components/AssessmentPhase.tsx`

**Changes**:
- Added immediate logging when component mounts
- Logs received props: participant object, research topic, topic type, length
- Logs when topic changes via useEffect
- Enhanced question generation logging:
  - Shows participant ID
  - Shows topic and trimmed version
  - Checks if topic is empty
  - Logs each question with full details
- Added validation to check if topic is empty before generating
- Better error messages mentioning the topic

**Key Code**:
```typescript
// IMMEDIATE LOGGING - Check what props are received
console.log('==========================================');
console.log('🎯 ASSESSMENT PHASE COMPONENT MOUNTED');
console.log('Participant object:', participant);
console.log('Research Topic:', participant.researchTopic);
console.log('Topic type:', typeof participant.researchTopic);
console.log('Topic length:', participant.researchTopic?.length);
console.log('Topic empty?:', !participant.researchTopic || participant.researchTopic.trim() === '');
...
```

### 3. Improved Fallback Questions
**Location**: `src/services/geminiService.ts` - `getFallbackAssessmentQuestions()`

**Changes**:
- Made fallback questions more topic-specific
- Each question and option directly references the topic name
- Better structured console output
- Examples:
  - "What is ${topic}?"
  - "Why is ${topic} important in modern society?"
  - "How is ${topic} applied in practical scenarios?"

## How to Debug Custom Topic Issues

### 1. Check Console Logs in Browser (F12)

When you create a participant with a custom topic, you should see:

#### In AdminDashboard:
```
🚀 Creating participant...
Mode: custom
Custom topic: Your Custom Topic
✏️ Custom topic used: Your Custom Topic
✅ Participant created successfully with topic: "Your Custom Topic"
```

#### In AssessmentPhase (when phase starts):
```
==========================================
🎯 ASSESSMENT PHASE COMPONENT MOUNTED
Participant object: {id: "P...", researchTopic: "Your Custom Topic", ...}
Research Topic: Your Custom Topic
Topic type: string
Topic length: 17
Topic empty?: false
==========================================
```

#### In geminiService (question generation):
```
==========================================
🎯 ASSESSMENT GENERATION FOR CUSTOM TOPIC
Topic provided: Your Custom Topic
Topic length: 17
Calling Gemini API with Questions API Key...
==========================================
📡 RAW GEMINI RESPONSE:
[{"id":"q1","question":"What is Your Custom Topic?"...
==========================================
🧹 CLEANED JSON:
[{"id":"q1","question":"What is Your Custom Topic?"...
==========================================
✅ PARSED QUESTIONS SUCCESSFULLY
Number of questions: 5
==========================================
Question 1: What is Your Custom Topic?
Topic field: Your Custom Topic
Difficulty: easy
---
...
==========================================
✅ FINAL VALIDATED QUESTIONS:
1. What is Your Custom Topic?...
2. Why is Your Custom Topic important?...
...
==========================================
```

### 2. Verify Topic Flow

Use console logs to trace the topic through each component:

```
AdminDashboard (topic set)
    ↓
App.tsx (participant created with topic)
    ↓
ParticipantDashboard (receives participant.researchTopic)
    ↓
AssessmentPhase (uses participant.researchTopic)
    ↓
geminiService (generates questions for topic)
```

### 3. Common Issues and Solutions

#### Issue: Questions are generic
**Check**: Look for warning in console:
```
⚠️ Question 1 may not be specific to topic "Your Topic": What is the main concept?
```

**Solution**: 
- Check if API key is working (might be using fallback)
- Try regenerating questions
- Check Gemini API quota/rate limits

#### Issue: Topic is empty/undefined
**Check**: Console shows:
```
Topic empty?: true
❌ ERROR: Research topic is empty or undefined!
```

**Solution**:
- Verify topic was set in AdminDashboard
- Check if `customTopic` state has value
- Ensure "Create" button was clicked with valid topic

#### Issue: Using fallback questions
**Check**: Console shows:
```
❌ GEMINI API ERROR:
...
📋 USING FALLBACK QUESTIONS FOR: Your Topic
```

**Solution**:
- Check API key in `.env` file
- Verify `VITE_GEMINI_QUESTIONS_API_KEY` is set
- Check API quota/rate limits
- Look for network errors in console

### 4. Testing Checklist

To test custom topic functionality:

1. ✅ **Create Custom Topic Participant**:
   - Go to Admin Dashboard
   - Select "Custom Topic" mode
   - Enter custom topic (e.g., "Quantum Computing")
   - Click "Create Participant" for ChatGPT or Google
   - Verify success message shows your custom topic

2. ✅ **Check Topic Display**:
   - Login as the created participant
   - Verify topic shown in research phase: "Research the topic: Quantum Computing"
   - Complete reading/notes phase

3. ✅ **Verify Assessment Questions**:
   - Open browser console (F12)
   - Start assessment phase
   - Check console logs for topic flow
   - Verify questions mention your custom topic
   - Example: "What is a qubit in Quantum Computing?" not "What is the main concept?"

4. ✅ **Check All Questions**:
   - Each question should mention or be clearly about the custom topic
   - All 5 questions should be topic-specific
   - Difficulty levels should vary (2 easy, 2 medium, 1 hard)

## API Configuration

Ensure `.env` file has:
```env
# Main fallback
VITE_GEMINI_API_KEY=AIza...

# For chatbot
VITE_GEMINI_CHAT_API_KEY=AIza...

# For question generation (IMPORTANT for custom topics!)
VITE_GEMINI_QUESTIONS_API_KEY=AIza...
```

## Troubleshooting Commands

### Check if topic is being passed:
```javascript
// In browser console during assessment:
console.log('Current participant:', participant);
console.log('Research topic:', participant.researchTopic);
```

### Force regenerate questions:
Refresh the page after starting assessment phase to trigger regeneration.

### Check API key:
```javascript
// In browser console:
console.log('Gemini Questions API Key:', import.meta.env.VITE_GEMINI_QUESTIONS_API_KEY ? 'Set' : 'Missing');
```

## Expected Behavior

### ✅ Correct Behavior:
- Custom topic entered: "Blockchain Technology"
- Questions generated:
  1. "What is the primary purpose of Blockchain Technology?"
  2. "How does Blockchain Technology ensure security?"
  3. "What is a smart contract in Blockchain Technology?"
  4. "What are the main advantages of Blockchain Technology?"
  5. "What challenges exist in implementing Blockchain Technology?"

### ❌ Incorrect Behavior (OLD):
- Custom topic entered: "Blockchain Technology"
- Questions generated:
  1. "What is the main concept of the topic?"
  2. "How does this work in practice?"
  3. "What are the benefits of understanding this?"
  4. "How can this be applied?"
  5. "What challenges exist?"

## Summary

The custom topic feature now includes:
- ✅ Comprehensive logging at every step
- ✅ Topic validation and empty checks
- ✅ Ultra-specific prompts to Gemini AI
- ✅ Question relevance verification
- ✅ Clear error messages
- ✅ Topic display in UI
- ✅ Fallback questions that reference the topic

All custom topics should now generate relevant, topic-specific assessment questions!
