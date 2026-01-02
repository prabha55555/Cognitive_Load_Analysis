"""
Tests for interaction API endpoints.

Tests the /api/interactions/* endpoints for event ingestion,
classification, and platform comparison.
"""

import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.routes.interactions import clear_session_storage, get_session_storage


@pytest.fixture(autouse=True)
def clear_storage():
    """Clear session storage before each test."""
    clear_session_storage()
    yield
    clear_session_storage()


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


def create_click_event(session_id: str, platform: str, timestamp: int, target: str = "button.submit"):
    """Helper to create a click event."""
    return {
        "type": "click",
        "timestamp": timestamp,
        "session_id": session_id,
        "platform": platform,
        "data": {
            "target_element": target,
            "x": 100,
            "y": 200,
        }
    }


def create_mouse_event(session_id: str, platform: str, timestamp: int, x: int = 100, y: int = 200):
    """Helper to create a mouse event."""
    return {
        "type": "mousemove",
        "timestamp": timestamp,
        "session_id": session_id,
        "platform": platform,
        "data": {
            "x": x,
            "y": y,
            "velocity": 150.0,
        }
    }


def create_navigation_event(session_id: str, platform: str, timestamp: int, from_section: str, to_section: str):
    """Helper to create a navigation event."""
    return {
        "type": "navigation",
        "timestamp": timestamp,
        "session_id": session_id,
        "platform": platform,
        "data": {
            "from_section": from_section,
            "to_section": to_section,
            "dwell_time": 5.0,
        }
    }


class TestIngestEndpoint:
    """Tests for /api/interactions/ingest endpoint."""
    
    def test_ingest_creates_session(self, client):
        """Test that ingesting events creates a new session."""
        batch = {
            "session_id": "test-session-1",
            "participant_id": "participant-1",
            "platform": "chatgpt",
            "events": [
                create_click_event("test-session-1", "chatgpt", 1000),
            ]
        }
        
        response = client.post("/api/interactions/ingest", json=batch)
        
        assert response.status_code == 201
        data = response.json()
        assert data["session_id"] == "test-session-1"
        assert data["events_received"] == 1
        assert data["total_events"] == 1
    
    def test_ingest_appends_to_existing_session(self, client):
        """Test that subsequent ingests append to existing session."""
        batch1 = {
            "session_id": "test-session-1",
            "participant_id": "participant-1",
            "platform": "chatgpt",
            "events": [
                create_click_event("test-session-1", "chatgpt", 1000),
            ]
        }
        batch2 = {
            "session_id": "test-session-1",
            "participant_id": "participant-1",
            "platform": "chatgpt",
            "events": [
                create_click_event("test-session-1", "chatgpt", 2000),
                create_click_event("test-session-1", "chatgpt", 3000),
            ]
        }
        
        client.post("/api/interactions/ingest", json=batch1)
        response = client.post("/api/interactions/ingest", json=batch2)
        
        assert response.status_code == 201
        data = response.json()
        assert data["events_received"] == 2
        assert data["total_events"] == 3
    
    def test_ingest_rejects_platform_mismatch(self, client):
        """Test that platform mismatch is rejected."""
        batch1 = {
            "session_id": "test-session-1",
            "participant_id": "participant-1",
            "platform": "chatgpt",
            "events": [
                create_click_event("test-session-1", "chatgpt", 1000),
            ]
        }
        batch2 = {
            "session_id": "test-session-1",
            "participant_id": "participant-1",
            "platform": "google",  # Different platform
            "events": [
                create_click_event("test-session-1", "google", 2000),
            ]
        }
        
        client.post("/api/interactions/ingest", json=batch1)
        response = client.post("/api/interactions/ingest", json=batch2)
        
        assert response.status_code == 400
        assert "platform mismatch" in response.json()["detail"].lower()
    
    def test_ingest_validates_empty_events(self, client):
        """Test that empty events list is rejected."""
        batch = {
            "session_id": "test-session-1",
            "participant_id": "participant-1",
            "platform": "chatgpt",
            "events": []
        }
        
        response = client.post("/api/interactions/ingest", json=batch)
        
        # Error handler returns 400 for validation errors
        assert response.status_code == 400


