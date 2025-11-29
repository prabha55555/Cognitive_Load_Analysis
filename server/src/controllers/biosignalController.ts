/**
 * Biosignal Controller
 * 
 * Handles biosignal generation requests by proxying to the Python biosignal service.
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/errorHandler';
import { setCache, getCache } from '../services/redisService';

const BIOSIGNAL_SERVICE_URL = process.env.BIOSIGNAL_SERVICE_URL || 'http://localhost:5000';
const CACHE_TTL = parseInt(process.env.BIOSIGNAL_CACHE_TTL || '3600', 10);

/**
 * Interface for participant metrics used in cognitive load calculation
 */
interface ParticipantMetrics {
  interactionCount: number;
  clarificationRequests: number;
  assessmentTime: number;
  assessmentAccuracy: number;
  timeSpent: number;
}

/**
 * Interface for biosignal data returned by Python service
 */
interface BiosignalData {
  cognitiveLoadTimeline: number[];
  brainwavePatterns: {
    theta: number[];
    alpha: number[];
    beta: number[];
  };
  metadata: {
    cognitiveLoadScore: number;
    loadLevel: string;
    participantId?: string;
    platform?: string;
    generatedAt: string;
  };
}

/**
 * Calculate cognitive load score from participant metrics
 */
function calculateCognitiveLoad(metrics: ParticipantMetrics): number {
  const normalizeTime = (time: number, min: number, max: number): number => {
    return Math.min(Math.max((time - min) / (max - min), 0), 1) * 100;
  };

  const normalizeInteractions = (count: number, max: number): number => {
    return Math.min(Math.max(count / max, 0), 1) * 100;
  };

  // Weighted calculation matching frontend cognitiveLoadService
  const timeScore = normalizeTime(metrics.timeSpent, 300, 1800) * 0.20;
  const interactionScore = normalizeInteractions(metrics.interactionCount, 20) * 0.20;
  const clarificationScore = Math.min(metrics.clarificationRequests * 5, 100) * 0.15;
  const assessmentTimeScore = normalizeTime(metrics.assessmentTime, 0, 1800) * 0.25;
  const accuracyScore = (1 - metrics.assessmentAccuracy) * 100 * 0.20;

  const totalScore = Math.round(
    timeScore + interactionScore + clarificationScore + assessmentTimeScore + accuracyScore
  );

  return Math.min(Math.max(totalScore, 0), 100);
}

/**
 * Generate cache key for biosignal request
 */
function getCacheKey(participantId: string, cognitiveLoadScore: number): string {
  return `biosignal:${participantId}:${Math.round(cognitiveLoadScore)}`;
}

/**
 * Proxy request to Python biosignal service
 */
async function callBiosignalService(
  endpoint: string,
  data: Record<string, unknown>
): Promise<BiosignalData> {
  const url = `${BIOSIGNAL_SERVICE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: string };
      throw new ApiError(
        response.status,
        errorData.error || `Biosignal service error: ${response.statusText}`
      );
    }

    const result = await response.json() as { success: boolean; data?: BiosignalData; error?: string };
    
    if (!result.success) {
      throw new ApiError(500, result.error || 'Biosignal generation failed');
    }
    
    return result.data as BiosignalData;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    
    console.error('Biosignal service call failed:', error);
    throw new ApiError(503, 'Biosignal service unavailable');
  }
}

/**
 * POST /api/biosignal/generate
 * Generate biosignal data for a participant
 */
export async function generateBiosignal(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { participantId, metrics, platform, cognitiveLoadScore: providedScore } = req.body;

    if (!participantId) {
      throw new ApiError(400, 'participantId is required');
    }

    // Calculate cognitive load from metrics or use provided score
    let cognitiveLoadScore: number;
    
    if (providedScore !== undefined) {
      cognitiveLoadScore = Number(providedScore);
    } else if (metrics) {
      cognitiveLoadScore = calculateCognitiveLoad(metrics);
    } else {
      throw new ApiError(400, 'Either cognitiveLoadScore or metrics is required');
    }

    if (cognitiveLoadScore < 0 || cognitiveLoadScore > 100) {
      throw new ApiError(400, 'cognitiveLoadScore must be between 0 and 100');
    }

    // Check cache first
    const cacheKey = getCacheKey(participantId, cognitiveLoadScore);
    const cached = await getCache<BiosignalData>(cacheKey);
    
    if (cached) {
      console.log(`Cache hit for ${cacheKey}`);
      res.json({
        success: true,
        data: cached,
        cached: true,
      });
      return;
    }

    // Call Python service
    const biosignalData = await callBiosignalService('/api/biosignal/generate', {
      cognitiveLoadScore,
      participantId,
      platform: platform || 'unknown',
      numPoints: 50,
    });

    // Cache the result
    await setCache(cacheKey, biosignalData, CACHE_TTL);

    res.json({
      success: true,
      data: biosignalData,
      cached: false,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/biosignal/timeline
 * Generate only cognitive load timeline (lighter endpoint)
 */
export async function generateTimeline(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { cognitiveLoadScore, numPoints = 50 } = req.body;

    if (cognitiveLoadScore === undefined) {
      throw new ApiError(400, 'cognitiveLoadScore is required');
    }

    const data = await callBiosignalService('/api/biosignal/timeline', {
      cognitiveLoadScore: Number(cognitiveLoadScore),
      numPoints,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/biosignal/brainwaves
 * Generate only brainwave patterns (lighter endpoint)
 */
export async function generateBrainwaves(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { cognitiveLoadScore, numPoints = 50 } = req.body;

    if (cognitiveLoadScore === undefined) {
      throw new ApiError(400, 'cognitiveLoadScore is required');
    }

    const data = await callBiosignalService('/api/biosignal/brainwaves', {
      cognitiveLoadScore: Number(cognitiveLoadScore),
      numPoints,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/biosignal/batch
 * Generate biosignal data for multiple participants
 */
export async function generateBatch(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { participants } = req.body;

    if (!Array.isArray(participants) || participants.length === 0) {
      throw new ApiError(400, 'participants array is required');
    }

    if (participants.length > 50) {
      throw new ApiError(400, 'Maximum 50 participants per batch');
    }

    const data = await callBiosignalService('/api/biosignal/batch', {
      participants,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/biosignal/:participantId
 * Get cached biosignal data for a participant
 */
export async function getCachedBiosignal(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { participantId } = req.params;
    const cognitiveLoadScore = Number(req.query.cognitiveLoadScore || 50);

    const cacheKey = getCacheKey(participantId, cognitiveLoadScore);
    const cached = await getCache<BiosignalData>(cacheKey);

    if (!cached) {
      throw new ApiError(404, 'No cached biosignal data found for this participant');
    }

    res.json({
      success: true,
      data: cached,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/biosignal/health
 * Check biosignal service health
 */
export async function checkHealth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const url = `${BIOSIGNAL_SERVICE_URL}/health`;
    
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error('Service unhealthy');
    }

    const healthData = await response.json();

    res.json({
      success: true,
      biosignalService: healthData,
    });
  } catch (error) {
    res.json({
      success: false,
      biosignalService: {
        status: 'unavailable',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
