// Analytics Service for tracking user behavior and search patterns
// This service handles data collection for research analysis

export interface SearchBehavior {
  participantId: string;
  timestamp: number;
  query: string;
  clickedResults: string[];
  timeSpent: number;
  scrollDepth: number;
  searchType: 'google' | 'internal';
  resultCount: number;
  sessionDuration: number;
}

export interface UserInteraction {
  participantId: string;
  timestamp: number;
  action: 'click' | 'scroll' | 'search' | 'hover' | 'copy' | 'bookmark';
  target: string;
  metadata?: Record<string, any>;
}

export interface CognitiveLoadData {
  participantId: string;
  timestamp: number;
  eegData?: {
    alphaPower: number;
    betaPower: number;
    thetaPower: number;
    gammaPower: number;
  };
  edaData?: {
    skinConductance: number;
    heartRate: number;
  };
  selfReportedLoad?: number; // 1-10 scale
  taskComplexity: 'low' | 'medium' | 'high';
}

export interface ResearchSession {
  participantId: string;
  sessionId: string;
  platform: 'chatgpt' | 'grok' | 'google';
  topic: string;
  startTime: number;
  endTime?: number;
  searchBehaviors: SearchBehavior[];
  userInteractions: UserInteraction[];
  cognitiveLoadData: CognitiveLoadData[];
  queries: string[];
  notes: string;
  completionRate: number;
}

export class AnalyticsService {
  private sessions: Map<string, ResearchSession> = new Map();
  private isTracking: boolean = false;

  /**
   * Start tracking a research session
   */
  startSession(participantId: string, platform: 'chatgpt' | 'grok' | 'google', topic: string): string {
    const sessionId = `session_${participantId}_${Date.now()}`;
    
    const session: ResearchSession = {
      participantId,
      sessionId,
      platform,
      topic,
      startTime: Date.now(),
      searchBehaviors: [],
      userInteractions: [],
      cognitiveLoadData: [],
      queries: [],
      notes: '',
      completionRate: 0
    };

    this.sessions.set(sessionId, session);
    this.isTracking = true;
    
    console.log(`Analytics session started: ${sessionId}`);
    return sessionId;
  }

  /**
   * Track a search behavior
   */
  trackSearchBehavior(
    sessionId: string,
    behavior: Omit<SearchBehavior, 'participantId' | 'timestamp'>
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`Session not found: ${sessionId}`);
      return;
    }

    const searchBehavior: SearchBehavior = {
      ...behavior,
      participantId: session.participantId,
      timestamp: Date.now()
    };

    session.searchBehaviors.push(searchBehavior);
    session.queries.push(behavior.query);
    
    console.log('Search behavior tracked:', searchBehavior);
  }

  /**
   * Track user interactions
   */
  trackUserInteraction(
    sessionId: string,
    action: UserInteraction['action'],
    target: string,
    metadata?: Record<string, any>
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`Session not found: ${sessionId}`);
      return;
    }

    const interaction: UserInteraction = {
      participantId: session.participantId,
      timestamp: Date.now(),
      action,
      target,
      metadata
    };

    session.userInteractions.push(interaction);
    console.log('User interaction tracked:', interaction);
  }

  /**
   * Track cognitive load data
   */
  trackCognitiveLoad(
    sessionId: string,
    data: Omit<CognitiveLoadData, 'participantId' | 'timestamp'>
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`Session not found: ${sessionId}`);
      return;
    }

    const cognitiveLoadData: CognitiveLoadData = {
      ...data,
      participantId: session.participantId,
      timestamp: Date.now()
    };

    session.cognitiveLoadData.push(cognitiveLoadData);
    console.log('Cognitive load data tracked:', cognitiveLoadData);
  }

  /**
   * Update session notes
   */
  updateSessionNotes(sessionId: string, notes: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.notes = notes;
    }
  }

  /**
   * End a research session
   */
  endSession(sessionId: string, completionRate: number = 100): ResearchSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`Session not found: ${sessionId}`);
      return null;
    }

    session.endTime = Date.now();
    session.completionRate = completionRate;
    this.isTracking = false;

    console.log(`Analytics session ended: ${sessionId}`, session);
    return session;
  }

  /**
   * Get session data
   */
  getSession(sessionId: string): ResearchSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get analytics summary for a session
   */
  getSessionAnalytics(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const totalTime = session.endTime ? session.endTime - session.startTime : Date.now() - session.startTime;
    const uniqueQueries = new Set(session.queries).size;
    const totalClicks = session.searchBehaviors.reduce((sum, behavior) => sum + behavior.clickedResults.length, 0);
    const avgTimePerQuery = session.searchBehaviors.length > 0 
      ? session.searchBehaviors.reduce((sum, behavior) => sum + behavior.timeSpent, 0) / session.searchBehaviors.length 
      : 0;

    return {
      sessionId,
      participantId: session.participantId,
      platform: session.platform,
      topic: session.topic,
      totalTime,
      uniqueQueries,
      totalClicks,
      avgTimePerQuery,
      completionRate: session.completionRate,
      searchBehaviors: session.searchBehaviors.length,
      userInteractions: session.userInteractions.length,
      cognitiveLoadDataPoints: session.cognitiveLoadData.length
    };
  }

  /**
   * Export session data for analysis
   */
  exportSessionData(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return '';

    return JSON.stringify(session, null, 2);
  }

  /**
   * Get real-time analytics
   */
  getRealTimeAnalytics(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const currentTime = Date.now();
    const sessionDuration = currentTime - session.startTime;
    const recentBehaviors = session.searchBehaviors.filter(
      behavior => currentTime - behavior.timestamp < 60000 // Last minute
    );

    return {
      sessionDuration,
      recentQueries: recentBehaviors.length,
      activeQueries: session.queries.slice(-5),
      currentPlatform: session.platform,
      topic: session.topic
    };
  }

  /**
   * Analyze search patterns
   */
  analyzeSearchPatterns(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const queryFrequency: Record<string, number> = {};
    session.queries.forEach(query => {
      queryFrequency[query] = (queryFrequency[query] || 0) + 1;
    });

    const mostFrequentQueries = Object.entries(queryFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([query, count]) => ({ query, count }));

    const avgScrollDepth = session.searchBehaviors.length > 0
      ? session.searchBehaviors.reduce((sum, behavior) => sum + behavior.scrollDepth, 0) / session.searchBehaviors.length
      : 0;

    return {
      mostFrequentQueries,
      avgScrollDepth,
      totalSearches: session.searchBehaviors.length,
      uniqueQueries: Object.keys(queryFrequency).length,
      searchEfficiency: session.searchBehaviors.length > 0 
        ? session.searchBehaviors.filter(b => b.clickedResults.length > 0).length / session.searchBehaviors.length
        : 0
    };
  }

  /**
   * Check if tracking is active
   */
  isTrackingActive(): boolean {
    return this.isTracking;
  }

  /**
   * Clear all sessions (for testing/reset)
   */
  clearSessions(): void {
    this.sessions.clear();
    this.isTracking = false;
  }
}

// Export a singleton instance
export const analyticsService = new AnalyticsService();
