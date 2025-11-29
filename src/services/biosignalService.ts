/**
 * Biosignal Service
 * 
 * Frontend service for fetching synthetic EEG data from the backend API.
 * Follows the singleton pattern consistent with other services.
 */

import { apiConfig } from '../config/apiConfig';

/**
 * Interface for biosignal generation request
 */
interface BiosignalRequest {
  participantId: string;
  cognitiveLoadScore?: number;
  metrics?: ParticipantMetrics;
  platform?: 'chatgpt' | 'google' | 'unknown';
  numPoints?: number;
}

/**
 * Interface for participant metrics
 */
interface ParticipantMetrics {
  interactionCount: number;
  clarificationRequests: number;
  assessmentTime: number;
  assessmentAccuracy: number;
  timeSpent: number;
}

/**
 * Interface for brainwave patterns
 */
interface BrainwavePatterns {
  theta: number[];
  alpha: number[];
  beta: number[];
}

/**
 * Interface for biosignal metadata
 */
interface BiosignalMetadata {
  cognitiveLoadScore: number;
  loadLevel: 'natural' | 'lowlevel' | 'midlevel' | 'highlevel';
  participantId: string;
  platform: string;
  generatedAt: string;
  numPoints: number;
  samplingRate: number;
  channels: string[];
}

/**
 * Interface for complete biosignal data
 */
export interface BiosignalData {
  cognitiveLoadTimeline: number[];
  brainwavePatterns: BrainwavePatterns;
  metadata: BiosignalMetadata;
}

/**
 * Interface for API response
 */
interface BiosignalResponse {
  success: boolean;
  data?: BiosignalData;
  error?: string;
  cached?: boolean;
}

/**
 * Biosignal Service Class
 * 
 * Handles all biosignal-related API calls and provides
 * synthetic EEG data for visualization.
 */
class BiosignalService {
  private static instance: BiosignalService;
  private baseUrl: string;
  private cache: Map<string, BiosignalData>;
  private cacheTimeout: number;

  private constructor() {
    // Use backend API URL from config, fallback to localhost
    this.baseUrl = apiConfig.BACKEND_URL 
      ? `${apiConfig.BACKEND_URL}/api/biosignal`
      : 'http://localhost:3001/api/biosignal';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes local cache
  }

  /**
   * Get singleton instance
   */
  static getInstance(): BiosignalService {
    if (!BiosignalService.instance) {
      BiosignalService.instance = new BiosignalService();
    }
    return BiosignalService.instance;
  }

  /**
   * Generate cache key
   */
  private getCacheKey(participantId: string, cognitiveLoadScore: number): string {
    return `${participantId}:${Math.round(cognitiveLoadScore)}`;
  }

  /**
   * Calculate cognitive load score from metrics
   * Matches the calculation in cognitiveLoadService
   */
  calculateCognitiveLoadScore(metrics: ParticipantMetrics): number {
    const normalizeTime = (time: number, min: number, max: number): number => {
      return Math.min(Math.max((time - min) / (max - min), 0), 1) * 100;
    };

    const normalizeInteractions = (count: number, max: number): number => {
      return Math.min(Math.max(count / max, 0), 1) * 100;
    };

    const timeScore = normalizeTime(metrics.timeSpent, 300, 1800) * 0.20;
    const interactionScore = normalizeInteractions(metrics.interactionCount, 20) * 0.20;
    const clarificationScore = Math.min(metrics.clarificationRequests * 5, 100) * 0.15;
    const assessmentTimeScore = normalizeTime(metrics.assessmentTime, 0, 1800) * 0.25;
    const accuracyScore = (1 - metrics.assessmentAccuracy) * 100 * 0.20;

    const totalScore = Math.round(
      timeScore + interactionScore + clarificationScore + assessmentTimeScore + accuracyScore
    );

    return Math.min(Math.max(totalScore, 0), 100);
  }

  /**
   * Map cognitive load score to load level
   */
  mapScoreToLevel(score: number): 'natural' | 'lowlevel' | 'midlevel' | 'highlevel' {
    if (score < 25) return 'natural';
    if (score < 50) return 'lowlevel';
    if (score < 75) return 'midlevel';
    return 'highlevel';
  }

