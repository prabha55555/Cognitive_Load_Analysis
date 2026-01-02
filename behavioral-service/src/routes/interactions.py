"""
API routes for interaction data ingestion and classification.

Provides endpoints for:
- Ingesting batched interaction events
- Classifying cognitive load from session data
- Comparing cognitive load between platforms

Validates: Requirements 1.6, 2.1, 4.1, 4.2, 7.1, 7.3, 7.4
"""

from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional
from collections import defaultdict

import structlog
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from scipy import stats

from src.models import (
    InteractionBatch,
    InteractionEvent,
    ClassificationRequest,
    ClassificationResponse,
    ComparisonResponse,
    BehavioralFeatures,
)
from src.features.aggregator import aggregate_features
from src.classifier.classifier import CognitiveLoadClassifier

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/interactions", tags=["interactions"])

# =============================================================================
# In-Memory Session Storage
# =============================================================================

class SessionData(BaseModel):
    """Stored session data with platform attribution."""
    session_id: str
    participant_id: str
    platform: Literal["chatgpt", "google"]
    events: List[InteractionEvent] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# In-memory storage for sessions
# Key: session_id, Value: SessionData
_session_storage: Dict[str, SessionData] = {}

# Classifier instance (singleton)
_classifier: Optional[CognitiveLoadClassifier] = None


def get_classifier() -> CognitiveLoadClassifier:
    """Get or create the classifier singleton."""
    global _classifier
    if _classifier is None:
        _classifier = CognitiveLoadClassifier()
    return _classifier


def get_session_storage() -> Dict[str, SessionData]:
    """Get the session storage (for testing purposes)."""
    return _session_storage


def clear_session_storage() -> None:
    """Clear all session storage (for testing purposes)."""
    global _session_storage
    _session_storage = {}


# =============================================================================
# Response Models
# =============================================================================

class IngestResponse(BaseModel):
    """Response for successful event ingestion."""
    session_id: str
    events_received: int
    total_events: int
    message: str = "Events ingested successfully"


# =============================================================================
# API Endpoints
# =============================================================================

@router.post("/ingest", response_model=IngestResponse, status_code=status.HTTP_201_CREATED)
async def ingest_interactions(batch: InteractionBatch) -> IngestResponse:
    """
    Ingest a batch of interaction events.
    
    Accepts batched interaction events from the frontend and stores them
    in session storage for later classification.
    
    Args:
        batch: InteractionBatch containing session info and events
        
    Returns:
        IngestResponse with ingestion statistics
        
    Validates: Requirements 1.6, 2.1, 7.1, 7.4
    """
    log = logger.bind(
        session_id=batch.session_id,
        participant_id=batch.participant_id,
        platform=batch.platform,
        event_count=len(batch.events),
    )
    
    log.info("ingesting_interaction_batch")
    
    # Get or create session
    if batch.session_id in _session_storage:
        session = _session_storage[batch.session_id]
        # Verify platform consistency
        if session.platform != batch.platform:
            log.warning(
                "platform_mismatch",
                stored_platform=session.platform,
                received_platform=batch.platform,
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Platform mismatch: session was created with platform '{session.platform}', "
                       f"but received events for platform '{batch.platform}'",
            )
    else:
        # Create new session with platform attribution
        session = SessionData(
            session_id=batch.session_id,
            participant_id=batch.participant_id,
            platform=batch.platform,
        )
        _session_storage[batch.session_id] = session
        log.info("session_created", platform=batch.platform)
    
    # Add events to session
    session.events.extend(batch.events)
    session.updated_at = datetime.now(timezone.utc)
    
    log.info(
        "batch_ingested",
        events_added=len(batch.events),
        total_events=len(session.events),
    )
    
    return IngestResponse(
        session_id=batch.session_id,
        events_received=len(batch.events),
        total_events=len(session.events),
    )



@router.post("/classify", response_model=ClassificationResponse)
async def classify_session(request: ClassificationRequest) -> ClassificationResponse:
    """
    Classify cognitive load for a session.
    
    Extracts features from stored session events and runs the classifier
    to determine cognitive load level.
    
    Args:
        request: ClassificationRequest with session_id and options
        
    Returns:
        ClassificationResponse with cognitive load level and confidence
        
    Raises:
        HTTPException: If session not found or has insufficient data
        
    Validates: Requirements 4.1, 4.2
    """
    log = logger.bind(session_id=request.session_id)
    
    log.info("classifying_session")
    
    # Get session from storage
    if request.session_id not in _session_storage:
        log.warning("session_not_found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{request.session_id}' not found",
        )
    
    session = _session_storage[request.session_id]
    
    # Check for sufficient events
    if len(session.events) < 2:
        log.warning("insufficient_events", event_count=len(session.events))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Session has insufficient events for classification "
                   f"(found {len(session.events)}, need at least 2)",
        )
    
    # Extract features from events
    try:
        features = aggregate_features(session.events)
    except Exception as e:
        log.error("feature_extraction_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Feature extraction failed: {str(e)}",
        )
    
    # Run classifier
    classifier = get_classifier()
    level, confidence = classifier.predict(features)
    
    log.info(
        "classification_complete",
        level=level,
        confidence=confidence,
    )
    
    # Build response
    response = ClassificationResponse(
        session_id=request.session_id,
        cognitive_load_level=level,
        confidence=confidence,
        features=features.to_dict() if request.include_features else None,
    )
    
    return response


