import { Brain, CheckCircle, Clock, PauseCircle, PlayCircle, Target, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEEGStream } from '../hooks/useEEGStream';
import { useBehavior } from '../context';
import { AssessmentResponse, Participant, TestResponse } from '../types';
import AssessmentPhase from './AssessmentPhase';
import { CognitiveLoadResults } from './CognitiveLoadResults';
import { CreativityTest } from './CreativityTest';
import { EEGVisualization } from './EEGVisualization';
import { ResearchInterface } from './ResearchInterface';
import { CreativityEvaluation } from '../services/geminiService';

interface ParticipantDashboardProps {
  participant: Participant;
  onPhaseComplete: (phase: string) => void;
}

export const ParticipantDashboard = ({
  participant: initialParticipant,
  onPhaseComplete
}: ParticipantDashboardProps) => {
  // Use local state to manage participant data including topic changes
  const [participant, setParticipant] = useState<Participant>(initialParticipant);
  
  // Sync with parent participant updates
  useEffect(() => {
    setParticipant(initialParticipant);
  }, [initialParticipant]);
  
  // Get behavior modifiers for EEG modulation
  const { getModifiers } = useBehavior();
  const behaviorModifiers = getModifiers();
  
  // Use EEG stream with cognitive load score and behavior modifiers
  const { eegData, currentReading, isLoading: eegLoading, error: eegError } = useEEGStream(
    participant.id, 
    participant.isActive,
    {
      cognitiveLoadScore: participant.cognitiveLoadScore || 50,
      platform: participant.platform as 'chatgpt' | 'google',
      useChronos: true, // Enable Chronos-based generation
      behaviorModifiers, // Pass behavior data for EEG modulation
      pollingInterval: 2500, // Poll every 2.5s for behavior updates
    }
  );
  const [assessmentResponses, setAssessmentResponses] = useState<AssessmentResponse[] | undefined>(participant.assessmentResponses);
  const [creativityEvaluations, setCreativityEvaluations] = useState<CreativityEvaluation[]>([]);
  const [readingContent, setReadingContent] = useState<string>('');
  const [userNotes, setUserNotes] = useState<string>('');

  // Log when scores change
  useEffect(() => {
    console.log('📊 SCORES UPDATED:');
    console.log('Cognitive Load Score:', participant.cognitiveLoadScore);
    console.log('Creativity Score:', participant.creativityScore);
  }, [participant.cognitiveLoadScore, participant.creativityScore]);

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'research': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'assessment': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'results': return 'text-green-600 bg-green-100 border-green-200';
      case 'creativity_test': return 'text-pink-600 bg-pink-100 border-pink-200';
      case 'completed': return 'text-emerald-600 bg-emerald-100 border-emerald-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'chatgpt':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'google':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'research': return <PlayCircle className="h-4 w-4" />;
      case 'assessment': return <Target className="h-4 w-4" />;
      case 'results': return <CheckCircle className="h-4 w-4" />;
      case 'creativity_test': return <Brain className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <PauseCircle className="h-4 w-4" />;
    }
  };

  const sessionDuration = Math.floor((Date.now() - participant.sessionStart.getTime()) / 60000);

  const handleCreativityComplete = (responses: TestResponse[], evaluations: CreativityEvaluation[]) => {
    console.log('==========================================');
    console.log('🎨 CREATIVITY TEST COMPLETE');
    console.log('Responses received:', responses.length);
    console.log('Evaluations received:', evaluations.length);
    console.log('Current participant state BEFORE update:', participant);
    
    // Calculate creativity score from evaluations
    const creativityScore = evaluations.length > 0 
      ? Math.round(evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length)
      : 0;
    
    console.log('==========================================');
    console.log('📊 CREATIVITY SCORE CALCULATION');
    console.log('Number of evaluations:', evaluations.length);
    console.log('Individual scores:', evaluations.map(e => e.score));
    console.log('Sum of scores:', evaluations.reduce((sum, e) => sum + e.score, 0));
    console.log('Calculated average:', creativityScore);
    console.log('==========================================');
    
    // Save evaluations first
    setCreativityEvaluations(evaluations);
    
    // Update participant with creativity score
    setParticipant(prev => ({
      ...prev,
      creativityScore: creativityScore
    }));
    
    console.log('✅ Creativity score set to:', creativityScore);
    console.log('⏳ Waiting 500ms before phase transition to ensure state update...');
    
    // Use setTimeout OUTSIDE setState to ensure state updates complete before phase change
    setTimeout(() => {
      console.log('==========================================');
      console.log('🚀 TRANSITIONING TO COMPLETED PHASE');
      console.log('Creativity Score after state update:', creativityScore);
      console.log('==========================================');
      onPhaseComplete('completed');
    }, 500);
  };

  const handleAssessmentComplete = (responses: AssessmentResponse[]) => {
    console.log('==========================================');
    console.log('📝 ASSESSMENT COMPLETE');
    console.log('Responses count:', responses.length);
    console.log('Responses:', responses);
    console.log('==========================================');
    
    setAssessmentResponses(responses);
    onPhaseComplete('results');
  };
  
  const handleResultsComplete = (cognitiveLoadScore: number) => {
    console.log('==========================================');
    console.log('🧠 COGNITIVE LOAD RESULTS COMPLETE');
    console.log('Received cognitive load score:', cognitiveLoadScore);
    console.log('Type of score:', typeof cognitiveLoadScore);
    console.log('Is valid number?:', !isNaN(cognitiveLoadScore));
    console.log('Current participant state BEFORE update:', participant);
    
    // Update participant with cognitive load score before moving to creativity test
    setParticipant(prev => {
      const rounded = Math.round(cognitiveLoadScore);
      const updated = {
        ...prev,
        cognitiveLoadScore: rounded
      };
      console.log('Updated participant state AFTER update:', updated);
      console.log('Previous cognitive load score:', prev.cognitiveLoadScore);
      console.log('New cognitive load score:', updated.cognitiveLoadScore);
      console.log('Cognitive load score saved:', rounded);
      return updated;
    });
    
    console.log('✅ Cognitive load score saved:', Math.round(cognitiveLoadScore));
    console.log('⏳ Waiting 300ms before phase transition to ensure state update...');
    console.log('==========================================');
    
    // Use setTimeout to ensure state updates complete before phase change
    setTimeout(() => {
      console.log('🚀 Transitioning to creativity_test phase...');
      onPhaseComplete('creativity_test');
    }, 300);
  };

  // CRITICAL: Handle topic changes from research interfaces
  const handleTopicChange = (newTopic: string) => {
    console.log('==========================================');
    console.log('🔄 TOPIC CHANGE DETECTED IN PARTICIPANT DASHBOARD');
    console.log('Previous Topic:', participant.researchTopic);
    console.log('New Topic:', newTopic);
    console.log('Participant ID:', participant.id);
    console.log('==========================================');
    
    // CRITICAL: Force re-render by creating completely new object
    setParticipant(prev => {
      const updated = {
        ...prev,
        researchTopic: newTopic.trim(),
        // Add timestamp to force React to detect the change
        _topicUpdatedAt: Date.now()
      };
      
      console.log('📝 Created new participant object');
      console.log('Previous researchTopic:', prev.researchTopic);
      console.log('New researchTopic:', updated.researchTopic);
      console.log('Timestamp added:', updated._topicUpdatedAt);
      
      return updated;
    });
    
    console.log('✅ Participant state update queued');
    console.log('React will re-render with new topic:', newTopic);
    console.log('==========================================');
  };

  const renderCurrentPhase = () => {
    switch (participant.currentPhase) {
      case 'research':
        return (
          <ResearchInterface
            participant={participant}
            onComplete={(content, notes) => {
              setReadingContent(content || '');
              setUserNotes(notes || '');
              onPhaseComplete('assessment');
            }}
            onTopicChange={handleTopicChange}
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
        console.log('==========================================');
        console.log('🎉 RENDERING COMPLETED PHASE');
        console.log('Participant object:', participant);
        console.log('Cognitive Load Score from participant:', participant.cognitiveLoadScore);
        console.log('Creativity Score from participant:', participant.creativityScore);
        console.log('Type of Cognitive Load Score:', typeof participant.cognitiveLoadScore);
        console.log('Type of Creativity Score:', typeof participant.creativityScore);
        console.log('Is Cognitive Load Score defined?:', participant.cognitiveLoadScore !== undefined);
        console.log('Is Creativity Score defined?:', participant.creativityScore !== undefined);
        
        // Add null checks and defaults
        const finalCognitiveScore = participant.cognitiveLoadScore ?? 0;
        const finalCreativityScore = participant.creativityScore ?? 0;
        
        console.log('Final scores to display:');
        console.log('- Cognitive Load:', finalCognitiveScore);
        console.log('- Creativity:', finalCreativityScore);
        console.log('==========================================');
        
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
                    <p className="text-xs text-amber-600 mt-2">⚠️ Score not calculated</p>
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
                    <p className="text-xs text-amber-600 mt-2">⚠️ Score not calculated</p>
                  )}
                </div>
              </div>
              <div className="mt-8 p-6 bg-white rounded-xl shadow-lg border border-green-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Study Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{sessionDuration}</p>
                    <p className="text-sm text-gray-500">Minutes</p>
                  </div>
                  <div>
                    <p className="text-l font-bold text-gray-800">
                      {/* {participant.assignedPlatform === 'chatgpt' ? 'ChatGPT' : 
                       participant.assignedPlatform === 'google' ? 'Google' : 
                       'Research'} */}
                       Cognitive Load
                    </p>
                    <p className="text-sm text-gray-500">Platform Used</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{creativityEvaluations.length}</p>
                    <p className="text-sm text-gray-500">Tests Completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">100%</p>
                    <p className="text-sm text-gray-500">Data Quality</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Enhanced Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-lg opacity-30 animate-pulse"></div>
                  <User className="h-8 w-8 text-blue-600 relative z-10" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">{participant.name}</h1>
                  <p className="text-sm text-gray-500">{participant.email}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{sessionDuration} min</span>
              </div>
              
              <div className={`px-4 py-2 rounded-full text-sm font-medium border ${getPlatformColor(participant.assignedPlatform)}`}>
                <div className="flex items-center space-x-2">
                  {participant.assignedPlatform === 'chatgpt' ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Cognitive Load</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Cognitive Load</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className={`px-4 py-2 rounded-full text-sm font-medium border ${getPhaseColor(participant.currentPhase)}`}>
                <div className="flex items-center space-x-2">
                  {getPhaseIcon(participant.currentPhase)}
                  <span>{participant.currentPhase.replace('_', ' ').toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
          {/* Main Task Area */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {renderCurrentPhase()}
            </div>
          </div>

          {/* Enhanced EEG Monitoring Sidebar */}
          <div className="xl:col-span-2">
            <div className="sticky top-8 space-y-8">
              <EEGVisualization
                eegData={eegData}
                currentReading={currentReading}
                participantName={participant.name}
                connected={!eegError}
              />
              
              {/* Topic Information */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-lg opacity-30 animate-pulse"></div>
                    <Brain className="h-8 w-8 text-indigo-600 relative z-10" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Research Topic</h3>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200 mb-6">
                  <p className="text-2xl font-bold text-indigo-600">{participant.researchTopic}</p>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                    <p className="text-sm text-gray-600 mb-2">Current Score</p>
                    <p className="text-3xl font-bold text-blue-600">{participant.cognitiveLoadScore}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                    <p className="text-sm text-gray-600 mb-2">Test Progress</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {participant.currentPhase === 'creativity_test' ? '3 Questions' : 
                       participant.currentPhase === 'completed' ? 'Done' : 'Starting'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Study Progress</h3>
                <div className="space-y-4">
                  {['research', 'assessment', 'results', 'creativity_test', 'completed'].map((phase) => {
                    const phaseOrder = ['research', 'assessment', 'results', 'creativity_test', 'completed'];
                    const currentIndex = phaseOrder.indexOf(participant.currentPhase);
                    const thisIndex = phaseOrder.indexOf(phase);
                    const isCompleted = thisIndex < currentIndex;
                    const isCurrent = thisIndex === currentIndex;

                    return (
                      <div key={phase} className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCurrent 
                            ? 'bg-blue-600 text-white' 
                            : isCompleted
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {isCurrent ? (
                            <PlayCircle className="h-5 w-5" />
                          ) : isCompleted ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                          )}
                        </div>
                        <span className={`text-base font-medium ${
                          isCurrent 
                            ? 'text-blue-600' 
                            : isCompleted
                            ? 'text-green-600'
                            : 'text-gray-500'
                        }`}>
                          {phase.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};