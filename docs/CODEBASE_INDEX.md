# Cognitive Load Analysis Platform - Codebase Index

## Project Overview

A React + TypeScript research platform for studying cognitive load and creativity by comparing AI-powered chatbots (ChatGPT/Gemini) vs traditional Google Search during research tasks. Built with Vite, Tailwind CSS, and integrates with Google's Gemini AI API. Features a dual-service backend architecture with Express.js for authentication/session management and FastAPI for behavioral data processing and ML classification.

---

## Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| React 18 | Frontend UI framework | ^18.3.1 |
| TypeScript | Type-safe JavaScript | ^5.5.3 |
| Vite | Build tool and dev server | ^5.4.2 |
| Tailwind CSS | Utility-first CSS styling | ^3.4.1 |
| PostCSS | CSS processing | ^8.4.35 |
| `@google/generative-ai` | Google Gemini AI integration | ^0.24.1 |
| Recharts | Data visualization charts | ^3.1.2 |
| React Router DOM v7 | Client-side routing | ^7.7.1 |
| Lucide React | Icon library | ^0.344.0 |
| date-fns | Date manipulation | ^4.1.0 |
| **Backend Services** | | |
| Node.js + Express | Authentication & session management | ^4.18.2 |
| FastAPI (Python) | Behavioral data processing & ML | ^0.109.0 |
| Redis | Caching and session storage | ^4.6.12 |
| **Machine Learning** | | |
| scikit-learn | ML classification models | ^1.4.0 |
| pandas | Data processing | ^2.1.0 |
| numpy | Numerical computing | ^1.26.0 |

---

## Project Structure

