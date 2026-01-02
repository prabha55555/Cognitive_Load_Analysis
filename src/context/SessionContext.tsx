/**
 * Session Context
 * 
 * TODO: Implement session management with persistence
 * - Store session state in localStorage/sessionStorage
 * - Auto-save on state changes
 * - Recover session on page refresh
 * - Handle session expiry
 * 
 * Related Flaw: Module 1 - Session State Lost on Refresh (HIGH)
 * @see docs/FLAWS_AND_ISSUES.md
 * 
 * Requirements: 9.3 - Session context sharing through JWT tokens
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';

interface SessionData {
  currentPhase: string;
  researchTopic: string;
  platform: 'chatgpt' | 'google' | null;
  startTime: number | null;
  assessmentResponses: Record<string, any>;
  creativityResponses: Record<string, any>;
  sessionId: string;
  participantId: string;
}

interface SessionContextType {
  session: SessionData;
  updateSession: (updates: Partial<SessionData>) => void;
  clearSession: () => void;
  restoreSession: () => boolean;
  getSessionToken: () => string | null;
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Generate a unique participant ID
 */
function generateParticipantId(): string {
  return `part_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

const defaultSession: SessionData = {
  currentPhase: 'login',
  researchTopic: '',
  platform: null,
  startTime: null,
  assessmentResponses: {},
  creativityResponses: {},
  sessionId: generateSessionId(),
  participantId: generateParticipantId(),
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [session, setSession] = useState<SessionData>(defaultSession);

  // Load session from storage on mount
  useEffect(() => {
    restoreSession();
  }, []);

  // Auto-save session on changes and generate session token
  // Requirements: 9.3 - Session context sharing through JWT
  useEffect(() => {
    localStorage.setItem('cognitiveLoadSession', JSON.stringify(session));
    
    // Generate/update session token for cross-service communication
    if (session.sessionId && session.participantId) {
      authService.generateSessionToken(session.sessionId, session.participantId);
    }
  }, [session]);

  const updateSession = (updates: Partial<SessionData>) => {
    setSession(prev => ({ ...prev, ...updates }));
  };

  const clearSession = () => {
    const newSession = {
      ...defaultSession,
      sessionId: generateSessionId(),
      participantId: generateParticipantId(),
    };
    setSession(newSession);
    localStorage.removeItem('cognitiveLoadSession');
    authService.clearTokens();
  };

  const restoreSession = (): boolean => {
    try {
      const saved = localStorage.getItem('cognitiveLoadSession');
      if (saved) {
        const parsedSession = JSON.parse(saved);
        // Ensure sessionId and participantId exist
        if (!parsedSession.sessionId) {
          parsedSession.sessionId = generateSessionId();
        }
        if (!parsedSession.participantId) {
          parsedSession.participantId = generateParticipantId();
        }
        setSession(parsedSession);
        return true;
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
    return false;
  };

  /**
   * Get the current session token for API requests
   * Requirements: 9.3 - Session context sharing through JWT
   */
  const getSessionToken = (): string | null => {
    return authService.getToken();
  };

  return (
    <SessionContext.Provider
      value={{
        session,
        updateSession,
        clearSession,
        restoreSession,
        getSessionToken,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export default SessionContext;
