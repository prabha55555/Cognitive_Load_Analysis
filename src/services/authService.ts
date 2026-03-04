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
  access_token?: string;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
  };
  token?: string;
  message?: string;
}

class AuthService {
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';

  private extractAuthError(error: any, fallbackMessage: string): AuthError {
    const message = error?.message || fallbackMessage;
    const code = error?.code || 'AUTH_ERROR';
    return new AuthError(message, code);
  }

  private async persistSupabaseSession(accessToken: string, refreshToken?: string): Promise<void> {
    if (!refreshToken) return;

    try {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } catch {
      // Non-blocking: app still relies on local auth_token
    }
  }

  /**
   * Sign in user
   */
  async signin(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/signin', {
        email,
        password
      });
      
      const token = response.data.session?.access_token || response.data.token || response.data.access_token;
      const refreshToken = response.data.session?.refresh_token;

      if (!token) {
        throw new AuthError('Sign in succeeded but no access token was returned', 'TOKEN_MISSING');
      }

      if (refreshToken) {
        this.setTokens(token, refreshToken);
      } else {
        this.setToken(token);
      }

      await this.persistSupabaseSession(token, refreshToken);
      
      return response.data;
    } catch (error) {
      throw this.extractAuthError(error, 'Sign in failed');
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
      const token = response.data.token || response.data.session?.access_token || response.data.access_token;
      const refreshToken = response.data.session?.refresh_token;
      
      if (token) {
        if (refreshToken) {
          this.setTokens(token, refreshToken);
        } else {
          this.setToken(token);
        }
        await this.persistSupabaseSession(token, refreshToken);
      } else {
        console.warn('[AUTH] Signup successful but no token returned - user will need to sign in manually');
      }
      
      return response.data;
    } catch (error) {
      throw this.extractAuthError(error, 'Sign up failed');
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
    try {
      await supabase.auth.signOut();
    } catch {
      // Non-blocking cleanup
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new AuthError('No refresh token available');
    }

    try {
      const response = await apiClient.post<{ session: { access_token: string; refresh_token: string; expires_at?: number } }>(
        '/auth/refresh',
        { refresh_token: refreshToken }
      );

      const accessToken = response.data.session?.access_token;
      const newRefreshToken = response.data.session?.refresh_token;

      if (!accessToken || !newRefreshToken) {
        throw new AuthError('Invalid refresh response from server', 'REFRESH_INVALID_RESPONSE');
      }

      this.setTokens(accessToken, newRefreshToken);
      await this.persistSupabaseSession(accessToken, newRefreshToken);
      return accessToken;
    } catch (error) {
      throw this.extractAuthError(error, 'Failed to refresh access token');
    }
  }

  async getCurrentUser(): Promise<AuthResponse['user'] | null> {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const response = await apiClient.get<{ user: AuthResponse['user'] }>('/auth/me');
      return response.data.user;
    } catch {
      this.clearTokens();
      apiClient.clearAuthToken();
      return null;
    }
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