# Mapping from cognitive load level to numeric value for statistics
LOAD_LEVEL_VALUES = {
    "Low": 1.0,
    "Moderate": 2.0,
    "High": 3.0,
    "Very High": 4.0,
}


@router.post("/compare", response_model=ComparisonResponse)
async def compare_platforms() -> ComparisonResponse:
    """
    Compare cognitive load between ChatGPT and Google Search sessions.
    
    Computes statistical comparison of cognitive load levels between
    the two platform groups.
    
    Returns:
        ComparisonResponse with mean loads and statistical significance
        
    Raises:
        HTTPException: If insufficient data for comparison
        
    Validates: Requirements 7.3
    """
    log = logger.bind()
    
    log.info("comparing_platforms")
    
    # Group sessions by platform
    chatgpt_sessions: List[SessionData] = []
    google_sessions: List[SessionData] = []
    
    for session in _session_storage.values():
        if session.platform == "chatgpt":
            chatgpt_sessions.append(session)
        else:
            google_sessions.append(session)
    
    log.info(
        "sessions_grouped",
        chatgpt_count=len(chatgpt_sessions),
        google_count=len(google_sessions),
    )
    
    # Check for sufficient data
    if len(chatgpt_sessions) < 1 or len(google_sessions) < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient data for comparison. "
                   f"ChatGPT sessions: {len(chatgpt_sessions)}, "
                   f"Google sessions: {len(google_sessions)}. "
                   f"Need at least 1 session per platform.",
        )
    
    # Classify all sessions and collect load values
    classifier = get_classifier()
    
    def get_load_values(sessions: List[SessionData]) -> List[float]:
        """Extract numeric load values from sessions."""
        values = []
        for session in sessions:
            if len(session.events) >= 2:
                try:
                    features = aggregate_features(session.events)
                    level, _ = classifier.predict(features)
                    values.append(LOAD_LEVEL_VALUES[level])
                except Exception as e:
                    log.warning(
                        "session_classification_failed",
                        session_id=session.session_id,
                        error=str(e),
                    )
        return values
    
    chatgpt_loads = get_load_values(chatgpt_sessions)
    google_loads = get_load_values(google_sessions)
    
    # Check for valid classifications
    if len(chatgpt_loads) < 1 or len(google_loads) < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient valid sessions for comparison after classification",
        )
    
    # Compute statistics
    chatgpt_mean = sum(chatgpt_loads) / len(chatgpt_loads)
    google_mean = sum(google_loads) / len(google_loads)
    
    # Compute statistical significance using t-test
    # If only one sample per group, p-value is 1.0 (not significant)
    if len(chatgpt_loads) < 2 or len(google_loads) < 2:
        p_value = 1.0
    else:
        _, p_value = stats.ttest_ind(chatgpt_loads, google_loads)
        # Handle NaN case (e.g., identical values)
        if p_value != p_value:  # NaN check
            p_value = 1.0
    
    log.info(
        "comparison_complete",
        chatgpt_mean=chatgpt_mean,
        google_mean=google_mean,
        p_value=p_value,
    )
    
    return ComparisonResponse(
        chatgpt_mean_load=chatgpt_mean,
        google_mean_load=google_mean,
        statistical_significance=p_value,
        sample_sizes={
            "chatgpt": len(chatgpt_loads),
            "google": len(google_loads),
        },
    )


@router.get("/sessions/{session_id}")
async def get_session(session_id: str) -> SessionData:
    """
    Get session data by ID.
    
    Args:
        session_id: The session identifier
        
    Returns:
        SessionData for the requested session
        
    Raises:
        HTTPException: If session not found
    """
    if session_id not in _session_storage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found",
        )
    
    return _session_storage[session_id]


@router.get("/sessions")
async def list_sessions(
    platform: Optional[Literal["chatgpt", "google"]] = None
) -> List[Dict]:
    """
    List all sessions, optionally filtered by platform.
    
    Args:
        platform: Optional platform filter
        
    Returns:
        List of session summaries
    """
    sessions = []
    for session in _session_storage.values():
        if platform is None or session.platform == platform:
            sessions.append({
                "session_id": session.session_id,
                "participant_id": session.participant_id,
                "platform": session.platform,
                "event_count": len(session.events),
                "created_at": session.created_at.isoformat(),
                "updated_at": session.updated_at.isoformat(),
            })
    
    return sessions
