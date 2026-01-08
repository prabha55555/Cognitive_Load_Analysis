/**
 * Supabase Client Configuration (Backend)
 * 
 * Phase 2: Database Integration
 * Provides admin-level Supabase client for backend operations
 * 
 * @see docs/DATABASE_PLAN.md
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please check server/.env file.');
}

/**
 * Admin Supabase client
 * - Uses service role key (bypasses RLS)
 * - For backend operations only
 * - NEVER expose this to frontend!
 */
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'cognitive-load-analysis-backend',
    },
  },
});

/**
 * Create user-scoped Supabase client
 * - Respects Row-Level Security (RLS)
 * - Use this when you want to enforce user permissions
 * 
 * @param userToken - Optional JWT token from authenticated user
 */
export const createUserSupabaseClient = (userToken?: string): SupabaseClient => {
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseAnonKey) {
    throw new Error('Missing SUPABASE_ANON_KEY in environment variables');
  }
  
  const config: any = {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
    },
  };
  
  if (userToken) {
    config.global = {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    };
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, config);
};

/**
 * Check if database connection is healthy
 */
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabaseAdmin
      .from('participants')
      .select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') { // Table doesn't exist yet
      console.error('Database connection failed:', error);
      return false;
    }
    
    console.log('✅ Supabase database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error);
    return false;
  }
};

export default supabaseAdmin;
