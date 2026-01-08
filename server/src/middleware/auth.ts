/**
 * Authentication Middleware
 * 
 * Phase 2: Database Integration - Supabase Auth
 * Validates JWT tokens from Supabase Auth and enforces RLS
 * 
 * @see docs/DATABASE_PLAN.md
 */

import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  token?: string;
}

/**
 * Middleware to authenticate user from Supabase JWT token
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log('[AUTH] Authentication attempt for:', req.method, req.path);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[AUTH] Missing or invalid authorization header');
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    req.token = token;
    
    console.log('[AUTH] Verifying token with Supabase...');
    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      console.error('[AUTH] Token verification failed:', error?.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    console.log('[AUTH] Token valid, user ID:', user.id);
    console.log('[AUTH] Fetching participant from database...');
    
    // Get participant details from database
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('participants')
      .select('id, email, name, role')
      .eq('id', user.id)
      .single();
    
    if (participantError || !participant) {
      console.error('[AUTH] Participant not found:', participantError);
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    console.log('[AUTH] Participant authenticated:', participant.email);
    
    // Attach user to request
    req.user = {
      id: participant.id,
      email: participant.email,
      role: participant.role,
    };
    
    next();
  } catch (error) {
    console.error('[AUTH] Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Check if user has required role
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

/**
 * Require admin role
 */
export const requireAdmin = requireRole('admin');
