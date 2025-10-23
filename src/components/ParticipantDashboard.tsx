import { Brain, CheckCircle, Clock, PauseCircle, PlayCircle, Target, User } from 'lucide-react';
import { useState } from 'react';
import { useEEGStream } from '../hooks/useEEGStream';
import { AssessmentResponse, Participant, TestResponse } from '../types';
import { AssessmentPhase } from './AssessmentPhase';
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
  participant,
  onPhaseComplete
}: ParticipantDashboardProps) => {
  const { eegData, currentReading } = useEEGStream(participant.id, participant.isActive);
  const [assessmentResponses, setAssessmentResponses] = useState<AssessmentResponse[] | undefined>(participant.assessmentResponses);
  const [creativityEvaluations, setCreativityEvaluations] = useState<CreativityEvaluation[]>([]);
  const [readingContent, setReadingContent] = useState<string>('');
  const [userNotes, setUserNotes] = useState<string>('');

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
    return platform === 'chatgpt' 
      ? 'text-green-600 bg-green-100 border-green-200' 
      : 'text-blue-600 bg-blue-100 border-blue-200';
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
    console.log('Creativity test complete:', { responses, evaluations });
    setCreativityEvaluations(evaluations);
    onPhaseComplete('completed');
  };

  const handleAssessmentComplete = (responses: AssessmentResponse[]) => {
    setAssessmentResponses(responses);
    onPhaseComplete('results');
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
            onComplete={() => onPhaseComplete('creativity_test')}
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
                  <p className="text-4xl font-bold text-blue-600">{participant.cognitiveLoadScore}%</p>
                  <p className="text-sm text-gray-500 mt-2">Average cognitive load during session</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-green-200">
                  <div className="flex items-center justify-center mb-4">
                    <Target className="h-8 w-8 text-purple-600 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-800">Creativity Score</h3>
                  </div>
                  <p className="text-4xl font-bold text-purple-600">{participant.creativityScore}</p>
                  <p className="text-sm text-gray-500 mt-2">Overall creativity assessment</p>
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
                    <p className="text-2xl font-bold text-gray-800">
                      {participant.assignedPlatform === 'chatgpt' ? 'ChatGPT' : 'Google'}
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
                      <span>ChatGPT</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Google Search</span>
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