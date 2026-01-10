/**
 * Admin Routes
 * 
 * Phase 3: Admin Dashboard
 * Provides admin-only endpoints for viewing all participant data and analytics
 */

import { Router, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply authentication and admin check to all routes
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/participants
 * Get all participants with their session counts and latest activity
 */
router.get('/participants', async (req: AuthRequest, res: Response) => {
  try {
    console.log('[ADMIN] Fetching all participants');
    
    const { data: participants, error } = await supabaseAdmin
      .from('participants')
      .select(`
        *,
        sessions (count)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[ADMIN] Error fetching participants:', error);
      return res.status(500).json({ error: 'Failed to fetch participants' });
    }
    
    console.log('[ADMIN] Found', participants.length, 'participants');
    res.json({ participants });
  } catch (error) {
    console.error('[ADMIN] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/sessions
 * Get all sessions with participant info and cognitive load metrics
 */
router.get('/sessions', async (req: AuthRequest, res: Response) => {
  try {
    console.log('[ADMIN] Fetching all sessions');
    
    const { data: sessions, error } = await supabaseAdmin
      .from('sessions')
      .select(`
        *,
        participants (
          id,
          email,
          name,
          role
        ),
        cognitive_load_metrics (
          overall_score,
          category,
          assessment_score,
          behavioral_score,
          blended_score,
          source
        ),
        interaction_events (count),
        assessment_responses (count),
        creativity_responses (count)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[ADMIN] Error fetching sessions:', error);
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }
    
    console.log('[ADMIN] Found', sessions.length, 'sessions');
    res.json({ sessions });
  } catch (error) {
    console.error('[ADMIN] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/analytics
 * Get aggregated analytics and statistics
 */
router.get('/analytics', async (req: AuthRequest, res: Response) => {
  try {
    console.log('[ADMIN] Generating analytics');
    
    // Get overview statistics
    const [
      participantsResult,
      sessionsResult,
      cognitiveLoadResult,
      platformStatsResult
    ] = await Promise.all([
      // Total participants
      supabaseAdmin
        .from('participants')
        .select('id', { count: 'exact', head: true }),
      
      // Total sessions
      supabaseAdmin
        .from('sessions')
        .select('id, current_phase', { count: 'exact' }),
      
      // Cognitive load metrics
      supabaseAdmin
        .from('cognitive_load_metrics')
        .select('overall_score, category, source'),
      
      // Platform distribution
      supabaseAdmin
        .from('sessions')
        .select('platform, current_phase, start_time, end_time')
    ]);
    
    if (participantsResult.error || sessionsResult.error || 
        cognitiveLoadResult.error || platformStatsResult.error) {
      console.error('[ADMIN] Error fetching analytics data');
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }
    
    // Calculate overview metrics
    const totalParticipants = participantsResult.count || 0;
    const totalSessions = sessionsResult.count || 0;
    const activeSessions = sessionsResult.data?.filter(s => 
      s.current_phase !== 'completed'
    ).length || 0;
    
    // Calculate average cognitive load
    const cognitiveMetrics = cognitiveLoadResult.data || [];
    const avgCognitiveLoad = cognitiveMetrics.length > 0
      ? Math.round(
          cognitiveMetrics.reduce((sum, m) => sum + m.overall_score, 0) / 
          cognitiveMetrics.length
        )
      : 0;
    
    // Cognitive load distribution by category
    const cognitiveLoadDistribution = {
      low: cognitiveMetrics.filter(m => m.category === 'low').length,
      moderate: cognitiveMetrics.filter(m => m.category === 'moderate').length,
      high: cognitiveMetrics.filter(m => m.category === 'high').length,
      'very-high': cognitiveMetrics.filter(m => m.category === 'very-high').length,
    };
    
    // Platform comparison
    const platformSessions = platformStatsResult.data || [];
    const platformStats = ['chatgpt', 'google'].map(platform => {
      const platformData = platformSessions.filter(s => s.platform === platform);
      const completedSessions = platformData.filter(s => s.current_phase === 'completed');
      
      // Calculate average session duration for completed sessions
      const durations = completedSessions
        .filter(s => s.start_time && s.end_time)
        .map(s => {
          const start = new Date(s.start_time).getTime();
          const end = new Date(s.end_time).getTime();
          return (end - start) / 60000; // Convert to minutes
        });
      
      const avgDuration = durations.length > 0
        ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
        : 0;
      
      return {
        platform,
        totalSessions: platformData.length,
        completedSessions: completedSessions.length,
        completionRate: platformData.length > 0
          ? Math.round((completedSessions.length / platformData.length) * 100)
          : 0,
        avgSessionDuration: avgDuration,
      };
    });
    
    // Source distribution (where cognitive load came from)
    const sourceDistribution = cognitiveMetrics.reduce((acc, m) => {
      acc[m.source] = (acc[m.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const analytics = {
      overview: {
        totalParticipants,
        totalSessions,
        activeSessions,
        completedSessions: totalSessions - activeSessions,
        avgCognitiveLoad,
      },
      cognitiveLoad: {
        distribution: cognitiveLoadDistribution,
        sourceDistribution,
        totalMetrics: cognitiveMetrics.length,
      },
      platforms: platformStats,
      generatedAt: new Date().toISOString(),
    };
    
    console.log('[ADMIN] Analytics generated successfully');
    res.json({ analytics });
  } catch (error) {
    console.error('[ADMIN] Error generating analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/sessions/:id
 * Get detailed session data including all interactions, responses, and metrics
 */
router.get('/sessions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    console.log('[ADMIN] Fetching detailed session:', id);
    
    const [sessionResult, interactionsResult, assessmentsResult, creativityResult] = 
      await Promise.all([
        // Session with participant and cognitive load
        supabaseAdmin
          .from('sessions')
          .select(`
            *,
            participants (
              id,
              email,
              name,
              role,
              demographic_data
            ),
            cognitive_load_metrics (*)
          `)
          .eq('id', id)
          .single(),
        
        // Interaction events
        supabaseAdmin
          .from('interaction_events')
          .select('*')
          .eq('session_id', id)
          .order('timestamp', { ascending: true }),
        
        // Assessment responses
        supabaseAdmin
          .from('assessment_responses')
          .select('*')
          .eq('session_id', id)
          .order('created_at', { ascending: true }),
        
        // Creativity responses
        supabaseAdmin
          .from('creativity_responses')
          .select('*')
          .eq('session_id', id)
          .order('created_at', { ascending: true }),
      ]);
    
    if (sessionResult.error) {
      console.error('[ADMIN] Session not found:', sessionResult.error);
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const sessionDetails = {
      session: sessionResult.data,
      interactions: interactionsResult.data || [],
      assessments: assessmentsResult.data || [],
      creativity: creativityResult.data || [],
      stats: {
        totalInteractions: (interactionsResult.data || []).length,
        totalAssessments: (assessmentsResult.data || []).length,
        totalCreativity: (creativityResult.data || []).length,
      }
    };
    
    console.log('[ADMIN] Session details retrieved successfully');
    res.json(sessionDetails);
  } catch (error) {
    console.error('[ADMIN] Error fetching session details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
