# Phase 4: Behavioral Analysis Integration

## Overview
Integrate the behavioral analysis microservice (behavioral-service/) to provide real-time cognitive load predictions based on user interactions during research sessions.

## Current State Assessment

### Existing Behavioral Service
- **Location**: `behavioral-service/`
- **Tech Stack**: Python (FastAPI), scikit-learn
- **Features**:
  - Interaction tracking (clicks, keystrokes, scrolling, dwell time)
  - Feature extraction and aggregation
  - ML-based classification
  - Rule-based classification fallback
- **Status**: Standalone service, not integrated with main app

### Current Frontend Interaction Tracking
- **File**: `src/services/interactionTracker.ts`
- **Capabilities**: Tracks clicks, key presses, mouse movements, scrolling
- **Current Usage**: Data collected but not analyzed in real-time
- **Storage**: Session storage only

### Current Cognitive Load Assessment
- **File**: `src/services/cognitiveLoadService.ts`
- **Method**: NASA-TLX based questionnaire
- **Timing**: Post-session only
- **Limitations**: Retrospective, no real-time feedback

## Integration Goals

1. **Real-time Cognitive Load Prediction**
   - Stream interaction data to behavioral service during sessions
   - Receive continuous cognitive load predictions
   - Display predictions to researchers/admins
   - Store predictions for post-session analysis

2. **Enhanced Analytics**
   - Compare self-reported (NASA-TLX) vs. predicted cognitive load
   - Identify patterns in interaction behaviors
   - Detect high cognitive load moments during sessions
   - Generate insights for researchers

3. **Improved Data Collection**
   - Standardize interaction event format
   - Add missing interaction types (copy/paste, tab switches)
   - Implement batching for efficient API calls
   - Add error handling and retry logic

4. **Admin Dashboard Enhancement**
   - Add behavioral analysis tab
   - Visualize cognitive load over time (line charts)
   - Show interaction heatmaps
   - Display prediction accuracy metrics

## Architecture Design

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Research Interface (ChatGPT/Gemini/Grok)            │   │
│  │  • User interactions captured                        │   │
│  │  • Events buffered locally                           │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │  Behavioral Analysis Service (Frontend)              │   │
│  │  • Batch interaction events                          │   │
│  │  • Send to backend every N seconds                   │   │
│  │  • Receive cognitive load predictions                │   │
│  │  • Update UI indicators (optional)                   │   │
│  └──────────────────┬───────────────────────────────────┘   │
└────────────────────┬┼───────────────────────────────────────┘
                     ││
                     ││ HTTP POST /api/behavioral/analyze
                     ││
┌────────────────────▼▼───────────────────────────────────────┐
│              Backend API Server (Node.js/Express)            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  POST /api/behavioral/analyze                        │   │
│  │  • Receive interaction batch                         │   │
│  │  • Forward to Python microservice                    │   │
│  │  • Store raw interactions in database                │   │
│  │  • Return predictions to frontend                    │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │  Admin Routes Enhancement                            │   │
│  │  • GET /api/admin/behavioral/:sessionId              │   │
│  │  • GET /api/admin/behavioral/accuracy                │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP POST to Python service
                     │
┌────────────────────▼────────────────────────────────────────┐
│         Behavioral Analysis Microservice (Python)            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  POST /classify                                      │   │
│  │  • Extract features from interactions                │   │
│  │  • Apply ML classifier                               │   │
│  │  • Return cognitive load prediction                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Models: RandomForest, SVM, Rule-based fallback             │
│  Features: Click rate, typing speed, dwell time, etc.       │
└──────────────────────────────────────────────────────────────┘
```

## Implementation Tasks

### Task 1: Database Schema Updates
**File**: Database migration
**Changes**:
```sql
-- Add behavioral_predictions table
CREATE TABLE behavioral_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  prediction_timestamp TIMESTAMP NOT NULL,
  predicted_load_category VARCHAR(50) NOT NULL,
  predicted_load_score DECIMAL(5,2),
  confidence_score DECIMAL(5,2),
  features JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add interactions table
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_behavioral_predictions_session ON behavioral_predictions(session_id);
CREATE INDEX idx_interactions_session ON interactions(session_id);
CREATE INDEX idx_interactions_timestamp ON interactions(timestamp);
```

### Task 2: Backend API Routes
**File**: `server/src/routes/behavioral.ts` (NEW)
**Endpoints**:
- `POST /api/behavioral/analyze` - Analyze interaction batch
- `POST /api/behavioral/interactions` - Store interactions
- `GET /api/behavioral/predictions/:sessionId` - Get predictions for session

**File**: `server/src/routes/admin.ts` (UPDATE)
**New Endpoints**:
- `GET /api/admin/behavioral/accuracy` - Compare predicted vs actual
- `GET /api/admin/behavioral/:sessionId` - Detailed behavioral analysis

### Task 3: Python Microservice Integration
**File**: `server/src/services/behavioralService.ts` (NEW)
**Purpose**: Communicate with Python microservice
**Methods**:
- `analyzeBehavior(interactions)` - Send to Python, get prediction
- `healthCheck()` - Verify Python service is running

**File**: `behavioral-service/src/main.py` (UPDATE)
**Changes**:
- Add CORS headers for Node.js backend
- Add health check endpoint
- Validate input format
- Return structured predictions

### Task 4: Frontend Service Updates
**File**: `src/services/behavioralClassificationService.ts` (UPDATE)
**Changes**:
- Replace mock implementation with real API calls
- Add batching logic (collect events, send every 10 seconds)
- Add retry logic for failed requests
- Store predictions in session state

**File**: `src/services/interactionTracker.ts` (UPDATE)
**Changes**:
- Standardize event format
- Add session context to events
- Implement event buffer
- Add timestamp precision

### Task 5: Frontend Context Updates
**File**: `src/context/SessionContext.tsx` (UPDATE)
**New State**:
```typescript
interface SessionContextType {
  // ... existing fields
  behavioralPredictions: BehavioralPrediction[];
  currentCognitiveLoad: number | null;
  addBehavioralPrediction: (prediction: BehavioralPrediction) => void;
}
```

### Task 6: Admin Dashboard Enhancement
**File**: `src/components/AdminDashboard.tsx` (UPDATE)
**New Tab**: "Behavioral Analysis"
**Features**:
- Cognitive load timeline (line chart)
- Prediction accuracy metrics
- Interaction heatmap
- Compare predicted vs NASA-TLX scores

**File**: `src/services/adminService.ts` (UPDATE)
**New Methods**:
- `getBehavioralAnalysis(sessionId)`
- `getPredictionAccuracy()`

### Task 7: Docker Integration
**File**: `docker-compose.yml` (UPDATE)
**Add Python Service**:
```yaml
behavioral-service:
  build: ./behavioral-service
  ports:
    - "8000:8000"
  volumes:
    - ./behavioral-service:/app
  environment:
    - MODEL_PATH=/app/data/models
