# Quick Start: Cognitive Load Measurement System

## Overview
This guide helps you quickly understand and test the new cognitive load measurement system that has been integrated into the EEG Research Platform.

## What's New?

### New Participant Flow
```
Login → Research → Learning → Assessment → Results → Creativity Test → Completed
         (old)      (NEW)      (NEW)       (NEW)       (old)          (old)
```

### New Components
1. **LearningPhase** - Interactive learning with Q&A and chatbot
2. **AssessmentPhase** - Timed questions with multiple types
3. **CognitiveLoadResults** - Comprehensive metrics and recommendations

### New Services
- **cognitiveLoadService** - Calculates cognitive load scores (0-100)

### New Data
- **questionsData** - Learning content and assessment questions for 3 topics

## Testing the System

### Step 1: Start the Application
```bash
npm run dev
```

### Step 2: Login as Participant
1. Enter name and email
2. Get assigned a platform (ChatGPT or Google)
3. Receive a research topic

### Step 3: Research Phase (Existing)
- Use ChatGPT or Google Search interface
- Research your assigned topic
- Click "Complete Research" to proceed

### Step 4: Learning Phase (NEW)
**What you'll see:**
- Left panel: Questions and answers about your topic
- Right panel: Chatbot for asking clarifications
- Header: Timer showing elapsed time
- Progress bar at the bottom

**What to do:**
1. Click "Show Answer" to reveal answers
2. Ask questions in the chatbot if confused
3. Review all content thoroughly
4. Click "Complete Learning Phase" when ready

**What's being tracked:**
- Total time spent learning
- Number of chatbot messages sent
- Which Q&A pairs you viewed
- Timestamps of all interactions

### Step 5: Assessment Phase (NEW)
**What you'll see:**
- One question at a time
- Timer for current question
- Progress indicator (e.g., "Question 2 of 6")
- Question types:
  - Multiple choice (radio buttons)
  - Short answer (text input)
  - Descriptive (textarea with word count)

**What to do:**
1. Read each question carefully
2. Provide your answer
3. Use "Previous" and "Next" to navigate
4. Watch for red borders (time warning)
5. Click "Submit Assessment" when finished

**What's being tracked:**
- Time per question
- Your answers
- Correctness (compared to answer key)
- Overall accuracy

### Step 6: Results Phase (NEW)
**What you'll see:**
- Large overall cognitive load score (0-100)
- Category: Low / Moderate / High / Very High
- Learning phase metrics:
  - Total time
  - Interactions
  - Average interaction time
  - Clarifications
- Assessment phase metrics:
  - Total time
  - Questions answered
  - Average time per question
  - Accuracy percentage
- Personalized recommendations
- Performance summary

**What to do:**
- Review your metrics
- Read the recommendations
- Click "Complete & Continue"

### Step 7: Creativity Test (Existing)
- Original creativity assessment
- Multiple tests
- Continue as before

### Step 8: Completed (Existing)
- Session summary
- All scores displayed
- Data recorded

## Sample Topics

The system includes questions for these topics:

1. **Renewable Energy Innovation**
   - 5 learning Q&A pairs
   - 6 assessment questions
   
2. **Artificial Intelligence**
   - 3 learning Q&A pairs
   - 6 assessment questions
   
3. **Climate Change**
   - 2 learning Q&A pairs
   - 6 assessment questions

## Cognitive Load Score Interpretation

### Score Ranges
- **0-25 (Low)**: Fast learner, minimal assistance needed
- **26-50 (Moderate)**: Normal learning pace, good comprehension
- **51-75 (High)**: Significant effort required, needed clarifications
- **76-100 (Very High)**: Struggled with content, extended time

### What Affects the Score?

**Increases Score (Higher Load):**
- Longer learning time
- More chatbot interactions
- More clarification requests
- Longer assessment time
- Lower accuracy

**Decreases Score (Lower Load):**
- Efficient learning
- Quick comprehension
- Minimal clarifications needed
- Fast assessment completion
- High accuracy

## Developer Guide

### Adding a New Topic

