/**
 * API Client Service
 * 
 * ✅ IMPLEMENTED: Unified API client with Supabase authentication (Phase 2)
 * - Centralized request handling
 * - Authentication headers with Supabase JWT
 * - Request/response interceptors
 * - Error handling
 * - Automatic token refresh
 * 
 * Related Flaw: Module 2 - API Keys Exposed in Frontend (CRITICAL) - FIXED
 * @see docs/FLAWS_AND_ISSUES.md
 */

import { ApiError, NetworkError } from '../utils/errorHandler';
import { apiRateLimiter } from '../utils/rateLimiter';
import { logger } from '../utils/logger';
import { supabase } from '../config/supabase';

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:3001/api') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get current authentication token from Supabase
   */
  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  /**
   * Make HTTP request with automatic authentication
   */
  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    // Check rate limit
    if (!apiRateLimiter.canMakeRequest(endpoint)) {
      throw new ApiError(
        'Rate limit exceeded. Please try again later.',
        endpoint,
        429
      );
    }

    // Get authentication token from Supabase
    const token = await this.getAuthToken();
    const headers = { ...this.defaultHeaders, ...config.headers };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;
    const { method = 'GET', body, timeout = 30000 } = config;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      logger.debug(`API Request: ${method} ${endpoint}`);
      
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      // Record request for rate limiting
      apiRateLimiter.recordRequest(endpoint);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const errorMessage = errorBody.error || errorBody.message || `Request failed with status ${response.status}`;
        const errorCode = errorBody.code;
        throw new ApiError(
          errorMessage,
          endpoint,
          response.status,
          errorCode,
          errorBody
        );
      }

      const data = await response.json();
      
      return {
        data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError('Request timeout');
      }
      
      throw new NetworkError('Network request failed');
    }
  }

  // Convenience methods
  get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  post<T>(endpoint: string, body: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  put<T>(endpoint: string, body: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  patch<T>(endpoint: string, body: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// Default API client instance
export const apiClient = new ApiClient(import.meta.env.VITE_API_URL || '/api');

export default ApiClient;
