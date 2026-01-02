"""
Feature aggregation module.

Combines all individual feature calculations into a complete BehavioralFeatures
dataclass for use in cognitive load classification.

Validates: Requirements 3.5
"""

from typing import List

from src.models import BehavioralFeatures, InteractionEvent
from .response_time import compute_response_time_features
from .click_analysis import compute_click_features
from .mouse_analysis import compute_mouse_features
from .navigation_analysis import compute_navigation_features


def compute_session_duration(events: List[InteractionEvent]) -> float:
    """
    Compute total session duration from events.
    
    Args:
        events: List of interaction events
        
    Returns:
        Session duration in seconds
    """
    if len(events) < 2:
        return 0.0
    
    timestamps = [e.timestamp for e in events]
    duration_ms = max(timestamps) - min(timestamps)
    return duration_ms / 1000.0


def compute_active_time_ratio(events: List[InteractionEvent], session_duration: float) -> float:
    """
    Compute ratio of active time to total session time.
    
    Active time is estimated by summing intervals between events that are
    less than the idle threshold (2 seconds).
    
    Args:
        events: List of interaction events
        session_duration: Total session duration in seconds
        
    Returns:
        Active time ratio (0-1)
    """
    if session_duration <= 0 or len(events) < 2:
        return 0.0
    
    IDLE_THRESHOLD_MS = 2000  # 2 seconds
    
    sorted_events = sorted(events, key=lambda e: e.timestamp)
    active_time_ms = 0
    
    for i in range(1, len(sorted_events)):
        interval = sorted_events[i].timestamp - sorted_events[i - 1].timestamp
        if interval < IDLE_THRESHOLD_MS:
            active_time_ms += interval
    
    active_time_seconds = active_time_ms / 1000.0
    return min(1.0, active_time_seconds / session_duration)


def compute_scroll_depth(events: List[InteractionEvent]) -> float:
    """
    Compute maximum scroll depth reached during session.
    
    Args:
        events: List of interaction events
        
    Returns:
        Maximum scroll depth (0-1), or 0 if no scroll events
    """
    scroll_events = [e for e in events if e.type == "scroll"]
    
    if not scroll_events:
        return 0.0
    
    # Get maximum scroll position
    # Assuming position is normalized 0-1 or we normalize based on max observed
    positions = []
    for event in scroll_events:
        position = event.data.get("position", 0)
        positions.append(float(position))
    
    if not positions:
        return 0.0
    
    max_position = max(positions)
    
    # If positions are already normalized (0-1), return directly
    # Otherwise, we'd need page height to normalize - assume normalized for now
    # Cap at 1.0 for safety
    return min(1.0, max_position) if max_position <= 1.0 else max_position / max(positions)


def aggregate_features(events: List[InteractionEvent]) -> BehavioralFeatures:
    """
    Aggregate all behavioral features from a list of interaction events.
    
    Combines response time, click, mouse, and navigation features into
    a complete BehavioralFeatures object for classification.
    
    Args:
        events: List of all interaction events for a session
        
    Returns:
        BehavioralFeatures with all feature dimensions populated
        
    Note:
        All feature dimensions are guaranteed to have valid numeric values.
        Missing or insufficient data results in sensible defaults (typically 0).
    """
    # Compute session-level metrics
    session_duration = compute_session_duration(events)
    
    # Compute individual feature groups
    response_time_features = compute_response_time_features(events)
    click_features = compute_click_features(events, session_duration)
    mouse_features = compute_mouse_features(events)
    navigation_features = compute_navigation_features(events)
    
    # Compute engagement features
    active_time_ratio = compute_active_time_ratio(events, session_duration)
    scroll_depth = compute_scroll_depth(events)
    
    # Aggregate into BehavioralFeatures
    return BehavioralFeatures(
        # Response Time Features
        mean_response_time=response_time_features.mean_response_time,
        median_response_time=response_time_features.median_response_time,
        std_response_time=response_time_features.std_response_time,
        
        # Click Features
        total_clicks=click_features.total_clicks,
        rage_click_count=click_features.rage_click_count,
        click_rate=click_features.click_rate,
        
        # Mouse Features
        mean_cursor_speed=mouse_features.mean_cursor_speed,
        trajectory_deviation=mouse_features.trajectory_deviation,
        total_idle_time=mouse_features.total_idle_time,
        
        # Navigation Features
        revisit_ratio=navigation_features.revisit_ratio,
        path_linearity=navigation_features.path_linearity,
        sections_visited=navigation_features.sections_visited,
        
        # Engagement Features
        total_session_time=session_duration,
        active_time_ratio=active_time_ratio,
        scroll_depth=scroll_depth,
    )
