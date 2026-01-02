"""
Pydantic models for request/response validation.

Defines all data types for interaction events, classification requests,
and API responses used by the Behavioral Cognitive Load Service.

Validates: Requirements 2.2
"""

from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator


# =============================================================================
# Event Data Types
# =============================================================================

class ClickData(BaseModel):
    """Data captured from click events."""
    model_config = ConfigDict(populate_by_name=True)
    
    target_element: str = Field(..., alias="targetElement", description="CSS selector or element identifier")
    x: int = Field(..., ge=0, description="X coordinate of click")
    y: int = Field(..., ge=0, description="Y coordinate of click")


class MouseData(BaseModel):
    """Data captured from mouse movement events."""
    x: int = Field(..., ge=0, description="X coordinate of cursor")
    y: int = Field(..., ge=0, description="Y coordinate of cursor")
    velocity: float = Field(..., ge=0, description="Cursor velocity in pixels/second")


class ScrollData(BaseModel):
    """Data captured from scroll events."""
    direction: Literal["up", "down"] = Field(..., description="Scroll direction")
    velocity: float = Field(..., ge=0, description="Scroll velocity in pixels/second")
    position: float = Field(..., ge=0, description="Current scroll position")


class KeystrokeData(BaseModel):
    """
    Data captured from keystroke events.
    
    Note: Only timing information is captured, not actual key values,
    to preserve user privacy.
    """
    model_config = ConfigDict(populate_by_name=True)
    
    key_down_time: float = Field(..., alias="keyDownTime", ge=0, description="Timestamp of key press")
    key_up_time: float = Field(..., alias="keyUpTime", ge=0, description="Timestamp of key release")
    inter_key_interval: float = Field(..., alias="interKeyInterval", ge=0, description="Time since previous keystroke")


class NavigationData(BaseModel):
    """Data captured from navigation events between sections."""
    model_config = ConfigDict(populate_by_name=True)
    
    from_section: str = Field(..., alias="fromSection", description="Source section identifier")
    to_section: str = Field(..., alias="toSection", description="Destination section identifier")
    dwell_time: float = Field(..., alias="dwellTime", ge=0, description="Time spent in source section (seconds)")


# =============================================================================
# Interaction Event
# =============================================================================

EventDataType = Union[ClickData, MouseData, ScrollData, KeystrokeData, NavigationData]


class InteractionEvent(BaseModel):
    """
    A discrete user interaction event captured by the frontend.
    
    Each event contains a type, timestamp, session context, and type-specific data.
    """
    type: Literal["click", "mousemove", "scroll", "keystroke", "navigation"] = Field(
        ..., description="Type of interaction event"
    )
    timestamp: int = Field(..., gt=0, description="Unix timestamp in milliseconds")
    session_id: str = Field(..., min_length=1, description="Session identifier")
    platform: Literal["chatgpt", "google"] = Field(..., description="Platform being used")
    data: Dict = Field(..., description="Event-specific data payload")

    @field_validator("data")
    @classmethod
    def validate_data_for_type(cls, v, info):
        """Validate that data matches the expected structure for the event type."""
        # Basic validation - data must not be empty
        if not v:
            raise ValueError("Event data cannot be empty")
        return v


class InteractionBatch(BaseModel):
    """
    A batch of interaction events for efficient transmission.
    
    Events are batched on the frontend and sent together to reduce network overhead.
    """
    session_id: str = Field(..., min_length=1, description="Session identifier")
    participant_id: str = Field(..., min_length=1, description="Participant identifier")
    platform: Literal["chatgpt", "google"] = Field(..., description="Platform being used")
    events: List[InteractionEvent] = Field(..., min_length=1, description="List of interaction events")


# =============================================================================
# Classification Request/Response
# =============================================================================

class ClassificationRequest(BaseModel):
    """Request to classify cognitive load for a session."""
    session_id: str = Field(..., min_length=1, description="Session to classify")
    include_features: bool = Field(default=False, description="Include feature values in response")


class ClassificationResponse(BaseModel):
    """Response containing cognitive load classification results."""
    session_id: str = Field(..., description="Session identifier")
    cognitive_load_level: Literal["Low", "Moderate", "High", "Very High"] = Field(
        ..., description="Classified cognitive load level"
    )
    confidence: float = Field(..., ge=0.0, le=1.0, description="Classification confidence score")
    features: Optional[Dict[str, float]] = Field(
        default=None, description="Feature values if requested"
    )
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Classification timestamp")


# =============================================================================
# Comparison Response
# =============================================================================

class ComparisonResponse(BaseModel):
    """Response containing platform comparison statistics."""
    chatgpt_mean_load: float = Field(..., description="Mean cognitive load for ChatGPT sessions")
    google_mean_load: float = Field(..., description="Mean cognitive load for Google sessions")
    statistical_significance: float = Field(
        ..., ge=0.0, le=1.0, description="P-value for statistical significance"
    )
    sample_sizes: Dict[str, int] = Field(..., description="Number of sessions per platform")


