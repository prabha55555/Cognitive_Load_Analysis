"""
Navigation feature calculations.

Computes revisit ratio and path linearity score from navigation events.

Validates: Requirements 3.4
"""

from dataclasses import dataclass
from typing import List, Set

from src.models import InteractionEvent


@dataclass
class NavigationFeatures:
    """Navigation features computed from interaction events."""
    revisit_ratio: float  # ratio of revisited sections (0-1)
    path_linearity: float  # linearity score of navigation path (0-1)
    sections_visited: int  # number of unique sections visited


def compute_navigation_features(events: List[InteractionEvent]) -> NavigationFeatures:
    """
    Compute navigation features from interaction events.
    
    Args:
        events: List of all interaction events
        
    Returns:
        NavigationFeatures with revisit ratio, path linearity, and sections visited
        
    Note:
        - Revisit ratio: proportion of navigations that go to previously visited sections
          Formula: revisits / total_navigations (0 = no revisits, 1 = all revisits)
        - Path linearity: measures how linear/sequential the navigation path is
          Formula: unique_sections / total_navigations (1 = perfectly linear, lower = more backtracking)
    """
    # Filter to only navigation events
    nav_events = [e for e in events if e.type == "navigation"]
    
    if not nav_events:
        return NavigationFeatures(
            revisit_ratio=0.0,
            path_linearity=1.0,  # No navigation = perfectly linear (no deviation)
            sections_visited=0
        )
    
    # Sort by timestamp
    sorted_events = sorted(nav_events, key=lambda e: e.timestamp)
    
    # Track visited sections and revisits
    visited_sections: Set[str] = set()
    revisit_count = 0
    total_navigations = 0
    
    for event in sorted_events:
        to_section = event.data.get("to_section", "")
        from_section = event.data.get("from_section", "")
        
        if not to_section:
            continue
            
        total_navigations += 1
        
        # Add from_section to visited if it's the first navigation
        if from_section and not visited_sections:
            visited_sections.add(from_section)
        
        # Check if this is a revisit
        if to_section in visited_sections:
            revisit_count += 1
        
        # Add to visited sections
        visited_sections.add(to_section)
    
    # Calculate revisit ratio
    if total_navigations > 0:
        revisit_ratio = revisit_count / total_navigations
    else:
        revisit_ratio = 0.0
    
    # Calculate path linearity
    # Linearity = unique sections / total navigations
    # A perfectly linear path visits each section once
    # More backtracking = lower linearity
    sections_visited = len(visited_sections)
    
    if total_navigations > 0:
        # Normalize: if you visit N unique sections in N navigations, linearity = 1
        # If you visit N unique sections in 2N navigations (lots of backtracking), linearity = 0.5
        path_linearity = min(1.0, sections_visited / total_navigations)
    else:
        path_linearity = 1.0
    
    return NavigationFeatures(
        revisit_ratio=revisit_ratio,
        path_linearity=path_linearity,
        sections_visited=sections_visited
    )
