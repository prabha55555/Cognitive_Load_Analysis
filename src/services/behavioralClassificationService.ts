/**
 * Behavioral Classification Service
 * 
 * Frontend service for fetching cognitive load classification from the FastAPI backend.
 * Uses behavioral interaction-based inference to determine cognitive load levels.
 * 
 * Requirements: 7.2, 9.3, 9.4
 */

import { API_CONFIG, getEndpointUrl } from '../config/apiConfig';
import { logger } from '../utils/logger';
import { authService } from './authService';

/**
 * Classification result from the behavioral service
 */
export interface BehavioralClassificationResult {
  session_id: string;
  cognitive_load_level: 'Low' | 'Moderate' | 'High' | 'Very High';
  confidence: number;
  features?: BehavioralFeatures;
  timestamp?: string;
}

/**
 * Behavioral features extracted from interaction data
 */
export interface BehavioralFeatures {
  mean_response_time: number;
  median_response_time: number;
  std_response_time: number;
  total_clicks: number;
  rage_click_count: number;
  click_rate: number;
  mean_cursor_speed: number;
  trajectory_deviation: number;
  total_idle_time: number;
  revisit_ratio: number;
  path_linearity: number;
  sections_visited: number;
  total_session_time: number;
  active_time_ratio: number;
  scroll_depth: number;
}

/**
 * Platform comparison result
 */
export interface PlatformComparisonResult {
  chatgpt_mean_load: number;
  google_mean_load: number;
  statistical_significance: number;
  sample_sizes: {
    chatgpt: number;
    google: number;
  };
}

/**
 * Classification request parameters
 */
interface ClassificationRequest {
  session_id: string;
  include_features?: boolean;
}

/**
 * Behavioral Classification Service Class
 */
class BehavioralClassificationService {
  private static instance: BehavioralClassificationService;
  private baseUrl: string;
  private timeout: number;

  private constructor() {
    // Use backend Express server URL, not Python service directly
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    this.timeout = 10000;  // 10 second timeout
  }

  /**
   * Get singleton instance
   */
  static getInstance(): BehavioralClassificationService {
    if (!BehavioralClassificationService.instance) {
      BehavioralClassificationService.instance = new BehavioralClassificationService();
    }
    return BehavioralClassificationService.instance;
  }

  /**
   * Get authorization headers for requests
   * Uses JWT token for session identification across services
   * Requirements: 9.3
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add JWT token if available for session context sharing
    const token = authService.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Check if the behavioral service is available through the backend
   */
  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/api/behavioral/health`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      logger.warn('Behavioral service health check failed', error);
      return false;
    }
  }

  /**
   * Get cognitive load predictions for a session
   * Retrieves predictions from the database (predictions are created by /analyze endpoint)
   * Requirements: 7.2 - Display cognitive load metrics
   * Requirements: 9.3 - Use JWT tokens for session identification
   */
  async getSessionPredictions(
    sessionId: string
  ): Promise<BehavioralClassificationResult[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/behavioral/predictions/${sessionId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      // Convert backend format to frontend format
      // Database fields: predicted_load_category, confidence_score, features
      return (data.predictions || []).map((pred: any) => ({
        session_id: pred.session_id,
        cognitive_load_level: this.categoryToLevel(pred.predicted_load_category),
        confidence: pred.confidence_score,
        features: pred.features,
        timestamp: pred.prediction_timestamp || pred.created_at,
      }));
    } catch (error) {
      logger.error('Failed to get session predictions', error);
      return [];
    }
  }

  /**
   * Get platform comparison statistics
   * Requirements: 7.3 - Compute statistical differences between platforms
   * Requirements: 9.3 - Use JWT tokens for session identification
   * 
   * Note: Returns null if insufficient data exists (e.g., only one platform has sessions).
   * This is expected behavior and not an error.
   */
  async comparePlatforms(): Promise<PlatformComparisonResult | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/interactions/compare`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // 400 errors are expected when there's insufficient data (only one platform)
        // Don't log this as an error - it's normal during single-platform sessions
        if (response.status === 400) {
          logger.info('Platform comparison unavailable - insufficient data from both platforms');
          return null;
        }
        
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const result = await response.json();
      return result as PlatformComparisonResult;
    } catch (error) {
      // Only log non-400 errors
      if (error instanceof Error && !error.message.includes('400')) {
        logger.error('Failed to compare platforms', error);
      }
      return null;
    }
  }

  /**
   * Map cognitive load level to numeric score (0-100)
   */
  levelToScore(level: 'Low' | 'Moderate' | 'High' | 'Very High'): number {
    switch (level) {
      case 'Low':
        return 20;
      case 'Moderate':
        return 45;
      case 'High':
        return 70;
      case 'Very High':
        return 90;
      default:
        return 50;
    }
  }

  /**
   * Map numeric score to cognitive load level
   */
  scoreToLevel(score: number): 'Low' | 'Moderate' | 'High' | 'Very High' {
    if (score < 25) return 'Low';
    if (score < 50) return 'Moderate';
    if (score < 75) return 'High';
    return 'Very High';
  }

  /**
   * Map category from backend format to cognitive load level
   */
  private categoryToLevel(category: string): 'Low' | 'Moderate' | 'High' | 'Very High' {
    switch (category) {
      case 'low':
        return 'Low';
      case 'moderate':
        return 'Moderate';
      case 'high':
        return 'High';
      case 'very-high':
        return 'Very High';
      default:
        return 'Moderate';
    }
  }
}

// Export singleton instance
export const behavioralClassificationService = BehavioralClassificationService.getInstance();
