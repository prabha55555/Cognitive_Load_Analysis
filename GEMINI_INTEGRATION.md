# Gemini AI Integration for Creativity Assessment

## Overview
This document describes the integration of Google's Gemini AI for topic-specific creativity assessments with cognitive load measurement.

## Features Implemented

### 1. AI-Powered Question Generation
- **Service**: `geminiService.ts`
- **Function**: `generateCreativityQuestions(topic, notes)`
- **Output**: 3 creativity questions based on the user's research topic and notes
- **Question Types**:
  - **Fluency**: Tests ability to generate many ideas quickly
  - **Originality**: Tests uniqueness and novelty of thinking
  - **Divergent**: Tests ability to see multiple perspectives

### 2. AI-Based Response Evaluation
- **Function**: `evaluateCreativityResponse(question, response, timeSpent)`
- **Evaluation Criteria**:
  - **Relevance Score** (0-100): How well the response relates to the topic
  - **Creativity Score** (0-100): Originality and innovativeness
  - **Depth Score** (0-100): Thoroughness and complexity of thinking
  - **Coherence Score** (0-100): Logical flow and structure
  - **Time Efficiency** (0-100): Quality relative to time taken

### 3. Cognitive Load Indicators
Each evaluation includes cognitive load metrics:
- **Processing Speed** (0-100): Speed of response generation
- **Mental Effort** (0-100): Cognitive resources required
- **Cognitive Strain** (0-100): Overall difficulty experienced

### 4. AI Feedback
- Personalized feedback on each response
- Strengths identified
- Areas for improvement suggested

## Components Updated

### CreativityTest.tsx
**Before**:
- Accepted a single test object
- Simple scoring algorithm
- No AI evaluation

**After**:
- Accepts topic and notes
- Generates questions using Gemini AI
- Evaluates responses with AI
- Shows 3 questions per session
- Displays cognitive load indicators
- Progress tracking across multiple questions

**Key Features**:
- Real-time timer for each question
- Word count and unique word tracking
- AI evaluation loading states
- Beautiful gradient UI with question type indicators

### CognitiveLoadResults.tsx
**Added Section**: Creativity Assessment Results
- Displays AI evaluation scores with visual progress bars
- Shows AI feedback for each question
- Cognitive load indicators visualization
- Overall creativity summary with average scores
- Assessment categories: 🌟 Excellent (80+), ✨ Very Good (65+), 💫 Good (50+), ⭐ Developing (<50)

### ParticipantDashboard.tsx
**Updated**:
- Added `creativityEvaluations` state to store AI evaluations
- Updated `handleCreativityComplete` to accept evaluations
- Passes topic and notes to CreativityTest
- Displays evaluation count in completion summary
- Passes evaluations to CognitiveLoadResults

## API Setup

### 1. Get API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key

### 2. Configure Environment
Create a `.env` file in the project root:
```env
VITE_GEMINI_API_KEY=your_api_key_here
```

### 3. Security Notes
- Never commit `.env` to version control
- API key is only used in the browser (client-side)
- Consider implementing rate limiting for production
- Monitor API usage in Google Cloud Console

## Data Flow

```
1. User completes reading/note-taking phase
   ↓
2. User answers assessment questions
   ↓
3. Assessment results displayed
   ↓
4. User proceeds to Creativity Test
   ↓
5. CreativityTest calls geminiService.generateCreativityQuestions(topic, notes)
   ↓
6. Gemini AI generates 3 topic-specific questions
   ↓
7. User answers Question 1 → geminiService.evaluateCreativityResponse()
   ↓
8. AI evaluates response with scores + cognitive load indicators
   ↓
9. Repeat for Questions 2 and 3
   ↓
10. All evaluations stored in creativityEvaluations state
   ↓
11. CognitiveLoadResults displays:
    - Assessment results
    - Creativity evaluations with AI feedback
    - Cognitive load indicators
    - Overall summary
```

## Example Evaluation Output

