# Behavioral Cognitive Load Service

FastAPI backend service for behavioral-based cognitive load classification. This service collects user interaction data (clicks, mouse movements, keystrokes, navigation) and uses machine learning to classify cognitive load levels during academic tasks.

## Overview

The Behavioral Cognitive Load Service is a lightweight Python microservice that:

- **Collects** user interaction events from the frontend
- **Extracts** behavioral features from raw interaction data
- **Classifies** cognitive load levels using rule-based or ML classifiers
- **Compares** cognitive load between different platforms (ChatGPT vs Google Search)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Application                          │
├─────────────────────────────────────────────────────────────────┤
│  /health              │  Health check endpoint                  │
│  /api/interactions/*  │  Interaction data endpoints             │
└───────────────────────┴─────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Feature Extraction                           │
├─────────────────────────────────────────────────────────────────┤
│  response_time.py     │  Response time metrics                  │
│  click_analysis.py    │  Click patterns & rage clicks           │
│  mouse_analysis.py    │  Cursor speed & trajectory              │
│  navigation_analysis.py│ Navigation patterns                    │
│  aggregator.py        │  Feature aggregation                    │
└───────────────────────┴─────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Classification                               │
├─────────────────────────────────────────────────────────────────┤
│  rule_based.py        │  Primary: Heuristic rules               │
│  ml_classifier.py     │  Fallback: Trained ML model             │
│  classifier.py        │  Classifier facade                      │
└───────────────────────┴─────────────────────────────────────────┘
```

## Setup

### Prerequisites

- Python 3.9+
- pip or pipenv

### Installation

```bash
# Navigate to the service directory
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
```

### Environment Configuration

Create a `.env` file based on `.env.example`:

```env
# Environment
FASTAPI_ENV=development

# Logging
LOG_LEVEL=INFO

# Server
HOST=0.0.0.0
PORT=8000

# CORS (comma-separated origins)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# ML Model (optional - rule-based classifier is used by default)
MODEL_PATH=data/models/cognitive_load_classifier.joblib
```

## Running the Service

### Development Mode

```bash
# From the behavioral-service directory
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

### Production Mode

```bash
uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Using Python directly

```bash
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Health Check

```
GET /health
```

Returns service health status.

**Response:**
```json
{
  "status": "healthy",
  "service": "behavioral-cognitive-load",
  "version": "1.0.0"
}
```

### Ingest Interaction Events

```
POST /api/interactions/ingest
```

Receives batched interaction events from the frontend.

**Request Body:**
```json
{
  "session_id": "sess_abc123",
  "participant_id": "user_001",
  "platform": "chatgpt",
  "events": [
    {
      "type": "click",
      "timestamp": 1704067200000,
      "session_id": "sess_abc123",
      "platform": "chatgpt",
      "data": {
        "target_element": "button.submit",
        "x": 450,
        "y": 320
      }
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "events_received": 1,
  "session_id": "sess_abc123"
}
```

### Classify Cognitive Load

```
POST /api/interactions/classify
```

Classifies cognitive load for a session based on collected interaction data.

**Request Body:**
```json
{
  "session_id": "sess_abc123",
  "include_features": true
}
```

**Response:**
```json
{
  "session_id": "sess_abc123",
  "cognitive_load_level": "Moderate",
  "confidence": 0.82,
  "features": {
    "mean_response_time": 2.45,
    "rage_click_count": 1,
    "trajectory_deviation": 0.32
  },
  "timestamp": "2025-01-02T10:30:00Z"
}
```

### Compare Platforms

```
POST /api/interactions/compare
```

Computes statistical comparison between ChatGPT and Google Search sessions.

**Response:**
```json
{
  "chatgpt_mean_load": 2.3,
  "google_mean_load": 2.8,
  "statistical_significance": 0.04,
  "sample_sizes": {
    "chatgpt": 25,
    "google": 28
  }
}
```

## Feature Extraction

The service extracts the following behavioral features from raw interaction events:

| Category | Feature | Description |
|----------|---------|-------------|
| **Response Time** | mean_response_time | Average time between interactions |
| | median_response_time | Median response time |
| | std_response_time | Standard deviation of response times |
| **Click Behavior** | total_clicks | Total number of clicks |
| | rage_click_count | Rapid clicks on same target (3+ in 500ms) |
| | click_rate | Clicks per second |
| **Mouse Movement** | mean_cursor_speed | Average cursor velocity |
| | trajectory_deviation | Deviation from optimal path |
| | total_idle_time | Time with no mouse movement |
| **Navigation** | revisit_ratio | Ratio of revisited sections |
| | path_linearity | How linear the navigation path is |
| | sections_visited | Number of unique sections |
| **Engagement** | total_session_time | Total session duration |
| | active_time_ratio | Active vs idle time ratio |
| | scroll_depth | Maximum scroll depth reached |

## Classification

### Rule-Based Classifier (Primary)

The rule-based classifier uses scientifically-grounded heuristic rules based on behavioral thresholds:

| Feature | Low Load | Moderate | High | Very High |
|---------|----------|----------|------|-----------|
| mean_response_time | < 1.5s | 1.5-3.0s | 3.0-5.0s | > 5.0s |
| rage_click_count | 0 | 1 | 2-3 | > 3 |
| trajectory_deviation | < 0.2 | 0.2-0.4 | 0.4-0.6 | > 0.6 |
| revisit_ratio | < 0.1 | 0.1-0.25 | 0.25-0.4 | > 0.4 |
| total_idle_time | < 10s | 10-30s | 30-60s | > 60s |
| active_time_ratio | > 0.8 | 0.6-0.8 | 0.4-0.6 | < 0.4 |

### ML Classifier (Optional Fallback)

When a trained model is available at `MODEL_PATH`, the service can use an ML classifier:

- **Algorithm**: Random Forest or Gradient Boosting
- **Format**: joblib serialized model
- **Fallback**: If model loading fails, rule-based classifier is used

## Training Pipeline (Optional)

The ML classifier can be trained when suitable behavioral datasets are available.

### Data Format

Training data should be in CSV format:

```csv
session_id,platform,mean_response_time,rage_click_count,cursor_speed,...,cognitive_load_label
sess_001,chatgpt,2.45,0,250.5,...,Low
sess_002,google,4.12,3,180.2,...,High
```

### Directory Structure

```
behavioral-service/
├── data/
│   ├── raw/                    # Raw training data (CSV files)
│   │   └── training_data.csv
│   ├── processed/              # Extracted features
│   │   └── features.csv
│   └── models/                 # Trained ML models
│       └── cognitive_load_classifier.joblib
```

### Training Script (Future)

```bash
# Train a new model
python -m src.training.train --data data/raw/training_data.csv --output data/models/

# Evaluate model
python -m src.training.evaluate --model data/models/cognitive_load_classifier.joblib
```

## Running Tests

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html

# Run specific test file
pytest tests/test_models.py -v

# Run property-based tests only
pytest tests/ -v -k "property"
```

### Test Structure

```
tests/
├── conftest.py              # Pytest fixtures
├── test_main.py             # API endpoint tests
├── test_models.py           # Pydantic model tests
├── test_error_handler.py    # Error handling tests
└── test_interactions.py     # Interaction processing tests
```

## Error Handling

The service returns structured error responses:

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

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request payload |
| SESSION_NOT_FOUND | 404 | Session ID not found |
| CLASSIFICATION_ERROR | 500 | Classification failed |
| INTERNAL_ERROR | 500 | Unexpected server error |

## Logging

The service uses structured logging with `structlog`:

```json
{
  "event": "request_completed",
  "request_id": "abc123",
  "method": "POST",
  "path": "/api/interactions/ingest",
  "status_code": 200,
  "duration_ms": 45.2,
  "timestamp": "2025-01-02T10:30:00Z"
}
```

Configure log level via environment variable:

```env
LOG_LEVEL=DEBUG  # DEBUG, INFO, WARNING, ERROR
```

## Development

### Code Structure

```
src/
├── main.py                  # FastAPI application entry point
├── models.py                # Pydantic request/response models
├── classifier/
│   ├── __init__.py
│   ├── classifier.py        # Main classifier facade
│   ├── rule_based.py        # Rule-based classifier
│   └── ml_classifier.py     # ML classifier wrapper
├── features/
│   ├── __init__.py
│   ├── aggregator.py        # Feature aggregation
│   ├── click_analysis.py    # Click feature extraction
│   ├── mouse_analysis.py    # Mouse feature extraction
│   ├── navigation_analysis.py
│   └── response_time.py     # Response time features
├── middleware/
│   ├── __init__.py
│   └── error_handler.py     # Error handling middleware
└── routes/
    ├── __init__.py
    └── interactions.py      # API route handlers
```

### Adding New Features

1. Create a new feature extractor in `src/features/`
2. Add the feature to `BehavioralFeatures` model in `src/models.py`
3. Update the aggregator in `src/features/aggregator.py`
4. Add tests in `tests/`

## License

MIT License
