/**
 * Authentication Routes
 * 
 * Phase 2: Database Integration
 * Handles user authentication with Supabase
 * Updated: 2026-01-08 - Fixed auth flow with proper admin methods
 */

import { Router, Request, Response } from 'express';
import { supabaseAdmin, createUserSupabaseClient } from '../config/supabase';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/signup
 * Register new participant
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    
    console.log('[SIGNUP] Request received:', { email, name });
    
    // Validate input
    if (!email || !password || !name) {
      console.log('[SIGNUP] Validation failed: Missing required fields');
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    
    console.log('[SIGNUP] Creating user in Supabase Auth...');
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for research study
      user_metadata: {
        name,
        role: 'participant',
      },
    });
    
    if (authError) {
      console.error('[SIGNUP] Auth error:', authError);
      return res.status(400).json({ error: authError.message });
    }
    
    if (!authData.user) {
      console.error('[SIGNUP] No user returned from Auth');
      return res.status(500).json({ error: 'Failed to create user' });
    }
    
    console.log('[SIGNUP] Auth user created:', authData.user.id);
    console.log('[SIGNUP] Inserting participant record...');
    
    // Create participant record in database
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('participants')
      .insert({
        id: authData.user.id,
        email,
        name,
        role: 'participant',
      })
      .select()
      .single();
    
    if (participantError) {
      console.error('[SIGNUP] Participant creation error:', {
        code: participantError.code,
        message: participantError.message,
        details: participantError.details,
        hint: participantError.hint,
      });
      // Rollback: delete auth user
      console.log('[SIGNUP] Rolling back auth user...');
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: 'Failed to create participant record' });
    }
    
    console.log('[SIGNUP] Participant created successfully:', participant.id);
    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: participant.id,
        email: participant.email,
        name: participant.name,
        role: participant.role,
      },
    });
  } catch (error) {
    console.error('[SIGNUP] Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/signin
 * Sign in existing user
 */
router.post('/signin', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    console.log('[SIGNIN] Request received:', { email });
    
    // Validate input
    if (!email || !password) {
      console.log('[SIGNIN] Validation failed: Missing credentials');
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    console.log('[SIGNIN] Creating user-specific Supabase client for authentication...');
    
    // Create a user-specific client to authenticate (admin client can't sign in)
    const userClient = createUserSupabaseClient();
    
    // Authenticate with user credentials
    const { data, error } = await userClient.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('[SIGNIN] Auth error:', {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!data.user || !data.session) {
      console.error('[SIGNIN] No user or session returned from auth');
      return res.status(401).json({ error: 'Authentication failed' });
    }
    
    console.log('[SIGNIN] Auth successful, user ID:', data.user.id);
    console.log('[SIGNIN] Fetching participant record from database...');
    
    // Get participant details using admin client (bypasses RLS)
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('participants')
      .select('id, email, name, role')
      .eq('id', data.user.id)
      .single();
    
    if (participantError) {
      console.error('[SIGNIN] Participant fetch error:', {
        code: participantError.code,
        message: participantError.message,
        details: participantError.details,
        hint: participantError.hint,
        userId: data.user.id,
      });
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    if (!participant) {
      console.error('[SIGNIN] Participant is null for user:', data.user.id);
      return res.status(404).json({ error: 'Participant record missing' });
    }
    
    console.log('[SIGNIN] Participant found:', {
      id: participant.id,
      email: participant.email,
      role: participant.role,
    });
    
    res.json({
      message: 'Signed in successfully',
      user: participant,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (error) {
    console.error('[SIGNIN] Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/signout
 * Sign out current user
 * Note: Client-side should handle token cleanup
 */
router.post('/signout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // With admin client, we just confirm the user is authenticated
    // The actual token revocation happens on the client side
    // or we can use admin.deleteSession if we have the session ID
    
    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log('[GET_ME] Request received for user:', req.user?.id);
    
    if (!req.user) {
      console.log('[GET_ME] No user in request');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { data: participant, error } = await supabaseAdmin
      .from('participants')
      .select('id, email, name, role, created_at')
      .eq('id', req.user.id)
      .single();
    
    if (error || !participant) {
      console.error('[GET_ME] Error fetching user:', error);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('[GET_ME] User found:', participant.email);
    res.json({ user: participant });
  } catch (error) {
    console.error('[GET_ME] Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;
    
    console.log('[REFRESH] Token refresh requested');
    
    if (!refresh_token) {
      console.log('[REFRESH] No refresh token provided');
      return res.status(400).json({ error: 'Refresh token required' });
    }
    
    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token,
    });
    
    if (error) {
      console.error('[REFRESH] Refresh error:', error.message);
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    console.log('[REFRESH] Token refreshed successfully');
    res.json({
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at,
      },
    });
  } catch (error) {
    console.error('[REFRESH] Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
