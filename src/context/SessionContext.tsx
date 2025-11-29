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
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SessionData {
  currentPhase: string;
  researchTopic: string;
  platform: 'chatgpt' | 'google' | null;
  startTime: number | null;
  assessmentResponses: Record<string, any>;
  creativityResponses: Record<string, any>;
}

interface SessionContextType {
  session: SessionData;
  updateSession: (updates: Partial<SessionData>) => void;
  clearSession: () => void;
  restoreSession: () => boolean;
}

const defaultSession: SessionData = {
  currentPhase: 'login',
  researchTopic: '',
  platform: null,
  startTime: null,
  assessmentResponses: {},
  creativityResponses: {},
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

  // TODO: Load session from storage on mount
  useEffect(() => {
    restoreSession();
  }, []);

  // TODO: Auto-save session on changes
  useEffect(() => {
    localStorage.setItem('cognitiveLoadSession', JSON.stringify(session));
  }, [session]);

  const updateSession = (updates: Partial<SessionData>) => {
    setSession(prev => ({ ...prev, ...updates }));
  };

  const clearSession = () => {
    setSession(defaultSession);
    localStorage.removeItem('cognitiveLoadSession');
  };

  const restoreSession = (): boolean => {
    try {
      const saved = localStorage.getItem('cognitiveLoadSession');
      if (saved) {
        setSession(JSON.parse(saved));
        return true;
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
    return false;
  };

  return (
    <SessionContext.Provider
      value={{
        session,
        updateSession,
        clearSession,
        restoreSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export default SessionContext;
