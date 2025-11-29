# Application Flow Documentation

This document describes the complete user journey through the Cognitive Load Analysis Platform.

---

## High-Level Flow Diagram

```
┌─────────────┐    ┌─────────┐    ┌───────────────────┐    ┌────────────────┐
│  Landing    │ →  │  Login  │ →  │ Platform Selection│ →  │ Research Phase │
│    Page     │    │         │    │ (ChatGPT/Google)  │    │  (15 minutes)  │
└─────────────┘    └─────────┘    └───────────────────┘    └───────┬────────┘
                                                                    │
                                                                    ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────────────┐
│  Completed  │ ←  │  Creativity  │ ←  │   Results   │ ←  │  Assessment    │
│   Screen    │    │     Test     │    │   Display   │    │    Phase       │
└─────────────┘    └──────────────┘    └─────────────┘    └────────────────┘
```

---

## Phase 1: Landing Page

**Component:** `LandingPage.tsx`

### Description
The entry point of the application that introduces the EEG Research Platform study.

### Features
- Animated background with gradient effects
- Study overview and benefits
- Step-by-step process explanation
- "Join Study" call-to-action button
- Live study status indicator

### User Actions
| Action | Result |
|--------|--------|
| Click "Join Study" | Navigates to Login page |

### Data Flow
```
LandingPage → onJoinStudy() → App.tsx sets showLanding=false
```

---

## Phase 2: Login

**Component:** `Login.tsx`

### Description
Authentication screen where users enter their credentials and select their role.

### Features
- Name and email input fields
- Role selection (Participant / Admin)
- Form validation
- Animated UI elements

### User Actions
| Action | Result |
|--------|--------|
| Enter name/email | Validates input |
| Select "Participant" | Creates participant session |
| Select "Admin" | Grants admin access |
| Submit form | Authenticates and routes to dashboard |

### Data Flow
```
Login Form Submit
    │
    ├─► Participant Role
    │       │
    │       ├─► Check existing participant by email
    │       │       │
    │       │       ├─► Found: Use existing participant data
    │       │       └─► Not Found: Create new participant
    │       │               ├─► Random platform assignment (ChatGPT/Google)
    │       │               └─► Random research topic assignment
    │       │
    │       └─► Navigate to /participant
    │
    └─► Admin Role
            │
            └─► Navigate to /admin
```

### New Participant Creation
```typescript
{
  id: `p${Date.now()}`,
  name: inputName,
  email: inputEmail,
  assignedPlatform: random('chatgpt' | 'google'),
  currentPhase: 'research',
  sessionStart: new Date(),
  researchTopic: randomTopic.title,
  cognitiveLoadScore: 0,
  creativityScore: 0,
  isActive: true
}
```

---

## Phase 3: Platform Selection

**Component:** `PlatformSelection.tsx`

### Description
Allows participants to choose their research platform before starting the study.

### Available Platforms

| Platform | Description | Features |
|----------|-------------|----------|
| **ChatGPT** | AI-powered research assistant | Direct Q&A, Real-time monitoring, Structured tracking |
| **Google Search** | Traditional web search | Search behavior analytics, EEG integration ready |

### User Actions
| Action | Result |
|--------|--------|
| Select ChatGPT | Routes to ChatGPTInterface |
| Select Google | Routes to GoogleSearchInterface |
| View API Status | Shows API key configuration |

### Data Flow
```
Platform Selection
    │
    ├─► ChatGPT Selected
    │       │
    │       ├─► Check Gemini API availability
    │       └─► Load ChatGPTInterface component
    │
    └─► Google Selected
            │
            └─► Load GoogleSearchInterface component
```

---

## Phase 4: Research Phase

**Component:** `ResearchInterface.tsx` + (`ChatGPTInterface.tsx` | `GoogleSearchInterface.tsx`)

### Description
The main research phase where participants have 15 minutes to research their assigned topic.

### Timer System
- **Duration:** 15 minutes (900 seconds)
- **Auto-complete:** Triggers when timer reaches 0
- **Display:** Shows remaining time in MM:SS format

### ChatGPT Interface Features

| Feature | Description |
|---------|-------------|
| Streaming Responses | Real-time AI response display |
| Topic Validation | Validates queries against research topic |
| Custom Topic Mode | Allows changing research topic |
| Query Analytics | Tracks search behavior and patterns |
| Conversation History | Maintains chat context |

