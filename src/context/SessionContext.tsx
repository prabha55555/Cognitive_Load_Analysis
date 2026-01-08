/**
 * Session Context
 * 
 * ✅ IMPLEMENTED: Session management with persistence (Phase 1)
 * - Auto-save every 10 seconds
 * - Before-unload warnings for active sessions
 * - Session recovery on page refresh
 * - Session expiry handling (24 hours)
 * 
 * Related Flaw: Module 1 - Session State Lost on Refresh (HIGH) - FIXED
 * @see docs/FLOW_IMPROVEMENTS.md - Issue #3
 * 
 * Requirements: 9.3 - Session context sharing through JWT tokens
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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
  lastSaved?: string; // ISO timestamp of last save
  createdAt?: string; // ISO timestamp of session creation
}

interface SessionContextType {
  session: SessionData;
  updateSession: (updates: Partial<SessionData>) => void;
  clearSession: () => void;
  restoreSession: () => boolean;
  getSessionToken: () => string | null;
  hasRecoverableSession: () => boolean;
  isSessionExpired: () => boolean;
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
  const autoSaveInterval = useRef<NodeJS.Timeout>();
  const saveDebounceTimeout = useRef<NodeJS.Timeout>();

  // Persist session to localStorage with timestamp
  const persistSession = (sessionData: SessionData) => {
    try {
      const dataWithTimestamp = {
        ...sessionData,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem('cognitiveLoadSession', JSON.stringify(dataWithTimestamp));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  // Check if session is expired (24 hours)
  const isSessionExpired = (): boolean => {
    try {
      const saved = localStorage.getItem('cognitiveLoadSession');
      if (!saved) return false;
      
      const parsed = JSON.parse(saved);
      const lastSaved = new Date(parsed.lastSaved || parsed.createdAt);
      const hoursSinceLastSave = (Date.now() - lastSaved.getTime()) / (1000 * 60 * 60);
      
      return hoursSinceLastSave > 24;
    } catch {
      return false;
    }
  };

  // Check if there's a recoverable session
  const hasRecoverableSession = (): boolean => {
    try {
      const saved = localStorage.getItem('cognitiveLoadSession');
      if (!saved) return false;
      
      const parsed = JSON.parse(saved);
      const hoursSinceLastSave = (Date.now() - new Date(parsed.lastSaved).getTime()) / (1000 * 60 * 60);
      
      // Session is recoverable if:
      // - Not expired (< 24 hours)
      // - Not completed
      // - Has been active (< 2 hours since last save)
      return hoursSinceLastSave < 24 && 
             parsed.currentPhase !== 'completed' && 
             hoursSinceLastSave < 2;
    } catch {
      return false;
    }
  };

  const restoreSession = (): boolean => {
    try {
      const saved = localStorage.getItem('cognitiveLoadSession');
      if (saved) {
        const parsedSession = JSON.parse(saved);
        
        // Check if session is expired
        if (isSessionExpired()) {
          console.warn('Session expired, starting fresh');
          localStorage.removeItem('cognitiveLoadSession');
          return false;
        }
        
        // Ensure sessionId and participantId exist
        if (!parsedSession.sessionId) {
          parsedSession.sessionId = generateSessionId();
        }
        if (!parsedSession.participantId) {
          parsedSession.participantId = generateParticipantId();
        }
        if (!parsedSession.createdAt) {
          parsedSession.createdAt = new Date().toISOString();
        }
        
        setSession(parsedSession);
        return true;
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
    return false;
  };

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

  /**
   * Get the current session token for API requests
   * Requirements: 9.3 - Session context sharing through JWT
   */
  const getSessionToken = (): string | null => {
    return authService.getToken();
  };

  // Load session from storage on mount
  useEffect(() => {
    restoreSession();
  }, []);

  // Auto-save session every 10 seconds
  useEffect(() => {
    autoSaveInterval.current = setInterval(() => {
      persistSession(session);
    }, 10000); // 10 seconds

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, [session]);

  // Debounced save on session changes (1 second)
  useEffect(() => {
    if (saveDebounceTimeout.current) {
      clearTimeout(saveDebounceTimeout.current);
    }

    saveDebounceTimeout.current = setTimeout(() => {
      persistSession(session);
      
      // Generate/update session token for cross-service communication
      // Requirements: 9.3 - Session context sharing through JWT
      if (session.sessionId && session.participantId) {
        authService.generateSessionToken(session.sessionId, session.participantId);
      }
    }, 1000);

    return () => {
      if (saveDebounceTimeout.current) {
        clearTimeout(saveDebounceTimeout.current);
      }
    };
  }, [session]);

  // Before-unload warning for active sessions
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Save one final time before unload
      persistSession(session);
      
      // Warn user if session is active (not completed)
      if (session.currentPhase !== 'completed' && session.currentPhase !== 'login') {
        e.preventDefault();
        e.returnValue = 'You have an active research session. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [session]);

  return (
    <SessionContext.Provider
      value={{
        session,
        updateSession,
        clearSession,
        restoreSession,
        getSessionToken,
        hasRecoverableSession,
        isSessionExpired,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export default SessionContext;