# =============================================================================
# Behavioral Features
# =============================================================================

class BehavioralFeatures(BaseModel):
    """
    Computed behavioral features from raw interaction events.
    
    These features are used as input to the cognitive load classifier.
    """
    # Response Time Features
    mean_response_time: float = Field(..., ge=0, description="Mean response time in seconds")
    median_response_time: float = Field(..., ge=0, description="Median response time in seconds")
    std_response_time: float = Field(..., ge=0, description="Standard deviation of response times")
    
    # Click Features
    total_clicks: int = Field(..., ge=0, description="Total number of clicks")
    rage_click_count: int = Field(..., ge=0, description="Number of rage click incidents")
    click_rate: float = Field(..., ge=0, description="Clicks per second")
    
    # Mouse Features
    mean_cursor_speed: float = Field(..., ge=0, description="Mean cursor speed in pixels/second")
    trajectory_deviation: float = Field(..., ge=0, description="Deviation from optimal path")
    total_idle_time: float = Field(..., ge=0, description="Total idle time in seconds")
    
    # Navigation Features
    revisit_ratio: float = Field(..., ge=0, le=1, description="Ratio of revisited sections")
    path_linearity: float = Field(..., ge=0, le=1, description="Linearity score of navigation path")
    sections_visited: int = Field(..., ge=0, description="Number of unique sections visited")
    
    # Engagement Features
    total_session_time: float = Field(..., ge=0, description="Total session duration in seconds")
    active_time_ratio: float = Field(..., ge=0, le=1, description="Ratio of active to total time")
    scroll_depth: float = Field(..., ge=0, le=1, description="Maximum scroll depth reached")

    def to_feature_vector(self) -> List[float]:
        """Convert features to a list for ML model input."""
        return [
            self.mean_response_time,
            self.median_response_time,
            self.std_response_time,
            float(self.total_clicks),
            float(self.rage_click_count),
            self.click_rate,
            self.mean_cursor_speed,
            self.trajectory_deviation,
            self.total_idle_time,
            self.revisit_ratio,
            self.path_linearity,
            float(self.sections_visited),
            self.total_session_time,
            self.active_time_ratio,
            self.scroll_depth,
        ]

    def to_json(self) -> str:
        """
        Serialize features to JSON string.
        
        Validates: Requirements 3.6
        
        Returns:
            JSON string representation of the features
        """
        return self.model_dump_json()

    @classmethod
    def from_json(cls, json_str: str) -> "BehavioralFeatures":
        """
        Deserialize features from JSON string.
        
        Validates: Requirements 3.6
        
        Args:
            json_str: JSON string representation of features
            
        Returns:
            BehavioralFeatures instance with values from JSON
        """
        return cls.model_validate_json(json_str)

    def to_dict(self) -> Dict[str, float]:
        """
        Convert features to a dictionary.
        
        Returns:
            Dictionary with feature names as keys and values as floats
        """
        return {
            "mean_response_time": self.mean_response_time,
            "median_response_time": self.median_response_time,
            "std_response_time": self.std_response_time,
            "total_clicks": float(self.total_clicks),
            "rage_click_count": float(self.rage_click_count),
            "click_rate": self.click_rate,
            "mean_cursor_speed": self.mean_cursor_speed,
            "trajectory_deviation": self.trajectory_deviation,
            "total_idle_time": self.total_idle_time,
            "revisit_ratio": self.revisit_ratio,
            "path_linearity": self.path_linearity,
            "sections_visited": float(self.sections_visited),
            "total_session_time": self.total_session_time,
            "active_time_ratio": self.active_time_ratio,
            "scroll_depth": self.scroll_depth,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, float]) -> "BehavioralFeatures":
        """
        Create BehavioralFeatures from a dictionary.
        
        Args:
            data: Dictionary with feature names and values
            
        Returns:
            BehavioralFeatures instance
        """
        return cls(
            mean_response_time=data["mean_response_time"],
            median_response_time=data["median_response_time"],
            std_response_time=data["std_response_time"],
            total_clicks=int(data["total_clicks"]),
            rage_click_count=int(data["rage_click_count"]),
            click_rate=data["click_rate"],
            mean_cursor_speed=data["mean_cursor_speed"],
            trajectory_deviation=data["trajectory_deviation"],
            total_idle_time=data["total_idle_time"],
            revisit_ratio=data["revisit_ratio"],
            path_linearity=data["path_linearity"],
            sections_visited=int(data["sections_visited"]),
            total_session_time=data["total_session_time"],
            active_time_ratio=data["active_time_ratio"],
            scroll_depth=data["scroll_depth"],
        )
