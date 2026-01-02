# Implementation Plan

- [x] 1. Project cleanup and setup






  - [x] 1.1 Remove biosignal-service directory and related Docker configurations

    - Delete `biosignal-service/` folder entirely
    - Remove biosignal-service from `docker-compose.yml`
    - Remove any biosignal-related environment variables from `.env` and `.env.example`
    - _Requirements: 8.5_

  - [x] 1.2 Create behavioral-service directory structure

    - Create `behavioral-service/` with `src/`, `data/`, `tests/` subdirectories
    - Create `data/raw/`, `data/processed/`, `data/models/` folders
    - Initialize `requirements.txt` with FastAPI, uvicorn, pydantic, scikit-learn, hypothesis, pandas, numpy
    - Create `.env.example` with configuration template
    - _Requirements: 2.5, 5.5_


  - [x] 1.3 Update ARCHITECTURE.md with new behavioral-based approach





    - Document new system architecture diagram
    - Update component descriptions and data flow
    - Remove EEG/Chronos references
    - _Requirements: 8.3, 8.4_

- [x] 2. FastAPI backend core implementation



  - [x] 2.1 Implement FastAPI application skeleton with logging


    - Create `src/main.py` with FastAPI app initialization
    - Configure CORS for frontend origins
    - Set up structured logging with request/response middleware
    - Implement `/health` endpoint
    - _Requirements: 2.1, 2.3, 8.1_
  - [ ]* 2.2 Write property test for request logging
    - **Property 23: Request logging completeness**
    - **Validates: Requirements 8.1**

  - [x] 2.3 Implement Pydantic models for request/response validation

    - Create `src/models.py` with InteractionEvent, InteractionBatch, ClassificationRequest, ClassificationResponse
    - Define all event data types (ClickData, MouseData, ScrollData, KeystrokeData, NavigationData)
    - _Requirements: 2.2_
  - [ ]* 2.4 Write property test for payload validation
    - **Property 6: Payload schema validation**

    - **Validates: Requirements 2.2**
  - [x] 2.5 Implement error handling middleware


    - Create `src/middleware/error_handler.py` with structured error responses
    - Define error codes and message formats
    - Add stack trace logging for errors
    - _Requirements: 2.4, 8.2_
  - [ ]* 2.6 Write property test for error response structure
    - **Property 7: Error response structure**
    - **Validates: Requirements 2.4**

