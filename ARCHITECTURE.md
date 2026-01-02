# Cognitive Load Analysis Platform - Architecture

## Overview

This platform compares cognitive load experienced by students using ChatGPT versus Google Search for academic tasks. The system infers cognitive load from user interaction patterns (clicks, mouse movements, keystrokes, navigation) using machine learning classification.

**Key Architectural Decisions:**
- Lightweight FastAPI backend for behavioral data processing (replaces heavy Docker-based services)
- ML classifier trained on behavioral features for cognitive load prediction
- Rule-based fallback when ML model is unavailable
- Event batching and throttling for efficient data transmission
- Dual-service architecture: FastAPI for behavioral analysis, Express.js for authentication

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React + Vite)                        │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │ Interaction     │  │ Platform        │  │ Results Display         │ │
│  │ Tracker         │  │ Components      │  │ (Cognitive Load)        │ │
│  │ (New)           │  │ (ChatGPT/Google)│  │                         │ │
│  └────────┬────────┘  └────────┬────────┘  └────────────┬────────────┘ │
│           │                    │                        │              │
│           └────────────────────┼────────────────────────┘              │
│                                │                                        │
└────────────────────────────────┼────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
┌───────────────────────────────┐  ┌───────────────────────────────────┐
│   FastAPI Service (New)       │  │   Express.js Server (Existing)    │
│   Port: 8000                  │  │   Port: 3001                      │
├───────────────────────────────┤  ├───────────────────────────────────┤
│  /api/interactions/ingest     │  │  /api/auth/*                      │
│  /api/interactions/classify   │  │  /api/sessions/*                  │
│  /api/interactions/compare    │  │  /api/assessments/*               │
│  /health                      │  │                                   │
└───────────────┬───────────────┘  └───────────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│   ML Classifier Module        │
├───────────────────────────────┤
│  • Feature Extraction         │
│  • Scikit-learn Classifier    │
│  • Rule-based Fallback        │
└───────────────────────────────┘
```

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION FLOW                             │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Research   │
│    Phase     │
└──────┬───────┘
       │ Complete Research
       ↓
┌──────────────────────────────────────┐
│       Platform Selection             │
│  ┌────────────────────────────────┐  │
│  │ User selects:                  │  │
│  │ • ChatGPT Interface            │  │
│  │ • Google Search Interface      │  │
│  └────────────────────────────────┘  │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│       Interaction Tracking           │
│  ┌────────────────────────────────┐  │
│  │ Capture Events:                │  │
│  │ • Click events (target, coords)│  │
│  │ • Mouse movements (trajectory) │  │
│  │ • Scroll events (direction)    │  │
│  │ • Keystroke timing             │  │
│  │ • Navigation paths             │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Batch & Transmit:              │  │
│  │ • Queue events in memory       │  │
│  │ • Flush every 5 seconds        │  │
│  │ • Send to FastAPI backend      │  │
│  └────────────────────────────────┘  │
└──────┬───────────────────────────────┘
       │ POST /api/interactions/ingest
       ↓
┌──────────────────────────────────────┐
│   FastAPI Backend                    │
│  ┌────────────────────────────────┐  │
│  │ Feature Extraction:            │  │
│  │ • Response time metrics        │  │
│  │ • Rage click detection         │  │
│  │ • Mouse speed & deviation      │  │
│  │ • Navigation patterns          │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ ML Classification:             │  │
│  │ • Load trained model           │  │
│  │ • Predict cognitive load       │  │
│  │ • Return confidence score      │  │
│  └────────────────────────────────┘  │
└──────┬───────────────────────────────┘
       │ Classification Result
       ↓
┌──────────────────────────────────────┐
│       Results Display                │
│  ┌────────────────────────────────┐  │
│  │ Show:                          │  │
│  │ • Cognitive load level         │  │
│  │ • Confidence score             │  │
│  │ • Platform comparison          │  │
│  │ • Recommendations              │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

## Component Architecture

### Frontend Components

```
src/
├── components/
│   ├── ParticipantDashboard.tsx    # Main state manager
│   ├── PlatformSelection.tsx       # ChatGPT vs Google selection
│   ├── ChatGPTInterface.tsx        # ChatGPT interaction UI
│   ├── GoogleSearchInterface.tsx   # Google Search interaction UI
│   ├── CognitiveLoadResults.tsx    # Results display
│   └── common/                     # Shared UI components
│
├── services/
│   ├── interactionTracker.ts       # Event capture & batching
│   ├── cognitiveLoadService.ts     # Classification API client
│   └── authService.ts              # Authentication
│
├── context/
│   ├── AuthContext.tsx             # Auth state
│   └── SessionContext.tsx          # Session management
│
└── types/
    └── index.ts                    # TypeScript interfaces
```

### Backend Services

```
behavioral-service/              # FastAPI (Python)
├── src/
│   ├── main.py                  # FastAPI app entry
│   ├── models.py                # Pydantic schemas
│   ├── features/                # Feature extraction
│   │   ├── response_time.py
│   │   ├── click_analysis.py
│   │   ├── mouse_analysis.py
│   │   └── navigation_analysis.py
│   ├── classifier/              # ML classification
│   │   ├── ml_classifier.py
│   │   └── rule_based.py
│   └── routes/                  # API endpoints
│       └── interactions.py
├── data/
│   ├── raw/                     # Training data
│   ├── processed/               # Feature data
│   └── models/                  # Trained models
└── tests/                       # Property-based tests

server/                          # Express.js (Node.js)
├── src/
│   ├── controllers/             # Request handlers
│   ├── middleware/              # Auth, validation
│   ├── routes/                  # API routes
│   └── services/                # Business logic
```

## Interaction Event Types

```typescript
interface InteractionEvent {
  type: 'click' | 'mousemove' | 'scroll' | 'keystroke' | 'navigation';
  timestamp: number;
  sessionId: string;
  platform: 'chatgpt' | 'google';
  data: ClickData | MouseData | ScrollData | KeystrokeData | NavigationData;
}

interface ClickData {
  targetElement: string;
  x: number;
  y: number;
}

interface MouseData {
  x: number;
  y: number;
  velocity: number;
}

interface ScrollData {
  direction: 'up' | 'down';
  velocity: number;
  position: number;
}

interface KeystrokeData {
  keyDownTime: number;
  keyUpTime: number;
  interKeyInterval: number;
}

interface NavigationData {
  fromSection: string;
  toSection: string;
  dwellTime: number;
}
```

## Behavioral Features

The system extracts the following features from raw interaction events:

| Feature Category | Metrics |
|-----------------|---------|
| Response Time | Mean, median, standard deviation |
| Click Behavior | Total clicks, rage click count, click rate |
| Mouse Movement | Cursor speed, trajectory deviation, idle time |
| Navigation | Revisit ratio, path linearity, sections visited |
| Engagement | Session time, active time ratio, scroll depth |

## Cognitive Load Classification

```
Input: BehavioralFeatures
  ↓
┌─────────────────────────────┐
│  ML Classifier              │
│  (Random Forest / XGBoost)  │
│                             │
│  OR                         │
│                             │
│  Rule-based Fallback        │
│  (Heuristic thresholds)     │
└─────────────────────────────┘
  ↓
Output: {
  level: "Low" | "Moderate" | "High" | "Very High",
  confidence: 0.0 - 1.0
}
```

### Model Selection
- **Primary**: Random Forest Classifier (good balance of accuracy and interpretability)
- **Alternative**: Gradient Boosting (XGBoost) for higher accuracy if needed
- **Fallback**: Rule-based heuristics when model unavailable

### Training Pipeline

```
behavioral-service/
├── data/
│   ├── raw/                     # Training data (CSV format)
│   │   └── training_data.csv
│   ├── processed/               # Extracted features
│   │   └── features.csv
│   └── models/                  # Trained models
│       └── cognitive_load_classifier.joblib
```

Training data format:
```csv
session_id,platform,mean_response_time,rage_click_count,cursor_speed,...,cognitive_load_label
sess_001,chatgpt,2.45,0,250.5,...,Low
sess_002,google,4.12,3,180.2,...,High
```

## Error Handling

### Frontend Error Handling
- **Network Failures**: Exponential backoff retry (1s, 2s, 4s, 8s, max 30s)
- **Queue Overflow**: Drop oldest events if queue exceeds 1000 events
- **Invalid Events**: Log and discard malformed events

### Backend Error Handling
- **Validation Errors**: Return 400 with field-level error messages
- **Classification Errors**: Fall back to rule-based classifier
- **Model Loading Errors**: Start with fallback classifier, log error
- **Database Errors**: Return 503 with retry-after header

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid interaction event format",
    "details": [
      {"field": "timestamp", "issue": "must be a positive integer"}
    ]
  },
  "request_id": "req_xyz789"
}
```

## API Endpoints

### FastAPI Service (Port 8000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/interactions/ingest` | POST | Receive batched events |
| `/api/interactions/classify` | POST | Classify session cognitive load |
| `/api/interactions/compare` | POST | Compare platforms statistically |

### Express.js Server (Port 3001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/*` | Various | Authentication endpoints |
| `/api/sessions/*` | Various | Session management |
| `/api/assessments/*` | Various | Assessment data |

## Deployment

### Development Setup

```bash
# Frontend (React + Vite)
npm install
npm run dev                    # Port 5173

# Backend (Express.js)
cd server
npm install
npm run dev                    # Port 3001

# Behavioral Service (FastAPI)
cd behavioral-service
python -m venv venv
.\venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn src.main:app --reload  # Port 8000
```

### Environment Configuration

FastAPI Service (`behavioral-service/.env`):
```env
FASTAPI_ENV=development
LOG_LEVEL=INFO
MODEL_PATH=data/models/cognitive_load_classifier.joblib
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Production (Docker Compose)

```bash
docker-compose up -d
```

Services:
- Redis: Port 6379 (caching)
- Express Backend: Port 3001
- Frontend: Port 5173 (dev profile)

Note: The FastAPI behavioral service runs outside Docker using a Python virtual environment for simplicity and ease of deployment.

## Key Design Patterns

### 1. Event Sourcing (Interaction Tracking)
```
User Actions → Event Queue → Batch Transmission → Feature Extraction
```

### 2. Service Layer Pattern
```
Components → Services → API Clients → Backend
```

### 3. Fallback Pattern (Classification)
```
ML Model Available? → Use ML Classifier
                   → Use Rule-based Fallback
```

### 4. Progressive Enhancement
```
Phase 1: Research
Phase 2: Platform Selection
Phase 3: Task Execution (with tracking)
Phase 4: Results & Comparison
```

## Service Communication

### Request Routing
- Behavioral data requests → FastAPI (Port 8000)
- Authentication requests → Express.js (Port 3001)
- Session management → Express.js (Port 3001)

### Session Context Sharing
Services share session context through JWT tokens for session identification across services.

### Graceful Degradation
If the FastAPI service is unavailable, the frontend continues functioning with reduced analytics capabilities.

---

**Architecture Version**: 2.0.0  
**Last Updated**: January 2026  
**Status**: Behavioral-based Cognitive Load Analysis
