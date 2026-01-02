"""
Tests for Pydantic models.
"""

import pytest
from pydantic import ValidationError

from src.models import (
    ClickData,
    MouseData,
    ScrollData,
    KeystrokeData,
    NavigationData,
    InteractionEvent,
    InteractionBatch,
    ClassificationRequest,
    ClassificationResponse,
    BehavioralFeatures,
)


class TestEventDataModels:
    """Tests for event data type models."""

    def test_click_data_valid(self):
        """Valid click data should be accepted."""
        data = ClickData(target_element="button.submit", x=100, y=200)
        assert data.target_element == "button.submit"
        assert data.x == 100
        assert data.y == 200

    def test_click_data_negative_coords_rejected(self):
        """Negative coordinates should be rejected."""
        with pytest.raises(ValidationError):
            ClickData(target_element="button", x=-1, y=200)

    def test_mouse_data_valid(self):
        """Valid mouse data should be accepted."""
        data = MouseData(x=100, y=200, velocity=150.5)
        assert data.velocity == 150.5

    def test_scroll_data_valid(self):
        """Valid scroll data should be accepted."""
        data = ScrollData(direction="up", velocity=100.0, position=500.0)
        assert data.direction == "up"

    def test_scroll_data_invalid_direction(self):
        """Invalid scroll direction should be rejected."""
        with pytest.raises(ValidationError):
            ScrollData(direction="left", velocity=100.0, position=500.0)

    def test_keystroke_data_valid(self):
        """Valid keystroke data should be accepted."""
        data = KeystrokeData(key_down_time=1000.0, key_up_time=1050.0, inter_key_interval=200.0)
        assert data.key_down_time == 1000.0

    def test_navigation_data_valid(self):
        """Valid navigation data should be accepted."""
        data = NavigationData(from_section="intro", to_section="results", dwell_time=30.5)
        assert data.from_section == "intro"


class TestInteractionEvent:
    """Tests for InteractionEvent model."""

    def test_valid_click_event(self):
        """Valid click event should be accepted."""
        event = InteractionEvent(
            type="click",
            timestamp=1704067200000,
            session_id="sess_123",
            platform="chatgpt",
            data={"target_element": "button", "x": 100, "y": 200}
        )
        assert event.type == "click"
        assert event.platform == "chatgpt"

    def test_invalid_event_type(self):
        """Invalid event type should be rejected."""
        with pytest.raises(ValidationError):
            InteractionEvent(
                type="invalid_type",
                timestamp=1704067200000,
                session_id="sess_123",
                platform="chatgpt",
                data={"x": 100}
            )

    def test_invalid_platform(self):
        """Invalid platform should be rejected."""
        with pytest.raises(ValidationError):
            InteractionEvent(
                type="click",
                timestamp=1704067200000,
                session_id="sess_123",
                platform="bing",
                data={"target_element": "button", "x": 100, "y": 200}
            )

    def test_empty_session_id_rejected(self):
        """Empty session ID should be rejected."""
        with pytest.raises(ValidationError):
            InteractionEvent(
                type="click",
                timestamp=1704067200000,
                session_id="",
                platform="chatgpt",
                data={"target_element": "button", "x": 100, "y": 200}
            )


class TestInteractionBatch:
    """Tests for InteractionBatch model."""

    def test_valid_batch(self):
        """Valid batch should be accepted."""
        batch = InteractionBatch(
            session_id="sess_123",
            participant_id="part_456",
            platform="google",
            events=[
                InteractionEvent(
                    type="click",
                    timestamp=1704067200000,
                    session_id="sess_123",
                    platform="google",
                    data={"target_element": "link", "x": 50, "y": 100}
                )
            ]
        )
        assert len(batch.events) == 1

    def test_empty_events_rejected(self):
        """Empty events list should be rejected."""
        with pytest.raises(ValidationError):
            InteractionBatch(
                session_id="sess_123",
                participant_id="part_456",
                platform="google",
                events=[]
            )


class TestClassificationModels:
    """Tests for classification request/response models."""

    def test_classification_request_defaults(self):
        """Classification request should have correct defaults."""
        req = ClassificationRequest(session_id="sess_123")
        assert req.include_features is False

    def test_classification_response_valid(self):
        """Valid classification response should be accepted."""
        resp = ClassificationResponse(
            session_id="sess_123",
            cognitive_load_level="Moderate",
            confidence=0.85
        )
        assert resp.cognitive_load_level == "Moderate"
        assert resp.confidence == 0.85

    def test_confidence_bounds(self):
        """Confidence must be between 0 and 1."""
        with pytest.raises(ValidationError):
            ClassificationResponse(
                session_id="sess_123",
                cognitive_load_level="High",
                confidence=1.5
            )


class TestBehavioralFeatures:
    """Tests for BehavioralFeatures model."""

    def test_valid_features(self):
        """Valid features should be accepted."""
        features = BehavioralFeatures(
            mean_response_time=2.5,
            median_response_time=2.0,
            std_response_time=0.8,
            total_clicks=45,
            rage_click_count=2,
            click_rate=0.15,
            mean_cursor_speed=250.0,
            trajectory_deviation=0.3,
            total_idle_time=30.0,
            revisit_ratio=0.2,
            path_linearity=0.8,
            sections_visited=5,
            total_session_time=300.0,
            active_time_ratio=0.9,
            scroll_depth=0.75
        )
        assert features.total_clicks == 45

    def test_feature_vector_conversion(self):
        """Features should convert to vector correctly."""
        features = BehavioralFeatures(
            mean_response_time=2.5,
            median_response_time=2.0,
            std_response_time=0.8,
            total_clicks=45,
            rage_click_count=2,
            click_rate=0.15,
            mean_cursor_speed=250.0,
            trajectory_deviation=0.3,
            total_idle_time=30.0,
            revisit_ratio=0.2,
            path_linearity=0.8,
            sections_visited=5,
            total_session_time=300.0,
            active_time_ratio=0.9,
            scroll_depth=0.75
        )
        vector = features.to_feature_vector()
        assert len(vector) == 15
        assert vector[0] == 2.5  # mean_response_time
        assert vector[3] == 45.0  # total_clicks
