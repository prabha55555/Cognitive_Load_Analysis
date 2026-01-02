# Design Document: Behavioral Cognitive Load Classification

## Overview

This design document describes the architecture and implementation approach for transforming the Cognitive Load Analysis Platform from EEG-based measurement to behavioral interaction-based inference. The system will capture user interaction patterns (clicks, mouse movements, keystrokes, navigation) and use a rule-based classifier to determine cognitive load levels.

The key architectural changes include:
1. Removing the Flask/Chronos biosignal-service (heavy Docker-based EEG generation)
2. Adding a lightweight FastAPI backend for behavioral data processing
3. Implementing a rule-based classifier as the primary classification method (works immediately without training data)
4. Supporting an optional ML classifier as fallback when trained model is available
5. Enhancing the React frontend with interaction tracking capabilities

## Architecture

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
│   Classifier Module           │
├───────────────────────────────┤
│  • Feature Extraction         │
│  • Rule-based Classifier (Primary) │
│  • ML Classifier (Fallback)   │
└───────────────────────────────┘
```

## Components and Interfaces

### 1. Interaction Tracker (Frontend)

A React service that captures and batches user interaction events.

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

interface InteractionTrackerConfig {
  batchSize: number;           // Max events before auto-flush (default: 50)
  flushInterval: number;       // Max time before auto-flush in ms (default: 5000)
  mouseSampleRate: number;     // Mouse sampling interval in ms (default: 100)
  throttleHighFrequency: boolean;
}
```

### 2. FastAPI Backend Service

A lightweight Python service for behavioral data processing.

```python
# API Endpoints
POST /api/interactions/ingest     # Receive batched interaction events
POST /api/interactions/classify   # Classify cognitive load from session
POST /api/interactions/compare    # Compare cognitive load between platforms
GET  /health                      # Health check endpoint

# Request/Response Models
class InteractionBatch(BaseModel):
    session_id: str
    participant_id: str
    platform: Literal["chatgpt", "google"]
    events: List[InteractionEvent]

class ClassificationRequest(BaseModel):
    session_id: str
    include_features: bool = False

class ClassificationResponse(BaseModel):
    session_id: str
    cognitive_load_level: Literal["Low", "Moderate", "High", "Very High"]
    confidence: float
    features: Optional[Dict[str, float]]

class ComparisonResponse(BaseModel):
    chatgpt_mean_load: float
    google_mean_load: float
    statistical_significance: float
    sample_sizes: Dict[str, int]
```

### 3. Feature Extraction Module

Computes behavioral features from raw interaction events.

```python
class BehavioralFeatures:
    # Response Time Features
    mean_response_time: float
    median_response_time: float
    std_response_time: float
    
    # Click Features
    total_clicks: int
    rage_click_count: int
    click_rate: float
    
    # Mouse Features
    mean_cursor_speed: float
    trajectory_deviation: float
    total_idle_time: float
    
    # Navigation Features
    revisit_ratio: float
    path_linearity: float
    sections_visited: int
    
    # Engagement Features
    total_session_time: float
    active_time_ratio: float
    scroll_depth: float
```

### 4. Cognitive Load Classifier

Classification module with rule-based primary and optional ML fallback.

```python
class RuleBasedClassifier:
    """Primary classifier using scientifically-grounded heuristic rules.
    
    Classification is based on behavioral indicators from HCI research:
    - Response time patterns (slower = higher load)
    - Rage clicks (frustration indicator)
    - Mouse trajectory deviation (confusion indicator)
    - Navigation revisits (difficulty finding information)
    - Idle time (processing/thinking time)
    """
    
    def predict(self, features: BehavioralFeatures) -> Tuple[str, float]:
        """
        Classify cognitive load using weighted feature thresholds.
        
        Returns (cognitive_load_level, confidence) where:
        - cognitive_load_level: "Low", "Moderate", "High", or "Very High"
        - confidence: 0.0 to 1.0 based on how clearly features indicate the level
        """

class MLClassifier:
    """Optional fallback classifier using trained ML model."""
    
    def __init__(self, model_path: Optional[str] = None):
        """Initialize classifier, loading model if path provided."""
        
    def predict(self, features: BehavioralFeatures) -> Tuple[str, float]:
        """ML-based classification when trained model available."""

class CognitiveLoadClassifier:
    """Main classifier that uses rule-based as primary, ML as fallback."""
    
    def __init__(self, model_path: Optional[str] = None):
        """Initialize with rule-based primary, optionally load ML model."""
        self.rule_based = RuleBasedClassifier()
        self.ml_classifier = MLClassifier(model_path) if model_path else None
        
    def predict(self, features: BehavioralFeatures) -> Tuple[str, float]:
        """Return (cognitive_load_level, confidence) using rule-based classifier."""
        
    def predict_batch(self, features_list: List[BehavioralFeatures]) -> List[Tuple[str, float]]:
        """Batch prediction for multiple sessions."""
```

### Rule-Based Classification Logic

