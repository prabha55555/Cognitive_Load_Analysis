# Requirements Document

## Introduction

This document specifies the requirements for transforming the Cognitive Load Analysis Platform from an EEG-based measurement system to a behavioral interaction-based cognitive load inference system. The platform compares cognitive load experienced by students using ChatGPT versus Google Search for academic tasks. Instead of relying on physiological signals (EEG/EDA), the system will infer cognitive load from user interaction patterns such as click behavior, response times, navigation patterns, mouse activity, and engagement metrics.

The transformation includes:
- Removing the heavy Chronos-based EEG biosignal service
- Implementing a lightweight FastAPI backend for behavioral data collection and classification
- Using a rule-based classifier as the primary classification method (works immediately without training data)
- Supporting an optional ML classifier as fallback when a trained model is available
- Maintaining the existing React frontend with enhanced interaction tracking

## Glossary

- **Cognitive Load**: The mental effort required to process information during a task
- **Behavioral Interaction Service**: The FastAPI backend service that collects, processes, and classifies user interaction data
- **Interaction Event**: A discrete user action captured by the frontend (click, scroll, mouse movement, keystroke, etc.)
- **Behavioral Feature**: A computed metric derived from raw interaction events (e.g., average response time, click frequency)
- **Cognitive Load Classifier**: The component that predicts cognitive load level from behavioral features (rule-based primary, ML fallback)
- **Rule-Based Classifier**: Primary classifier using scientifically-grounded heuristic rules based on behavioral thresholds
- **ML Classifier**: Optional fallback classifier using a trained machine learning model
- **Session**: A complete user interaction period from task start to completion
- **Rage Click**: Multiple rapid clicks on the same element indicating user frustration
- **Dwell Time**: Duration a user spends on a specific element or page section
- **Navigation Path**: The sequence of pages or sections visited during a session

## Requirements

### Requirement 1

**User Story:** As a researcher, I want to collect comprehensive user interaction data during academic tasks, so that I can analyze behavioral patterns indicative of cognitive load.

#### Acceptance Criteria

1. WHEN a user interacts with the platform THEN the Behavioral Interaction Service SHALL capture click events with timestamp, target element, and coordinates
2. WHEN a user moves the mouse THEN the Behavioral Interaction Service SHALL record mouse trajectory data at configurable sampling intervals
3. WHEN a user types in input fields THEN the Behavioral Interaction Service SHALL capture keystroke timing patterns without recording actual content
4. WHEN a user scrolls the page THEN the Behavioral Interaction Service SHALL record scroll events with direction, velocity, and position
5. WHEN a user navigates between sections THEN the Behavioral Interaction Service SHALL track navigation path and time spent per section
6. WHEN interaction events are captured THEN the Behavioral Interaction Service SHALL batch and transmit events to the backend within 5 seconds

### Requirement 2

**User Story:** As a system architect, I want to replace the Flask/Chronos biosignal service with a lightweight FastAPI backend, so that the system is easier to deploy and maintain without heavy ML dependencies.

#### Acceptance Criteria

1. WHEN the backend service starts THEN the Behavioral Interaction Service SHALL expose REST API endpoints for interaction data ingestion
2. WHEN the backend receives interaction data THEN the Behavioral Interaction Service SHALL validate the payload against a defined schema
3. WHEN the backend processes requests THEN the Behavioral Interaction Service SHALL log all operations with appropriate severity levels
4. WHEN the backend encounters errors THEN the Behavioral Interaction Service SHALL return structured error responses with error codes and messages
5. WHEN the backend is deployed THEN the Behavioral Interaction Service SHALL run without Docker containerization using standard Python virtual environment

### Requirement 3

**User Story:** As a data scientist, I want to compute behavioral features from raw interaction data, so that I can feed meaningful inputs to the cognitive load classifier.

#### Acceptance Criteria

1. WHEN raw interaction events are received THEN the Behavioral Interaction Service SHALL compute response time metrics (mean, median, standard deviation)
2. WHEN click events are analyzed THEN the Behavioral Interaction Service SHALL detect and count rage click patterns (3+ clicks within 500ms on same target)
3. WHEN mouse movement data is processed THEN the Behavioral Interaction Service SHALL calculate cursor speed, trajectory deviation, and idle time
4. WHEN navigation data is analyzed THEN the Behavioral Interaction Service SHALL compute revisit ratio and path linearity score
5. WHEN a session completes THEN the Behavioral Interaction Service SHALL aggregate all features into a feature vector for classification
6. WHEN features are serialized for storage or transmission THEN the Behavioral Interaction Service SHALL encode them as JSON and decode them back to equivalent feature vectors

