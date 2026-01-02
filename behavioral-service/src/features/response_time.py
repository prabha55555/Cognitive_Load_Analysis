"""
Response time feature calculations.

Computes response time metrics (mean, median, standard deviation) from
interaction event timestamps.

Validates: Requirements 3.1
"""

import statistics
from dataclasses import dataclass
from typing import List

from src.models import InteractionEvent


@dataclass
class ResponseTimeFeatures:
    """Response time features computed from interaction events."""
    mean_response_time: float
    median_response_time: float
    std_response_time: float


def compute_response_time_features(events: List[InteractionEvent]) -> ResponseTimeFeatures:
    """
    Compute response time features from a list of interaction events.
    
    Response time is calculated as the time interval between consecutive
    events, representing how quickly the user responds/interacts.
    
    Args:
        events: List of interaction events sorted by timestamp
        
    Returns:
        ResponseTimeFeatures with mean, median, and std of response times
        
    Note:
        - If fewer than 2 events, returns zeros for all metrics
        - Response times are converted from milliseconds to seconds
    """
    if len(events) < 2:
        return ResponseTimeFeatures(
            mean_response_time=0.0,
            median_response_time=0.0,
            std_response_time=0.0
        )
    
    # Sort events by timestamp to ensure correct ordering
    sorted_events = sorted(events, key=lambda e: e.timestamp)
    
    # Calculate inter-event intervals (response times) in seconds
    response_times: List[float] = []
    for i in range(1, len(sorted_events)):
        interval_ms = sorted_events[i].timestamp - sorted_events[i - 1].timestamp
        interval_seconds = interval_ms / 1000.0
        response_times.append(interval_seconds)
    
    # Compute statistics
    mean_rt = statistics.mean(response_times)
    median_rt = statistics.median(response_times)
    
    # Standard deviation requires at least 2 data points
    if len(response_times) >= 2:
        std_rt = statistics.stdev(response_times)
    else:
        std_rt = 0.0
    
    return ResponseTimeFeatures(
        mean_response_time=mean_rt,
        median_response_time=median_rt,
        std_response_time=std_rt
    )
