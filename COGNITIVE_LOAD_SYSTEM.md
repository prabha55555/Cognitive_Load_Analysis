# Cognitive Load Measurement System

## Overview
This system measures cognitive load during the research learning process by tracking multiple metrics including learning time, interactions, assessment performance, and response accuracy.

## System Flow

### Phase 1: Research Phase
- Participant uses ChatGPT or Google Search to research their assigned topic
- Can set custom topics using the Edit button in the interface
- Topic changes are synchronized across components
- Duration: Variable based on research needs
- **Next**: Learning Phase

### Phase 2: Learning Phase
- Displays topic-specific questions and answers
- Interactive chatbot for clarifications and doubts
- Tracks the following metrics:
  - **Total Learning Time**: Time spent reviewing content
  - **Chatbot Interactions**: Number of messages sent to chatbot
  - **Questions Viewed**: Which Q&A pairs were expanded
  - **Clarifications Asked**: Specific questions to the chatbot
  - **Interaction Timestamps**: Timing of each interaction
- **Next**: Assessment Phase

### Phase 3: Assessment Phase
- Multiple question types:
  - **Multiple Choice**: Single correct answer
  - **Short Answer**: Brief text responses
  - **Descriptive**: Longer detailed answers (word count tracked)
- Tracks per-question metrics:
  - **Time Taken**: Seconds spent on each question
  - **Warning System**: Alerts if exceeding expected time
  - **Correctness**: Compared against answer key
  - **Score**: Points based on accuracy and completeness
- **Next**: Results Phase

### Phase 4: Results Phase
- Displays comprehensive cognitive load analysis
- Shows metrics from both learning and assessment phases
- Provides personalized recommendations
- **Next**: Creativity Test

### Phase 5: Creativity Test
- Original creativity assessment (unchanged)
- Multiple tests with scoring
- **Next**: Completed

### Phase 6: Completed
- Final summary of entire session
- All scores and metrics displayed

## Cognitive Load Calculation

### Formula
The cognitive load score (0-100) is calculated using weighted factors:

```typescript
overallCognitiveLoad = 
  (learningTimeScore × 0.20) +
  (interactionScore × 0.15) +
  (clarificationScore × 0.20) +
  (assessmentTimeScore × 0.25) +
  (accuracyScore × 0.20)
```

### Weight Distribution
- **Learning Time (20%)**: Longer time may indicate difficulty understanding
- **Interaction Count (15%)**: More interactions suggest engagement
- **Clarifications (20%)**: More clarifications indicate confusion
- **Assessment Time (25%)**: Time pressure is a major load factor
- **Accuracy (20%)**: Lower accuracy suggests higher cognitive load

### Normalization
All metrics are normalized to 0-100 scale using:
- **Min-Max Normalization**: For time-based metrics
- **Linear Scaling**: For count-based metrics
- **Inverse Scaling**: For accuracy (low accuracy = high load)

### Categories
- **Low Load (0-25)**: Efficient learning, quick understanding
- **Moderate Load (26-50)**: Normal learning pace, good comprehension
- **High Load (51-75)**: Significant effort required, multiple clarifications
- **Very High Load (76-100)**: Struggled with content, extended time needed

## Recommendations System

The system provides personalized recommendations based on performance:

### For High Cognitive Load
- "Consider breaking down complex topics into smaller sections"
- "Take more time in the learning phase before starting assessment"
- "Use the chatbot more actively for clarifications"
- "Review foundational concepts before advancing"

### For Low Accuracy
- "Review the learning materials more thoroughly"
- "Ask more clarifying questions during learning"
- "Spend more time understanding key concepts"

### For Time Management
- "Practice time management during assessments"
- "Review simpler questions first, then tackle complex ones"
- "Don't rush through descriptive questions"

## Data Structure

### Learning Phase Data
```typescript
{
  participantId: string;
  topic: string;
  startTime: Date;
  endTime: Date;
  totalLearningTime: number; // seconds
  chatbotInteractions: number;
  questionsViewed: string[];
  clarificationsAsked: string[];
  interactionTimestamps: Date[];
}
```

### Assessment Response
```typescript
{
  participantId: string;
  questionId: string;
  startTime: Date;
  endTime: Date;
  timeTaken: number; // seconds
  answer: string;
  isCorrect: boolean;
  score: number;
}
```

### Cognitive Load Metrics
```typescript
{
  participantId: string;
  topic: string;
  learningPhase: {
    totalTime: number;
    interactionCount: number;
    averageInteractionTime: number;
    clarificationRequests: number;
  };
  assessmentPhase: {
    totalTime: number;
    averageTimePerQuestion: number;
    questionsAnswered: number;
    descriptiveQuestionsTime: number;
    totalScore: number;
    accuracy: number; // percentage
  };
  overallCognitiveLoad: number; // 0-100
  cognitiveLoadCategory: 'Low' | 'Moderate' | 'High' | 'Very High';
  timestamp: Date;
}
```

