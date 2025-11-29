/**
 * API Client Service
 * 
 * TODO: Implement unified API client
 * - Centralized request handling
 * - Authentication headers
 * - Request/response interceptors
 * - Error handling
 * 
 * Related Flaw: Module 2 - API Keys Exposed in Frontend (CRITICAL)
 * @see docs/FLAWS_AND_ISSUES.md
 */

import { ApiError, NetworkError } from '../utils/errorHandler';
import { apiRateLimiter } from '../utils/rateLimiter';
import { logger } from '../utils/logger';

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

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
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
   * Make HTTP request
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

    const url = `${this.baseUrl}${endpoint}`;
    const { method = 'GET', headers = {}, body, timeout = 30000 } = config;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      logger.debug(`API Request: ${method} ${endpoint}`);
      
      const response = await fetch(url, {
        method,
        headers: { ...this.defaultHeaders, ...headers },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      // Record request for rate limiting
      apiRateLimiter.recordRequest(endpoint);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new ApiError(
          errorBody.message || `Request failed with status ${response.status}`,
          endpoint,
          response.status
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

  delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// Default API client instance
export const apiClient = new ApiClient(import.meta.env.VITE_API_URL || '/api');

export default ApiClient;
