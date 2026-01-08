/**
 * Interaction Events Routes
 * 
 * Phase 2: Database Integration
 * Handles high-volume behavioral tracking events
 */

import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/interactions/batch
 * Batch insert interaction events (optimized for high volume)
 */
router.post('/batch', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, events } = req.body;
    const userId = req.user?.id;
    
    console.log('[BATCH_INTERACTIONS] Request:', { sessionId, userId, eventCount: events?.length });
    
    // Validate input
    if (!sessionId || !Array.isArray(events) || events.length === 0) {
      console.log('[BATCH_INTERACTIONS] Validation failed:', { sessionId, eventsLength: events?.length });
      return res.status(400).json({ error: 'Session ID and events array required' });
    }
    
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
    
    // Prepare batch insert
    const eventsToInsert = events.map((event: any) => ({
      session_id: sessionId,
      type: event.type || event.event_type,
      timestamp: event.timestamp || new Date().toISOString(),
      platform: event.platform,
      data: event.data || {},
    }));
    
    console.log('[BATCH_INTERACTIONS] Prepared events:', { count: eventsToInsert.length, sample: eventsToInsert[0] });
    
    // Insert in batches (Supabase recommends max 1000 per batch)
    const batchSize = 1000;
    let inserted = 0;
    
    for (let i = 0; i < eventsToInsert.length; i += batchSize) {
      const batch = eventsToInsert.slice(i, i + batchSize);
      
      const { error } = await supabaseAdmin
        .from('interaction_events')
        .insert(batch);
      
      if (error) {
        console.error('[BATCH_INTERACTIONS] Database error:', error);
        return res.status(500).json({ 
          error: 'Failed to insert events',
          inserted,
          failed: eventsToInsert.length - inserted,
        });
      }
      
      inserted += batch.length;
    }
    
    console.log('[BATCH_INTERACTIONS] Events inserted successfully:', inserted);
    res.status(201).json({ 
      message: 'Events inserted successfully',
      count: inserted,
    });
  } catch (error) {
    console.error('Batch insert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/interactions/:sessionId
 * Get all interaction events for a session
 */
router.get('/:sessionId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;
    const { type, limit = 1000, offset = 0 } = req.query;
    
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
    
    // Build query
    let query = supabaseAdmin
      .from('interaction_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })
      .range(Number(offset), Number(offset) + Number(limit) - 1);
    
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Get interactions error:', error);
      return res.status(500).json({ error: 'Failed to fetch interactions' });
    }
    
    res.json({ 
      events: data,
      count: data.length,
      offset: Number(offset),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Get interactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/interactions/:sessionId/summary
 * Get interaction event summary/statistics
 */
router.get('/:sessionId/summary', authenticate, async (req: AuthRequest, res: Response) => {
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
    
    // Get aggregated statistics
    const { data, error } = await supabaseAdmin
      .rpc('get_session_statistics', { p_session_id: sessionId });
    
    if (error) {
      console.error('Get summary error:', error);
      return res.status(500).json({ error: 'Failed to get summary' });
    }
    
    res.json({ summary: data });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
