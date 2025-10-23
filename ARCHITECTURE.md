# Cognitive Load System Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE LAYER                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  Learning    │  │  Assessment  │  │   Results    │            │
│  │    Phase     │→ │    Phase     │→ │   Display    │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│         │                  │                  │                      │
│         ↓                  ↓                  ↓                      │
│  ┌──────────────────────────────────────────────────────┐          │
│  │         ParticipantDashboard (State Manager)         │          │
│  └──────────────────────────────────────────────────────┘          │
│                              │                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────────┐
│                         SERVICE LAYER                │               │
├──────────────────────────────┼───────────────────────────────────────┤
│                              ↓                                       │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │         cognitiveLoadService.ts                         │       │
│  │  ┌───────────────────────────────────────────────────┐ │       │
│  │  │  • calculateCognitiveLoad()                       │ │       │
│  │  │  • calculateLearningMetrics()                     │ │       │
│  │  │  • calculateAssessmentMetrics()                   │ │       │
│  │  │  • normalizeValue()                               │ │       │
│  │  │  • categorizeCognitiveLoad()                      │ │       │
│  │  │  • getRecommendations()                           │ │       │
│  │  └───────────────────────────────────────────────────┘ │       │
│  └─────────────────────────────────────────────────────────┘       │
│                              │                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────────┐
│                          DATA LAYER                  │               │
├──────────────────────────────┼───────────────────────────────────────┤
│                              ↓                                       │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │            questionsData.ts                             │       │
│  │  ┌───────────────────────────────────────────────────┐ │       │
│  │  │  learningContent: {                               │ │       │
│  │  │    'Renewable Energy': [...],                     │ │       │
│  │  │    'Artificial Intelligence': [...],              │ │       │
│  │  │    'Climate Change': [...]                        │ │       │
│  │  │  }                                                 │ │       │
│  │  │                                                    │ │       │
│  │  │  assessmentQuestions: {                           │ │       │
│  │  │    'Renewable Energy': [...],                     │ │       │
│  │  │    'Artificial Intelligence': [...],              │ │       │
│  │  │    'Climate Change': [...]                        │ │       │
│  │  │  }                                                 │ │       │
│  │  └───────────────────────────────────────────────────┘ │       │
│  └─────────────────────────────────────────────────────────┘       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

## Data Flow Diagram

┌──────────────┐
│   Research   │
│    Phase     │
└──────┬───────┘
       │ Complete Research
       ↓
┌──────────────────────────────────────┐
│       Learning Phase                 │
│  ┌────────────────────────────────┐  │
│  │ Display Q&A from               │  │
│  │ questionsData.ts               │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Track:                         │  │
│  │ • Total time                   │  │
│  │ • Interactions                 │  │
│  │ • Clarifications               │  │
│  │ • Timestamps                   │  │
│  └────────────────────────────────┘  │
└──────┬───────────────────────────────┘
       │ onComplete(learningData)
       ↓
┌──────────────────────────────────────┐
│      Assessment Phase                │
│  ┌────────────────────────────────┐  │
│  │ Load questions from            │  │
│  │ questionsData.ts               │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ For each question:             │  │
│  │ • Display question             │  │
│  │ • Track time                   │  │
│  │ • Capture answer               │  │
│  │ • Check correctness            │  │
│  │ • Calculate score              │  │
│  └────────────────────────────────┘  │
└──────┬───────────────────────────────┘
       │ onComplete(assessmentResponses[])
       ↓
┌──────────────────────────────────────┐
│   cognitiveLoadService               │
│  ┌────────────────────────────────┐  │
│  │ Receive:                       │  │
│  │ • learningData                 │  │
│  │ • assessmentResponses          │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Calculate:                     │  │
│  │ • Normalize all metrics        │  │
│  │ • Apply weights                │  │
│  │ • Compute overall score        │  │
│  │ • Assign category              │  │
│  │ • Generate recommendations     │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Return:                        │  │
│  │ • CognitiveLoadMetrics         │  │
│  └────────────────────────────────┘  │
└──────┬───────────────────────────────┘
       │ metrics
       ↓
┌──────────────────────────────────────┐
│       Results Phase                  │
│  ┌────────────────────────────────┐  │
│  │ Display:                       │  │
│  │ • Overall score (0-100)        │  │
│  │ • Category badge               │  │
│  │ • Learning metrics             │  │
│  │ • Assessment metrics           │  │
│  │ • Recommendations              │  │
│  │ • Performance summary          │  │
│  └────────────────────────────────┘  │
└──────┬───────────────────────────────┘
       │ Complete & Continue
       ↓
┌──────────────┐
│  Creativity  │
│     Test     │
└──────────────┘
```

## Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    ParticipantDashboard.tsx                      │
│                                                                  │
│  State:                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • participant: Participant                              │   │
│  │ • learningData: LearningPhaseData | undefined           │   │
│  │ • assessmentResponses: AssessmentResponse[] | undefined │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Renders:                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Learning    │  │ Assessment   │  │   Results    │         │
│  │    Phase     │  │    Phase     │  │   Display    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│        ↓                  ↓                  ↓                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │handleLearning│  │handleAssess- │  │  Automatic   │         │
│  │  Complete()  │  │mentComplete()│  │ Calculation  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└──────────────────────────────────────────────────────────────────┘
                 │               │               │
                 │               │               │
                 ↓               ↓               ↓
┌────────────────────────┐  ┌────────────────────────┐
│  setLearningData()     │  │setAssessmentResponses()│
│  onPhaseComplete()     │  │  onPhaseComplete()     │
└────────────────────────┘  └────────────────────────┘
```

