# Cognitive Load Analysis Platform - Codebase Index

## Project Overview

A React + TypeScript research platform for studying cognitive load and creativity by comparing AI-powered chatbots (ChatGPT/Gemini) vs traditional Google Search during research tasks. Built with Vite, Tailwind CSS, and integrates with Google's Gemini AI API.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | Frontend UI framework |
| TypeScript | Type-safe JavaScript |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first CSS styling |
| PostCSS | CSS processing |
| `@google/generative-ai` | Google Gemini AI integration |
| Recharts | Data visualization charts |
| React Router DOM v7 | Client-side routing |
| Lucide React | Icon library |
| date-fns | Date manipulation |

---

## Project Structure

```
Cognitive_Load_Analysis/
├── src/
│   ├── App.tsx                    # Main app with routing & state
│   ├── main.tsx                   # React entry point
│   ├── index.css                  # Global styles
│   ├── vite-env.d.ts              # Vite type declarations
│   │
│   ├── components/                # React UI components
│   │   ├── AdminDashboard.tsx     # Admin analytics & management
│   │   ├── ApiKeyStatus.tsx       # API configuration status
│   │   ├── AssessmentPhase.tsx    # Quiz/assessment component
│   │   ├── ChatGPTInterface.tsx   # AI chatbot interface
│   │   ├── CognitiveLoadResults.tsx # Results display
│   │   ├── CreativityTest.tsx     # Creativity assessment
│   │   ├── EEGVisualization.tsx   # EEG data visualization
│   │   ├── GoogleSearchInterface.tsx # Google search tracking
│   │   ├── LandingPage.tsx        # Study introduction page
│   │   ├── Login.tsx              # Authentication component
│   │   ├── ParticipantDashboard.tsx # Main participant view
│   │   ├── PlatformSelection.tsx  # ChatGPT/Google choice
│   │   └── ResearchInterface.tsx  # Research phase orchestrator
│   │
│   ├── config/                    # Configuration files
│   │   ├── api.ts                 # API endpoints & keys
│   │   └── apiConfig.ts           # Additional API config
│   │
│   ├── data/                      # Static data
│   │   ├── mockData.ts            # Sample participants & topics
│   │   └── questionsData.ts       # Learning content & assessments
│   │
│   ├── hooks/                     # Custom React hooks
│   │   └── useEEGStream.ts        # Simulated EEG data stream
│   │
│   ├── services/                  # Business logic & API calls
│   │   ├── analyticsService.ts    # Analytics tracking
│   │   ├── assessmentGenerationService.ts # Question generation
│   │   ├── chatgptService.ts      # ChatGPT-specific logic
│   │   ├── cognitiveLoadService.ts # Cognitive load calculations
│   │   ├── geminiService.ts       # Gemini AI integration
│   │   ├── grokService.ts         # Grok API integration
│   │   ├── llmService.ts          # LLM streaming & retry logic
│   │   └── topicValidationService.ts # Query relevance validation
│   │
│   └── types/                     # TypeScript type definitions
│       └── index.ts               # All interfaces & types
│
├── backend/                       # Backend server (Node.js)
│   └── .env                       # Backend environment variables
│
├── docs/                          # Documentation
│   ├── CODEBASE_INDEX.md          # This file
│   ├── APPLICATION_FLOW.md        # User flow documentation
│   └── UI_COMPONENTS.md           # Component documentation
│
├── index.html                     # HTML entry point
├── package.json                   # Dependencies & scripts
├── vite.config.ts                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS config
├── tsconfig.json                  # TypeScript config
└── .env                           # Environment variables (API keys)
```

---

## Key Services

### `geminiService.ts`
Core AI integration service with:
- **Dual API key system** for load balancing
- Assessment question generation
- Creativity question generation
- Response evaluation with scoring
- Retry mechanism with exponential backoff

### `llmService.ts`
Streaming chat service featuring:
- Real-time response streaming
- Automatic retry (3 attempts with 1s, 2s, 4s delays)
- Fallback responses when API unavailable
- Topic validation integration

### `cognitiveLoadService.ts`
Calculates cognitive load metrics:
- Learning phase metrics (time, interactions, clarifications)
- Assessment metrics (time per question, accuracy, scores)
- Overall cognitive load score (0-100 scale)
- Category classification (Low/Moderate/High/Very High)

### `topicValidationService.ts`
Ensures research relevance:
- Validates queries against assigned topic
- Keyword matching with confidence scoring
- Generates suggested questions for off-topic queries

---

## Type Definitions

### Core Interfaces

```typescript
interface Participant {
  id: string;
  name: string;
  email: string;
  assignedPlatform: 'chatgpt' | 'google';
  currentPhase: 'login' | 'research' | 'assessment' | 'results' | 'creativity_test' | 'completed';
  sessionStart: Date;
  researchTopic: string;
  cognitiveLoadScore: number;
  creativityScore: number;
  isActive: boolean;
}

interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'descriptive' | 'short-answer';
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedTimeSeconds: number;
  options?: string[];
  correctAnswer?: string;
  points: number;
}

interface CognitiveLoadMetrics {
  participantId: string;
  topic: string;
  learningPhase: { totalTime, interactionCount, averageInteractionTime, clarificationRequests };
  assessmentPhase: { totalTime, averageTimePerQuestion, questionsAnswered, totalScore, accuracy };
  overallCognitiveLoad: number;
  cognitiveLoadCategory: 'Low' | 'Moderate' | 'High' | 'Very High';
}

interface EEGData {
  participantId: string;
  timestamp: number;
  channels: Record<string, number>;
  cognitiveLoad: number;
  thetaPower: number;
  alphaPower: number;
  betaPower: number;
  engagement: number;
}
```

---

## API Configuration

### Environment Variables

```env
# Primary Gemini API Key (fallback)
VITE_GEMINI_API_KEY=AIzaSy...

# Dedicated Chat API Key (high frequency)
VITE_GEMINI_CHAT_API_KEY=AIzaSy...

# Dedicated Questions API Key (lower frequency)
VITE_GEMINI_QUESTIONS_API_KEY=AIzaSy...

# Optional APIs
VITE_OPENAI_API_KEY=sk-...
VITE_GROK_API_KEY=xai-...
VITE_GOOGLE_SEARCH_API_KEY=...
VITE_GOOGLE_SEARCH_ENGINE_ID=...
```

### API Key Usage

| Feature | API Key Used | Frequency |
|---------|-------------|-----------|
| Chatbot queries | `GEMINI_CHAT` | High (every message) |
| Assessment questions | `GEMINI_QUESTIONS` | Low (once per session) |
| Creativity questions | `GEMINI_QUESTIONS` | Low (once per session) |
| Creativity evaluation | `GEMINI_QUESTIONS` | Low (once per session) |

---

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## Related Documentation

- [Application Flow](./APPLICATION_FLOW.md) - Detailed user journey
- [UI Components](./UI_COMPONENTS.md) - Component documentation
- [Dual API Key Setup](../DUAL_API_KEY_SETUP.md) - API configuration guide
- [Architecture](../ARCHITECTURE.md) - System architecture diagrams