The rule-based classifier uses weighted scoring across behavioral dimensions:

| Feature | Low Load | Moderate Load | High Load | Very High Load |
|---------|----------|---------------|-----------|----------------|
| mean_response_time | < 1.5s | 1.5-3.0s | 3.0-5.0s | > 5.0s |
| rage_click_count | 0 | 1 | 2-3 | > 3 |
| trajectory_deviation | < 0.2 | 0.2-0.4 | 0.4-0.6 | > 0.6 |
| revisit_ratio | < 0.1 | 0.1-0.25 | 0.25-0.4 | > 0.4 |
| total_idle_time | < 10s | 10-30s | 30-60s | > 60s |
| active_time_ratio | > 0.8 | 0.6-0.8 | 0.4-0.6 | < 0.4 |

Confidence is calculated based on feature agreement - higher confidence when multiple features point to the same level.

## Data Models

### Interaction Event Schema

```json
{
  "type": "click",
  "timestamp": 1704067200000,
  "sessionId": "sess_abc123",
  "platform": "chatgpt",
  "data": {
    "targetElement": "button.submit",
    "x": 450,
    "y": 320
  }
}
```

### Feature Vector Schema

```json
{
  "session_id": "sess_abc123",
  "platform": "chatgpt",
  "features": {
    "mean_response_time": 2.45,
    "median_response_time": 2.10,
    "std_response_time": 0.85,
    "total_clicks": 45,
    "rage_click_count": 2,
    "click_rate": 0.15,
    "mean_cursor_speed": 250.5,
    "trajectory_deviation": 0.32,
    "total_idle_time": 45.2,
    "revisit_ratio": 0.15,
    "path_linearity": 0.78,
    "sections_visited": 8,
    "total_session_time": 300.0,
    "active_time_ratio": 0.85,
    "scroll_depth": 0.92
  }
}
```

### Classification Result Schema