### Requirement 4

**User Story:** As a researcher, I want to classify cognitive load levels using behavioral indicators, so that I can objectively quantify mental effort during tasks.

#### Acceptance Criteria

1. WHEN a feature vector is submitted for classification THEN the Cognitive Load Classifier SHALL return a cognitive load level (Low, Moderate, High, Very High)
2. WHEN the classifier makes a prediction THEN the Cognitive Load Classifier SHALL provide a confidence score between 0 and 1
3. WHEN the classifier is initialized THEN the Cognitive Load Classifier SHALL use the rule-based classifier as the primary method
4. WHEN a trained ML model file is available THEN the Cognitive Load Classifier SHALL optionally use the ML model as fallback
5. WHEN classification is performed THEN the Cognitive Load Classifier SHALL complete within 100 milliseconds for single predictions

### Requirement 5

**User Story:** As a developer, I want to optionally train an ML classifier on behavioral data, so that the model can enhance classification accuracy when suitable training data becomes available.

#### Acceptance Criteria

1. WHEN training data is prepared THEN the Training Pipeline SHALL accept CSV files with behavioral features and cognitive load labels
2. WHEN the model is trained THEN the Training Pipeline SHALL use cross-validation to evaluate model performance
3. WHEN training completes THEN the Training Pipeline SHALL save the trained model in a portable format (joblib or pickle)
4. WHEN training metrics are computed THEN the Training Pipeline SHALL report accuracy, precision, recall, and F1-score per class
5. WHEN the dataset location is configured THEN the Training Pipeline SHALL document the expected folder structure for training data

### Requirement 6

**User Story:** As a frontend developer, I want to integrate interaction tracking into the existing React application, so that behavioral data is captured seamlessly during user sessions.

#### Acceptance Criteria

1. WHEN the React application loads THEN the Interaction Tracker SHALL initialize event listeners for clicks, mouse movements, scrolls, and keystrokes
2. WHEN interaction events are captured THEN the Interaction Tracker SHALL queue events in memory before batch transmission
3. WHEN the user completes a task phase THEN the Interaction Tracker SHALL flush all pending events to the backend
4. WHEN the Interaction Tracker encounters network errors THEN the Interaction Tracker SHALL retry transmission with exponential backoff
5. WHEN tracking is active THEN the Interaction Tracker SHALL minimize performance impact by throttling high-frequency events

### Requirement 7

**User Story:** As a researcher, I want to compare cognitive load between ChatGPT and Google Search usage, so that I can validate the research hypothesis about AI tools and cognitive processing.

#### Acceptance Criteria

1. WHEN a session is recorded THEN the Behavioral Interaction Service SHALL tag the session with the platform type (ChatGPT or Google Search)
2. WHEN results are displayed THEN the Results Display SHALL show cognitive load metrics for each platform used
3. WHEN comparative analysis is requested THEN the Behavioral Interaction Service SHALL compute statistical differences between platform groups
4. WHEN session data is stored THEN the Behavioral Interaction Service SHALL maintain platform attribution for all interaction records

### Requirement 8

**User Story:** As a system administrator, I want comprehensive logging and documentation, so that I can effectively debug issues and understand the system architecture.

#### Acceptance Criteria

1. WHEN any API endpoint is called THEN the Behavioral Interaction Service SHALL log the request method, path, and response status
2. WHEN errors occur THEN the Behavioral Interaction Service SHALL log stack traces and contextual information
3. WHEN the architecture changes THEN the Documentation SHALL be updated to reflect the new behavioral-based approach
4. WHEN the codebase is modified THEN the Documentation SHALL include updated component diagrams and data flow descriptions
5. WHEN deprecated code is identified THEN the Cleanup Process SHALL remove unused EEG/Chronos-related files and dependencies

### Requirement 9

**User Story:** As a developer, I want the existing Express.js server functionality preserved, so that authentication and other existing features continue to work alongside the new FastAPI service.

#### Acceptance Criteria

1. WHEN the system is deployed THEN the Express Server SHALL continue handling authentication endpoints
2. WHEN the FastAPI service is added THEN the System SHALL route behavioral data requests to FastAPI and auth requests to Express
3. WHEN both services run THEN the Services SHALL share session context through a common mechanism (Redis or JWT)
4. IF the FastAPI service is unavailable THEN the Frontend SHALL gracefully degrade and continue functioning with reduced analytics
