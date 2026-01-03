# Cognitive Load Analysis Platform

A research platform for studying cognitive load differences between AI chatbots and traditional Google Search, with integrated creativity assessment.

## 🎯 Overview

This platform enables researchers to conduct studies comparing how users learn and retain information when using AI chatbots (like ChatGPT) versus Google Search. It measures cognitive load through **behavioral interaction analysis** - capturing user interaction patterns (clicks, mouse movements, keystrokes, navigation) and using machine learning classification to infer cognitive load levels.

## ✨ Features

- **Multi-Platform Research**: Compare learning outcomes between AI chatbots and Google Search
- **Behavioral Cognitive Load Analysis**: Real-time cognitive load inference from user interaction patterns
- **Dynamic Assessments**: AI-generated questions based on research topics
- **Creativity Evaluation**: Divergent thinking tests with automated scoring
- **Cognitive Load Metrics**: Behavioral-based scoring system with confidence levels
- **Admin Dashboard**: Manage participants and view aggregated results

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **AI Integration**: Google Gemini API (with dual API key system)
- **Backend**: Node.js + Express + Redis
- **Behavioral Service**: Python + FastAPI (behavioral data processing and ML classification)
- **Testing**: Vitest + React Testing Library + Hypothesis (property-based testing)

## 📁 Project Structure

```
Cognitive_Load_Analysis/
├── behavioral-service/             # Python FastAPI behavioral analysis service
│   ├── src/
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── models.py               # Pydantic request/response models
│   │   ├── classifier/             # Cognitive load classification
│   │   │   ├── classifier.py       # Main classifier facade
│   │   │   ├── rule_based.py       # Rule-based classifier (primary)
│   │   │   └── ml_classifier.py    # ML classifier (optional fallback)
│   │   ├── features/               # Feature extraction modules
│   │   │   ├── aggregator.py       # Feature aggregation
│   │   │   ├── click_analysis.py   # Click pattern analysis
│   │   │   ├── mouse_analysis.py   # Mouse movement analysis
│   │   │   ├── navigation_analysis.py
│   │   │   └── response_time.py    # Response time metrics
│   │   └── middleware/             # Error handling middleware
│   ├── data/
│   │   ├── raw/                    # Training data (optional)
│   │   ├── processed/              # Processed features
│   │   └── models/                 # Trained ML models (optional)
│   ├── tests/                      # Property-based tests
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
│   │   ├── middleware/             # Express middleware
│   │   ├── routes/                 # API routes
│   │   └── index.ts                # Server entry point
│   └── package.json
│
├── src/                            # Frontend source
│   ├── components/                 # React components
│   │   ├── common/                 # Shared components
│   │   ├── AdminDashboard.tsx
│   │   ├── ChatGPTInterface.tsx
│   │   ├── CognitiveLoadResults.tsx
│   │   ├── GoogleSearchInterface.tsx
│   │   └── ...
│   ├── services/
│   │   ├── interactionTracker.ts   # Behavioral event capture
│   │   ├── behavioralClassificationService.ts
│   │   ├── cognitiveLoadService.ts
│   │   └── ...
│   ├── context/                    # React Context
│   ├── hooks/                      # Custom hooks
│   ├── types/                      # TypeScript types
│   └── utils/                      # Utility functions
│
├── .env.example                    # Environment template
├── ARCHITECTURE.md                 # System architecture
├── docker-compose.yml              # Docker services (Redis, Backend)
└── README.md                       # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- npm or yarn
- Google Gemini API key(s)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/Cognitive_Load_Analysis.git
cd Cognitive_Load_Analysis

# Install frontend dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your API keys to .env
# VITE_GEMINI_API_KEY=your-api-key
```

### Running the Services

#### 1. Start the Behavioral Service (FastAPI)

```bash
cd behavioral-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Unix/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the service
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Start the Backend (Express.js)

```bash
cd server
npm install
npm run dev
```

#### 3. Start the Frontend (React + Vite)

```bash
# From project root
npm run dev
```

### Running with Docker (Optional - for Redis and Backend)

```bash"
# Start Redis and Express backend
docker-compose up -d

# Start behavioral service separately (outside Docker)
cd behavioral-service
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

# Start frontend
npm run dev
```

### Running Tests

```bash
# Frontend tests
npm test

# Frontend tests with coverage
npm run test:coverage

# Behavioral service tests
cd behavioral-service
pytest tests/ -v
```

## 🔧 Environment Configuration

Create a `.env` file in the project root:

```env
# API Keys
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_OPENAI_API_KEY=your-openai-api-key  # Optional
VITE_GROK_API_KEY=your-grok-api-key      # Optional

# Backend URLs
VITE_API_BASE_URL=http://localhost:3001
VITE_BEHAVIORAL_SERVICE_URL=http://localhost:8000

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_REAL_TIME=false
```

## 📊 Architecture Overview

The platform uses a dual-service architecture:

- **FastAPI Service (Port 8000)**: Handles behavioral data collection, feature extraction, and cognitive load classification
- **Express.js Server (Port 3001)**: Handles authentication, session management, and assessment data

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React + Vite)                        │
├─────────────────────────────────────────────────────────────────────────┤
│  Interaction Tracker  │  Platform Components  │  Results Display        │
└───────────────────────┼───────────────────────┼─────────────────────────┘
                        │                       │
           ┌────────────┴───────────┐           │
           ▼                        ▼           │
┌──────────────────────┐  ┌────────────────────┐│
│  FastAPI Service     │  │  Express.js Server ││
│  Port: 8000          │  │  Port: 3001        ││
│  - /api/interactions │  │  - /api/auth       ││
│  - /api/classify     │  │  - /api/sessions   ││
│  - /health           │  │  - /api/assessments││
└──────────────────────┘  └────────────────────┘│
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design.

## 📚 Documentation

- [Architecture](./ARCHITECTURE.md) - System design and data flow
- [Application Flow](./docs/APPLICATION_FLOW.md) - User journey documentation
- [Codebase Index](./docs/CODEBASE_INDEX.md) - Complete code reference
- [UI Components](./docs/UI_COMPONENTS.md) - Component documentation
- [API Setup](./DUAL_API_KEY_SETUP.md) - API configuration guide

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
- FastAPI for high-performance Python web framework