## Sample Topics

### 1. Renewable Energy Innovation
- 5 learning Q&A pairs (easy to hard)
- 6 assessment questions (mixed types)
- Categories: Fundamentals, Technology, Benefits, Challenges

### 2. Artificial Intelligence
- 3 learning Q&A pairs
- 6 assessment questions
- Categories: Basics, Machine Learning, Applications, Ethics

### 3. Climate Change
- 2 learning Q&A pairs
- 6 assessment questions
- Categories: Science, Impacts, Solutions

## Adding New Topics

### Step 1: Add Learning Content
In `src/data/questionsData.ts`:

```typescript
learningContent['Your Topic'] = [
  {
    id: 'learn_yourtopic_1',
    topic: 'Your Topic',
    question: 'Question text?',
    answer: 'Detailed answer...',
    difficulty: 'easy', // or 'medium', 'hard'
    category: 'Category Name'
  },
  // Add more Q&A pairs
];
```

### Step 2: Add Assessment Questions
```typescript
assessmentQuestions['Your Topic'] = [
  {
    id: 'assess_yourtopic_1',
    question: 'Question text?',
    type: 'multiple-choice', // or 'short-answer', 'descriptive'
    topic: 'Your Topic',
    difficulty: 'medium',
    expectedTimeSeconds: 60,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: 'Option A',
    points: 10
  },
  // Add more questions
];
```

## UI Components

### LearningPhase Component
- **Left Panel**: Q&A display with expand/collapse
- **Right Panel**: Chatbot for questions
- **Header**: Timer and progress bar
- **Footer**: Navigation buttons

### AssessmentPhase Component
- **Question Display**: Shows one question at a time
- **Timer**: Per-question time tracking
- **Warning**: Red border if exceeding expected time
- **Navigation**: Previous/Next buttons
- **Submit**: Final submission and scoring

### CognitiveLoadResults Component
- **Overall Score**: Large display with category badge
- **Metrics Grid**: Learning and assessment breakdowns
- **Recommendations**: Personalized feedback
- **Performance Summary**: Quick insights
- **Continue Button**: Proceed to creativity test

## Integration Points

### ParticipantDashboard
- Updated to include new phases
- State management for learning and assessment data
- Phase progression logic
- Results display integration

### Participant Type
- Added optional fields:
  - `learningData?: LearningPhaseData`
  - `assessmentResponses?: AssessmentResponse[]`
  - `cognitiveLoadMetrics?: CognitiveLoadMetrics`
- Extended `currentPhase` to include:
  - `'learning'`
  - `'assessment'`
  - `'results'`

## Future Enhancements

1. **Real Chatbot Integration**
   - Replace simulated responses with actual AI
   - Connect to OpenAI, Anthropic, or custom LLM

2. **Admin Interface**
   - Manage topics and questions via UI
   - Export/import question banks
   - Analytics dashboard

3. **Advanced Analytics**
   - Compare cognitive load across platforms
   - Correlation with creativity scores
   - Topic difficulty analysis

4. **Adaptive Assessment**
   - Adjust question difficulty based on performance
   - Personalized question selection
   - Dynamic time limits

5. **Multi-language Support**
   - Translate questions and content
   - Language-specific cognitive load factors

6. **Mobile Optimization**
   - Responsive design improvements
   - Touch-friendly interactions
   - Progressive Web App

## Testing

### Manual Testing Steps
1. Start with a participant in research phase
2. Complete research and proceed to learning
3. View Q&A pairs and interact with chatbot
4. Complete learning and proceed to assessment
5. Answer all assessment questions
6. View results with cognitive load score
7. Verify recommendations are relevant
8. Continue to creativity test
9. Complete session

### Metrics to Verify
- Learning time is accurate
- Chatbot interaction count is correct
- Assessment scores match answer key
- Cognitive load calculation is reasonable
- Category assignment makes sense
- All data persists between phases

## Troubleshooting

### Common Issues

**Q: Results show "Missing learning or assessment data"**
A: Ensure learningData and assessmentResponses are set before reaching results phase

**Q: Cognitive load score seems incorrect**
A: Check normalization ranges in cognitiveLoadService.ts

**Q: Chatbot doesn't respond**
A: Currently using simulated responses; integrate real API for production

**Q: Questions not loading**
A: Verify topic name matches exactly in questionsData.ts

**Q: Time tracking seems off**
A: Check that startTime and endTime are set correctly in components

## Support

For questions or issues with the cognitive load measurement system:
- Check this documentation first
- Review TypeScript types in `src/types/index.ts`
- Examine service logic in `src/services/cognitiveLoadService.ts`
- Test with sample data in `src/data/questionsData.ts`

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Complete and Integrated
