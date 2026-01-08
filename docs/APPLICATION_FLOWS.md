# Application Flow Documentation

**Last Updated**: January 8, 2026  
**Purpose**: Complete documentation of user journeys and data flows across ChatGPT platform, Google Search platform, and Researcher dashboard

---

## Table of Contents
1. [Overall System Architecture](#overall-system-architecture)
2. [ChatGPT Research Platform Flow](#chatgpt-research-platform-flow)
3. [Google Search Research Platform Flow](#google-search-research-platform-flow)
4. [Researcher Dashboard Flow](#researcher-dashboard-flow)
5. [Data Flow & Services](#data-flow--services)
6. [File Reference Map](#file-reference-map)

---

## Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + TypeScript + Vite)                 │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Landing     │→│    Login     │→│ Participant  │→│   Results    │   │
│  │  Page        │  │              │  │  Dashboard   │  │              │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│         │                  │                   │                             │
│         │                  └───────────────────┼─────────────────────┐      │
│         │                                      │                     │      │
│  ┌──────▼──────────┐               ┌──────────▼──────────┐  ┌──────▼──────┐│
│  │ Admin Dashboard │               │  ChatGPT Interface  │  │   Google    ││
│  │                 │               │  (Gemini API)       │  │  Search UI  ││
│  └─────────────────┘               └─────────────────────┘  └─────────────┘│
│                                                                              │
│  Context Providers: SessionContext, AuthContext                             │
│  Services: interactionTracker, cognitiveLoadService, dataPersistenceService │
└─────────────────────────────────┬────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌──────────────────┐  ┌──────────────────────┐  ┌────────────────────────┐
│ FastAPI Service  │  │ Express.js Server    │  │ Google Gemini API      │
│ (Port 8000)      │  │ (Port 3001)          │  │ (External)             │
├──────────────────┤  ├──────────────────────┤  ├────────────────────────┤
│ Behavioral Data: │  │ ⚠️ TODO Routes:      │  │ • Chat streaming       │
│ • /interactions  │  │ • /auth/*            │  │ • Question generation  │
│ • /classify      │  │ • /sessions/*        │  │ • Topic validation     │
│ • /compare       │  │ • /assessments/*     │  │ • Creativity eval      │
│                  │  │                      │  │                        │
│ ML Classifier:   │  │ Redis: Caching       │  │                        │
│ Rule-based + ML  │  │                      │  │                        │
└──────────────────┘  └──────────────────────┘  └────────────────────────┘
```

**Key Files**:
- Main App: [src/App.tsx](../src/App.tsx)
- Session State: [src/context/SessionContext.tsx](../src/context/SessionContext.tsx)
- Auth Context: [src/context/AuthContext.tsx](../src/context/AuthContext.tsx)

---

## ChatGPT Research Platform Flow

### Phase-by-Phase Journey

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│  Landing   │────▶│   Login    │────▶│ Participant│────▶│  Platform  │
│   Page     │     │            │     │  Dashboard │     │ Selection  │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
                                                                 │
                                                                 ▼
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│ Creativity │◀────│  Results   │◀────│ Assessment │◀────│  ChatGPT   │
│   Test     │     │  Display   │     │   Phase    │     │ Interface  │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
      │
      ▼
┌────────────┐
│ Completed  │
│   State    │
└────────────┘
```

---

### 1. Landing Page Flow
**Component**: [src/components/LandingPage.tsx](../src/components/LandingPage.tsx)

**Purpose**: First impression and study introduction

**Display Elements**:
- Study title: "Cognitive Load Research"
- Overview of research purpose
- Estimated time: 30-45 minutes
- Benefits to participants
- "Join Study" CTA button

**Actions**:
```
User clicks "Join Study"
  → Triggers: onStartStudy() callback
  → Navigates to: Login component
  → Updates App state: Current view = 'login'
```

**File Logic**: Simple presentational component with single callback prop

---

### 2. Login Flow
**Component**: [src/components/Login.tsx](../src/components/Login.tsx)

**Data Collected**:
- Name (text input)
- Email (email input with validation)
- Role selection: "Participant" or "Admin"

**Validation Logic**:
```typescript
// Email validation regex
/^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Required fields check
name.trim() && email.trim() && role
```

**On Submit Actions**:
```
Participant Role:
  1. Generate unique participant ID (UUID)
  2. Random platform assignment: "chatgpt" | "google"
  3. Random topic assignment from predefined list (questionsData.ts)
  4. Initialize session state:
     - currentPhase: 'research'
     - startTime: new Date()
     - researchData: { queries: [], notes: '', timeSpent: 0 }
     - assessmentResults: null
  5. Call: onLogin(participantData)
  6. Navigate to: ParticipantDashboard

Admin Role:
  1. Validate credentials (⚠️ TODO: Currently not implemented)
  2. Navigate to: AdminDashboard
```

**File References**:
- Auth service: [src/services/authService.ts](../src/services/authService.ts) ⚠️ Returns "Not implemented"
- Session context: [src/context/SessionContext.tsx](../src/context/SessionContext.tsx)
- Topics data: [src/data/questionsData.ts](../src/data/questionsData.ts)

---

### 3. Participant Dashboard Flow
**Component**: [src/components/ParticipantDashboard.tsx](../src/components/ParticipantDashboard.tsx)

**State Machine Logic**:
```typescript
Phases: 'research' | 'assessment' | 'results' | 'creativity' | 'completed'

Phase Transitions:
  research → assessment (after 15 min timer OR manual advance)
  assessment → results (after answering all questions)
  results → creativity (automatic)
  creativity → completed (after submission)
```

**Displayed Information**:
- Welcome message with participant name
- Current phase indicator
- Assigned research topic (with edit capability)
- Progress tracker

**Conditional Rendering**:
```
if (currentPhase === 'research'):
  → Render: <PlatformSelection /> OR <ResearchInterface />

if (currentPhase === 'assessment'):
  → Render: <AssessmentPhase />

if (currentPhase === 'results'):
  → Render: <CognitiveLoadResults />

if (currentPhase === 'creativity'):
  → Render: <CreativityTest />

if (currentPhase === 'completed'):
  → Display: Final summary with both scores
```

**File Logic**:
- Heavy state management via useState hooks
- Session synchronization with SessionContext
- Timer management for research phase
- Callback propagation for child components

---

### 4. Platform Selection Flow
**Component**: [src/components/PlatformSelection.tsx](../src/components/PlatformSelection.tsx)

**Purpose**: Allow user to choose research interface (even if pre-assigned)

**Options**:
1. ChatGPT Interface (Gemini-powered)
2. Google Search Interface

**Display**:
```
┌─────────────────────────────────────────────────┐
│  Choose Your Research Platform                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐         ┌──────────────┐     │
│  │   ChatGPT    │         │    Google    │     │
│  │   AI Chat    │         │    Search    │     │
│  │              │         │              │     │
│  │   [Select]   │         │   [Select]   │     │
│  └──────────────┘         └──────────────┘     │
│                                                 │
└─────────────────────────────────────────────────┘
```

**On Selection**:
```
User clicks platform button
  → Calls: onPlatformSelect('chatgpt' | 'google')
  → Parent (ParticipantDashboard) updates state
  → Triggers: <ResearchInterface platform={selected} />
```

**File Logic**: Simple selection UI with two buttons and callback

---

### 5. ChatGPT Interface Flow
**Component**: [src/components/ChatGPTInterface.tsx](../src/components/ChatGPTInterface.tsx)

**Timer**: 15 minutes (900 seconds) countdown

**UI Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Research Topic: [Artificial Intelligence in Healthcare]     │
│ Time Remaining: 14:32                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Chat History:                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ User: What are the main applications of AI in       │   │
│  │       healthcare?                                    │   │
│  │                                                       │   │
│  │ GPT-4: AI in healthcare has several key              │   │
│  │        applications including...                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Type your message...                    [Send]      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Notes Section:                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Take notes here...                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [ ] Custom Topic Mode                                      │
│  [Finish Research Early]                                    │
└─────────────────────────────────────────────────────────────┘
```

**Interaction Tracking Initialization**:
```typescript
useEffect(() => {
  const sessionId = generateSessionId(); // UUID
  
  // Start interaction tracker
  InteractionTracker.initialize({
    sessionId,
    platform: 'chatgpt',
    topic: researchTopic,
    enableBehavioralTracking: true
  });
  
  InteractionTracker.startTracking();
}, []);
```

**Message Flow**:
```
User types query + clicks Send
  ↓
1. Validate topic relevance (if custom mode OFF)
   → topicValidationService.validateQuery(query, topic)
   → If off-topic: Show warning, don't send
   
2. Add user message to chat history
   → messages.push({ role: 'user', content: query })
   
3. Track interaction event
   → InteractionTracker.trackEvent({
        type: 'search',
        query,
        timestamp: new Date()
      })
   
4. Call Gemini API (streaming)
   → geminiService.sendMessage(query, conversationHistory)
   → Stream response chunks to UI
   
5. Add assistant response to history
   → messages.push({ role: 'assistant', content: response })
   
6. Update research data
   → queries.push({ query, timestamp, response })
```

**Topic Validation Logic** ([src/services/topicValidationService.ts](../src/services/topicValidationService.ts)):
```typescript
// Uses Gemini API to check relevance
async validateQuery(query: string, topic: string): Promise<{
  isValid: boolean;
  confidence: number;
  suggestion?: string;
}>
```

**Services Used**:
- Gemini API: [src/services/geminiService.ts](../src/services/geminiService.ts)
- Topic Validation: [src/services/topicValidationService.ts](../src/services/topicValidationService.ts)
- Interaction Tracker: [src/services/interactionTracker.ts](../src/services/interactionTracker.ts)

**Behavioral Events Tracked**:
- Every chat message sent (search event)
- Mouse movements (throttled to 100ms)
- Clicks on interface elements
- Scroll events
- Keystroke timing (no key content)
- Note-taking activity

**Timer Expiration**:
```
When timer reaches 0:
  1. Stop interaction tracking
  2. Send final batch to behavioral service
  3. Calculate time spent
  4. Call onComplete(researchData)
  5. Parent transitions to 'assessment' phase
```

**File Dependencies**:
- [src/services/geminiService.ts](../src/services/geminiService.ts) - AI responses
- [src/services/interactionTracker.ts](../src/services/interactionTracker.ts) - Behavioral tracking
- [src/services/topicValidationService.ts](../src/services/topicValidationService.ts) - On-topic checking
- [src/hooks/useTimer.ts](../src/hooks/useTimer.ts) - Countdown timer

---

### 6. Assessment Phase Flow
**Component**: [src/components/AssessmentPhase.tsx](../src/components/AssessmentPhase.tsx)

**Question Generation**:
```
On component mount:
  1. Call assessmentGenerationService.generateQuestions(topic)
  2. Gemini API generates 5 MCQ questions
  3. Questions have difficulty levels: easy, medium, hard
  4. Each question has 4 options with 1 correct answer
```

**Question Structure**:
```typescript
interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index 0-3
  difficulty: 'easy' | 'medium' | 'hard';
}
```

**UI Flow**:
```
┌─────────────────────────────────────────────────┐
│ Question 1 of 5                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│ What is the primary advantage of using AI in   │
│ medical diagnostics?                            │
│                                                 │
│ ( ) A. Lower costs                              │
│ ( ) B. Faster processing                        │
│ (●) C. Higher accuracy                          │
│ ( ) D. Easier implementation                    │
│                                                 │
│                           [Next Question]       │
└─────────────────────────────────────────────────┘
```

**Answer Recording**:
```
For each question:
  1. Record start time
  2. User selects answer
  3. Record end time
  4. Calculate timeTaken (seconds)
  5. Check correctness
  6. Calculate score based on difficulty:
     - Easy: 10 points
     - Medium: 20 points
     - Hard: 30 points
  7. Store response:
     {
       questionId,
       answer: selectedIndex,
       isCorrect: boolean,
       timeTaken: number,
       score: number,
       earnedPoints: isCorrect ? score : 0,
       confidenceLevel: calculateConfidence(timeTaken)
     }
```

**Confidence Calculation**:
```typescript
// Based on response time
const calculateConfidence = (timeTaken: number): number => {
  if (timeTaken < 5) return 5; // Very confident (fast)
  if (timeTaken < 10) return 4;
  if (timeTaken < 20) return 3; // Moderate
  if (timeTaken < 30) return 2;
  return 1; // Low confidence (slow)
};
```

**On Completion**:
```
After answering all 5 questions:
  1. Calculate total score
  2. Calculate accuracy percentage
  3. Store assessment results in session
  4. Call onComplete(assessmentResults)
  5. Transition to 'results' phase
```

**File Dependencies**:
- [src/services/assessmentGenerationService.ts](../src/services/assessmentGenerationService.ts)
- [src/services/geminiService.ts](../src/services/geminiService.ts)

---

### 7. Results Display Flow
**Component**: [src/components/CognitiveLoadResults.tsx](../src/components/CognitiveLoadResults.tsx)

**Cognitive Load Calculation**:
```
Phase 1: Calculate Assessment-Based Metrics
  → cognitiveLoadService.calculateFromAssessment(assessmentResults)
  → Returns: 0-100 score based on:
     - Accuracy
     - Response times
     - Confidence levels

Phase 2: Try Behavioral Classification (if service available)
  → behavioralClassificationService.classify(interactionData)
  → Sends to FastAPI /api/classify endpoint
  → ML classifier returns: low/moderate/high/very-high
  → Platform comparison data from /api/compare

Phase 3: Blend Scores
  → If behavioral available:
     finalScore = (behavioralScore * 0.7) + (assessmentScore * 0.3)
  → Else:
     finalScore = assessmentScore
```

**Score Categories**:
```
0-25:   Low Cognitive Load (Green)
25-50:  Moderate Cognitive Load (Yellow)
50-75:  High Cognitive Load (Orange)
75-100: Very High Cognitive Load (Red)
```

**UI Display**:
```
┌─────────────────────────────────────────────────────────┐
│  Your Cognitive Load Assessment Results                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Overall Cognitive Load: 42/100                         │
│  Category: Moderate                                     │
│                                                         │
│  ████████████████░░░░░░░░░░░░░░░░░░░░░░░░              │
│                                                         │
│  Assessment Performance:                                │
│  • Accuracy: 80% (4/5 correct)                          │
│  • Avg Response Time: 12s                               │
│  • Total Score: 80/150 points                           │
│                                                         │
│  Behavioral Analysis:                                   │
│  • Classification: Moderate Load                        │
│  • Interaction Patterns: Normal                         │
│  • Platform Comparison: Similar to Google Search users  │
│                                                         │
│  [Continue to Creativity Test] →                        │
└─────────────────────────────────────────────────────────┘
```

**Auto-Transition**:
```
After displaying results for 5 seconds:
  → Automatically move to 'creativity' phase
  → Or user can click "Continue" button
```

**File Dependencies**:
- [src/services/cognitiveLoadService.ts](../src/services/cognitiveLoadService.ts)
- [src/services/behavioralClassificationService.ts](../src/services/behavioralClassificationService.ts)
- FastAPI: `behavioral-service/src/main.py`

---

### 8. Creativity Test Flow
**Component**: [src/components/CreativityTest.tsx](../src/components/CreativityTest.tsx)

**Question Generation**:
```
Uses Gemini API to generate 3-5 creativity questions:
  Types:
    - Divergent thinking (multiple solutions)
    - Fluency (idea generation speed)
    - Originality (unique approaches)
```

**Example Question**:
```
"Imagine AI systems could feel emotions. Describe 5 potential 
applications or consequences of emotional AI in healthcare."

Time Limit: 3 minutes
```

**UI Flow**:
```
┌─────────────────────────────────────────────────────────┐
│ Creativity Assessment - Question 1 of 3                 │
│ Time Remaining: 2:45                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [Question text displayed here]                          │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Your response...                                 │   │
│ │                                                  │   │
│ │                                                  │   │
│ │                                                  │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│                              [Submit Answer] →          │
└─────────────────────────────────────────────────────────┘
```

**Evaluation Process**:
```
On submit:
  1. Record timestamp
  2. Send response to Gemini API for evaluation
  3. AI evaluates on 5 dimensions:
     - Relevance to topic (0-100)
     - Creativity/originality (0-100)
     - Depth of thought (0-100)
     - Coherence (0-100)
     - Time efficiency (0-100)
  4. Calculate overall creativity score
  5. Store results
```

**Creativity Score Calculation**:
```typescript
Overall Score = (
  relevance * 0.25 +
  creativity * 0.30 +
  depth * 0.20 +
  coherence * 0.15 +
  timeEfficiency * 0.10
)
```

**On Completion**:
```
After all creativity questions:
  1. Calculate aggregate creativity score
  2. Store in session
  3. Call onComplete(creativityResults)
  4. Transition to 'completed' phase
```

**File Dependencies**:
- [src/services/geminiService.ts](../src/services/geminiService.ts)

---

### 9. Completion Flow

**Final Display**:
```
┌─────────────────────────────────────────────────────────┐
│  Study Complete - Thank You!                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Your Results Summary:                                  │
│                                                         │
│  ✓ Cognitive Load Score: 42/100 (Moderate)             │
│  ✓ Creativity Score: 78/100 (High)                     │
│  ✓ Total Session Time: 34 minutes                      │
│  ✓ Platform Used: ChatGPT                              │
│  ✓ Research Topic: AI in Healthcare                    │
│                                                         │
│  Your data has been recorded for research purposes.    │
│                                                         │
│  [Download Results] [Return to Dashboard]              │
└─────────────────────────────────────────────────────────┘
```

**Data Persistence** (⚠️ Current Implementation):
```typescript
// From dataPersistenceService.ts
// TODO: Implement when backend is ready
localStorage.setItem('research_sessions', JSON.stringify({
  participantId,
  sessionData,
  assessmentResults,
  creativityResults,
  cognitiveLoadMetrics,
  timestamp: new Date()
}));
```

---

## Google Search Research Platform Flow

**Key Difference**: Uses [src/components/GoogleSearchInterface.tsx](../src/components/GoogleSearchInterface.tsx) instead of ChatGPT interface

### Interface Layout
```
┌─────────────────────────────────────────────────────────┐
│ Research Topic: [Artificial Intelligence in Healthcare] │
│ Time Remaining: 14:32                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Search History:                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 1. "AI applications in medical diagnosis"       │   │
│  │    Clicked: 3 results | Time: 2m 15s           │   │
│  │                                                  │   │
│  │ 2. "machine learning healthcare examples"       │   │
│  │    Clicked: 2 results | Time: 1m 45s           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Enter search query...            [Search]       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Open Google Search in New Tab]                       │
│                                                         │
│  Notes Section:                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Take notes here...                               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Finish Research Early]                               │
└─────────────────────────────────────────────────────────┘
```

### Google Search Interaction Tracking

**Events Tracked**:
```typescript
// Search query submission
InteractionTracker.trackEvent({
  type: 'search',
  query: searchQuery,
  timestamp: new Date()
});

// Click on "Open Google" button
InteractionTracker.trackEvent({
  type: 'click',
  targetElement: 'google-search-button',
  timestamp: new Date()
});

// Manual result click logging (user self-reports)
InteractionTracker.trackEvent({
  type: 'click',
  targetElement: 'search-result',
  resultUrl: clickedUrl,
  timestamp: new Date()
});

// Note-taking
InteractionTracker.trackEvent({
  type: 'input',
  targetElement: 'notes-textarea',
  timestamp: new Date()
});
```

**Research Data Structure**:
```typescript
interface GoogleResearchData {
  queries: Array<{
    query: string;
    timestamp: Date;
    clickedResults: string[]; // URLs
    timeSpent: number; // seconds on each query
  }>;
  notes: string;
  totalTimeSpent: number;
}
```

**Behavioral Differences from ChatGPT**:
- Tracking focuses on search patterns vs. conversation flow
- External navigation (opens real Google in new tab)
- Self-reported result clicks (cannot track external page behavior)
- Different cognitive load indicators (search reformulation vs. query complexity)

**All Other Phases**: Same as ChatGPT flow (Assessment → Results → Creativity → Completion)

**File**: [src/components/GoogleSearchInterface.tsx](../src/components/GoogleSearchInterface.tsx)

---

## Researcher Dashboard Flow

### Admin Login Path
```
Landing Page → Login (select "Admin") → AdminDashboard
```

### Admin Dashboard Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  Cognitive Load Research - Admin Dashboard                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Overview Statistics:                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Total        │  │ Completed    │  │ Avg Cog Load │         │
│  │ Participants │  │ Sessions     │  │ Score        │         │
│  │     24       │  │     18       │  │   45.2       │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  Platform Comparison:                                           │
│  ┌─────────────────────────────────────────────────┐           │
│  │ ChatGPT Users: 12 | Avg Load: 42.3              │           │
│  │ Google Users:  12 | Avg Load: 48.1              │           │
│  │                                                  │           │
│  │ █████████████░░░░░░  ChatGPT                    │           │
│  │ ████████████████░░░  Google                     │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  Recent Participants:                                           │
│  ┌─────────────────────────────────────────────────┐           │
│  │ Name        │ Platform │ Load Score │ Status    │           │
│  ├─────────────┼──────────┼────────────┼───────────┤           │
│  │ John Doe    │ ChatGPT  │    38      │ Completed │           │
│  │ Jane Smith  │ Google   │    52      │ Completed │           │
│  │ Bob Wilson  │ ChatGPT  │    45      │ In Progress│          │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  [Export Data] [View Detailed Analytics] [Refresh]             │
└─────────────────────────────────────────────────────────────────┘
```

### Data Fetching Flow

**Component**: [src/components/AdminDashboard.tsx](../src/components/AdminDashboard.tsx)

```typescript
useEffect(() => {
  async function loadDashboardData() {
    try {
      // Fetch all participants
      const participants = await dataPersistenceService.getAllSessions();
      
      // Fetch platform comparison stats
      const platformStats = await behavioralClassificationService
        .comparePlatforms();
      
      // Calculate aggregate metrics
      const metrics = calculateDashboardMetrics(participants);
      
      setDashboardData(metrics);
    } catch (error) {
      // ⚠️ Fallback to mock data if API unavailable
      console.warn('Using mock data:', error);
      setDashboardData(mockDashboardData);
    }
  }
  
  loadDashboardData();
}, []);
```

### Dashboard Metrics Calculation

```typescript
interface DashboardMetrics {
  totalParticipants: number;
  completedSessions: number;
  averageCognitiveLoad: number;
  platformBreakdown: {
    chatgpt: {
      count: number;
      averageLoad: number;
      completionRate: number;
    };
    google: {
      count: number;
      averageLoad: number;
      completionRate: number;
    };
  };
  recentSessions: SessionSummary[];
}

// Calculation logic
const calculateMetrics = (sessions: Session[]): DashboardMetrics => {
  const completed = sessions.filter(s => s.currentPhase === 'completed');
  
  const chatgptSessions = completed.filter(s => s.platform === 'chatgpt');
  const googleSessions = completed.filter(s => s.platform === 'google');
  
  return {
    totalParticipants: sessions.length,
    completedSessions: completed.length,
    averageCognitiveLoad: average(completed.map(s => s.cognitiveLoadScore)),
    platformBreakdown: {
      chatgpt: {
        count: chatgptSessions.length,
        averageLoad: average(chatgptSessions.map(s => s.cognitiveLoadScore)),
        completionRate: (chatgptSessions.length / sessions.length) * 100
      },
      google: {
        count: googleSessions.length,
        averageLoad: average(googleSessions.map(s => s.cognitiveLoadScore)),
        completionRate: (googleSessions.length / sessions.length) * 100
      }
    },
    recentSessions: completed.slice(-10).reverse()
  };
};
```

### Data Export Flow

```
User clicks "Export Data"
  ↓
1. Fetch all session data
2. Format as CSV/JSON
3. Include:
   - Participant demographics
   - Session metadata
   - Cognitive load scores
   - Assessment results
   - Behavioral features (if available)
   - Creativity scores
4. Trigger browser download
```

**File Dependencies**:
- [src/components/AdminDashboard.tsx](../src/components/AdminDashboard.tsx)
- [src/services/dataPersistenceService.ts](../src/services/dataPersistenceService.ts)
- [src/data/mockData.ts](../src/data/mockData.ts) - Fallback data

**⚠️ Current Limitations**:
- No real-time updates (requires manual refresh)
- Falls back to mock data when API unavailable
- No filtering/search functionality
- Limited visualization options

---

## Data Flow & Services

### Interaction Tracking Pipeline

```
User Interaction (click, scroll, keystroke, etc.)
  ↓
InteractionTracker.trackEvent()
  ↓
Event batching (50 events or 5 seconds)
  ↓
POST to FastAPI: /api/interactions
  ↓
behavioral-service receives batch
  ↓
Feature extraction (aggregator.py)
  ↓
Classification (ml_classifier.py or rule_based.py)
  ↓
Return cognitive load level
```

**File**: [src/services/interactionTracker.ts](../src/services/interactionTracker.ts)

**Configuration**:
```typescript
const BATCH_SIZE = 50;
const BATCH_INTERVAL = 5000; // 5 seconds
const BACKEND_URL = 'http://localhost:8000';
```

### Behavioral Classification Service

**Endpoints Used**:
```
POST /api/interactions
  Body: { sessionId, events: InteractionEvent[] }
  Returns: { received: boolean }

POST /api/classify
  Body: { sessionId, platform, topic }
  Returns: {
    cognitiveLoad: 'low' | 'moderate' | 'high' | 'very-high',
    score: number,
    features: ExtractedFeatures
  }

GET /api/compare?platform={chatgpt|google}
  Returns: {
    platform: string,
    averageLoad: number,
    userLoad: number,
    comparison: 'higher' | 'lower' | 'similar'
  }
```

**File**: [src/services/behavioralClassificationService.ts](../src/services/behavioralClassificationService.ts)

### Cognitive Load Calculation

**Two-Stage Process**:

**Stage 1: Assessment-Based** ([src/services/cognitiveLoadService.ts](../src/services/cognitiveLoadService.ts))
```typescript
calculateFromAssessment(results: AssessmentResults): number {
  const accuracyScore = (correctAnswers / totalQuestions) * 50;
  const speedScore = calculateSpeedScore(responseTimes) * 30;
  const confidenceScore = averageConfidence * 20;
  
  return accuracyScore + speedScore + confidenceScore;
}
```

**Stage 2: Behavioral Blend**
```typescript
if (behavioralServiceAvailable) {
  const behavioralScore = await getBehavioralScore(sessionId);
  finalScore = (behavioralScore * 0.7) + (assessmentScore * 0.3);
} else {
  finalScore = assessmentScore;
}
```

### Data Persistence Flow (Current State)

**⚠️ Temporary Implementation** ([src/services/dataPersistenceService.ts](../src/services/dataPersistenceService.ts)):

```typescript
// Save session
async saveSession(sessionData: SessionData): Promise<void> {
  try {
    // TODO: POST to /api/sessions when backend ready
    // await apiClient.post('/sessions', sessionData);
    
    // Temporary: Use localStorage
    const sessions = JSON.parse(
      localStorage.getItem('research_sessions') || '[]'
    );
    sessions.push(sessionData);
    localStorage.setItem('research_sessions', JSON.stringify(sessions));
  } catch (error) {
    console.error('Save failed:', error);
  }
}

// Retrieve sessions
async getAllSessions(): Promise<SessionData[]> {
  try {
    // TODO: GET from /api/sessions when backend ready
    // return await apiClient.get('/sessions');
    
    // Temporary: Read from localStorage
    return JSON.parse(
      localStorage.getItem('research_sessions') || '[]'
    );
  } catch (error) {
    console.error('Retrieval failed:', error);
    return [];
  }
}
```

---

## File Reference Map

### Frontend Components
| Component | File Path | Purpose |
|-----------|-----------|---------|
| Main App | [src/App.tsx](../src/App.tsx) | Root component, routing |
| Landing Page | [src/components/LandingPage.tsx](../src/components/LandingPage.tsx) | Study introduction |
| Login | [src/components/Login.tsx](../src/components/Login.tsx) | User authentication |
| Participant Dashboard | [src/components/ParticipantDashboard.tsx](../src/components/ParticipantDashboard.tsx) | Main participant flow |
| Admin Dashboard | [src/components/AdminDashboard.tsx](../src/components/AdminDashboard.tsx) | Researcher view |
| Platform Selection | [src/components/PlatformSelection.tsx](../src/components/PlatformSelection.tsx) | Choose interface |
| ChatGPT Interface | [src/components/ChatGPTInterface.tsx](../src/components/ChatGPTInterface.tsx) | AI chat research |
| Google Interface | [src/components/GoogleSearchInterface.tsx](../src/components/GoogleSearchInterface.tsx) | Search research |
| Research Interface | [src/components/ResearchInterface.tsx](../src/components/ResearchInterface.tsx) | Wrapper for platforms |
| Assessment Phase | [src/components/AssessmentPhase.tsx](../src/components/AssessmentPhase.tsx) | MCQ questions |
| Results Display | [src/components/CognitiveLoadResults.tsx](../src/components/CognitiveLoadResults.tsx) | Score presentation |
| Creativity Test | [src/components/CreativityTest.tsx](../src/components/CreativityTest.tsx) | Creative assessment |

### Services
| Service | File Path | Purpose |
|---------|-----------|---------|
| Interaction Tracker | [src/services/interactionTracker.ts](../src/services/interactionTracker.ts) | Event capture & batching |
| Cognitive Load | [src/services/cognitiveLoadService.ts](../src/services/cognitiveLoadService.ts) | Load calculation |
| Behavioral Classification | [src/services/behavioralClassificationService.ts](../src/services/behavioralClassificationService.ts) | FastAPI communication |
| Data Persistence | [src/services/dataPersistenceService.ts](../src/services/dataPersistenceService.ts) | Session storage (TODO) |
| Gemini Service | [src/services/geminiService.ts](../src/services/geminiService.ts) | AI API calls |
| ChatGPT Service | [src/services/chatgptService.ts](../src/services/chatgptService.ts) | (Deprecated) |
| Assessment Generation | [src/services/assessmentGenerationService.ts](../src/services/assessmentGenerationService.ts) | Question creation |
| Topic Validation | [src/services/topicValidationService.ts](../src/services/topicValidationService.ts) | On-topic checking |
| Auth Service | [src/services/authService.ts](../src/services/authService.ts) | Authentication (TODO) |
| Analytics Service | [src/services/analyticsService.ts](../src/services/analyticsService.ts) | Usage tracking |

### Context & State
| Context | File Path | Purpose |
|---------|-----------|---------|
| Session Context | [src/context/SessionContext.tsx](../src/context/SessionContext.tsx) | Global session state |
| Auth Context | [src/context/AuthContext.tsx](../src/context/AuthContext.tsx) | User authentication |

### Backend Services
| Service | File Path | Purpose |
|---------|-----------|---------|
| FastAPI Main | [behavioral-service/src/main.py](../behavioral-service/src/main.py) | Behavioral API |
| Python Models | [behavioral-service/src/models.py](../behavioral-service/src/models.py) | Data models |
| Classifier | [behavioral-service/src/classifier/classifier.py](../behavioral-service/src/classifier/classifier.py) | ML/rule classifier |
| Feature Aggregator | [behavioral-service/src/features/aggregator.py](../behavioral-service/src/features/aggregator.py) | Feature extraction |
| Express Server | [server/src/index.ts](../server/src/index.ts) | Main backend (TODO) |

### Data & Types
| File | Path | Purpose |
|------|------|---------|
| TypeScript Types | [src/types/index.ts](../src/types/index.ts) | All TS interfaces |
| Questions Data | [src/data/questionsData.ts](../src/data/questionsData.ts) | Research topics |
| Mock Data | [src/data/mockData.ts](../src/data/mockData.ts) | Fallback data |

---

## Summary of Flow Issues

**🔴 CRITICAL**:
1. No real database - all data in localStorage
2. No authentication - anyone can access admin panel
3. Session state lost on browser refresh

**🟠 HIGH**:
4. Platform labeling mismatch (Gemini vs. ChatGPT)
5. Behavioral service dependency (optional but breaks features)
6. Admin dashboard uses mock data fallbacks

**🟡 MEDIUM**:
7. API keys exposed in frontend
8. Timer continues during API errors
9. Complex topic propagation callback chain

See [FLOW_IMPROVEMENTS.md](./FLOW_IMPROVEMENTS.md) for detailed fixes.

---

**End of Documentation** | *Last Updated: January 8, 2026*
