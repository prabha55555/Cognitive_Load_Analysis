# Cognitive Load Analysis Platform

A research platform for studying cognitive load differences between AI chatbots and traditional Google Search, with integrated creativity assessment.

## 🎯 Overview

This platform enables researchers to conduct studies comparing how users learn and retain information when using AI chatbots (like ChatGPT) versus Google Search. It measures cognitive load through **synthetic EEG data generated using Amazon Chronos foundation model** trained on the Mendeley cognitive load EEG dataset, knowledge assessments, and creativity tests.

## ✨ Features

- **Multi-Platform Research**: Compare learning outcomes between AI chatbots and Google Search
- **Synthetic EEG Generation**: Real-time brainwave patterns generated using Amazon Chronos time-series foundation model
- **Dynamic Assessments**: AI-generated questions based on research topics
- **Creativity Evaluation**: Divergent thinking tests with automated scoring
- **Cognitive Load Metrics**: NASA-TLX based scoring system
- **Admin Dashboard**: Manage participants and view aggregated results

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **AI Integration**: Google Gemini API (with dual API key system)
- **Backend**: Node.js + Express + Redis
- **Biosignal Service**: Python + Flask + Amazon Chronos (time-series foundation model)
- **Containerization**: Docker + Docker Compose
- **Testing**: Vitest + React Testing Library

## 📁 Project Structure

```
Cognitive_Load_Analysis/
├── biosignal-service/              # Python EEG generation microservice
│   ├── src/
│   │   ├── app.py                  # Flask API server
│   │   ├── generator.py            # Chronos-based EEG generator
│   │   ├── preprocessing.py        # Mendeley dataset preprocessing
│   │   └── config.py               # Service configuration
│   ├── Dockerfile
│   └── requirements.txt
│
├── docs/                           # Documentation
│   ├── APPLICATION_FLOW.md         # User journey documentation
│   ├── CODEBASE_INDEX.md           # Complete codebase reference
│   ├── FLAWS_AND_ISSUES.md         # Known issues & action plan
│   └── UI_COMPONENTS.md            # Component documentation
│
├── server/                         # Node.js Backend API
│   ├── src/
│   │   ├── controllers/            # Request handlers
│   │   │   ├── aiController.ts     # AI proxy endpoints
│   │   │   ├── assessmentController.ts
│   │   │   ├── authController.ts   # Authentication logic
│   │   │   └── sessionController.ts
│   │   ├── middleware/             # Express middleware
│   │   │   ├── auth.ts             # JWT verification
│   │   │   ├── rateLimit.ts        # Request throttling
│   │   │   └── validation.ts       # Input validation
│   │   ├── routes/                 # API routes
│   │   │   ├── ai.ts               # /api/ai/*
│   │   │   ├── assessments.ts      # /api/assessments/*
│   │   │   ├── auth.ts             # /api/auth/*
│   │   │   └── sessions.ts         # /api/sessions/*
│   │   ├── validators/             # Zod schemas
│   │   │   └── auth.ts
│   │   └── index.ts                # Server entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── src/                            # Frontend source
│   ├── __tests__/                  # Test files
│   │   ├── components/             # Component tests
│   │   │   └── Login.test.tsx
│   │   ├── authService.test.ts
│   │   ├── validation.test.ts
│   │   └── setup.ts                # Test setup
│   │
│   ├── components/                 # React components
│   │   ├── common/                 # Shared components
│   │   │   ├── Button.tsx          # Accessible button
│   │   │   ├── ErrorBoundary.tsx   # Error handling
│   │   │   ├── Input.tsx           # Accessible input
│   │   │   ├── LoadingSpinner.tsx  # Loading states
│   │   │   └── index.ts
│   │   ├── AdminDashboard.tsx
│   │   ├── ApiKeyStatus.tsx
│   │   ├── AssessmentPhase.tsx
│   │   ├── ChatGPTInterface.tsx
│   │   ├── CognitiveLoadResults.tsx
│   │   ├── CreativityTest.tsx
│   │   ├── EEGVisualization.tsx
│   │   ├── GoogleSearchInterface.tsx
│   │   ├── LandingPage.tsx
│   │   ├── Login.tsx
│   │   ├── ParticipantDashboard.tsx
│   │   ├── PlatformSelection.tsx
│   │   └── ResearchInterface.tsx
│   │
│   ├── config/                     # Configuration
│   │   ├── api.ts
│   │   └── apiConfig.ts
│   │
│   ├── context/                    # React Context (TODO)
│   │   ├── AuthContext.tsx         # Authentication state
│   │   ├── SessionContext.tsx      # Session persistence
│   │   └── index.ts
│   │
│   ├── data/                       # Static data
│   │   ├── mockData.ts
│   │   └── questionsData.ts
│   │
│   ├── hooks/                      # Custom hooks
│   │   ├── useDebounce.ts          # Input debouncing
│   │   ├── useEEGStream.ts         # EEG simulation
│   │   ├── useStorage.ts           # localStorage/sessionStorage
│   │   ├── useTimer.ts             # Timer with visibility handling
│   │   └── index.ts
│   │
│   ├── services/                   # API services
│   │   ├── analyticsService.ts
│   │   ├── apiClient.ts            # Unified HTTP client
│   │   ├── assessmentGenerationService.ts
│   │   ├── authService.ts          # Authentication API
│   │   ├── chatgptService.ts
│   │   ├── cognitiveLoadService.ts
│   │   ├── dataPersistenceService.ts # Data storage
│   │   ├── geminiService.ts
│   │   ├── grokService.ts
│   │   ├── llmService.ts
│   │   ├── retryService.ts         # Retry with circuit breaker
│   │   ├── topicValidationService.ts
│   │   └── validationService.ts    # Response validation
│   │
│   ├── types/                      # TypeScript types
│   │   └── index.ts
│   │
│   ├── utils/                      # Utility functions
│   │   ├── errorHandler.ts         # Custom error classes
│   │   ├── logger.ts               # Logging service
│   │   ├── rateLimiter.ts          # Client-side throttling
│   │   ├── validation.ts           # Input sanitization
│   │   └── index.ts
│   │
│   ├── App.tsx                     # Main app component
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles
│
├── .env.example                    # Environment template
├── .gitignore
├── ARCHITECTURE.md                 # System architecture
├── CHANGELOG.md                    # Version history
├── DUAL_API_KEY_SETUP.md           # API configuration guide
├── QUICK_START.md                  # Getting started
├── README.md                       # This file
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts                # Test configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker & Docker Compose
- Google Gemini API key(s)
- Mendeley EEG Dataset (for biosignal generation)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/Cognitive_Load_Analysis.git
cd Cognitive_Load_Analysis

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your API keys to .env
# VITE_GEMINI_API_KEY=your-api-key
```