1. **Edit questionsData.ts**
```typescript
// Add learning content
learningContent['Your Topic Name'] = [
  {
    id: 'learn_yourtopic_1',
    topic: 'Your Topic Name',
    question: 'What is...?',
    answer: 'Detailed explanation...',
    difficulty: 'easy',
    category: 'Basics'
  }
];

// Add assessment questions
assessmentQuestions['Your Topic Name'] = [
  {
    id: 'assess_yourtopic_1',
    question: 'What is the main...?',
    type: 'multiple-choice',
    topic: 'Your Topic Name',
    difficulty: 'medium',
    expectedTimeSeconds: 60,
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'A',
    points: 10
  }
];
```

2. **Assign Topic to Participant**
```typescript
// In mockData.ts or your data source
researchTopic: 'Your Topic Name'
```

### Adjusting Cognitive Load Weights

Edit `cognitiveLoadService.ts`:
```typescript
const overallLoad = 
  (normalizedLearningTime * 0.20) +    // Change these weights
  (normalizedInteractions * 0.15) +    // to adjust scoring
  (normalizedClarifications * 0.20) +  // Total must = 1.0
  (normalizedAssessmentTime * 0.25) +
  (inverseAccuracy * 0.20);
```

### Customizing UI

**Colors:**
- Learning: Purple-to-pink gradient
- Assessment: Orange-to-amber gradient  
- Results: Varies by score category

**Timing:**
- Default learning: No time limit
- Assessment: Per-question time limits in questionsData
- Warning threshold: expectedTimeSeconds * 1.5

**Chatbot:**
- Currently simulated responses
- Replace `simulateChatbotResponse()` with real API call

## File Structure

```
src/
├── components/
│   ├── LearningPhase.tsx          # NEW: Learning interface
│   ├── AssessmentPhase.tsx        # NEW: Assessment interface
│   ├── CognitiveLoadResults.tsx   # NEW: Results display
│   └── ParticipantDashboard.tsx   # UPDATED: Integrated new phases
├── services/
│   └── cognitiveLoadService.ts    # NEW: Calculation logic
├── data/
│   └── questionsData.ts           # NEW: Sample questions
├── types/
│   └── index.ts                   # UPDATED: New types added
└── ...
```

## API Integration Points

### Future Backend Endpoints

**POST /api/learning-phase**
```json
{
  "participantId": "string",
  "learningData": {
    "topic": "string",
    "totalTime": "number",
    "interactions": "number",
    ...
  }
}
```

**POST /api/assessment**
```json
{
  "participantId": "string",
  "responses": [
    {
      "questionId": "string",
      "answer": "string",
      "timeTaken": "number",
      ...
    }
  ]
}
```

**GET /api/cognitive-load/:participantId**
```json
{
  "metrics": {
    "overallScore": "number",
    "category": "string",
    "learningPhase": {...},
    "assessmentPhase": {...}
  }
}
```

## Troubleshooting

### Issue: "Missing learning or assessment data"
**Solution:** Ensure you complete both learning and assessment phases before viewing results.

### Issue: Questions don't load
**Solution:** Check that the topic name exactly matches in `questionsData.ts`:
```typescript
// Must match exactly
participant.researchTopic === 'Renewable Energy Innovation'
```

### Issue: Chatbot doesn't respond
**Solution:** Currently using simulated responses. Integrate real API for production:
```typescript
// Replace in LearningPhase.tsx
const response = await callRealChatbotAPI(message);
```

### Issue: Cognitive load seems wrong
**Solution:** Check normalization ranges in `cognitiveLoadService.ts`:
```typescript
// Adjust these max values based on your data
const maxLearningTime = 1800; // 30 minutes
const maxInteractions = 50;
const maxClarifications = 20;
```

## Next Steps

1. **Test with real participants**
   - Gather baseline data
   - Validate scoring algorithm
   - Adjust weights if needed

2. **Integrate real chatbot**
   - OpenAI GPT-4
   - Anthropic Claude
   - Custom model

3. **Add more topics**
   - Create question banks
   - Build admin interface for management
   - Import/export functionality

4. **Analyze correlation**
   - Cognitive load vs creativity scores
   - Platform comparison (ChatGPT vs Google)
   - Topic difficulty analysis

## Support

For detailed documentation, see:
- **COGNITIVE_LOAD_SYSTEM.md** - Complete system documentation
- **README.md** - General project information
- **types/index.ts** - TypeScript type definitions

---

**Quick Start Version**: 1.0.0  
**Last Updated**: December 2024  
**Status**: Ready for Testing
