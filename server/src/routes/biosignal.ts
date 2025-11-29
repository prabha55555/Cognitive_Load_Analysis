/**
 * Biosignal Routes
 * 
 * Routes for biosignal generation API
 */

import { Router } from 'express';
import {
  generateBiosignal,
  generateTimeline,
  generateBrainwaves,
  generateBatch,
  getCachedBiosignal,
  checkHealth,
} from '../controllers/biosignalController';
import { rateLimitMiddleware } from '../middleware/rateLimit';

const router = Router();

// Apply rate limiting to biosignal endpoints
// More restrictive for generation, less for cached retrieval
const generateRateLimit = rateLimitMiddleware(30, 60); // 30 requests per minute
const readRateLimit = rateLimitMiddleware(100, 60); // 100 requests per minute

/**
 * POST /api/biosignal/generate
 * Generate complete biosignal data (timeline + brainwaves)
 */
router.post('/generate', generateRateLimit, generateBiosignal);

/**
 * POST /api/biosignal/timeline
 * Generate only cognitive load timeline
 */
router.post('/timeline', generateRateLimit, generateTimeline);

/**
 * POST /api/biosignal/brainwaves
 * Generate only brainwave frequency patterns
 */
router.post('/brainwaves', generateRateLimit, generateBrainwaves);

/**
 * POST /api/biosignal/batch
 * Generate biosignal data for multiple participants
 */
router.post('/batch', generateRateLimit, generateBatch);

/**
 * GET /api/biosignal/:participantId
 * Get cached biosignal data for a participant
 */
router.get('/:participantId', readRateLimit, getCachedBiosignal);

/**
 * GET /api/biosignal/health
 * Check biosignal service health
 */
router.get('/health', checkHealth);

export default router;
