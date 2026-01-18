/**
 * Behavioral Analysis Routes
 * 
 * Phase 4: Behavioral Analysis Integration
 * Routes for interacting with the Python behavioral analysis microservice
 * and storing/retrieving behavioral predictions
 */

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import axios from 'axios';

const router = Router();

// Apply authentication to all behavioral routes
router.use(authenticate);

const BEHAVIORAL_SERVICE_URL = process.env.BEHAVIORAL_SERVICE_URL || 'http://localhost:8000';
const BEHAVIORAL_SERVICE_TIMEOUT = parseInt(process.env.BEHAVIORAL_SERVICE_TIMEOUT || '5000');

/**
 * POST /api/behavioral/analyze
 * Send interaction batch to Python service for cognitive load prediction
 */
router.post('/analyze', async (req: AuthRequest, res: Response) => {
  try {
    // Support both formats: frontend sends session_id/events, we need sessionId/interactions
    const sessionId = req.body.sessionId || req.body.session_id;
    const interactions = req.body.interactions || req.body.events;
    const participantId = req.body.participant_id;
    const platform = req.body.platform;

    if (!sessionId || !interactions || !Array.isArray(interactions)) {
      console.error('[BEHAVIORAL] Invalid request body:', {
        hasSessionId: !!sessionId,
        hasInteractions: !!interactions,
        isArray: Array.isArray(interactions),
        body: req.body
      });
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId (or session_id) and interactions (or events) array' 
      });
    }

    console.log(`[BEHAVIORAL] Analyzing ${interactions.length} interactions for session:`, sessionId);

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('id, participant_id')
      .eq('id', sessionId)
      .eq('participant_id', req.user!.id)
      .single();

    // If session doesn't exist, skip processing (likely login page interactions with temporary session ID)
    if (sessionError || !session) {
      console.log('[BEHAVIORAL] Session not found - skipping behavioral analysis for temporary session');
      return res.json({
        prediction: null,
        stored: false,
        message: 'Session not found - interactions tracked but not analyzed'
      });
    }

    // Forward to Python behavioral analysis service
    try {
      const response = await axios.post(
        `${BEHAVIORAL_SERVICE_URL}/classify`,
        {
          session_id: sessionId,
          participant_id: participantId || req.user!.id,
          platform: platform || 'unknown',
          events: interactions  // Python expects 'events', not 'interactions'
        },
        {
          timeout: BEHAVIORAL_SERVICE_TIMEOUT,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const prediction = response.data;

      // Store prediction in database
      const { data: storedPrediction, error: insertError } = await supabaseAdmin
        .from('behavioral_predictions')
        .insert({
          session_id: sessionId,
          predicted_load_category: prediction.category,
          predicted_load_score: prediction.score,
          confidence_score: prediction.confidence,
          features: prediction.features || {},
          prediction_method: prediction.method || 'rule-based'
        })
        .select()
        .single();

      if (insertError) {
        console.error('[BEHAVIORAL] Error storing prediction:', insertError);
        // Still return prediction even if storage fails
        return res.json({ 
          prediction,
          stored: false,
          error: 'Failed to store prediction'
        });
      }

      console.log('[BEHAVIORAL] Prediction stored:', storedPrediction.id);

      res.json({
        prediction,
        stored: true,
        predictionId: storedPrediction.id
      });

    } catch (serviceError: any) {
      console.error('[BEHAVIORAL] Python service error:', serviceError.message);
      
      if (serviceError.code === 'ECONNREFUSED') {
        return res.status(503).json({ 
          error: 'Behavioral analysis service unavailable',
          details: 'Python microservice is not running'
        });
      }

      if (serviceError.code === 'ETIMEDOUT' || serviceError.code === 'ECONNABORTED') {
        return res.status(504).json({ 
          error: 'Behavioral analysis timeout',
          details: 'Service took too long to respond'
        });
      }

      return res.status(502).json({ 
        error: 'Behavioral analysis failed',
        details: serviceError.message
      });
    }

  } catch (error) {
    console.error('[BEHAVIORAL] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/behavioral/interactions
 * Store batch of interaction events
 */
router.post('/interactions', async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, interactions } = req.body;

    if (!sessionId || !interactions || !Array.isArray(interactions)) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId and interactions array' 
      });
    }

    console.log(`[BEHAVIORAL] Storing ${interactions.length} interactions for session:`, sessionId);

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('id, participant_id')
      .eq('id', sessionId)
      .eq('participant_id', req.user!.id)
      .single();

    if (sessionError || !session) {
      console.error('[BEHAVIORAL] Session not found or unauthorized');
      return res.status(404).json({ error: 'Session not found' });
    }

    // Transform interactions for database insertion
    const interactionsToInsert = interactions.map((interaction: any) => ({
      session_id: sessionId,
      participant_id: req.user!.id,
      interaction_type: interaction.type,
      timestamp: interaction.timestamp || new Date().toISOString(),
      details: interaction.details || {},
      event_count: interaction.count || 1,
      duration_ms: interaction.duration
    }));

    // Batch insert interactions
    const { data: insertedInteractions, error: insertError } = await supabaseAdmin
      .from('interactions')
      .insert(interactionsToInsert)
      .select();

    if (insertError) {
      console.error('[BEHAVIORAL] Error storing interactions:', insertError);
      return res.status(500).json({ error: 'Failed to store interactions' });
    }

    console.log(`[BEHAVIORAL] Stored ${insertedInteractions.length} interactions`);

    res.json({
      stored: insertedInteractions.length,
      interactions: insertedInteractions
    });

  } catch (error) {
    console.error('[BEHAVIORAL] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/behavioral/predictions/:sessionId
 * Get all predictions for a session
 */
router.get('/predictions/:sessionId', async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;

    console.log('[BEHAVIORAL] Fetching predictions for session:', sessionId);

    // Verify session belongs to user or user is admin
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('id, participant_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('[BEHAVIORAL] Session not found');
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check authorization
    if (session.participant_id !== req.user!.id && req.user!.role !== 'admin') {
      console.error('[BEHAVIORAL] Unauthorized access attempt');
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Fetch predictions
    const { data: predictions, error: predictionsError } = await supabaseAdmin
      .from('behavioral_predictions')
      .select('*')
      .eq('session_id', sessionId)
      .order('prediction_timestamp', { ascending: true });

    if (predictionsError) {
      console.error('[BEHAVIORAL] Error fetching predictions:', predictionsError);
      return res.status(500).json({ error: 'Failed to fetch predictions' });
    }

    console.log(`[BEHAVIORAL] Found ${predictions.length} predictions`);

    res.json({ predictions });

  } catch (error) {
    console.error('[BEHAVIORAL] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/behavioral/health
 * Check if Python behavioral service is healthy
 */
router.get('/health', async (req: AuthRequest, res: Response) => {
  try {
    console.log('[BEHAVIORAL] Checking service health');

    const response = await axios.get(
      `${BEHAVIORAL_SERVICE_URL}/health`,
      { timeout: 3000 }
    );

    res.json({
      status: 'healthy',
      service: response.data,
      url: BEHAVIORAL_SERVICE_URL
    });

  } catch (error: any) {
    console.error('[BEHAVIORAL] Health check failed:', error.message);
    
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      url: BEHAVIORAL_SERVICE_URL
    });
  }
});

export default router;