class TestClassifyEndpoint:
    """Tests for /api/interactions/classify endpoint."""
    
    def test_classify_returns_valid_level(self, client):
        """Test that classification returns a valid cognitive load level."""
        # First ingest some events
        batch = {
            "session_id": "test-session-1",
            "participant_id": "participant-1",
            "platform": "chatgpt",
            "events": [
                create_click_event("test-session-1", "chatgpt", 1000),
                create_click_event("test-session-1", "chatgpt", 2000),
                create_mouse_event("test-session-1", "chatgpt", 1500),
                create_navigation_event("test-session-1", "chatgpt", 3000, "home", "search"),
            ]
        }
        client.post("/api/interactions/ingest", json=batch)
        
        # Then classify
        request = {"session_id": "test-session-1"}
        response = client.post("/api/interactions/classify", json=request)
        
        assert response.status_code == 200
        data = response.json()
        assert data["cognitive_load_level"] in ["Low", "Moderate", "High", "Very High"]
        assert 0.0 <= data["confidence"] <= 1.0
    
    def test_classify_includes_features_when_requested(self, client):
        """Test that features are included when requested."""
        batch = {
            "session_id": "test-session-1",
            "participant_id": "participant-1",
            "platform": "chatgpt",
            "events": [
                create_click_event("test-session-1", "chatgpt", 1000),
                create_click_event("test-session-1", "chatgpt", 2000),
            ]
        }
        client.post("/api/interactions/ingest", json=batch)
        
        request = {"session_id": "test-session-1", "include_features": True}
        response = client.post("/api/interactions/classify", json=request)
        
        assert response.status_code == 200
        data = response.json()
        assert data["features"] is not None
        assert "mean_response_time" in data["features"]
    
    def test_classify_not_found(self, client):
        """Test that non-existent session returns 404."""
        request = {"session_id": "non-existent"}
        response = client.post("/api/interactions/classify", json=request)
        
        assert response.status_code == 404
    
    def test_classify_insufficient_events(self, client):
        """Test that session with insufficient events returns error."""
        batch = {
            "session_id": "test-session-1",
            "participant_id": "participant-1",
            "platform": "chatgpt",
            "events": [
                create_click_event("test-session-1", "chatgpt", 1000),
            ]
        }
        client.post("/api/interactions/ingest", json=batch)
        
        request = {"session_id": "test-session-1"}
        response = client.post("/api/interactions/classify", json=request)
        
        assert response.status_code == 400
        assert "insufficient" in response.json()["detail"].lower()


class TestCompareEndpoint:
    """Tests for /api/interactions/compare endpoint."""
    
    def test_compare_returns_valid_statistics(self, client):
        """Test that comparison returns valid statistics."""
        # Create ChatGPT session
        chatgpt_batch = {
            "session_id": "chatgpt-session-1",
            "participant_id": "participant-1",
            "platform": "chatgpt",
            "events": [
                create_click_event("chatgpt-session-1", "chatgpt", 1000),
                create_click_event("chatgpt-session-1", "chatgpt", 2000),
            ]
        }
        client.post("/api/interactions/ingest", json=chatgpt_batch)
        
        # Create Google session
        google_batch = {
            "session_id": "google-session-1",
            "participant_id": "participant-2",
            "platform": "google",
            "events": [
                create_click_event("google-session-1", "google", 1000),
                create_click_event("google-session-1", "google", 2000),
            ]
        }
        client.post("/api/interactions/ingest", json=google_batch)
        
        # Compare
        response = client.post("/api/interactions/compare")
        
        assert response.status_code == 200
        data = response.json()
        assert "chatgpt_mean_load" in data
        assert "google_mean_load" in data
        assert "statistical_significance" in data
        assert data["sample_sizes"]["chatgpt"] == 1
        assert data["sample_sizes"]["google"] == 1
    
    def test_compare_insufficient_data(self, client):
        """Test that comparison with insufficient data returns error."""
        # Only create ChatGPT session
        batch = {
            "session_id": "chatgpt-session-1",
            "participant_id": "participant-1",
            "platform": "chatgpt",
            "events": [
                create_click_event("chatgpt-session-1", "chatgpt", 1000),
                create_click_event("chatgpt-session-1", "chatgpt", 2000),
            ]
        }
        client.post("/api/interactions/ingest", json=batch)
        
        response = client.post("/api/interactions/compare")
        
        assert response.status_code == 400
        assert "insufficient" in response.json()["detail"].lower()


class TestPlatformTagging:
    """Tests for platform tagging in session storage."""
    
    def test_session_has_platform_tag(self, client):
        """Test that sessions are tagged with platform."""
        batch = {
            "session_id": "test-session-1",
            "participant_id": "participant-1",
            "platform": "chatgpt",
            "events": [
                create_click_event("test-session-1", "chatgpt", 1000),
            ]
        }
        client.post("/api/interactions/ingest", json=batch)
        
        # Get session
        response = client.get("/api/interactions/sessions/test-session-1")
        
        assert response.status_code == 200
        data = response.json()
        assert data["platform"] == "chatgpt"
    
    def test_list_sessions_by_platform(self, client):
        """Test filtering sessions by platform."""
        # Create sessions for both platforms
        chatgpt_batch = {
            "session_id": "chatgpt-session-1",
            "participant_id": "participant-1",
            "platform": "chatgpt",
            "events": [create_click_event("chatgpt-session-1", "chatgpt", 1000)]
        }
        google_batch = {
            "session_id": "google-session-1",
            "participant_id": "participant-2",
            "platform": "google",
            "events": [create_click_event("google-session-1", "google", 1000)]
        }
        client.post("/api/interactions/ingest", json=chatgpt_batch)
        client.post("/api/interactions/ingest", json=google_batch)
        
        # Filter by platform
        response = client.get("/api/interactions/sessions?platform=chatgpt")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["platform"] == "chatgpt"
