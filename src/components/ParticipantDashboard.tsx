import React, { useState } from 'react';
import { Participant } from '../types';
import { useEEGStream } from '../hooks/useEEGStream';
import { EEGVisualization } from './EEGVisualization';
import { ResearchInterface } from './ResearchInterface';
import { CreativityTest } from './CreativityTest';
import { creativityTests } from '../data/mockData';
import { User, Clock, Brain, Target } from 'lucide-react';

interface ParticipantDashboardProps {
  participant: Participant;
  onPhaseComplete: (phase: string) => void;
}

export const ParticipantDashboard: React.FC<ParticipantDashboardProps> = ({
  participant,
  onPhaseComplete
}) => {
  const { eegData, currentReading } = useEEGStream(participant.id, participant.isActive);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'research': return 'text-blue-600 bg-blue-100';
      case 'creativity_test': return 'text-purple-600 bg-purple-100';
      case 'completed': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPlatformColor = (platform: string) => {
    return platform === 'chatgpt' ? 'text-green-600 bg-green-100' : 'text-blue-600 bg-blue-100';
  };

  const sessionDuration = Math.floor((Date.now() - participant.sessionStart.getTime()) / 60000);

  const handleTestComplete = () => {
    if (currentTestIndex < creativityTests.length - 1) {
      setCurrentTestIndex(currentTestIndex + 1);
    } else {
      onPhaseComplete('completed');
    }
  };

  const renderCurrentPhase = () => {
    switch (participant.currentPhase) {
      case 'research':
        return (
          <ResearchInterface
            participant={participant}
            onComplete={() => onPhaseComplete('creativity_test')}
          />
        );
      case 'creativity_test':
        return (
          <CreativityTest
            test={creativityTests[currentTestIndex]}
            participantId={participant.id}
            onComplete={handleTestComplete}
          />
        );
      case 'completed':
        return (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
              <Target className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-green-800 mb-2">Session Complete!</h2>
              <p className="text-green-700 mb-4">
                Thank you for participating in this research study.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">Final Cognitive Load Score</p>
                  <p className="text-2xl font-bold text-blue-600">{participant.cognitiveLoadScore}%</p>
                </div>
                <div className="p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">Creativity Score</p>
                  <p className="text-2xl font-bold text-purple-600">{participant.creativityScore}</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <User className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-800">{participant.name}</h1>
                <p className="text-sm text-gray-500">{participant.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{sessionDuration} min</span>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPlatformColor(participant.assignedPlatform)}`}>
                {participant.assignedPlatform === 'chatgpt' ? 'ChatGPT' : 'Google Search'}
              </div>
              
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPhaseColor(participant.currentPhase)}`}>
                {participant.currentPhase.replace('_', ' ').toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Task Area */}
          <div className="lg:col-span-2">
            {renderCurrentPhase()}
          </div>

          {/* EEG Monitoring Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <EEGVisualization
                eegData={eegData}
                currentReading={currentReading}
                participantName={participant.name}
              />
              
              {/* Topic Information */}
              <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Brain className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Research Topic</h3>
                </div>
                <p className="text-2xl font-bold text-indigo-600 mb-2">{participant.researchTopic}</p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Current Score</p>
                    <p className="text-lg font-semibold text-gray-800">{participant.cognitiveLoadScore}%</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Test Progress</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {participant.currentPhase === 'creativity_test' ? `${currentTestIndex + 1}/${creativityTests.length}` : 
                       participant.currentPhase === 'completed' ? 'Done' : 'Starting'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};