```
Cognitive_Load_Analysis/
├── src/                            # Frontend React application
│   ├── App.tsx                     # Main app with routing & state management
│   ├── main.tsx                    # React entry point
│   ├── index.css                   # Global styles (Tailwind)
│   ├── vite-env.d.ts               # Vite type declarations
│   │
│   ├── components/                 # React UI components
│   │   ├── common/                 # Shared/reusable components
│   │   ├── AdminDashboard.tsx      # Admin analytics & participant management
│   │   ├── ApiKeyStatus.tsx        # API key configuration status
│   │   ├── AssessmentPhase.tsx     # Quiz/assessment component
│   │   ├── ChatGPTInterface.tsx    # AI chatbot research interface
│   │   ├── CognitiveLoadResults.tsx # Results display with metrics
│   │   ├── CreativityTest.tsx      # Divergent thinking assessment
│   │   ├── GoogleSearchInterface.tsx # Google search research interface
│   │   ├── LandingPage.tsx         # Study introduction page
│   │   ├── Login.tsx               # Authentication component
│   │   ├── ParticipantDashboard.tsx # Main participant view
│   │   ├── PlatformSelection.tsx   # ChatGPT vs Google choice
│   │   ├── ResearchInterface.tsx   # Research phase orchestrator
│   │   └── ...
│   │
│   ├── config/                     # Configuration files
│   │   ├── api.ts                  # API endpoints & base URLs
│   │   └── apiConfig.ts            # API configuration constants
│   │
│   ├── context/                    # React Context providers
│   │   ├── AuthContext.tsx         # Authentication state management
│   │   ├── index.ts                # Context exports
│   │   └── SessionContext.tsx      # Session state management
│   │
│   ├── data/                       # Static data and mock data
│   │   ├── mockData.ts             # Sample participants & research topics
│   │   └── questionsData.ts        # Learning content & assessment questions
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── index.ts                # Hook exports
│   │   ├── useDebounce.ts          # Debounce utility hook
│   │   ├── useStorage.ts           # Local storage hook
│   │   ├── useTimer.ts             # Timer functionality hook
│   │   └── ...
│   │
│   ├── services/                   # Business logic & external API calls
│   │   ├── analyticsService.ts     # Analytics tracking
│   │   ├── apiClient.ts            # Generic API client
│   │   ├── assessmentGenerationService.ts # AI-generated questions
│   │   ├── authService.ts          # Authentication logic
│   │   ├── behavioralClassificationService.ts # Cognitive load classification
│   │   ├── chatgptService.ts       # ChatGPT-specific logic
│   │   ├── cognitiveLoadService.ts # Cognitive load calculations
│   │   ├── dataPersistenceService.ts # Data storage operations
│   │   ├── geminiService.ts        # Google Gemini AI integration
│   │   ├── grokService.ts          # Grok API integration
│   │   ├── interactionTracker.ts   # Behavioral event capture
│   │   ├── llmService.ts           # LLM streaming & retry logic
│   │   ├── retryService.ts         # Retry mechanisms
│   │   ├── topicValidationService.ts # Query relevance validation
│   │   ├── validationService.ts    # Input validation
│   │   └── ...
│   │
│   ├── types/                      # TypeScript type definitions
│   │   └── index.ts                # All interfaces & types
│   │
│   └── utils/                      # Utility functions
│       ├── errorHandler.ts         # Error handling utilities
│       ├── index.ts                # Utility exports
│       ├── logger.ts               # Logging utilities
│       ├── rateLimiter.ts          # Rate limiting logic
│       └── validation.ts           # Validation utilities
│
├── server/                         # Node.js Express backend
│   ├── Dockerfile                  # Docker configuration
│   ├── package.json                # Dependencies & scripts
│   └── src/
│       ├── index.ts                # Server entry point
│       ├── controllers/            # Request handlers
│       ├── middleware/             # Express middleware
│       │   ├── errorHandler.ts     # Error handling middleware
│       │   └── requestLogger.ts    # Request logging middleware
│       ├── routes/                 # API route definitions
│       │   ├── ai.ts               # AI-related routes
│       │   ├── assessments.ts      # Assessment routes
│       │   ├── auth.ts             # Authentication routes
│       │   └── sessions.ts         # Session management routes
│       └── services/               # Backend services
│           └── redisService.ts     # Redis caching service
│
├── behavioral-service/             # Python FastAPI service
│   ├── README.md                   # Service documentation
│   ├── requirements.txt            # Python dependencies
│   └── src/
│       ├── main.py                 # FastAPI application entry point
│       ├── models.py               # Pydantic data models
│       ├── classifier/             # ML classification modules
│       │   ├── classifier.py       # Main classifier facade
│       │   ├── rule_based.py       # Rule-based classifier (primary)
│       │   └── ml_classifier.py    # ML classifier (optional fallback)
│       ├── features/               # Feature extraction modules
│       │   ├── aggregator.py       # Feature aggregation logic
│       │   ├── click_analysis.py   # Click pattern analysis
│       │   ├── mouse_analysis.py   # Mouse movement analysis
│       │   ├── navigation_analysis.py # Navigation pattern analysis
│       │   └── response_time.py    # Response time metrics
│       ├── middleware/             # FastAPI middleware
│       │   └── error_handler.py    # Error handling middleware
│       ├── routes/                 # API route handlers
│       │   └── interactions.py     # Interaction data routes
│       └── __init__.py             # Package initialization
│
├── docs/                           # Documentation
│   ├── APPLICATION_FLOW.md         # Detailed user journey
│   ├── CODEBASE_INDEX.md           # This file
│   ├── FLAWS_AND_ISSUES.md         # Known issues & fixes
│   └── UI_COMPONENTS.md            # Component documentation
│
├── index.html                      # HTML entry point
├── package.json                    # Frontend dependencies
├── vite.config.ts                  # Vite configuration
├── tailwind.config.js              # Tailwind CSS config
├── tsconfig.json                   # TypeScript config
├── docker-compose.yml              # Docker services (Redis)
└── .env.example                    # Environment variables template
```

---

## Key Services

### Frontend Services

#### `interactionTracker.ts`
Behavioral data capture service:
- **Event listeners** for clicks, mouse movements, scrolls, keystrokes
- **Event batching** and throttling (5-second intervals)
- **Platform-specific tracking** (ChatGPT vs Google interfaces)
- **Data transmission** to FastAPI behavioral service

#### `behavioralClassificationService.ts`
Cognitive load classification client:
- **API integration** with FastAPI behavioral service
- **Real-time classification** from interaction patterns
- **Confidence scoring** and feature extraction
- **Platform comparison** analytics

#### `geminiService.ts`
Core AI integration service with:
- **Dual API key system** for load balancing and redundancy
- Assessment question generation using Gemini 1.5 Pro
- Creativity question generation and evaluation
- Response evaluation with scoring
- Retry mechanism with exponential backoff

#### `llmService.ts`
Streaming chat service featuring:
- Real-time response streaming from multiple LLM providers
- Automatic retry (3 attempts with 1s, 2s, 4s delays)
- Fallback responses when API unavailable
- Topic validation integration

#### `cognitiveLoadService.ts`
Calculates cognitive load metrics:
- Learning phase metrics (time, interactions, clarifications)
- Assessment metrics (time per question, accuracy, scores)
- Overall cognitive load score (0-100 scale)
- Category classification (Low/Moderate/High/Very High)

#### `topicValidationService.ts`
Ensures research relevance:
- Validates queries against assigned topic
- Keyword matching with confidence scoring
- Generates suggested questions for off-topic queries

### Backend Services