  /**
   * Generate biosignal data for a participant
   */
  async generateBiosignal(request: BiosignalRequest): Promise<BiosignalData> {
    const { participantId, metrics, platform = 'unknown', numPoints = 50 } = request;
    
    // Calculate cognitive load score
    let cognitiveLoadScore = request.cognitiveLoadScore;
    if (cognitiveLoadScore === undefined && metrics) {
      cognitiveLoadScore = this.calculateCognitiveLoadScore(metrics);
    }
    
    if (cognitiveLoadScore === undefined) {
      throw new Error('Either cognitiveLoadScore or metrics must be provided');
    }

    // Check local cache
    const cacheKey = this.getCacheKey(participantId, cognitiveLoadScore);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`[BiosignalService] Cache hit for ${cacheKey}`);
      return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId,
          cognitiveLoadScore,
          metrics,
          platform,
          numPoints,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const result: BiosignalResponse = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate biosignal');
      }

      // Cache the result
      this.cache.set(cacheKey, result.data);
      
      // Set timeout to clear from cache
      setTimeout(() => {
        this.cache.delete(cacheKey);
      }, this.cacheTimeout);

      return result.data;
    } catch (error) {
      console.error('[BiosignalService] Generation failed:', error);
      
      // Fallback: generate mock data if API is unavailable
      return this.generateFallbackData(participantId, cognitiveLoadScore, platform, numPoints);
    }
  }

  /**
   * Generate only the cognitive load timeline
   */
  async generateTimeline(
    cognitiveLoadScore: number,
    numPoints: number = 50
  ): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}/timeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cognitiveLoadScore, numPoints }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      return result.data?.timeline || this.generateFallbackTimeline(cognitiveLoadScore, numPoints);
    } catch (error) {
      console.error('[BiosignalService] Timeline generation failed:', error);
      return this.generateFallbackTimeline(cognitiveLoadScore, numPoints);
    }
  }

  /**
   * Generate only brainwave patterns
   */
  async generateBrainwaves(
    cognitiveLoadScore: number,
    numPoints: number = 50
  ): Promise<BrainwavePatterns> {
    try {
      const response = await fetch(`${this.baseUrl}/brainwaves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cognitiveLoadScore, numPoints }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      return result.data || this.generateFallbackBrainwaves(cognitiveLoadScore, numPoints);
    } catch (error) {
      console.error('[BiosignalService] Brainwaves generation failed:', error);
      return this.generateFallbackBrainwaves(cognitiveLoadScore, numPoints);
    }
  }

  /**
   * Check if biosignal service is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Generate fallback data when API is unavailable
   * Uses similar logic to the Python service but simplified
   */
  private generateFallbackData(
    participantId: string,
    cognitiveLoadScore: number,
    platform: string,
    numPoints: number
  ): BiosignalData {
    console.log('[BiosignalService] Using fallback data generation');
    
    const timeline = this.generateFallbackTimeline(cognitiveLoadScore, numPoints);
    const brainwaves = this.generateFallbackBrainwaves(cognitiveLoadScore, numPoints);
    
    return {
      cognitiveLoadTimeline: timeline,
      brainwavePatterns: brainwaves,
      metadata: {
        cognitiveLoadScore,
        loadLevel: this.mapScoreToLevel(cognitiveLoadScore),
        participantId,
        platform,
        generatedAt: new Date().toISOString(),
        numPoints,
        samplingRate: 250,
        channels: ['Fp1', 'Fp2', 'F7', 'F3', 'FZ', 'F4', 'F8', 'C2'],
      },
    };
  }

  /**
   * Generate fallback cognitive load timeline
   */
  private generateFallbackTimeline(cognitiveLoadScore: number, numPoints: number): number[] {
    const timeline: number[] = [];
    
    for (let i = 0; i < numPoints; i++) {
      // Create smooth variations around the target score
      const progress = i / numPoints;
      
      // Temporal variation: lower at start (adaptation), higher at end (fatigue)
      let temporalFactor = 0;
      if (progress < 0.2) {
        temporalFactor = -5;
      } else if (progress > 0.8) {
        temporalFactor = 8;
      } else {
        temporalFactor = (Math.random() - 0.5) * 6;
      }
      
      // Add some noise and sinusoidal variation
      const noise = (Math.random() - 0.5) * 10;
      const wave = Math.sin(progress * Math.PI * 4) * 5;
      
      const value = cognitiveLoadScore + temporalFactor + noise + wave;
      timeline.push(Math.max(0, Math.min(100, value)));
    }
    
    return timeline;
  }

  /**
   * Generate fallback brainwave patterns
   */
  private generateFallbackBrainwaves(cognitiveLoadScore: number, numPoints: number): BrainwavePatterns {
    const loadFactor = cognitiveLoadScore / 100;
    
    const theta: number[] = [];
    const alpha: number[] = [];
    const beta: number[] = [];
    
    for (let i = 0; i < numPoints; i++) {
      const progress = i / numPoints;
      const wave1 = Math.sin(progress * Math.PI * 3);
      const wave2 = Math.sin(progress * Math.PI * 5 + 1);
      const noise = (Math.random() - 0.5) * 0.3;
      
      // Theta increases with load (30-70 range)
      const thetaBase = 30 + 20 * loadFactor;
      theta.push(thetaBase + 15 * (wave1 * 0.5 + 0.5 + noise));
      
      // Alpha decreases with load (60-35 range)
      const alphaBase = 60 - 25 * loadFactor;
      alpha.push(alphaBase + 12 * (wave2 * 0.5 + 0.5 + noise));
      
      // Beta increases with load (25-55 range)
      const betaBase = 25 + 30 * loadFactor;
      beta.push(betaBase + 10 * ((wave1 + wave2) * 0.25 + 0.5 + noise));
    }
    
    return { theta, alpha, beta };
  }

  /**
   * Clear local cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[BiosignalService] Cache cleared');
  }
}

// Export singleton instance getter
export const biosignalService = BiosignalService.getInstance();