```json
{
  "session_id": "sess_abc123",
  "cognitive_load_level": "Moderate",
  "confidence": 0.82,
  "timestamp": "2025-01-02T10:30:00Z"
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Click event data completeness
*For any* click event captured by the Interaction Tracker, the event object SHALL contain a valid timestamp, target element identifier, and x/y coordinates.
**Validates: Requirements 1.1**

### Property 2: Mouse sampling consistency
*For any* sequence of mouse movements during tracking, the recorded events SHALL be spaced at intervals no less than the configured sampling rate.
**Validates: Requirements 1.2**

### Property 3: Keystroke privacy preservation
*For any* keystroke event captured, the event data SHALL contain timing information but SHALL NOT contain the actual character or key value.
**Validates: Requirements 1.3**

### Property 4: Scroll event data completeness
*For any* scroll event captured, the event object SHALL contain direction, velocity, and scroll position values.
**Validates: Requirements 1.4**

### Property 5: Navigation path tracking accuracy
*For any* navigation between sections, the recorded path SHALL correctly reflect the source section, destination section, and time spent.
**Validates: Requirements 1.5**

### Property 6: Payload schema validation
*For any* interaction data payload received by the backend, valid payloads conforming to the schema SHALL be accepted, and invalid payloads SHALL be rejected with appropriate error responses.
**Validates: Requirements 2.2**

### Property 7: Error response structure
*For any* error encountered during request processing, the response SHALL contain an error code and human-readable message in a consistent JSON structure.
**Validates: Requirements 2.4**

### Property 8: Response time metric correctness
*For any* set of interaction events with timestamps, the computed mean, median, and standard deviation of response times SHALL match the mathematically correct values.
**Validates: Requirements 3.1**

### Property 9: Rage click detection accuracy
*For any* sequence of click events, rage clicks SHALL be correctly identified as 3 or more clicks within 500ms on the same target element.
**Validates: Requirements 3.2**

### Property 10: Mouse metric calculation correctness
*For any* mouse trajectory data, the computed cursor speed, trajectory deviation, and idle time SHALL be mathematically correct based on the input coordinates and timestamps.
**Validates: Requirements 3.3**

### Property 11: Navigation metric calculation correctness
*For any* navigation path, the revisit ratio (revisited sections / total navigations) and path linearity score SHALL be correctly computed.
**Validates: Requirements 3.4**

### Property 12: Feature vector completeness
*For any* completed session, the aggregated feature vector SHALL contain all defined feature dimensions with valid numeric values.
**Validates: Requirements 3.5**

### Property 13: Feature serialization round-trip
*For any* feature vector, serializing to JSON and deserializing back SHALL produce an equivalent feature vector with identical values.
**Validates: Requirements 3.6**

### Property 14: Classification output validity
*For any* valid feature vector submitted for classification, the returned cognitive load level SHALL be one of: "Low", "Moderate", "High", or "Very High".
**Validates: Requirements 4.1**

### Property 15: Confidence score bounds
*For any* classification prediction, the confidence score SHALL be a value between 0.0 and 1.0 inclusive.
**Validates: Requirements 4.2**

### Property 16: Training data parsing
*For any* valid CSV file with the expected column structure, the training pipeline SHALL successfully parse all rows into feature vectors with labels.
**Validates: Requirements 5.1**

### Property 17: Training metrics completeness
*For any* completed training run, the output metrics SHALL include accuracy, precision, recall, and F1-score for each cognitive load class.
**Validates: Requirements 5.4**

### Property 18: Event queue behavior
*For any* interaction event captured while tracking is active, the event SHALL be added to the in-memory queue before transmission.
**Validates: Requirements 6.2**

### Property 19: Queue flush completeness
*For any* flush operation triggered on the Interaction Tracker, all queued events SHALL be transmitted and the queue SHALL be empty after successful transmission.
**Validates: Requirements 6.3**

### Property 20: High-frequency event throttling
*For any* high-frequency event stream (e.g., mousemove), the Interaction Tracker SHALL limit the output rate to the configured throttle threshold.
**Validates: Requirements 6.5**

### Property 21: Platform tagging consistency
*For any* recorded session, the platform tag (ChatGPT or Google Search) SHALL be present and consistent across all interaction records in that session.
**Validates: Requirements 7.1, 7.4**

### Property 22: Statistical comparison validity
*For any* two groups of sessions (ChatGPT vs Google), the comparative analysis SHALL compute valid statistical measures including mean difference and significance.
**Validates: Requirements 7.3**

### Property 23: Request logging completeness
*For any* API request processed by the backend, a log entry SHALL be created containing the HTTP method, request path, and response status code.
**Validates: Requirements 8.1**

## Error Handling

### Frontend Error Handling

1. **Network Failures**: Interaction Tracker implements exponential backoff retry (1s, 2s, 4s, 8s, max 30s)
2. **Queue Overflow**: If queue exceeds 1000 events, oldest events are dropped with warning logged
3. **Invalid Events**: Malformed events are logged and discarded, not queued

### Backend Error Handling

1. **Validation Errors**: Return 400 with detailed field-level error messages
2. **Classification Errors**: Log warning, rule-based classifier handles gracefully
3. **ML Model Loading Errors**: Service continues with rule-based classifier (primary), logs info
4. **Database Errors**: Return 503 with retry-after header

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

## Testing Strategy

### Dual Testing Approach

This project uses both unit tests and property-based tests for comprehensive coverage:

1. **Unit Tests**: Verify specific examples, edge cases, and integration points
2. **Property-Based Tests**: Verify universal properties that should hold across all inputs

### Property-Based Testing Framework

- **Python Backend**: `hypothesis` library for property-based testing
- **TypeScript Frontend**: `fast-check` library for property-based testing

### Test Configuration

- Property tests run minimum 100 iterations per property
- Each property test is tagged with the correctness property it validates

### Unit Test Coverage

- API endpoint integration tests
- Feature extraction edge cases (empty sessions, single events)
- Classifier fallback behavior
- Frontend event listener initialization

### Property Test Coverage

All correctness properties (1-23) are implemented as property-based tests with explicit requirement references.

## Dataset and Training (Optional)

### Note on Training Data

The rule-based classifier works immediately without any training data. The ML classifier is optional and can be trained when suitable behavioral datasets become available.

### Recommended Approach

1. **MVP**: Use rule-based classifier (no training data needed)
2. **Future Enhancement**: Collect labeled data from pilot studies using the platform itself
3. **Alternative**: Find behavioral interaction datasets with cognitive load labels

### Dataset Folder Structure

```
behavioral-service/
├── data/
│   ├── raw/
│   │   └── training_data.csv    # Optional: for ML training
│   ├── processed/
│   │   └── features.csv
│   └── models/
│       └── cognitive_load_classifier.joblib  # Optional: trained ML model
```

### Training Data Format (When Available)

```csv
session_id,platform,mean_response_time,rage_click_count,cursor_speed,...,cognitive_load_label
sess_001,chatgpt,2.45,0,250.5,...,Low
sess_002,google,4.12,3,180.2,...,High
```

### Model Selection (For ML Fallback)

- **Primary**: Rule-based heuristics (always available, no training needed)
- **Optional ML**: Random Forest Classifier (when training data available)
- **Alternative ML**: Gradient Boosting (XGBoost) for higher accuracy if needed

## Deployment

### FastAPI Service (No Docker Required)

```bash
# Setup
cd behavioral-service
python -m venv venv
source venv/bin/activate  # or .\venv\Scripts\activate on Windows
pip install -r requirements.txt

# Run
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

### Service Configuration

```env
# behavioral-service/.env
FASTAPI_ENV=development
LOG_LEVEL=INFO
MODEL_PATH=data/models/cognitive_load_classifier.joblib
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Files to Remove (Cleanup)

The following files/folders from the old EEG-based approach should be removed:
- `biosignal-service/` (entire directory)
- Docker configurations related to biosignal service
- EEG-related frontend components and services