```

### Task 8: Testing & Validation
**Files**: 
- `server/src/routes/__tests__/behavioral.test.ts` (NEW)
- `src/__tests__/behavioralService.test.ts` (NEW)

**Test Cases**:
- Interaction batching and sending
- Python service communication
- Prediction storage
- Error handling and retries
- Admin analytics accuracy

## Data Flow Example

### During Research Session
1. User types query in ChatGPT interface
2. `interactionTracker` captures keypress events
3. Events added to buffer: `[{type: 'keypress', timestamp: ...}]`
4. Every 10 seconds, `behavioralClassificationService` sends batch to backend
5. Backend forwards to Python service
6. Python returns prediction: `{category: 'medium', score: 65, confidence: 0.85}`
7. Backend stores in `behavioral_predictions` table
8. Frontend receives prediction, updates session context
9. (Optional) UI shows cognitive load indicator

### Post-Session Analysis
1. User completes NASA-TLX questionnaire
2. Backend stores self-reported cognitive load
3. Admin views session in dashboard
4. Dashboard fetches:
   - All behavioral predictions for session
   - Final NASA-TLX score
   - Raw interactions
5. Charts show:
   - Cognitive load over time
   - Comparison: predicted vs actual
   - Interaction patterns

## Success Metrics

1. **Integration Success**
   - Python service responds within 500ms
   - 95%+ prediction requests succeed
   - Data stored correctly in database

2. **Prediction Quality**
   - Compare predictions to NASA-TLX scores
   - Calculate correlation coefficient
   - Identify systematic biases

3. **User Experience**
   - No noticeable performance impact
   - Minimal network overhead (<1MB per session)
   - Graceful degradation if service unavailable

## Dependencies

### New NPM Packages (Backend)
- `axios` (if not already installed) - HTTP client for Python service

### Python Service Requirements
- FastAPI running on port 8000
- Trained models in `behavioral-service/data/models/`
- CORS configured for Node.js backend

### Environment Variables
```env
# .env
BEHAVIORAL_SERVICE_URL=http://localhost:8000
BEHAVIORAL_SERVICE_TIMEOUT=5000
BEHAVIORAL_BATCH_INTERVAL=10000
```

## Rollout Plan

### Phase 4.1: Infrastructure (Days 1-2)
- [ ] Update database schema
- [ ] Add behavioral routes to backend
- [ ] Create behavioral service client
- [ ] Configure Docker Compose

### Phase 4.2: Core Integration (Days 3-4)
- [ ] Update Python service for integration
- [ ] Implement interaction batching
- [ ] Connect frontend to backend
- [ ] Test end-to-end flow

### Phase 4.3: Admin Dashboard (Day 5)
- [ ] Add behavioral analysis tab
- [ ] Create visualization components
- [ ] Implement accuracy metrics
- [ ] Test with real data

### Phase 4.4: Testing & Refinement (Days 6-7)
- [ ] Unit tests for all components
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Error handling edge cases

## Risk Mitigation

1. **Python Service Downtime**
   - Store interactions even if service fails
   - Queue predictions for retry
   - Show graceful error to admin

2. **Performance Impact**
   - Batch requests to reduce API calls
   - Implement client-side throttling
   - Use async processing

3. **Data Privacy**
   - Anonymize interaction data
   - Respect user consent
   - Implement data retention policies

## Next Steps

1. Review and approve this plan
2. Set up development environment with Python service
3. Begin Phase 4.1: Infrastructure updates
4. Daily progress updates

---

**Estimated Completion**: 7 days
**Dependencies**: Supabase access, Python environment
**Priority**: High - Enables core research functionality
