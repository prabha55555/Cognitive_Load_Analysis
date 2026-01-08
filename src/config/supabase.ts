/**
 * Supabase Client Configuration (Frontend)
 * 
 * Phase 2: Database Integration
 * Provides authenticated Supabase client for frontend operations
 * 
 * @see docs/DATABASE_PLAN.md
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('Missing Supabase configuration. Please check your .env file.');
  throw new Error('Supabase configuration is missing');
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  logger.error('Invalid Supabase URL format');
  throw new Error('Invalid Supabase URL. Expected format: https://xxxxx.supabase.co');
}

/**
 * Supabase client instance
 * - Automatically handles authentication with JWT tokens
 * - Respects Row-Level Security (RLS) policies
 * - Safe for frontend use (uses anon key)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'cognitive-load-analysis-frontend',
    },
  },
});

/**
 * Check if Supabase connection is healthy
 */
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('participants').select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet (OK during setup)
      logger.error('Supabase connection failed:', error);
      return false;
    }
    
    logger.info('Supabase connection successful');
    return true;
  } catch (error) {
    logger.error('Failed to connect to Supabase:', error);
    return false;
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    logger.error('Failed to get current user:', error);
    return null;
  }
  
  return user;
};

/**
 * Sign in with email and password
 */
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    logger.error('Sign in failed:', error);
    throw error;
  }
  
  return data;
};

/**
 * Sign up new user
 */
export const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  
  if (error) {
    logger.error('Sign up failed:', error);
    throw error;
  }
  
  return data;
};

/**
 * Sign out current user
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    logger.error('Sign out failed:', error);
    throw error;
  }
};

export default supabase;