### Running with Docker (Recommended)

```bash
# Download Mendeley EEG dataset and place in raw_data/
# Dataset: https://data.mendeley.com/datasets/kt38js3jv7/1

# Start all services (Redis, Biosignal Service, Backend)
docker-compose up -d

# Start frontend development server
npm run dev
```

### Running without Docker

```bash
# Start frontend only (no EEG generation)
npm run dev
```

### Running Tests

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📋 Known Issues & Roadmap

See [FLAWS_AND_ISSUES.md](./docs/FLAWS_AND_ISSUES.md) for a comprehensive list of:
- 🔴 5 Critical issues
- 🟠 10 High priority issues
- 🟡 12 Medium priority issues
- 🟢 2 Low priority issues

### Priority Action Plan

| Phase | Focus | Status |
|-------|-------|--------|
| Week 1 | Critical Security (Auth, API keys, Input sanitization) | ⬜ Todo |
| Week 2 | Data Integrity (Backend, Database, Validation) | ⬜ Todo |
| Week 3 | User Experience (Timer, Loading, Accessibility) | ⬜ Todo |
| Week 4 | Code Quality (Tests, Logging, Refactoring) | ⬜ Todo |
| Week 5 | Performance (Code splitting, Optimization) | ⬜ Todo |

## 📚 Documentation

- [Codebase Index](./docs/CODEBASE_INDEX.md) - Complete code reference
- [Application Flow](./docs/APPLICATION_FLOW.md) - User journey documentation
- [UI Components](./docs/UI_COMPONENTS.md) - Component documentation
- [Architecture](./ARCHITECTURE.md) - System design
- [API Setup](./DUAL_API_KEY_SETUP.md) - API configuration

## 🔧 New File Structure for Fixes

The following folders/files have been added to support fixing identified issues:

### Authentication & Sessions (`src/context/`)
- `AuthContext.tsx` - Authentication state management
- `SessionContext.tsx` - Session persistence

### Common Components (`src/components/common/`)
- `ErrorBoundary.tsx` - Catch and display errors gracefully
- `LoadingSpinner.tsx` - Loading state indicators
- `Button.tsx` - Accessible button component
- `Input.tsx` - Accessible input component

### Utilities (`src/utils/`)
- `validation.ts` - Input sanitization & validation
- `errorHandler.ts` - Standardized error handling
- `logger.ts` - Environment-aware logging
- `rateLimiter.ts` - Client-side request throttling

### Custom Hooks (`src/hooks/`)
- `useTimer.ts` - Timer with visibility handling
- `useStorage.ts` - Persistent storage hooks
- `useDebounce.ts` - Input debouncing

### Services (`src/services/`)
- `apiClient.ts` - Unified HTTP client
- `authService.ts` - Authentication API calls
- `retryService.ts` - Retry with circuit breaker
- `dataPersistenceService.ts` - Data storage service
- `validationService.ts` - Response validation

### Backend (`server/`)
Complete Express.js backend structure ready for implementation.

### Testing (`src/__tests__/`)
Vitest test setup with placeholder tests.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- React and Vite teams for excellent developer experience
- Tailwind CSS for rapid UI development
