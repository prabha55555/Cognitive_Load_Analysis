/**
 * Assessment & Creativity Routes
 * 
 * Phase 2: Database Integration
 * Handles assessment responses, creativity responses, and cognitive load metrics
 * 
 * @see docs/DATABASE_PLAN.md
 */

import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/assessments/responses
 * Save assessment response
 */
router.post('/responses', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { sessionId, questionId, questionText, difficulty, answerIndex, isCorrect, score, earnedPoints, startTime, endTime, confidenceLevel } = req.body;
    
    // Verify session ownership
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('participant_id')
      .eq('id', sessionId)
      .single();
    
    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.participant_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Insert assessment response
    const { data, error } = await supabaseAdmin
      .from('assessment_responses')
      .insert({
        session_id: sessionId,
        question_id: questionId,
        question_text: questionText,
        difficulty,
        answer_index: answerIndex,
        is_correct: isCorrect,
        score,
        earned_points: earnedPoints,
        start_time: startTime,
        end_time: endTime,
        confidence_level: confidenceLevel,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Save assessment error:', error);
      return res.status(500).json({ error: 'Failed to save assessment response' });
    }
    
    res.status(201).json({ response: data });
  } catch (error) {
    console.error('Save assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/assessments/:sessionId
 * Get all assessment responses for a session
 */
router.get('/:sessionId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;
    
    // Verify session ownership
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('participant_id')
      .eq('id', sessionId)
      .single();
    
    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.participant_id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { data, error } = await supabaseAdmin
      .from('assessment_responses')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Get assessments error:', error);
      return res.status(500).json({ error: 'Failed to fetch assessments' });
    }
    
    res.json({ responses: data });
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/assessments/creativity
 * Save creativity response
 */
router.post('/creativity', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { sessionId, questionId, questionText, responseText, scores, aiFeedback, timeTaken } = req.body;
    
    // Verify session ownership
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('participant_id')
      .eq('id', sessionId)
      .single();
    
    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.participant_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Insert creativity response
    const { data, error } = await supabaseAdmin
      .from('creativity_responses')
      .insert({
        session_id: sessionId,
        question_id: questionId,
        question_text: questionText,
        response_text: responseText,
        overall_score: scores?.overall,
        relevance_score: scores?.relevance,
        creativity_score: scores?.creativity,
        depth_score: scores?.depth,
        coherence_score: scores?.coherence,
        time_efficiency_score: scores?.timeEfficiency,
        ai_feedback: aiFeedback,
        time_taken: timeTaken,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Save creativity error:', error);
      return res.status(500).json({ error: 'Failed to save creativity response' });
    }
    
    res.status(201).json({ response: data });
  } catch (error) {
    console.error('Save creativity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/assessments/creativity/:sessionId
 * Get all creativity responses for a session
 */
router.get('/creativity/:sessionId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;
    
    // Verify session ownership
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('participant_id')
      .eq('id', sessionId)
      .single();
    
    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.participant_id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { data, error } = await supabaseAdmin
      .from('creativity_responses')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Get creativity responses error:', error);
      return res.status(500).json({ error: 'Failed to fetch creativity responses' });
    }
    
    res.json({ responses: data });
  } catch (error) {
    console.error('Get creativity responses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/assessments/cognitive-load
 * Save cognitive load metrics
 */
router.post('/cognitive-load', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { sessionId, overallScore, category, assessmentScore, behavioralScore, blendedScore, behavioralFeatures, source } = req.body;
    
    // Verify session ownership
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('participant_id')
      .eq('id', sessionId)
      .single();
    
    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.participant_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Insert or update cognitive load metrics (upsert)
    const { data, error } = await supabaseAdmin
      .from('cognitive_load_metrics')
      .upsert({
        session_id: sessionId,
        overall_score: overallScore,
        category,
        assessment_score: assessmentScore,
        behavioral_score: behavioralScore,
        blended_score: blendedScore,
        behavioral_features: behavioralFeatures,
        source,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Save cognitive load error:', error);
      return res.status(500).json({ error: 'Failed to save cognitive load metrics' });
    }
    
    res.status(201).json({ metrics: data });
  } catch (error) {
    console.error('Save cognitive load error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/assessments/cognitive-load/:sessionId
 * Get cognitive load metrics for a session
 */
router.get('/cognitive-load/:sessionId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;
    
    // Verify session ownership
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('participant_id')
      .eq('id', sessionId)
      .single();
    
    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.participant_id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { data, error } = await supabaseAdmin
      .from('cognitive_load_metrics')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Get cognitive load error:', error);
      return res.status(500).json({ error: 'Failed to fetch cognitive load metrics' });
    }
    
    res.json({ metrics: data || null });
  } catch (error) {
    console.error('Get cognitive load error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
