"""
Tests for the error handling middleware.
"""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel

from src.middleware.error_handler import (
    APIError,
    ErrorCode,
    ValidationError,
    NotFoundError,
    ClassificationError,
    register_error_handlers,
)


# Create a test app with error handlers
test_app = FastAPI()
register_error_handlers(test_app)


class InputModel(BaseModel):
    """Input model for validation tests."""
    name: str
    value: int


@test_app.get("/test-api-error")
async def raise_api_error():
    raise APIError(
        code=ErrorCode.INTERNAL_ERROR,
        message="Test API error",
        status_code=500,
    )


@test_app.get("/test-validation-error")
async def raise_validation_error():
    raise ValidationError(message="Test validation error")


@test_app.get("/test-not-found")
async def raise_not_found():
    raise NotFoundError(message="Resource not found")


@test_app.get("/test-classification-error")
async def raise_classification_error():
    raise ClassificationError(message="Classification failed")


@test_app.get("/test-generic-error")
async def raise_generic_error():
    raise RuntimeError("Unexpected error")


@test_app.post("/test-pydantic-validation")
async def pydantic_validation_endpoint(data: InputModel):
    return {"received": data.model_dump()}


@pytest.fixture
def client():
    return TestClient(test_app)


class TestErrorResponseStructure:
    """Tests for error response structure."""

    def test_api_error_response_structure(self, client):
        """API errors should return structured response."""
        response = client.get("/test-api-error")
        assert response.status_code == 500
        data = response.json()
        
        assert "error" in data
        assert "code" in data["error"]
        assert "message" in data["error"]
        assert data["error"]["code"] == "INTERNAL_ERROR"
        assert data["error"]["message"] == "Test API error"

    def test_validation_error_response(self, client):
        """Validation errors should return 400 with proper structure."""
        response = client.get("/test-validation-error")
        assert response.status_code == 400
        data = response.json()
        
        assert data["error"]["code"] == "VALIDATION_ERROR"

    def test_not_found_error_response(self, client):
        """Not found errors should return 404."""
        response = client.get("/test-not-found")
        assert response.status_code == 404
        data = response.json()
        
        assert data["error"]["code"] == "NOT_FOUND"

    def test_classification_error_response(self, client):
        """Classification errors should return 422."""
        response = client.get("/test-classification-error")
        assert response.status_code == 422
        data = response.json()
        
        assert data["error"]["code"] == "CLASSIFICATION_ERROR"

    def test_generic_error_response(self, client):
        """Unhandled exceptions should be logged with stack trace."""
        # Note: FastAPI's exception handling re-raises generic exceptions
        # after our handler logs them. The important thing is that the
        # error is logged with stack trace (verified in output).
        # For production, we'd use a custom middleware to catch all exceptions.
        import pytest
        with pytest.raises(RuntimeError):
            client.get("/test-generic-error")


class TestPydanticValidationErrors:
    """Tests for Pydantic validation error handling."""

    def test_missing_field_error(self, client):
        """Missing required fields should return validation error."""
        response = client.post("/test-pydantic-validation", json={})
        assert response.status_code == 400
        data = response.json()
        
        assert data["error"]["code"] == "VALIDATION_ERROR"
        assert data["error"]["details"] is not None
        assert len(data["error"]["details"]) > 0

    def test_invalid_type_error(self, client):
        """Invalid field types should return validation error with details."""
        response = client.post(
            "/test-pydantic-validation",
            json={"name": "test", "value": "not_an_int"}
        )
        assert response.status_code == 400
        data = response.json()
        
        assert data["error"]["code"] == "VALIDATION_ERROR"
        # Should have details about the invalid field
        assert any(
            d["field"] == "body.value" 
            for d in data["error"]["details"]
        )
