/**
 * Authentication Service
 * 
 * TODO: Implement authentication API calls
 * - Login/logout
 * - Registration
 * - Token refresh
 * - Password reset
 * 
 * Related Flaw: Module 1 - No Real Authentication System (CRITICAL)
 * @see docs/FLAWS_AND_ISSUES.md
 */

import { apiClient } from './apiClient';
import { AuthError } from '../utils/errorHandler';
import { supabase } from '../config/supabase';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'participant' | 'admin';
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'participant' | 'admin';
  };
  access_token: string;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

class AuthService {
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';

  /**
   * Sign in user
   */
  async signin(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/signin', {
        email,
        password
      });
      
      const token = response.data.session?.access_token || response.data.access_token;
      this.setToken(token);
      apiClient.setAuthToken(token);
      
      return response.data;
    } catch (error: any) {
      throw new AuthError(error.response?.data?.error || 'Sign in failed');
    }
  }

  /**
   * Sign up new user
   */
  async signup(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/signup', {
        email,
        password,
        name
      });
      
      // Try multiple token locations (backend now returns 'token' field)
      const token = (response.data as any).token || response.data.session?.access_token || response.data.access_token;
      
      if (token) {
        this.setToken(token);
        apiClient.setAuthToken(token);
      } else {
        console.warn('[AUTH] Signup successful but no token returned - user will need to sign in manually');
      }
      
      return response.data;
    } catch (error: any) {
      // Extract error message and code from ApiError
      const errorMessage = error.message || 'Sign up failed';
      const errorCode = error.code || 'SIGNUP_ERROR';
      throw new AuthError(errorMessage, errorCode);
    }
  }

  /**
   * Sign in with Google OAuth using Supabase
   */
  async signInWithGoogle(): Promise<void> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        throw new AuthError(error.message, 'GOOGLE_AUTH_ERROR');
      }
      
      // The redirect will happen automatically
    } catch (error: any) {
      console.error('[AUTH] Google sign-in error:', error);
      throw new AuthError(error.message || 'Google sign-in failed', 'GOOGLE_AUTH_ERROR');
    }
  }

  /**
   * Handle OAuth callback - exchange code for session
   */
  async handleOAuthCallback(): Promise<AuthResponse | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw new AuthError(error.message, 'OAUTH_CALLBACK_ERROR');
      }
      
      if (session) {
        this.setToken(session.access_token);
        apiClient.setAuthToken(session.access_token);
        
        // Get or create participant record
        const { data: participant } = await supabase
          .from('participants')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        // If no participant record, create one
        if (!participant) {
          const userName = session.user.user_metadata?.full_name || 
                          session.user.user_metadata?.name || 
                          session.user.email?.split('@')[0] || 
                          'User';
                          
          await supabase.from('participants').insert({
            id: session.user.id,
            email: session.user.email,
            name: userName,
            role: 'participant',
          });
        }
        
        return {
          user: {
            id: session.user.id,
            email: session.user.email!,
            name: participant?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            role: participant?.role || 'participant',
          },
          access_token: session.access_token,
        };
      }
      
      return null;
    } catch (error: any) {
      console.error('[AUTH] OAuth callback error:', error);
      throw new AuthError(error.message || 'OAuth callback failed', 'OAUTH_CALLBACK_ERROR');
    }
  }

  /**
   * Get current session from Supabase
   */
  async getCurrentSession(): Promise<AuthResponse | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return null;
      }
      
      const { data: participant } = await supabase
        .from('participants')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      return {
        user: {
          id: session.user.id,
          email: session.user.email!,
          name: participant?.name || session.user.user_metadata?.full_name || 'User',
          role: participant?.role || 'participant',
        },
        access_token: session.access_token,
      };
    } catch (error) {
      console.error('[AUTH] Get session error:', error);
      return null;
    }
  }

  /**
   * Login user (legacy - use signin instead)
   */
  async login(_credentials: LoginRequest): Promise<AuthResponse> {
    // Redirect to signin
    return this.signin(_credentials.email, _credentials.password);
  }

  /**
   * Register new user (legacy - use signup instead)
   */
  async register(_data: RegisterRequest): Promise<AuthResponse> {
    // Redirect to signup
    return this.signup(_data.email, _data.password, _data.name);
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    // TODO: Call backend logout endpoint
    // await apiClient.post('/auth/logout', {});
    this.clearTokens();
    apiClient.clearAuthToken();
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new AuthError('No refresh token available');
    }

    // TODO: Implement when backend is ready
    // const response = await apiClient.post<{ token: string }>('/auth/refresh', {
    //   refreshToken,
    // });
    // this.setToken(response.data.token);
    // apiClient.setAuthToken(response.data.token);
    // return response.data.token;
    throw new AuthError('Token refresh not implemented');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get stored token
   * Used for session context sharing across services (Requirements: 9.3)
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  /**
   * Set authentication token
   * Used for session context sharing across services (Requirements: 9.3)
   */
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    apiClient.setAuthToken(token);
  }

  /**
   * Set both tokens
   * Requirements: 9.3 - Session context sharing through JWT
   */
  setTokens(token: string, refreshToken: string): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
    apiClient.setAuthToken(token);
  }

  /**
   * Clear stored tokens
   */
  clearTokens(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  /**
   * Generate a session token for anonymous users
   * This allows session tracking without full authentication
   * Requirements: 9.3 - Session context sharing
   */
  generateSessionToken(sessionId: string, participantId: string): string {
    // Create a simple session token for anonymous users
    // In production, this should be a proper JWT from the backend
    const payload = {
      sessionId,
      participantId,
      timestamp: Date.now(),
      type: 'session',
    };
    
    // Base64 encode the payload (not secure, but allows session tracking)
    const token = btoa(JSON.stringify(payload));
    this.setToken(token);
    return token;
  }

  /**
   * Parse session info from token
   * Requirements: 9.3 - Session context sharing
   */
  getSessionInfo(): { sessionId?: string; participantId?: string } | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token));
      if (payload.type === 'session') {
        return {
          sessionId: payload.sessionId,
          participantId: payload.participantId,
        };
      }
    } catch {
      // Token is not a session token, might be a real JWT
    }
    
    return null;
  }
}

export const authService = new AuthService();
export default AuthService;
