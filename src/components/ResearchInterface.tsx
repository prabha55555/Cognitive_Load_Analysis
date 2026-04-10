import { Clock } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { getInteractionTracker, stopInteractionTracker } from '../services/interactionTracker';
import { Participant } from '../types';
import { ChatGPTInterface } from './ChatGPTInterface';
import { GoogleSearchInterface } from './GoogleSearchInterface';
import { PlatformSelection } from './PlatformSelection';

interface ResearchInterfaceProps {
  participant: Participant;
  onComplete: (readingContent?: string, userNotes?: string, sessionId?: string, platform?: 'chatgpt' | 'google') => void;
  onTopicChange?: (topic: string) => void;
  onActivePlatformChange?: (platform: 'chatgpt' | 'google') => void;
}

export const ResearchInterface: React.FC<ResearchInterfaceProps> = ({
  participant,
  onComplete,
  onTopicChange,
  onActivePlatformChange
}) => {
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [queries, setQueries] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<'chatgpt' | 'google' | null>(null);
  const [currentResearchTopic, setCurrentResearchTopic] = useState(participant.researchTopic);
  const [behavioralSessionId, setBehavioralSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPlatform || !behavioralSessionId || !participant.id) {
      return;
    }

    const tracker = getInteractionTracker(
      behavioralSessionId,
      participant.id,
      selectedPlatform,
    );

    tracker.start();
    tracker.trackNavigation('research');

    return () => {
      stopInteractionTracker().catch((error) => {
        console.error('Failed to stop interaction tracker during cleanup:', error);
      });
    };
  }, [selectedPlatform, behavioralSessionId, participant.id]);

  const stopTrackerSafely = useCallback(async () => {
    try {
      await Promise.race([
        stopInteractionTracker(),
        new Promise<void>((resolve) => {
          window.setTimeout(() => resolve(), 3000);
        }),
      ]);
    } catch (error) {
      console.error('Failed to stop interaction tracker:', error);
    }
  }, []);

  const finalizeResearch = useCallback(async (platformOverride?: 'chatgpt' | 'google') => {
    await stopTrackerSafely();
    const readingContent = queries.join(' | ');
    onComplete(
      readingContent,
      notes,
      behavioralSessionId || undefined,
      platformOverride || selectedPlatform || undefined,
    );
  }, [behavioralSessionId, notes, onComplete, queries, selectedPlatform, stopTrackerSafely]);

  useEffect(() => {
    if (timeLeft > 0 && isActive && selectedPlatform) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }

    if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setTimeout(() => {
        void finalizeResearch();
      }, 2000);
    }
  }, [finalizeResearch, timeLeft, isActive, selectedPlatform]);

  const handleQuerySubmit = (query: string) => {
    setQueries(prev => [...prev, query]);
  };

  const handleSearchBehavior = (behavior: unknown) => {
    console.log('Search behavior tracked:', behavior);
  };

  const handleTopicChange = (newTopic: string) => {
    setCurrentResearchTopic(newTopic);
    if (onTopicChange) {
      onTopicChange(newTopic);
    }
  };

  const handlePlatformSelect = async (platform: 'chatgpt' | 'google') => {      
    setSelectedPlatform(platform);
    if (onActivePlatformChange) onActivePlatformChange(platform);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          platform,
          topic: currentResearchTopic || participant.researchTopic || 'Research Session'
        })
      });

      if (response.ok) {
        const session = await response.json();
        setBehavioralSessionId(session.id);
      } else {
        const sessionId = `session_${participant.id}_${Date.now()}`;
        setBehavioralSessionId(sessionId);
      }
    } catch {
      const sessionId = `session_${participant.id}_${Date.now()}`;
      setBehavioralSessionId(sessionId);
    }
  };

  if (!selectedPlatform) {
    return <PlatformSelection participant={participant} onPlatformSelect={handlePlatformSelect} />;
  }

  if (!isActive) {
    return (
      <div className="mx-auto max-w-4xl p-4 lg:p-6 xl:p-8">
        <div className="cla-surface border-amber-200/70 p-6 text-center lg:p-8 xl:p-12 dark:border-amber-500/30">
          <div className="relative mb-6 lg:mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full blur-lg lg:blur-xl opacity-40 animate-pulse"></div>     
            <Clock className="h-12 w-12 lg:h-14 lg:w-14 xl:h-16 xl:w-16 text-amber-600 relative z-10 mx-auto" />
          </div>
          <h2 className="mb-3 text-2xl font-black text-amber-800 lg:mb-4 lg:text-3xl xl:text-4xl">Time's Up!</h2>
          <p className="mb-6 text-base font-medium text-amber-700 lg:mb-8 lg:text-lg">Moving to the creativity assessment phase...</p>
        </div>
      </div>
    );
  }

  if (selectedPlatform === 'google') {
    return (
      <GoogleSearchInterface
        participant={participant}
        onQuerySubmit={handleQuerySubmit}
        onSearchBehavior={handleSearchBehavior}
        onTopicChange={handleTopicChange}
        sessionId={behavioralSessionId || undefined}
        timeLeft={timeLeft}
        queriesCount={queries.length}
        notes={notes}
        onNotesChange={setNotes}
        onFinishEarly={() => {
          void finalizeResearch('google');
        }}
      />
    );
  }

  return (
    <ChatGPTInterface
      participant={participant}
      onQuerySubmit={handleQuerySubmit}
      onTopicChange={handleTopicChange}
      sessionId={behavioralSessionId || undefined}
      timeLeft={timeLeft}
      queriesCount={queries.length}
      notes={notes}
      onNotesChange={setNotes}
      onFinishEarly={() => {
        void finalizeResearch('chatgpt');
      }}
    />
  );
};