## Type System Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                       types/index.ts                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Participant {                                               │
│    ├─ id: string                                            │
│    ├─ name: string                                          │
│    ├─ currentPhase: 'learning' | 'assessment' | 'results'   │
│    ├─ learningData?: LearningPhaseData                      │
│    ├─ assessmentResponses?: AssessmentResponse[]            │
│    └─ cognitiveLoadMetrics?: CognitiveLoadMetrics           │
│  }                                                           │
│                                                              │
│  LearningPhaseData {                                         │
│    ├─ participantId: string                                 │
│    ├─ topic: string                                         │
│    ├─ totalLearningTime: number                             │
│    ├─ chatbotInteractions: number                           │
│    ├─ questionsViewed: string[]                             │
│    ├─ clarificationsAsked: string[]                         │
│    └─ interactionTimestamps: Date[]                         │
│  }                                                           │
│                                                              │
│  AssessmentResponse {                                        │
│    ├─ participantId: string                                 │
│    ├─ questionId: string                                    │
│    ├─ timeTaken: number                                     │
│    ├─ answer: string                                        │
│    ├─ isCorrect?: boolean                                   │
│    └─ score: number                                         │
│  }                                                           │
│                                                              │
│  CognitiveLoadMetrics {                                      │
│    ├─ participantId: string                                 │
│    ├─ topic: string                                         │
│    ├─ learningPhase: {                                      │
│    │   ├─ totalTime: number                                │
│    │   ├─ interactionCount: number                         │
│    │   ├─ averageInteractionTime: number                   │
│    │   └─ clarificationRequests: number                    │
│    │ }                                                      │
│    ├─ assessmentPhase: {                                    │
│    │   ├─ totalTime: number                                │
│    │   ├─ averageTimePerQuestion: number                   │
│    │   ├─ questionsAnswered: number                        │
│    │   ├─ totalScore: number                               │
│    │   └─ accuracy: number                                 │
│    │ }                                                      │
│    ├─ overallCognitiveLoad: number                          │
│    └─ cognitiveLoadCategory: string                         │
│  }                                                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Calculation Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│         cognitiveLoadService.calculateCognitiveLoad()       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
         ┌─────────────────────────────┐
         │  Extract Raw Metrics        │
         ├─────────────────────────────┤
         │ • learningTime              │
         │ • interactions              │
         │ • clarifications            │
         │ • assessmentTime            │
         │ • accuracy                  │
         └─────────────┬───────────────┘
                       │
                       ↓
         ┌─────────────────────────────┐
         │  Normalize (0-100 scale)    │
         ├─────────────────────────────┤
         │ • normalizeValue(value, max)│
         │ • Linear scaling            │
         │ • Inverse for accuracy      │
         └─────────────┬───────────────┘
                       │
                       ↓
         ┌─────────────────────────────┐
         │  Apply Weights              │
         ├─────────────────────────────┤
         │ • learningTime × 0.20       │
         │ • interactions × 0.15       │
         │ • clarifications × 0.20     │
         │ • assessmentTime × 0.25     │
         │ • accuracy × 0.20           │
         └─────────────┬───────────────┘
                       │
                       ↓
         ┌─────────────────────────────┐
         │  Sum Weighted Scores        │
         ├─────────────────────────────┤
         │ overallLoad = Σ(scores)     │
         └─────────────┬───────────────┘
                       │
                       ↓
         ┌─────────────────────────────┐
         │  Categorize Load            │
         ├─────────────────────────────┤
         │ 0-25:   Low                 │
         │ 26-50:  Moderate            │
         │ 51-75:  High                │
         │ 76-100: Very High           │
         └─────────────┬───────────────┘
                       │
                       ↓
         ┌─────────────────────────────┐
         │  Generate Recommendations   │
         ├─────────────────────────────┤
         │ Based on:                   │
         │ • Overall score             │
         │ • Individual metrics        │
         │ • Category level            │
         └─────────────┬───────────────┘
                       │
                       ↓
         ┌─────────────────────────────┐
         │  Return Complete Metrics    │
         └─────────────────────────────┘
```

## File Dependencies

```
App.tsx
  └─> ParticipantDashboard.tsx
        ├─> LearningPhase.tsx
        │     ├─> types/index.ts (LearningPhaseData, QuestionAndAnswer)
        │     └─> data/questionsData.ts (getLearningContent)
        │
        ├─> AssessmentPhase.tsx
        │     ├─> types/index.ts (AssessmentQuestion, AssessmentResponse)
        │     └─> data/questionsData.ts (getAssessmentQuestions)
        │
        └─> CognitiveLoadResults.tsx
              ├─> types/index.ts (CognitiveLoadMetrics)
              └─> services/cognitiveLoadService.ts
                    └─> types/index.ts (all interfaces)
```

## Key Design Patterns

### 1. Container/Presenter Pattern
```
ParticipantDashboard (Container)
  └─> Manages state & logic
      ├─> LearningPhase (Presenter)
      ├─> AssessmentPhase (Presenter)  
      └─> CognitiveLoadResults (Presenter)
```

### 2. Service Layer Pattern
```
Components
  ↓ (use)
Services (cognitiveLoadService)
  ↓ (access)
Data (questionsData)
```

### 3. Callback Pattern
```
ParticipantDashboard
  ├─> passes onComplete callback
  │
  └─> LearningPhase
        └─> calls onComplete(learningData)
              └─> handleLearningComplete(data)
                    └─> setLearningData(data)
                    └─> onPhaseComplete('assessment')
```

### 4. Progressive Enhancement
```
Phase 1: Research (existing)
  ↓
Phase 2: Learning (new - data collection)
  ↓
Phase 3: Assessment (new - evaluation)
  ↓
Phase 4: Results (new - analysis)
  ↓
Phase 5: Creativity (existing)
```

---

**Architecture Version**: 1.0.0  
**Last Updated**: December 2024  
**Status**: Production Ready