```typescript
{
  score: 85,
  relevanceScore: 90,
  creativityScore: 80,
  depthScore: 85,
  coherenceScore: 88,
  timeEfficiencyScore: 82,
  feedback: "Your response demonstrates excellent understanding of the topic with creative insights. The examples provided are relevant and well-explained.",
  strengths: [
    "Strong connection to the topic",
    "Creative perspective",
    "Well-structured response"
  ],
  improvements: [
    "Could explore more diverse viewpoints",
    "Add more specific examples"
  ],
  cognitiveLoadIndicators: {
    processingSpeed: 75,    // Fast response = lower cognitive load
    mentalEffort: 60,        // Good quality/time ratio = moderate effort
    cognitiveStrain: 55      // Overall manageable difficulty
  }
}
```

## Fallback Mechanisms

### Question Generation Fallback
If Gemini API fails, system uses pre-defined fallback questions:
```typescript
{
  type: 'fluency',
  question: "List as many uses as you can for the concepts...",
  timeLimit: 180
}
```

### Evaluation Fallback
If AI evaluation fails, uses basic scoring algorithm:
- Word count
- Unique word count
- Response length
- Default cognitive load values

## Error Handling

All Gemini API calls are wrapped in try-catch blocks:
- Network errors → Fallback responses
- API errors → Console logging + fallback
- Invalid responses → Parse fallback data
- Timeout errors → Default values

## Cognitive Load Calculation

The creativity cognitive load indicators are calculated based on:

1. **Processing Speed**:
   - Expected time vs actual time
   - Faster = higher processing speed score

2. **Mental Effort**:
   - Quality scores vs time spent
   - High quality in short time = lower effort score

3. **Cognitive Strain**:
   - Combination of all evaluation scores
   - Response length and complexity
   - Overall difficulty assessment

## Future Enhancements

### Planned Features:
1. **Multi-modal Analysis**: Support for image/audio responses
2. **Comparative Analysis**: Compare creativity across different topics
3. **Longitudinal Tracking**: Track creativity improvement over time
4. **Custom Question Templates**: Admin-defined question patterns
5. **Real-time Suggestions**: AI hints during response composition
6. **Collaborative Creativity**: Group creativity assessments
7. **Adaptive Difficulty**: Adjust question difficulty based on performance

### Technical Improvements:
1. Server-side API calls for security
2. Response caching to reduce API costs
3. Streaming responses for faster feedback
4. Batch evaluation for multiple questions
5. Advanced prompt engineering for better evaluations

## Testing

### Manual Testing Checklist:
- [ ] API key configuration works
- [ ] Questions generated based on topic
- [ ] All 3 questions display correctly
- [ ] Timer counts down properly
- [ ] Response submission works
- [ ] AI evaluation displays
- [ ] Cognitive load indicators show
- [ ] Navigation between questions works
- [ ] Results page shows all evaluations
- [ ] Fallback works without API key

### Test Scenarios:
1. **Valid API Key**: Full AI functionality
2. **Invalid API Key**: Fallback questions/evaluation
3. **Network Offline**: Graceful degradation
4. **Long Responses**: Handle large text
5. **Quick Responses**: Calculate cognitive load correctly
6. **Multiple Sessions**: State management correct

## Troubleshooting

### Common Issues:

**Issue**: "Cannot find module '@google/generative-ai'"
- **Solution**: Run `npm install @google/generative-ai`

**Issue**: API returns 400 Bad Request
- **Solution**: Check API key is correct and has proper permissions

**Issue**: Questions not generated
- **Solution**: Check console for errors, verify topic and notes are passed

**Issue**: Evaluation fails silently
- **Solution**: Check fallback evaluation is working, verify response format

**Issue**: Cognitive load indicators show 0
- **Solution**: Verify time tracking is working, check evaluation response

## Resources

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Gemini API Quickstart](https://ai.google.dev/tutorials/quickstart)
- [API Pricing](https://ai.google.dev/pricing)
- [Best Practices](https://ai.google.dev/docs/best_practices)

## License & Attribution

This implementation uses Google's Gemini AI API. Please review:
- [Google AI Terms of Service](https://ai.google.dev/terms)
- [Generative AI Prohibited Use Policy](https://policies.google.com/terms/generative-ai/use-policy)

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: Development Team
