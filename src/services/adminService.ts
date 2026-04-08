/**
 * Admin Service
 * 
 * Phase 3: Admin Dashboard
 * Handles admin-specific API calls for viewing all participant data and analytics
 */

import { apiClient } from './apiClient';
import { logger } from '../utils/logger';

export interface AdminParticipant {
  id: string;
  email: string;
  name: string;
  role: string;
  demographic_data: any;
  created_at: string;
  sessions: { count: number }[];
}

export interface AdminSession {
  id: string;
  participant_id: string;
  platform: 'chatgpt' | 'google';
  topic: string;
  current_phase: string;
  start_time: string;
  end_time?: string;
  created_at: string;
  participants: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  cognitive_load_metrics?: {
    overall_score: number;
    category: string;
    assessment_score?: number;
    behavioral_score?: number;
    blended_score?: number;
    source: string;
  }[];
  interaction_events: { count: number }[];
  assessment_responses: { count: number }[];
  creativity_responses: { count: number }[];
}

export interface AdminAnalytics {
  overview: {
    totalParticipants: number;
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    avgCognitiveLoad: number;
  };
  cognitiveLoad: {
    distribution: {
      low: number;
      moderate: number;
      high: number;
      'very-high': number;
    };
    sourceDistribution: Record<string, number>;
    totalMetrics: number;
  };
  platforms: Array<{
    platform: string;
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
    avgSessionDuration: number;
  }>;
  generatedAt: string;
}

export interface SessionDetails {
  session: AdminSession;
  interactions: any[];
  assessments: any[];
  creativity: any[];
  stats: {
    totalInteractions: number;
    totalAssessments: number;
    totalCreativity: number;
  };
}

class AdminService {
  /**
   * Get all participants
   */
  async getAllParticipants(): Promise<AdminParticipant[]> {
    try {
      logger.info('[AdminService] Fetching all participants');
      const response = await apiClient.get<{ participants: AdminParticipant[] }>('/admin/participants');
      return response.data.participants;
    } catch (error) {
      logger.error('[AdminService] Failed to fetch participants:', error);
      throw error;
    }
  }

  /**
   * Get all sessions
   */
  async getAllSessions(): Promise<AdminSession[]> {
    try {
      logger.info('[AdminService] Fetching all sessions');
      const response = await apiClient.get<{ sessions: AdminSession[] }>('/admin/sessions');
      return response.data.sessions;
    } catch (error) {
      logger.error('[AdminService] Failed to fetch sessions:', error);
      throw error;
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics(): Promise<AdminAnalytics> {
    try {
      logger.info('[AdminService] Fetching analytics');
      const response = await apiClient.get<{ analytics: AdminAnalytics }>('/admin/analytics');
      return response.data.analytics;
    } catch (error) {
      logger.error('[AdminService] Failed to fetch analytics:', error);
      throw error;
    }
  }

  /**
   * Get detailed session data
   */
  async getSessionDetails(sessionId: string): Promise<SessionDetails> {
    try {
      logger.info('[AdminService] Fetching session details:', sessionId);
      const response = await apiClient.get<SessionDetails>(`/admin/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      logger.error('[AdminService] Failed to fetch session details:', error);
      throw error;
    }
  }

  /**
   * Get behavioral predictions with optional filters
   */
  async getBehavioralPredictions(options?: {
    platform?: 'chatgpt' | 'google';
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> {
    try {
      logger.info('[AdminService] Fetching behavioral predictions');
      const params = new URLSearchParams();
      if (options?.platform) params.append('platform', options.platform);
      if (options?.startDate) params.append('startDate', options.startDate);
      if (options?.endDate) params.append('endDate', options.endDate);
      
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await apiClient.get<{ predictions: any[] }>(`/admin/behavioral${query}`);
      return response.data.predictions;
    } catch (error) {
      logger.error('[AdminService] Failed to fetch behavioral predictions:', error);
      throw error;
    }
  }

  /**
   * Get behavioral timeline data (grouped by date)
   */
  async getBehavioralTimeline(options?: {
    platform?: 'chatgpt' | 'google';
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> {
    try {
      logger.info('[AdminService] Fetching behavioral timeline');
      const params = new URLSearchParams();
      if (options?.platform) params.append('platform', options.platform);
      if (options?.startDate) params.append('startDate', options.startDate);
      if (options?.endDate) params.append('endDate', options.endDate);
      
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await apiClient.get<{ timeline: any[] }>(`/admin/behavioral/timeline${query}`);
      return response.data.timeline;
    } catch (error) {
      logger.error('[AdminService] Failed to fetch behavioral timeline:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
