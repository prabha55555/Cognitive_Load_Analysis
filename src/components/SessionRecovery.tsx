/**
 * Session Recovery Component
 * 
 * ✅ IMPLEMENTED: Session recovery modal (Phase 1)
 * Displays when user returns to app with incomplete session
 * Allows resuming or starting fresh
 * 
 * Related Fix: Issue #3 - Session State Lost on Refresh
 * @see docs/FLOW_IMPROVEMENTS.md
 */

import React, { useState, useEffect } from 'react';
import { useSession } from '../context/SessionContext';

interface SessionRecoveryProps {
  onResume?: () => void;
  onStartFresh?: () => void;
}

export const SessionRecovery: React.FC<SessionRecoveryProps> = ({ onResume, onStartFresh }) => {
  const { session, clearSession, hasRecoverableSession } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [timeSinceLastSave, setTimeSinceLastSave] = useState<string>('');

  useEffect(() => {
    // Check if there's a recoverable session on mount
    if (hasRecoverableSession()) {
      // Calculate time since last save
      try {
        const saved = localStorage.getItem('cognitiveLoadSession');
        if (saved) {
          const parsed = JSON.parse(saved);
          const lastSaved = new Date(parsed.lastSaved);
          const minutesAgo = Math.floor((Date.now() - lastSaved.getTime()) / (1000 * 60));
          
          if (minutesAgo < 60) {
            setTimeSinceLastSave(`${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`);
          } else {
            const hoursAgo = Math.floor(minutesAgo / 60);
            setTimeSinceLastSave(`${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`);
          }
          
          setShowModal(true);
        }
      } catch (error) {
        console.error('Failed to calculate time since last save:', error);
      }
    }
  }, [hasRecoverableSession]);

  const handleResume = () => {
    setShowModal(false);
    onResume?.();
  };

  const handleStartFresh = () => {
    clearSession();
    setShowModal(false);
    onStartFresh?.();
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 backdrop-blur-sm">
      <div className="cla-surface w-full max-w-lg p-6 sm:p-7">
        <div className="mb-5 flex items-center">
          <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Resume Previous Session?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Last saved {timeSinceLastSave}</p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-slate-600 dark:text-slate-300">Phase:</dt>
              <dd className="text-sm capitalize text-slate-900 dark:text-slate-100">{session.currentPhase}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-slate-600 dark:text-slate-300">Topic:</dt>
              <dd className="max-w-[200px] truncate text-sm text-slate-900 dark:text-slate-100">{session.researchTopic || 'Not set'}</dd>
            </div>
            {session.platform && (
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-slate-600 dark:text-slate-300">Platform:</dt>
                <dd className="text-sm capitalize text-slate-900 dark:text-slate-100">{session.platform}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleResume}
            className="cla-btn-primary flex-1 px-4 py-3 text-sm font-semibold"
          >
            Resume Session
          </button>
          <button
            onClick={handleStartFresh}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            Start New Session
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          Your previous work has been saved and can be resumed.
        </p>
      </div>
    </div>
  );
};

export default SessionRecovery;
