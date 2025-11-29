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
  token: string;
  refreshToken: string;
  expiresAt: number;
}

class AuthService {
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';

  /**
   * Login user
   */
  async login(_credentials: LoginRequest): Promise<AuthResponse> {
    // TODO: Implement when backend is ready
    // const response = await apiClient.post<AuthResponse>('/auth/login', _credentials);
    // this._setTokens(response.data.token, response.data.refreshToken);
    // apiClient.setAuthToken(response.data.token);
    // return response.data;
    throw new AuthError('Authentication not implemented');
  }

  /**
   * Register new user
   */
  async register(_data: RegisterRequest): Promise<AuthResponse> {
    // TODO: Implement when backend is ready
    // const response = await apiClient.post<AuthResponse>('/auth/register', _data);
    // this._setTokens(response.data.token, response.data.refreshToken);
    // apiClient.setAuthToken(response.data.token);
    // return response.data;
    throw new AuthError('Registration not implemented');
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

  // TODO: Implement token storage methods when backend auth is ready
  // - setTokens(token, refreshToken)
  // - setToken(token)

  /**
   * Clear stored tokens
   */
  private clearTokens(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }
}

export const authService = new AuthService();
export default AuthService;