- [ ] 3. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Feature extraction module





  - [x] 4.1 Implement response time feature calculations


    - Create `src/features/response_time.py`
    - Implement mean, median, standard deviation calculations from event timestamps
    - _Requirements: 3.1_
  - [ ]* 4.2 Write property test for response time metrics
    - **Property 8: Response time metric correctness**
    - **Validates: Requirements 3.1**
  - [x] 4.3 Implement rage click detection


    - Create `src/features/click_analysis.py`
    - Detect 3+ clicks within 500ms on same target
    - Calculate total clicks and click rate
    - _Requirements: 3.2_
  - [ ]* 4.4 Write property test for rage click detection
    - **Property 9: Rage click detection accuracy**
    - **Validates: Requirements 3.2**
  - [x] 4.5 Implement mouse movement feature calculations


    - Create `src/features/mouse_analysis.py`
    - Calculate cursor speed, trajectory deviation, idle time
    - _Requirements: 3.3_
  - [ ]* 4.6 Write property test for mouse metrics
    - **Property 10: Mouse metric calculation correctness**
    - **Validates: Requirements 3.3**


  - [x] 4.7 Implement navigation feature calculations
    - Create `src/features/navigation_analysis.py`
    - Calculate revisit ratio and path linearity score
    - _Requirements: 3.4_
  - [x]* 4.8 Write property test for navigation metrics


    - **Property 11: Navigation metric calculation correctness**
    - **Validates: Requirements 3.4**
  - [x] 4.9 Implement feature aggregation
    - Create `src/features/aggregator.py`
    - Combine all features into BehavioralFeatures dataclass
    - Ensure all feature dimensions are populated


    - _Requirements: 3.5_
  - [ ]* 4.10 Write property test for feature vector completeness
    - **Property 12: Feature vector completeness**
    - **Validates: Requirements 3.5**
  - [x] 4.11 Implement feature serialization
    - Add JSON serialization/deserialization to BehavioralFeatures
    - _Requirements: 3.6_
  - [ ]* 4.12 Write property test for feature serialization round-trip
    - **Property 13: Feature serialization round-trip**
    - **Validates: Requirements 3.6**

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Cognitive load classifier





  - [x] 6.1 Implement rule-based primary classifier


    - Create `src/classifier/rule_based.py`
    - Define weighted scoring based on feature thresholds (response time, rage clicks, trajectory deviation, revisit ratio, idle time, active time ratio)
    - Return cognitive load level (Low, Moderate, High, Very High) and confidence score
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 6.2 Implement ML classifier wrapper (optional fallback)


    - Create `src/classifier/ml_classifier.py`
    - Load pre-trained model from file path if available
    - Return None if model not available (rule-based remains primary)
    - _Requirements: 4.4_

  - [x] 6.3 Implement main classifier facade

    - Create `src/classifier/classifier.py`
    - Use rule-based as primary classifier
    - Optionally use ML classifier when model available
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]* 6.4 Write property test for classification output validity
    - **Property 14: Classification output validity**
    - **Validates: Requirements 4.1**
  - [ ]* 6.5 Write property test for confidence score bounds
    - **Property 15: Confidence score bounds**
    - **Validates: Requirements 4.2**

- [x] 7. API endpoints implementation






  - [x] 7.1 Implement /api/interactions/ingest endpoint

    - Create `src/routes/interactions.py`
    - Accept batched interaction events
    - Store events in session storage (in-memory for now)
    - _Requirements: 1.6, 2.1_


  - [ ] 7.2 Implement /api/interactions/classify endpoint
    - Extract features from stored session events


    - Run classifier and return results
    - _Requirements: 4.1, 4.2_
  - [ ] 7.3 Implement /api/interactions/compare endpoint
    - Compute statistical comparison between ChatGPT and Google sessions
    - Return mean loads and significance


    - _Requirements: 7.3_
  - [ ]* 7.4 Write property test for statistical comparison
    - **Property 22: Statistical comparison validity**
    - **Validates: Requirements 7.3**
  - [ ] 7.5 Implement platform tagging in session storage
    - Ensure all sessions have platform attribution
    - _Requirements: 7.1, 7.4_
  - [ ]* 7.6 Write property test for platform tagging
    - **Property 21: Platform tagging consistency**
    - **Validates: Requirements 7.1, 7.4**

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Training pipeline (Optional - for ML fallback)
  - [ ]* 9.1 Implement CSV data loader
    - Create `src/training/data_loader.py`
    - Parse CSV files with behavioral features and labels
    - _Requirements: 5.1_
  - [ ]* 9.2 Write property test for training data parsing
    - **Property 16: Training data parsing**
    - **Validates: Requirements 5.1**
  - [ ]* 9.3 Implement model training script
    - Create `src/training/train.py`
    - Use cross-validation for evaluation
    - Save trained model to joblib format
    - Report accuracy, precision, recall, F1-score per class
    - _Requirements: 5.2, 5.3, 5.4_
  - [ ]* 9.4 Write property test for training metrics completeness
    - **Property 17: Training metrics completeness**
    - **Validates: Requirements 5.4**