### Google Search Interface Features

| Feature | Description |
|---------|-------------|
| Search Tracking | Records all search queries |
| Behavior Analytics | Tracks click patterns and time spent |
| Results Display | Shows search results |

### Data Tracked
```typescript
{
  queries: string[],           // All search/chat queries
  notes: string,               // User's research notes
  timeSpent: number,           // Total time in seconds
  interactionCount: number,    // Number of interactions
  clarificationRequests: string[] // Off-topic queries
}
```

### User Actions
| Action | Result |
|--------|--------|
| Submit query | Sends to AI/Search, tracks analytics |
| Take notes | Saves to session data |
| Wait for timer | Auto-advances to Assessment |
| Change topic | Updates research focus |

### Data Flow
```
Research Phase
    │
    ├─► User submits query
    │       │
    │       ├─► Validate topic relevance
    │       │       │
    │       │       ├─► Relevant: Process normally
    │       │       └─► Off-topic: Guide back to topic
    │       │
    │       ├─► Send to Gemini API (streaming)
    │       │       │
    │       │       ├─► Success: Stream response
    │       │       └─► Error: Retry (3x) → Fallback
    │       │
    │       └─► Track interaction analytics
    │
    └─► Timer expires OR Manual complete
            │
            └─► onComplete(readingContent, notes)
                    │
                    └─► Advance to Assessment Phase
```

---

## Phase 5: Assessment Phase

**Component:** `AssessmentPhase.tsx`

### Description
Participants answer AI-generated questions based on their research topic to measure learning.

### Question Generation
```
Research Topic
    │
    ├─► Call geminiService.generateAssessmentQuestions()
    │       │
    │       ├─► Generate 5 multiple-choice questions
    │       │       │
    │       │       ├─► 2 EASY questions (basic facts)
    │       │       ├─► 2 MEDIUM questions (understanding)
    │       │       └─► 1 HARD question (application)
    │       │
    │       └─► Return structured questions with options
    │
    └─► Display questions sequentially
```

### Question Types
| Type | Description | Time Limit |
|------|-------------|------------|
| Multiple Choice | 4 options, 1 correct | 30-60 seconds |
| Short Answer | Text input | 90 seconds |
| Descriptive | Long-form response | 150-240 seconds |

### Metrics Tracked
```typescript
{
  questionId: string,
  startTime: Date,
  endTime: Date,
  timeTaken: number,        // seconds
  answer: string,
  isCorrect: boolean,
  score: number,
  difficulty: 'easy' | 'medium' | 'hard'
}
```

### User Actions
| Action | Result |
|--------|--------|
| Select answer | Records response and time |
| Submit | Moves to next question |
| Complete all | Advances to Results |

### Data Flow
```
Assessment Phase
    │
    ├─► Load questions from Gemini AI
    │
    ├─► For each question:
    │       │
    │       ├─► Display question
    │       ├─► Start timer
    │       ├─► Wait for answer selection
    │       ├─► Record: time, answer, correctness
    │       └─► Calculate score
    │
    └─► All questions completed
            │
            └─► onComplete(responses[])
                    │
                    └─► Advance to Results Phase
```

---

## Phase 6: Results Display

**Component:** `CognitiveLoadResults.tsx`

### Description
Displays the calculated cognitive load metrics based on assessment performance.

### Cognitive Load Calculation

```typescript
// Factors considered:
1. Learning Time Score (normalized 300-1800 seconds)
2. Interaction Count Score (normalized 0-20 interactions)
3. Clarification Requests Score
4. Assessment Time Score
5. Accuracy Score (inverse - better accuracy = lower load)

// Weights:
- Learning Time: 20%
- Interactions: 20%
- Clarifications: 15%
- Assessment Time: 25%
- Accuracy: 20%

// Categories:
0-30:  Low
31-50: Moderate
51-70: High
71-100: Very High
```

### Displayed Metrics
| Metric | Description |
|--------|-------------|
| Overall Score | 0-100 cognitive load score |
| Category | Low/Moderate/High/Very High |
| Assessment Time | Total time spent on questions |
| Accuracy | Percentage of correct answers |
| Questions Answered | Count of completed questions |
| Recommendations | Personalized learning suggestions |

