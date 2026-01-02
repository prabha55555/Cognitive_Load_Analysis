"""
Mouse movement feature calculations.

Computes cursor speed, trajectory deviation, and idle time from mouse events.

Validates: Requirements 3.3
"""

import math
from dataclasses import dataclass
from typing import List, Tuple

from src.models import InteractionEvent


# Idle detection threshold in milliseconds
IDLE_THRESHOLD_MS = 2000  # 2 seconds without movement = idle


@dataclass
class MouseFeatures:
    """Mouse movement features computed from interaction events."""
    mean_cursor_speed: float  # pixels per second
    trajectory_deviation: float  # deviation from optimal path (0-1 scale)
    total_idle_time: float  # seconds


def calculate_distance(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    """Calculate Euclidean distance between two points."""
    return math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2)


def compute_mouse_features(events: List[InteractionEvent]) -> MouseFeatures:
    """
    Compute mouse movement features from interaction events.
    
    Args:
        events: List of all interaction events
        
    Returns:
        MouseFeatures with cursor speed, trajectory deviation, and idle time
        
    Note:
        - Trajectory deviation is calculated as the ratio of actual path length
          to the optimal (straight-line) distance between start and end points.
          A value of 0 means perfectly straight, higher values indicate more deviation.
        - Idle time is accumulated when gaps between mouse events exceed threshold.
    """
    # Filter to only mousemove events
    mouse_events = [e for e in events if e.type == "mousemove"]
    
    if len(mouse_events) < 2:
        return MouseFeatures(
            mean_cursor_speed=0.0,
            trajectory_deviation=0.0,
            total_idle_time=0.0
        )
    
    # Sort by timestamp
    sorted_events = sorted(mouse_events, key=lambda e: e.timestamp)
    
    # Extract coordinates and timestamps
    points: List[Tuple[float, float]] = []
    timestamps: List[int] = []
    
    for event in sorted_events:
        x = event.data.get("x", 0)
        y = event.data.get("y", 0)
        points.append((float(x), float(y)))
        timestamps.append(event.timestamp)
    
    # Calculate speeds between consecutive points
    speeds: List[float] = []
    total_path_length = 0.0
    total_idle_time_ms = 0
    
    for i in range(1, len(points)):
        distance = calculate_distance(points[i - 1], points[i])
        time_diff_ms = timestamps[i] - timestamps[i - 1]
        
        # Check for idle time
        if time_diff_ms >= IDLE_THRESHOLD_MS:
            total_idle_time_ms += time_diff_ms
        
        # Calculate speed (pixels per second)
        if time_diff_ms > 0:
            time_diff_seconds = time_diff_ms / 1000.0
            speed = distance / time_diff_seconds
            speeds.append(speed)
        
        total_path_length += distance
    
    # Calculate mean cursor speed
    mean_cursor_speed = sum(speeds) / len(speeds) if speeds else 0.0
    
    # Calculate trajectory deviation
    # Optimal path is straight line from first to last point
    if len(points) >= 2:
        optimal_distance = calculate_distance(points[0], points[-1])
        if optimal_distance > 0:
            # Deviation ratio: how much longer the actual path is vs optimal
            # Normalized to 0-1 range using formula: 1 - (optimal / actual)
            # 0 = perfectly straight, approaching 1 = very deviated
            if total_path_length > 0:
                efficiency = optimal_distance / total_path_length
                trajectory_deviation = max(0.0, min(1.0, 1.0 - efficiency))
            else:
                trajectory_deviation = 0.0
        else:
            # Start and end at same point - check if there was movement
            trajectory_deviation = 1.0 if total_path_length > 0 else 0.0
    else:
        trajectory_deviation = 0.0
    
    # Convert idle time to seconds
    total_idle_time = total_idle_time_ms / 1000.0
    
    return MouseFeatures(
        mean_cursor_speed=mean_cursor_speed,
        trajectory_deviation=trajectory_deviation,
        total_idle_time=total_idle_time
    )
