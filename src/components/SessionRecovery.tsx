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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Resume Previous Session?</h2>
            <p className="text-sm text-gray-500">Last saved {timeSinceLastSave}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-md p-4 mb-6">
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">Phase:</dt>
              <dd className="text-sm text-gray-900 capitalize">{session.currentPhase}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-600">Topic:</dt>
              <dd className="text-sm text-gray-900 truncate max-w-[200px]">{session.researchTopic || 'Not set'}</dd>
            </div>
            {session.platform && (
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-600">Platform:</dt>
                <dd className="text-sm text-gray-900 capitalize">{session.platform}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleResume}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Resume Session
          </button>
          <button
            onClick={handleStartFresh}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
          >
            Start New Session
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-500 text-center">
          Your previous work has been saved and can be resumed.
        </p>
      </div>
    </div>
  );
};

export default SessionRecovery;
