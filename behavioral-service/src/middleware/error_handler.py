"""
Error handling middleware for structured error responses.

Provides consistent error response format across all API endpoints,
with proper logging of stack traces and contextual information.

Validates: Requirements 2.4, 8.2
"""

import traceback
from enum import Enum
from typing import Any, Dict, List, Optional

import structlog
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel

logger = structlog.get_logger(__name__)


# =============================================================================
# Error Codes
# =============================================================================

class ErrorCode(str, Enum):
    """Standardized error codes for the API."""
    
    # Validation errors (400)
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INVALID_PAYLOAD = "INVALID_PAYLOAD"
    MISSING_FIELD = "MISSING_FIELD"
    INVALID_FORMAT = "INVALID_FORMAT"
    
    # Authentication/Authorization errors (401, 403)
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    
    # Resource errors (404)
    NOT_FOUND = "NOT_FOUND"
    SESSION_NOT_FOUND = "SESSION_NOT_FOUND"
    
    # Processing errors (422)
    CLASSIFICATION_ERROR = "CLASSIFICATION_ERROR"
    FEATURE_EXTRACTION_ERROR = "FEATURE_EXTRACTION_ERROR"
    
    # Server errors (500)
    INTERNAL_ERROR = "INTERNAL_ERROR"
    MODEL_LOAD_ERROR = "MODEL_LOAD_ERROR"
    
    # Service errors (503)
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"


# =============================================================================
# Error Response Models
# =============================================================================

class ErrorDetail(BaseModel):
    """Detail about a specific error field or issue."""
    field: Optional[str] = None
    issue: str
    value: Optional[Any] = None


class ErrorResponse(BaseModel):
    """Structured error response format."""
    code: str
    message: str
    details: Optional[List[ErrorDetail]] = None
    request_id: Optional[str] = None


class APIErrorResponse(BaseModel):
    """Wrapper for error responses."""
    error: ErrorResponse


# =============================================================================
# Custom Exceptions
# =============================================================================

class APIError(Exception):
    """Base exception for API errors."""
    
    def __init__(
        self,
        code: ErrorCode,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[List[ErrorDetail]] = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


class ValidationError(APIError):
    """Validation error exception."""
    
    def __init__(self, message: str, details: Optional[List[ErrorDetail]] = None):
        super().__init__(
            code=ErrorCode.VALIDATION_ERROR,
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
        )


class NotFoundError(APIError):
    """Resource not found exception."""
    
    def __init__(self, message: str, details: Optional[List[ErrorDetail]] = None):
        super().__init__(
            code=ErrorCode.NOT_FOUND,
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            details=details,
        )


class ClassificationError(APIError):
    """Classification processing error exception."""
    
    def __init__(self, message: str, details: Optional[List[ErrorDetail]] = None):
        super().__init__(
            code=ErrorCode.CLASSIFICATION_ERROR,
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
        )


# =============================================================================
# Error Handlers
# =============================================================================

def create_error_response(
    code: ErrorCode,
    message: str,
    details: Optional[List[ErrorDetail]] = None,
    request_id: Optional[str] = None,
) -> Dict:
    """Create a structured error response dictionary."""
    response = APIErrorResponse(
        error=ErrorResponse(
            code=code.value,
            message=message,
            details=details,
            request_id=request_id,
        )
    )
    return response.model_dump()


async def api_error_handler(request: Request, exc: APIError) -> JSONResponse:
    """Handle custom API errors."""
    request_id = request.headers.get("X-Request-ID")
    
    logger.error(
        "api_error",
        error_code=exc.code.value,
        message=exc.message,
        status_code=exc.status_code,
        request_id=request_id,
        path=request.url.path,
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=create_error_response(
            code=exc.code,
            message=exc.message,
            details=exc.details,
            request_id=request_id,
        ),
    )


async def validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handle Pydantic validation errors."""
    request_id = request.headers.get("X-Request-ID")
    
    # Convert Pydantic errors to our format
    details = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"])
        details.append(
            ErrorDetail(
                field=field,
                issue=error["msg"],
                value=error.get("input"),
            )
        )
    
    logger.warning(
        "validation_error",
        error_count=len(details),
        request_id=request_id,
        path=request.url.path,
        errors=[d.model_dump() for d in details],
    )
    
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=create_error_response(
            code=ErrorCode.VALIDATION_ERROR,
            message="Invalid request payload",
            details=details,
            request_id=request_id,
        ),
    )


async def generic_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    request_id = request.headers.get("X-Request-ID")
    
    # Log full stack trace for debugging
    logger.error(
        "unhandled_exception",
        error_type=type(exc).__name__,
        message=str(exc),
        request_id=request_id,
        path=request.url.path,
        stack_trace=traceback.format_exc(),
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=create_error_response(
            code=ErrorCode.INTERNAL_ERROR,
            message="An unexpected error occurred",
            request_id=request_id,
        ),
    )


def register_error_handlers(app: FastAPI) -> None:
    """Register all error handlers with the FastAPI application."""
    app.add_exception_handler(APIError, api_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(Exception, generic_error_handler)
