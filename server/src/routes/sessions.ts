/**
 * Session Routes
 * 
 * Phase 2: Database Integration - Research Session Management
 * Handles CRUD operations for research sessions with Supabase
 * 
 * @see docs/DATABASE_PLAN.md
 */

import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/sessions
 * Create new research session
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { platform, topic } = req.body;
    
    console.log('[CREATE_SESSION] Request:', { userId, platform, topic });
    
    // Validate input
    if (!platform || !topic) {
      console.log('[CREATE_SESSION] Validation failed: Missing fields');
      return res.status(400).json({ error: 'Platform and topic are required' });
    }
    
    if (!['chatgpt', 'google'].includes(platform)) {
      console.log('[CREATE_SESSION] Invalid platform:', platform);
      return res.status(400).json({ error: 'Platform must be either "chatgpt" or "google"' });
    }
    
    console.log('[CREATE_SESSION] Inserting session into database...');
    // Create session
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .insert({
        participant_id: userId,
        platform,
        topic,
        current_phase: 'research',
        research_data: {},
      })
      .select()
      .single();
    
    if (error) {
      console.error('[CREATE_SESSION] Database error:', error);
      return res.status(500).json({ error: 'Failed to create session' });
    }
    
    console.log('[CREATE_SESSION] Session created:', data.id);
    res.status(201).json(data);
  } catch (error) {
    console.error('[CREATE_SESSION] Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/sessions
 * List user's sessions
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    console.log('[LIST_SESSIONS] Request for user:', userId);
    
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select(`
        *,
        cognitive_load_metrics (
          overall_score,
          category
        )
      `)
      .eq('participant_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[LIST_SESSIONS] Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }
    
    console.log('[LIST_SESSIONS] Found', data.length, 'sessions');
    res.json({ sessions: data });
  } catch (error) {
    console.error('[LIST_SESSIONS] Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/sessions/:id
 * Get session by ID with all related data
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    // Get session with related data
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select(`
        *,
        assessment_responses (*),
        creativity_responses (*),
        cognitive_load_metrics (*)
      `)
      .eq('id', id)
      .single();
    
    if (sessionError) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Verify ownership (unless admin)
    if (session.participant_id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({ session });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/sessions/:id
 * Update session
 */
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updates = req.body;
    
    console.log('[UPDATE_SESSION] Request:', { sessionId: id, userId, updates });
    
    // Verify ownership
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('sessions')
      .select('participant_id')
      .eq('id', id)
      .single();
    
    if (checkError || !existing) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (existing.participant_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Update session
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('[UPDATE_SESSION] Database error:', error);
      return res.status(500).json({ error: 'Failed to update session' });
    }
    
    console.log('[UPDATE_SESSION] Session updated successfully:', data.id);
    res.json({ session: data });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/sessions/all (Admin only)
 * Get all sessions across all participants
 */
router.get('/admin/all', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select(`
        *,
        participants (id, name, email),
        cognitive_load_metrics (overall_score, category)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Admin list sessions error:', error);
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }
    
    res.json({ sessions: data });
  } catch (error) {
    console.error('Admin get sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
