import { Brain, CheckCircle, Clock, PauseCircle, PlayCircle, Target, User, Activity } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { AssessmentResponse, Participant, TestResponse } from '../types';       
import AssessmentPhase from './AssessmentPhase';
import { CognitiveLoadResults } from './CognitiveLoadResults';
import { CreativityTest } from './CreativityTest';
import { ResearchInterface } from './ResearchInterface';
import { CreativityEvaluation } from '../services/geminiService';
import { isTrackerActive } from '../services/interactionTracker';
import { PlatformSelection } from './PlatformSelection';

interface ParticipantDashboardProps {
  participant: Participant;
  onPhaseComplete: (phase: string) => void;
  onLogout?: () => void;
}

export const ParticipantDashboard = ({
  participant: initialParticipant,
  onPhaseComplete,
  onLogout
}: ParticipantDashboardProps) => {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');

  const [participant, setParticipant] = useState<Participant>(initialParticipant);
  const cognitiveLoadScoreRef = useRef<number>(initialParticipant.cognitiveLoadScore ?? 0);
  const creativityScoreRef = useRef<number>(initialParticipant.creativityScore ?? 0);

  useEffect(() => {
    setParticipant(prev => {
      const preservedCognitiveLoad = cognitiveLoadScoreRef.current > 0
        ? cognitiveLoadScoreRef.current
        : (prev.cognitiveLoadScore ?? initialParticipant.cognitiveLoadScore ?? 0);
      const preservedCreativity = creativityScoreRef.current > 0
        ? creativityScoreRef.current
        : (prev.creativityScore ?? initialParticipant.creativityScore ?? 0);    

      return {
        ...initialParticipant,
        cognitiveLoadScore: preservedCognitiveLoad,
        creativityScore: preservedCreativity
      };
    });
  }, [initialParticipant]);

  const [isTrackingActive, setIsTrackingActive] = useState(false);

  useEffect(() => {
    const checkTracker = () => {
      setIsTrackingActive(isTrackerActive());
    };
    checkTracker();
    const interval = setInterval(checkTracker, 1000);
    return () => clearInterval(interval);
  }, []);

  const [assessmentResponses, setAssessmentResponses] = useState<AssessmentResponse[] | undefined>(participant.assessmentResponses);
  const [creativityEvaluations, setCreativityEvaluations] = useState<CreativityEvaluation[]>([]);
  const [readingContent, setReadingContent] = useState<string>('');
  const [userNotes, setUserNotes] = useState<string>('');
  const [behavioralSessionId, setBehavioralSessionId] = useState<string | undefined>(undefined);
  const [selectedPlatform, setSelectedPlatform] = useState<'chatgpt' | 'google' | undefined>(undefined);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleCreativityComplete = async (responses: TestResponse[], totalScore: number) => {
    const creativityScore = responses.reduce((sum, current) => sum + (current.score || 0), 0);
    creativityScoreRef.current = creativityScore;
    
    setParticipant(prev => ({
      ...prev,
      creativityScore: creativityScore
    }));

    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch(`${apiBaseUrl}/api/auth/participant/scores`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            creativityScore,
            sessionId: behavioralSessionId
          })
        });
      }
    } catch (error) {
      console.error('Failed to save creativity score to database:', error);  
    }

    setTimeout(() => {
      onPhaseComplete('completed');
    }, 500);
  };

  const handleAssessmentComplete = (responses: AssessmentResponse[]) => {
    setAssessmentResponses(responses);
    onPhaseComplete('results');
  };

  const handleResultsComplete = async (cognitiveLoadScore: number) => {
    const rounded = Math.round(cognitiveLoadScore);
    cognitiveLoadScoreRef.current = rounded;

    setParticipant(prev => ({
      ...prev,
      cognitiveLoadScore: rounded
    }));

    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch(`${apiBaseUrl}/api/auth/participant/scores`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            cognitiveLoadScore: rounded,
            sessionId: behavioralSessionId
          })
        });
      }
    } catch (error) {
      console.error('Failed to save cognitive load score to database:', error);
    }
    
    setTimeout(() => {
      onPhaseComplete('creativity_test');
    }, 300);
  };

  const handleTopicChange = (newTopic: string) => {
    setParticipant(prev => ({
      ...prev,
      researchTopic: newTopic.trim(),
      _topicUpdatedAt: Date.now()
    }));
  };

  const renderCurrentPhase = () => {
    switch (participant.currentPhase) {
      case 'research':
        // Let ResearchInterface handle its own platform selection directly,
        // or just render ResearchInterface block
        return (
          <ResearchInterface
            participant={participant}
            onComplete={(content, notes, sessionId, platform) => {
              setReadingContent(content || '');
              setUserNotes(notes || '');
              setBehavioralSessionId(sessionId);
              setSelectedPlatform(platform);
              onPhaseComplete('assessment');
            }}
            onTopicChange={handleTopicChange}
            onActivePlatformChange={setSelectedPlatform}
          />
        );
      case 'assessment':
        return (
          <AssessmentPhase
            participant={participant}
            readingContent={readingContent}
            userNotes={userNotes}
            onComplete={handleAssessmentComplete}
          />
        );
      case 'results':
        if (!assessmentResponses) {
          return (
            <div className="p-8 text-center">
              <p className="text-red-600">Error: Missing assessment data</p>
            </div>
          );
        }
        return (
          <CognitiveLoadResults
            assessmentResponses={assessmentResponses}
            creativityEvaluations={creativityEvaluations}
            topic={participant.researchTopic}
            participantId={participant.id}
            sessionId={behavioralSessionId}
            platform={selectedPlatform}
            onComplete={handleResultsComplete}
          />
        );
      case 'creativity_test':
        return (
          <CreativityTest
            topic={participant.researchTopic}
            notes={userNotes}
            participantId={participant.id}
            onComplete={handleCreativityComplete}
          />
        );
      case 'completed':
        const finalCognitiveScore = participant.cognitiveLoadScore ?? 0;
        const finalCreativityScore = participant.creativityScore ?? 0;
        
        return (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                  <Target className="h-16 w-16 text-green-600 relative z-10" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-green-800 mb-4">Session Complete!</h2>
              <p className="text-green-700 mb-8 text-lg">
                Thank you for participating in this research study. Your data has been recorded successfully.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-green-200">
                  <div className="flex items-center justify-center mb-4">
                    <Brain className="h-8 w-8 text-blue-600 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-800">Cognitive Load Score</h3>
                  </div>
                  <p className="text-4xl font-bold text-blue-600">
                    {finalCognitiveScore}%
                  </p>
                  <p className="text-sm text-gray-500 mt-2">Average cognitive load during session</p>
                  {finalCognitiveScore === 0 && (
                    <p className="text-xs text-amber-600 mt-2">?? Score not calculated</p>
                  )}
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-green-200">
                  <div className="flex items-center justify-center mb-4">
                    <Target className="h-8 w-8 text-purple-600 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-800">Creativity Score</h3>
                  </div>
                  <p className="text-4xl font-bold text-purple-600">
                    {finalCreativityScore}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">Overall creativity assessment</p>
                  {finalCreativityScore === 0 && (
                    <p className="text-xs text-amber-600 mt-2">?? Score not calculated</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // derived state
  const isAssigned = participant.assignedPlatform !== undefined && participant.assignedPlatform !== null && participant.assignedPlatform !== '';
  const isSelectingPlatform = participant.currentPhase === 'research' && !selectedPlatform && !isAssigned;
  const badgeLabel = isAssigned || selectedPlatform ? (selectedPlatform || participant.assignedPlatform)?.toUpperCase() : '� UNASSIGNED �';
  const badgeClass = (isAssigned || selectedPlatform)
    ? 'border-[#00bfdb] bg-[#00bfdb]/[0.08] text-[#00bfdb]' 
    : 'border-white/[0.1] text-white/40';

  const phaseOrder = ['research', 'assessment', 'creativity_test', 'results'];
  const isEdgeToEdge = participant.currentPhase === 'research' && (selectedPlatform === 'google' || selectedPlatform === 'chatgpt');

  return (
    <div className="min-h-[100dvh] grid grid-rows-[auto_1fr_auto] bg-[#090a0c] text-white selection:bg-[#00bfdb] selection:text-[#090a0c]">
      <style>{`
        .font-display { font-family: 'Cabinet Grotesk', system-ui, -apple-system, sans-serif; }
        .font-mono { font-family: 'Geist Mono', ui-monospace, SFMono-Regular, monospace; }
        
        .pulse-dot {
          animation: pulse-opacity 1.8s ease-in-out infinite;
        }
        @keyframes pulse-opacity {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <header 
        className="sticky top-0 z-50 px-[2.5rem] py-4 flex justify-between items-center border-b border-white/[0.07]"
        style={{ background: 'rgba(9,10,12,0.92)', backdropFilter: 'blur(14px)' }}
      >
        <div className="flex items-center gap-4">
          <div className="h-[38px] w-[38px] rounded-full bg-[#00bfdb]/10 border border-[#00bfdb]/25 flex items-center justify-center font-mono text-[#00bfdb] text-sm">
            {getInitials(participant.name)}
          </div>
          <div>
            <div className="font-display font-[600] text-[0.95rem] tracking-wide text-[#f0f2f5]">{participant.name}</div>
            <div className="font-mono text-[0.72rem] text-white/40">{participant.email || 'Participant Account'}</div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-mono text-[0.75rem]">
            <div className={`h-1.5 w-1.5 rounded-full ${isTrackingActive ? 'bg-[#00bfdb]/60 pulse-dot' : 'bg-white/20'}`} />
            <span className="text-white/40">0 min</span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="font-mono text-[0.65rem] uppercase px-2.5 py-1 border border-white/20 text-white/40 rounded-full">
              {participant.currentPhase.replace('_', ' ')}
            </div>
            <div className={`font-mono text-[0.65rem] uppercase px-2.5 py-1 border rounded-full transition-colors duration-400 ${badgeClass}`}>
              {badgeLabel}
            </div>
          </div>
          {onLogout && (
            <button 
              onClick={onLogout}
              className="font-mono text-[0.78rem] text-white/30 hover:text-white/70 transition-colors ml-2 bg-transparent border-none"
            >
              Logout
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className={`w-full ${isEdgeToEdge ? 'h-full flex flex-col' : 'max-w-[1200px] mx-auto px-[2.5rem] py-12'}`}>
        {renderCurrentPhase()}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.07] px-[2.5rem] py-4 flex justify-between items-center mt-auto">
        <div className="flex items-center gap-[1.5rem]">
          <div className="font-mono text-[0.65rem] uppercase text-white/40">BEHAVIORAL TRACKING</div>
          {['Click Events', 'Mouse Movement', 'Scroll Behavior', 'Navigation'].map(tracker => (
            <div key={tracker} className="flex items-center gap-1.5 transition-all duration-400">
              <div 
                className={`h-[5px] w-[5px] rounded-full transition-colors duration-400 ${
                  isTrackingActive ? 'bg-[#00bfdb] pulse-dot' : 'bg-white/[0.15]'
                }`} 
              />
              <span className="font-mono text-[0.72rem] text-white/40 transition-colors duration-400">
                {tracker}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {phaseOrder.map((phase, idx) => {
            const isActive = participant.currentPhase === phase || 
                             (phase === 'research' && isSelectingPlatform);
            return (
              <div key={phase} className="flex items-center gap-2">
                <div className={`font-mono text-[0.65rem] uppercase px-[10px] py-[3px] border rounded-[4px] ${
                  isActive 
                    ? 'border-[#00bfdb] bg-[#00bfdb]/[0.08] text-[#00bfdb]' 
                    : 'border-white/[0.07] text-white/40 opacity-40'
                }`}>
                  {phase.replace('_', ' ')}
                </div>
                {idx < phaseOrder.length - 1 && (
                  <div className="font-mono text-[0.7rem] text-white/40 px-1">�</div>
                )}
              </div>
            );
          })}
        </div>
      </footer>
    </div>
  );
};