#### Express.js Server (`server/`)
Authentication and session management:
- **JWT-based authentication** (planned)
- **Session persistence** with Redis
- **API routing** for assessments and user management
- **CORS and security** middleware

#### FastAPI Behavioral Service (`behavioral-service/`)
Machine learning and behavioral analysis:
- **Feature extraction** from interaction data
- **ML classification** using scikit-learn models
- **Rule-based fallback** classifier
- **Real-time processing** of behavioral metrics

### Behavioral Analysis Features

#### Feature Extraction Pipeline
The behavioral service extracts 15+ features from user interaction data:

- **Response Time Metrics**: Mean, median, standard deviation, percentiles
- **Click Analysis**: Total clicks, rage click detection, click rate per minute
- **Mouse Movement**: Mean cursor speed, trajectory deviation, path linearity
- **Navigation Patterns**: Sections visited, revisit ratios, dwell time per section
- **Session Metrics**: Total session time, active time ratio, scroll depth

#### Classification Models
- **Rule-based Classifier** (Primary): Uses threshold-based rules on behavioral features
- **ML Classifier** (Fallback): Scikit-learn model trained on behavioral data
- **Confidence Scoring**: Each classification includes confidence level (0-1)

#### Cognitive Load Categories
- **Low**: Smooth, efficient interaction patterns
- **Moderate**: Some hesitation but manageable cognitive load
- **High**: Frequent pauses, revisits, rage clicking
- **Very High**: Extreme frustration indicators

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

### Service Endpoints

| Service | Port | Base URL | Purpose |
|---------|------|----------|---------|
| Frontend (Vite) | 5173 | `http://localhost:5173` | React development server |
| Express Backend | 3001 | `http://localhost:3001` | Authentication & sessions |
| FastAPI Behavioral | 8000 | `http://localhost:8000` | ML classification & features |
| Redis | 6379 | `redis://localhost:6379` | Caching & session storage |

### Environment Variables

```env
# Frontend Environment (.env)
VITE_GEMINI_API_KEY=AIzaSy...
VITE_GEMINI_CHAT_API_KEY=AIzaSy...
VITE_GEMINI_QUESTIONS_API_KEY=AIzaSy...
VITE_OPENAI_API_KEY=sk-...
VITE_GROK_API_KEY=xai-...
VITE_API_BASE_URL=http://localhost:3001
VITE_BEHAVIORAL_SERVICE_URL=http://localhost:8000

# Backend Environment (.env in server/)
PORT=3001
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
NODE_ENV=development

# Behavioral Service Environment (.env in behavioral-service/)
FASTAPI_ENV=development
PORT=8000
```

### API Key Usage

| Feature | API Key Used | Service | Frequency |
|---------|-------------|---------|-----------|
| Chatbot queries | `GEMINI_CHAT` | Frontend | High (every message) |
| Assessment questions | `GEMINI_QUESTIONS` | Frontend | Low (once per session) |
| Creativity questions | `GEMINI_QUESTIONS` | Frontend | Low (once per session) |
| Behavioral classification | N/A | FastAPI | Real-time (per batch) |
| Session management | N/A | Express | Per request |

### FastAPI Behavioral Service Endpoints

```
POST /api/interactions/ingest     # Ingest interaction data batch
POST /api/interactions/classify   # Classify cognitive load
GET  /api/interactions/compare    # Compare platforms
GET  /health                      # Health check
```

---

## Development Scripts

### Frontend (Root Directory)
```bash
npm run dev      # Start Vite development server (port 5173)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
npm test         # Run Vitest tests
```

### Express Backend (server/)
```bash
cd server
npm run dev      # Start development server with ts-node-dev
npm run build    # Build TypeScript to JavaScript
npm run start    # Start production server
npm test         # Run backend tests
```

### FastAPI Behavioral Service (behavioral-service/)
```bash
cd behavioral-service

# Setup virtual environment
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run service
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

# Run tests
pytest tests/ -v
```

### Docker Services
```bash
# Start Redis and Express backend
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Full Development Setup
```bash
# Terminal 1: Redis (if not using Docker)
redis-server

# Terminal 2: Express Backend
cd server && npm run dev

# Terminal 3: FastAPI Behavioral Service
cd behavioral-service && uvicorn src.main:app --reload

# Terminal 4: Frontend
npm run dev
```

## Related Documentation

- [Application Flow](./APPLICATION_FLOW.md) - Detailed user journey
- [UI Components](./UI_COMPONENTS.md) - Component documentation
- [Dual API Key Setup](../DUAL_API_KEY_SETUP.md) - API configuration guide
- [Architecture](../ARCHITECTURE.md) - System architecture diagrams
