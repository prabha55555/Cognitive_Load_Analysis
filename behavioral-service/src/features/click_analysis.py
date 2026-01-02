"""
Click analysis feature calculations.

Detects rage clicks and computes click-related metrics from interaction events.

Validates: Requirements 3.2
"""

from dataclasses import dataclass
from typing import List

from src.models import InteractionEvent


# Rage click detection parameters
RAGE_CLICK_THRESHOLD = 3  # Minimum clicks to qualify as rage click
RAGE_CLICK_WINDOW_MS = 500  # Time window in milliseconds


@dataclass
class ClickFeatures:
    """Click-related features computed from interaction events."""
    total_clicks: int
    rage_click_count: int
    click_rate: float  # clicks per second


def detect_rage_clicks(click_events: List[InteractionEvent]) -> int:
    """
    Detect rage click incidents from click events.
    
    A rage click is defined as 3 or more clicks within 500ms on the same target.
    
    Args:
        click_events: List of click events sorted by timestamp
        
    Returns:
        Number of rage click incidents detected
    """
    if len(click_events) < RAGE_CLICK_THRESHOLD:
        return 0
    
    # Sort by timestamp
    sorted_clicks = sorted(click_events, key=lambda e: e.timestamp)
    
    rage_click_count = 0
    i = 0
    
    while i < len(sorted_clicks):
        # Get target element for current click
        current_target = sorted_clicks[i].data.get("target_element", "")
        current_timestamp = sorted_clicks[i].timestamp
        
        # Count consecutive clicks on same target within time window
        consecutive_count = 1
        j = i + 1
        
        while j < len(sorted_clicks):
            next_target = sorted_clicks[j].data.get("target_element", "")
            next_timestamp = sorted_clicks[j].timestamp
            
            # Check if same target and within time window
            if (next_target == current_target and 
                next_timestamp - current_timestamp <= RAGE_CLICK_WINDOW_MS):
                consecutive_count += 1
                j += 1
            else:
                break
        
        # If we found a rage click pattern
        if consecutive_count >= RAGE_CLICK_THRESHOLD:
            rage_click_count += 1
            # Skip past this rage click sequence
            i = j
        else:
            i += 1
    
    return rage_click_count


def compute_click_features(
    events: List[InteractionEvent],
    session_duration_seconds: float
) -> ClickFeatures:
    """
    Compute click-related features from interaction events.
    
    Args:
        events: List of all interaction events
        session_duration_seconds: Total session duration in seconds
        
    Returns:
        ClickFeatures with total clicks, rage click count, and click rate
    """
    # Filter to only click events
    click_events = [e for e in events if e.type == "click"]
    
    total_clicks = len(click_events)
    rage_click_count = detect_rage_clicks(click_events)
    
    # Calculate click rate (clicks per second)
    if session_duration_seconds > 0:
        click_rate = total_clicks / session_duration_seconds
    else:
        click_rate = 0.0
    
    return ClickFeatures(
        total_clicks=total_clicks,
        rage_click_count=rage_click_count,
        click_rate=click_rate
    )
