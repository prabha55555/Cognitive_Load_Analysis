"""
FastAPI application for Behavioral Cognitive Load Classification.

This service collects user interaction data and classifies cognitive load levels
using machine learning models trained on behavioral features.
"""

import os
import time
import uuid
from contextlib import asynccontextmanager
from typing import Callable

import structlog
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from src.middleware.error_handler import register_error_handlers
from src.routes import interactions_router

# Load environment variables
load_dotenv()

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown events."""
    logger.info("behavioral_service_starting", env=os.getenv("FASTAPI_ENV", "development"))
    yield
    logger.info("behavioral_service_shutdown")


# Create FastAPI application
app = FastAPI(
    title="Behavioral Cognitive Load Service",
    description="API for collecting user interaction data and classifying cognitive load levels",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
origins = [origin.strip() for origin in cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register error handlers
register_error_handlers(app)

# Register API routers
app.include_router(interactions_router)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next: Callable) -> Response:
    """
    Middleware for logging all HTTP requests and responses.
    
    Logs request method, path, and response status code for every API call.
    Validates: Requirements 2.3, 8.1
    """
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    # Bind request context to logger
    log = logger.bind(
        request_id=request_id,
        method=request.method,
        path=request.url.path,
        client_ip=request.client.host if request.client else None,
    )
    
    log.info("request_started")
    
    try:
        response = await call_next(request)
        
        # Calculate request duration
        duration_ms = (time.time() - start_time) * 1000
        
        log.info(
            "request_completed",
            status_code=response.status_code,
            duration_ms=round(duration_ms, 2),
        )
        
        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        
        return response
        
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        log.error(
            "request_failed",
            error=str(e),
            duration_ms=round(duration_ms, 2),
        )
        raise


@app.get("/health")
async def health_check():
    """
    Health check endpoint for service monitoring.
    
    Returns:
        dict: Service health status and version information
    """
    return {
        "status": "healthy",
        "service": "behavioral-cognitive-load",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.getenv("FASTAPI_ENV") == "development",
    )
