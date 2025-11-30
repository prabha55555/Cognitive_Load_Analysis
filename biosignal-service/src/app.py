"""
Flask application for biosignal generation service.

Exposes REST API endpoints for generating synthetic EEG data
using Amazon Chronos and the Mendeley cognitive load dataset.
"""
import os
import json
import logging
from datetime import datetime
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
import redis

from .config import config
from .generator import get_generator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'])

# Initialize Redis client
redis_client = None
try:
    redis_client = redis.from_url(config.REDIS_URL, decode_responses=True)
    redis_client.ping()
    logger.info("Redis connection established")
except Exception as e:
    logger.warning(f"Redis not available, caching disabled: {e}")
    redis_client = None


def cache_response(ttl: int = 3600):
    """
    Decorator to cache API responses in Redis.
    
    Args:
        ttl: Time to live in seconds (default 1 hour)
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if redis_client is None:
                return f(*args, **kwargs)
            
            # Create cache key from request data
            try:
                request_data = request.get_json() or {}
                cache_key = f"biosignal:{request.path}:{hash(str(request_data))}"
            except Exception:
                return f(*args, **kwargs)
            
            # Try to get from cache
            try:
                cached = redis_client.get(cache_key)
                if cached:
                    logger.info(f"Cache hit for {cache_key}")
                    return jsonify(json.loads(cached))
            except Exception as e:
                logger.warning(f"Cache read failed: {e}")
            
            # Generate response
            result = f(*args, **kwargs)
            
            # Handle tuple responses (data, status_code) or Response objects
            if isinstance(result, tuple):
                response_data, status_code = result[0], result[1] if len(result) > 1 else 200
            else:
                # Assume it's a Response object
                try:
                    response_data = result.get_json()
                    status_code = result.status_code
                except Exception:
                    return result
            
            # Cache if successful
            if status_code == 200:
                try:
                    cache_data = response_data if isinstance(response_data, dict) else response_data
                    redis_client.setex(
                        cache_key, 
                        ttl, 
                        json.dumps(cache_data)
                    )
                    logger.info(f"Cached response for {cache_key}")
                except Exception as e:
                    logger.warning(f"Failed to cache response: {e}")
            
            return result
        return decorated_function
    return decorator


def validate_request(required_fields: list):
    """
    Decorator to validate required fields in request JSON.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'success': False,
                    'error': 'Request body must be JSON'
                }), 400
            
            missing = [field for field in required_fields if field not in data]
            if missing:
                return jsonify({
                    'success': False,
                    'error': f'Missing required fields: {", ".join(missing)}'
                }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


# ============================================================================
# Health Check Endpoint
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for container orchestration."""
    status = {
        'status': 'healthy',
        'service': 'biosignal-service',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0',
        'components': {
            'redis': 'connected' if redis_client else 'disconnected',
            'generator': 'ready'
        }
    }
    
    # Check if generator is initialized
    try:
        generator = get_generator()
        generator._ensure_initialized()
        status['components']['generator'] = 'ready'
    except Exception as e:
        status['components']['generator'] = f'error: {str(e)}'
        status['status'] = 'degraded'
    
    return jsonify(status), 200 if status['status'] == 'healthy' else 503


# ============================================================================
# EEG Generation Endpoints
# ============================================================================

@app.route('/api/biosignal/generate', methods=['POST'])
@validate_request(['cognitiveLoadScore'])
@cache_response(ttl=config.CACHE_TTL)
def generate_biosignal():
    """
    Generate synthetic EEG biosignal data with behavior-based modulation.
    
    Request Body:
        {
            "cognitiveLoadScore": 65,  // Required: 0-100
            "participantId": "p123",    // Optional: for tracking
            "platform": "chatgpt",      // Optional: 'chatgpt' or 'google'
            "numPoints": 50,            // Optional: number of data points
            "behaviorModifiers": {      // Optional: behavior-based modulation
                "currentPhase": "assessment",  // research|assessment|creativity|results|idle
                "phaseProgress": 0.45,         // 0-1 progress through phase
                "currentTime": 1700000000,     // Current timestamp in ms
                "recentEvents": [              // Recent behavioral events
                    {
                        "type": "answer_submitted_correct",
                        "timestamp": 1700000000,
                        "intensity": 0.8
                    }
                ],
                "aggregateMetrics": {          // Session-level metrics
                    "avgResponseTime": 45.2,
                    "correctCount": 3,
                    "incorrectCount": 1
                }
            }
        }
    
    Response:
        {
            "success": true,
            "data": {
                "cognitiveLoadTimeline": [...],
                "brainwavePatterns": {
                    "theta": [...],
                    "alpha": [...],
                    "beta": [...]
                },
                "metadata": {
                    "cognitiveLoadScore": 65,
                    "effectiveLoad": 62.5,
                    "loadLevel": "midlevel",
                    "behaviorModulation": {
                        "alphaModifier": 0.92,
                        "betaModifier": 1.12,
                        "thetaModifier": 1.05,
                        "phase": "assessment"
                    },
                    ...
                }
            }
        }
    """
    try:
        data = request.get_json()
        
        # Extract and validate parameters
        cognitive_load_score = float(data['cognitiveLoadScore'])
        if not 0 <= cognitive_load_score <= 100:
            return jsonify({
                'success': False,
                'error': 'cognitiveLoadScore must be between 0 and 100'
            }), 400
        
        participant_id = data.get('participantId', 'anonymous')
        platform = data.get('platform', 'unknown')
        num_points = int(data.get('numPoints', config.DEFAULT_NUM_POINTS))
        behavior_modifiers = data.get('behaviorModifiers', None)
        
        # Validate behavior modifiers if provided
        if behavior_modifiers:
            valid_phases = ['research', 'assessment', 'creativity', 'results', 'idle']
            current_phase = behavior_modifiers.get('currentPhase', 'idle')
            if current_phase not in valid_phases:
                behavior_modifiers['currentPhase'] = 'idle'
            
            # Ensure recentEvents is a list
            if not isinstance(behavior_modifiers.get('recentEvents'), list):
                behavior_modifiers['recentEvents'] = []
        
        logger.info(
            f"Generating biosignal for participant={participant_id}, "
            f"load={cognitive_load_score}, platform={platform}, "
            f"phase={behavior_modifiers.get('currentPhase') if behavior_modifiers else 'none'}"
        )
        
        # Generate biosignal data with behavior modulation
        generator = get_generator()
        biosignal_data = generator.generate_full_biosignal_data(
            cognitive_load_score, num_points, behavior_modifiers
        )
        
        # Add request metadata
        biosignal_data['metadata'].update({
            'participantId': participant_id,
            'platform': platform,
            'generatedAt': datetime.utcnow().isoformat()
        })
        
        return jsonify({
            'success': True,
            'data': biosignal_data
        }), 200
        
    except ValueError as e:
        logger.warning(f"Invalid request data: {e}")
        return jsonify({
            'success': False,
            'error': f'Invalid data: {str(e)}'
        }), 400
        
    except Exception as e:
        logger.error(f"Biosignal generation failed: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Internal server error during generation'
        }), 500


@app.route('/api/biosignal/timeline', methods=['POST'])
@validate_request(['cognitiveLoadScore'])
@cache_response(ttl=config.CACHE_TTL)
def generate_timeline():
    """
    Generate only the cognitive load timeline (lighter endpoint).
    
    Request Body:
        {
            "cognitiveLoadScore": 65,
            "numPoints": 50
        }
    """
    try:
        data = request.get_json()
        
        cognitive_load_score = float(data['cognitiveLoadScore'])
        num_points = int(data.get('numPoints', config.DEFAULT_NUM_POINTS))
        
        generator = get_generator()
        timeline, level = generator.generate_aggregated_timeline(
            cognitive_load_score, num_points
        )
        
        return jsonify({
            'success': True,
            'data': {
                'timeline': timeline.tolist(),
                'loadLevel': level,
                'cognitiveLoadScore': cognitive_load_score
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Timeline generation failed: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/biosignal/brainwaves', methods=['POST'])
@validate_request(['cognitiveLoadScore'])
@cache_response(ttl=config.CACHE_TTL)
def generate_brainwaves():
    """
    Generate only brainwave frequency patterns (lighter endpoint).
    
    Request Body:
        {
            "cognitiveLoadScore": 65,
            "numPoints": 50
        }
    """
    try:
        data = request.get_json()
        
        cognitive_load_score = float(data['cognitiveLoadScore'])
        num_points = int(data.get('numPoints', config.DEFAULT_NUM_POINTS))
        
        generator = get_generator()
        brainwaves = generator.generate_brainwave_patterns(
            cognitive_load_score, num_points
        )
        
        return jsonify({
            'success': True,
            'data': {
                'theta': brainwaves['theta'].tolist(),
                'alpha': brainwaves['alpha'].tolist(),
                'beta': brainwaves['beta'].tolist(),
                'cognitiveLoadScore': cognitive_load_score
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Brainwave generation failed: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/biosignal/batch', methods=['POST'])
@validate_request(['participants'])
def generate_batch():
    """
    Generate biosignal data for multiple participants in batch.
    
    Request Body:
        {
            "participants": [
                {"id": "p1", "cognitiveLoadScore": 45, "platform": "chatgpt"},
                {"id": "p2", "cognitiveLoadScore": 72, "platform": "google"}
            ]
        }
    """
    try:
        data = request.get_json()
        participants = data['participants']
        
        if len(participants) > 50:
            return jsonify({
                'success': False,
                'error': 'Maximum 50 participants per batch'
            }), 400
        
        generator = get_generator()
        results = {}
        
        for p in participants:
            participant_id = p.get('id', 'unknown')
            try:
                biosignal_data = generator.generate_full_biosignal_data(
                    float(p['cognitiveLoadScore']),
                    int(p.get('numPoints', config.DEFAULT_NUM_POINTS))
                )
                biosignal_data['metadata'].update({
                    'participantId': participant_id,
                    'platform': p.get('platform', 'unknown'),
                    'generatedAt': datetime.utcnow().isoformat()
                })
                results[participant_id] = {
                    'success': True,
                    'data': biosignal_data
                }
            except Exception as e:
                results[participant_id] = {
                    'success': False,
                    'error': str(e)
                }
        
        return jsonify({
            'success': True,
            'results': results,
            'totalProcessed': len(results)
        }), 200
        
    except Exception as e:
        logger.error(f"Batch generation failed: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================================
# Cache Management Endpoints
# ============================================================================

@app.route('/api/biosignal/cache/clear', methods=['POST'])
def clear_cache():
    """Clear all cached biosignal data."""
    if redis_client is None:
        return jsonify({
            'success': False,
            'error': 'Redis not available'
        }), 503
    
    try:
        # Get all biosignal keys
        keys = redis_client.keys('biosignal:*')
        if keys:
            redis_client.delete(*keys)
        
        return jsonify({
            'success': True,
            'message': f'Cleared {len(keys)} cached entries'
        }), 200
        
    except Exception as e:
        logger.error(f"Cache clear failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/biosignal/cache/stats', methods=['GET'])
def cache_stats():
    """Get cache statistics."""
    if redis_client is None:
        return jsonify({
            'success': False,
            'error': 'Redis not available',
            'cacheEnabled': False
        }), 200
    
    try:
        keys = redis_client.keys('biosignal:*')
        info = redis_client.info('memory')
        
        return jsonify({
            'success': True,
            'cacheEnabled': True,
            'entries': len(keys),
            'memoryUsed': info.get('used_memory_human', 'unknown'),
            'ttl': config.CACHE_TTL
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================================
# Error Handlers
# ============================================================================

@app.errorhandler(404)
def not_found(e):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({
        'success': False,
        'error': 'Method not allowed'
    }), 405


@app.errorhandler(500)
def internal_error(e):
    logger.error(f"Internal server error: {e}")
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = config.DEBUG
    
    logger.info(f"Starting biosignal service on port {port}")
    logger.info(f"Debug mode: {debug}")
    logger.info(f"Redis: {'connected' if redis_client else 'disabled'}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