### User Actions
| Action | Result |
|--------|--------|
| Review results | View detailed metrics |
| Continue | Advances to Creativity Test |

### Data Flow
```
Results Phase
    │
    ├─► Calculate cognitive load from assessment data
    │       │
    │       ├─► cognitiveLoadService.calculateCognitiveLoad()
    │       └─► Generate recommendations
    │
    ├─► Display results with visualizations
    │
    └─► onComplete(cognitiveLoadScore)
            │
            └─► Advance to Creativity Test Phase
```

---

## Phase 7: Creativity Test

**Component:** `CreativityTest.tsx`

### Description
Assesses creative thinking ability through AI-generated creativity challenges.

### Question Types
| Type | Description | Example |
|------|-------------|---------|
| Fluency | Generate many ideas | "List unusual uses for a paperclip" |
| Originality | Create unique solutions | "Design a new transportation system" |
| Divergent | Explore consequences | "What if gravity was 50% weaker?" |

### AI Evaluation Criteria
```typescript
{
  relevanceScore: number,    // Topic relevance (0-100)
  creativityScore: number,   // Originality (0-100)
  depthScore: number,        // Detail level (0-100)
  coherenceScore: number,    // Logical flow (0-100)
  timeEfficiencyScore: number // Time usage (0-100)
}
```

### User Actions
| Action | Result |
|--------|--------|
| Write response | Tracks time and content |
| Submit | Sends to AI for evaluation |
| Complete all | Calculates creativity score |

### Data Flow
```
Creativity Test Phase
    │
    ├─► Generate creativity questions
    │       │
    │       └─► geminiService.generateCreativityQuestions()
    │
    ├─► For each question:
    │       │
    │       ├─► Display question with timer
    │       ├─► Collect written response
    │       ├─► Send to AI for evaluation
    │       │       │
    │       │       └─► geminiService.evaluateCreativityResponse()
    │       │
    │       └─► Store evaluation scores
    │
    └─► All questions completed
            │
            ├─► Calculate average creativity score
            └─► onComplete(responses[], evaluations[])
                    │
                    └─► Advance to Completed Phase
```

---

## Phase 8: Completed

**Component:** `ParticipantDashboard.tsx` (completed state)

### Description
Final screen showing comprehensive results from the entire study session.

### Final Scores Displayed
| Score | Source |
|-------|--------|
| Cognitive Load Score | From assessment phase |
| Creativity Score | Average of creativity evaluations |
| Session Duration | Total time from start |

### Data Persistence
- All metrics logged to console
- Ready for backend integration
- Can export to analytics service

---

## State Management

### App-Level State (`App.tsx`)

```typescript
const [currentUser, setCurrentUser] = useState<{
  email: string;
  name: string;
  type: 'participant' | 'admin';
  participant?: Participant;
} | null>(null);

const [showLanding, setShowLanding] = useState(true);
```

### Phase Transitions

```typescript
handlePhaseComplete(phase: string) {
  // Updates participant.currentPhase
  // Triggers component re-render
  // Routes to appropriate phase component
}
```

### Phase State Machine

```
login → research → assessment → results → creativity_test → completed
```

---

## Error Handling

### API Failures
1. **Retry Mechanism:** 3 attempts with exponential backoff
2. **Fallback Responses:** Pre-generated content when API unavailable
3. **User Feedback:** Clear error messages and retry status

### Validation Errors
1. **Topic Validation:** Guides users back to relevant queries
2. **Form Validation:** Input requirements enforced
3. **Session Validation:** Prevents invalid state transitions

---

## Analytics Events

| Event | Trigger | Data Captured |
|-------|---------|---------------|
| `session_start` | Login complete | participant_id, platform, topic |
| `query_submitted` | Chat/search query | query_text, timestamp, relevance |
| `assessment_answer` | Question answered | question_id, time_taken, correct |
| `creativity_response` | Creativity submitted | response_text, evaluation_scores |
| `session_complete` | Study finished | all_scores, total_duration |

---

## Related Documentation

- [Codebase Index](./CODEBASE_INDEX.md) - Project structure
- [UI Components](./UI_COMPONENTS.md) - Component details
- [Architecture](../ARCHITECTURE.md) - System design