- [x] 10. Frontend interaction tracker

  - [x] 10.1 Create InteractionTracker service
    - Create `src/services/interactionTracker.ts`
    - Initialize event listeners for clicks, mouse, scroll, keystrokes
    - Implement event queue with configurable batch size and flush interval
    - _Requirements: 6.1, 6.2_
  - [ ]* 10.2 Write property test for event queue behavior
    - **Property 18: Event queue behavior**
    - **Validates: Requirements 6.2**

  - [x] 10.3 Implement click event capture
    - Capture timestamp, target element, coordinates
    - _Requirements: 1.1_
  - [ ]* 10.4 Write property test for click event completeness
    - **Property 1: Click event data completeness**
    - **Validates: Requirements 1.1**

  - [x] 10.5 Implement mouse movement capture with sampling
    - Record trajectory at configurable intervals
    - Throttle high-frequency events
    - _Requirements: 1.2, 6.5_
  - [ ]* 10.6 Write property test for mouse sampling consistency
    - **Property 2: Mouse sampling consistency**
    - **Validates: Requirements 1.2**
  - [ ]* 10.7 Write property test for event throttling
    - **Property 20: High-frequency event throttling**
    - **Validates: Requirements 6.5**

  - [x] 10.8 Implement keystroke timing capture (privacy-preserving)
    - Capture timing patterns without actual key values
    - _Requirements: 1.3_
  - [ ]* 10.9 Write property test for keystroke privacy
    - **Property 3: Keystroke privacy preservation**
    - **Validates: Requirements 1.3**

  - [x] 10.10 Implement scroll event capture
    - Record direction, velocity, position
    - _Requirements: 1.4_
  - [ ]* 10.11 Write property test for scroll event completeness
    - **Property 4: Scroll event data completeness**
    - **Validates: Requirements 1.4**

  - [x] 10.12 Implement navigation tracking
    - Track section transitions and dwell time
    - _Requirements: 1.5_
  - [ ]* 10.13 Write property test for navigation tracking
    - **Property 5: Navigation path tracking accuracy**
    - **Validates: Requirements 1.5**

  - [x] 10.14 Implement batch transmission with retry logic

    - Flush events to backend
    - Implement exponential backoff on network errors
    - _Requirements: 1.6, 6.3, 6.4_
  - [ ]* 10.15 Write property test for queue flush completeness
    - **Property 19: Queue flush completeness**
    - **Validates: Requirements 6.3**

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Frontend integration



  - [x] 12.1 Integrate InteractionTracker with platform components


    - Add tracker initialization to ChatGPTInterface and GoogleSearchInterface
    - Pass platform type to tracker
    - _Requirements: 7.1_


  - [x] 12.2 Update CognitiveLoadResults component
    - Fetch classification results from FastAPI
    - Display cognitive load level and confidence


    - Show platform comparison when available
    - _Requirements: 7.2_

  - [x] 12.3 Update cognitiveLoadService to use new backend
    - Replace EEG-based calculation with behavioral classification API call
    - Handle fallback when service unavailable
    - _Requirements: 9.4_
  - [x] 12.4 Remove unused EEG-related frontend code


    - Remove biosignalService.ts
    - Remove EEGVisualization component if no longer needed
    - Clean up unused imports and types
    - _Requirements: 8.5_

- [x] 13. Service integration

  - [x] 13.1 Update frontend API configuration
    - Add FastAPI service URL to config
    - Configure request routing (behavioral → FastAPI, auth → Express)
    - _Requirements: 9.2_

  - [x] 13.2 Ensure session context sharing
    - Use JWT tokens for session identification across services
    - _Requirements: 9.3_

- [x] 14. Documentation and final cleanup





  - [x] 14.1 Update README.md with new setup instructions


    - Document behavioral-service setup
    - Update architecture overview
    - Remove Docker-based biosignal instructions
    - _Requirements: 8.3_
  - [x] 14.2 Create behavioral-service README.md


    - Document API endpoints
    - Explain feature extraction
    - Describe training pipeline usage

    - _Requirements: 8.3, 8.4_
  - [x] 14.3 Final code cleanup

    - Remove any remaining unused EEG/Chronos references
    - Ensure consistent logging throughout
    - _Requirements: 8.5_

- [ ] 15. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
