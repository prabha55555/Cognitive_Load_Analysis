"""
Feature extraction modules for behavioral cognitive load analysis.

This package contains modules for computing behavioral features from
raw interaction events, including response time, click analysis,
mouse movement, and navigation patterns.
"""

from .response_time import ResponseTimeFeatures, compute_response_time_features
from .click_analysis import ClickFeatures, compute_click_features
from .mouse_analysis import MouseFeatures, compute_mouse_features
from .navigation_analysis import NavigationFeatures, compute_navigation_features
from .aggregator import aggregate_features

__all__ = [
    "ResponseTimeFeatures",
    "compute_response_time_features",
    "ClickFeatures",
    "compute_click_features",
    "MouseFeatures",
    "compute_mouse_features",
    "NavigationFeatures",
    "compute_navigation_features",
    "aggregate_features",
]
