import { Brain, CheckCircle, Clock, FileText, Lightbulb, MessageSquare, Search, Sparkles, Timer } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Participant } from '../types';
import { ChatGPTInterface } from './ChatGPTInterface';
import { GoogleSearchInterface } from './GoogleSearchInterface';
import { PlatformSelection } from './PlatformSelection';

interface ResearchInterfaceProps {
  participant: Participant;
  onComplete: (readingContent?: string, userNotes?: string) => void;
  onTopicChange?: (topic: string) => void;
}

export const ResearchInterface: React.FC<ResearchInterfaceProps> = ({
  participant,
  onComplete,
  onTopicChange
}) => {
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [queries, setQueries] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [pulseEffect, setPulseEffect] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'chatgpt' | 'google' | null>(null);
  const [currentResearchTopic, setCurrentResearchTopic] = useState(participant.researchTopic);

  // Animate pulse effect periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseEffect(true);
      setTimeout(() => setPulseEffect(false), 1000);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && isActive && selectedPlatform) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleTimeUp();
    }
  }, [timeLeft, isActive, selectedPlatform]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQuerySubmit = (query: string) => {
    setQueries(prev => [...prev, query]);
  };

  const handleSearchBehavior = (behavior: any) => {
    // Here you would send this data to your backend for analysis
    console.log('Search behavior tracked:', behavior);
  };

  const handleTopicChange = (newTopic: string) => {
    console.log('==========================================');
    console.log('🔄 TOPIC CHANGE IN RESEARCH INTERFACE');
    console.log('Old Topic:', currentResearchTopic);
    console.log('New Topic:', newTopic);
    console.log('Propagating to parent...');
    console.log('==========================================');
    
    setCurrentResearchTopic(newTopic);
    
    // Propagate topic change to parent (ParticipantDashboard)
    if (onTopicChange) {
      onTopicChange(newTopic);
      console.log('✅ Topic change propagated to ParticipantDashboard');
    } else {
      console.error('❌ onTopicChange prop not provided to ResearchInterface!');
    }
  };

  const handlePlatformSelect = (platform: 'chatgpt' | 'google') => {
    setSelectedPlatform(platform);
  };

  const handleTimeUp = () => {
    setIsActive(false);
    setTimeout(() => {
      // Pass reading content (queries joined) and notes to parent
      const readingContent = queries.join(' | ');
      onComplete(readingContent, notes);
    }, 2000);
  };

  // Show platform selection if no platform is selected
  if (!selectedPlatform) {
    return <PlatformSelection participant={participant} onPlatformSelect={handlePlatformSelect} />;
  }

  if (!isActive) {
    return (
      <div className="max-w-4xl mx-auto p-4 lg:p-6 xl:p-8">
        <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 border-2 border-amber-200/60 rounded-xl lg:rounded-2xl xl:rounded-3xl p-6 lg:p-8 xl:p-12 text-center backdrop-blur-sm shadow-xl">
          <div className="relative mb-6 lg:mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full blur-lg lg:blur-xl opacity-40 animate-pulse"></div>
            <Clock className="h-12 w-12 lg:h-14 lg:w-14 xl:h-16 xl:w-16 text-amber-600 relative z-10 mx-auto" />
          </div>
          <h2 className="text-2xl lg:text-3xl xl:text-4xl font-black text-amber-800 mb-3 lg:mb-4">Time's Up!</h2>
          <p className="text-amber-700 text-base lg:text-lg mb-6 lg:mb-8 font-medium">Moving to the creativity assessment phase...</p>
          <div className="bg-white/80 backdrop-blur-sm p-4 lg:p-5 xl:p-6 rounded-lg lg:rounded-xl xl:rounded-2xl border border-amber-200/60">
            <div className="flex items-center justify-center space-x-2">
              <Sparkles className="h-4 w-4 lg:h-5 lg:w-5 text-amber-600" />
              <span className="text-amber-700 text-sm lg:text-base font-semibold">Preparing next phase...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 lg:p-6 xl:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl lg:rounded-2xl xl:rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden">
          {/* Enhanced Header */}
          <div className="p-6 lg:p-8 xl:p-10 border-b border-slate-200/60 bg-gradient-to-r from-slate-50/80 to-white/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 lg:space-x-6">
                <div className="relative">
                  <div className={`absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl lg:rounded-2xl blur-lg opacity-40 ${pulseEffect ? 'animate-ping' : 'animate-pulse'}`}></div>
                  <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 p-3 lg:p-4 xl:p-5 rounded-xl lg:rounded-2xl shadow-lg">
                    <Brain className="h-6 w-6 lg:h-8 lg:w-8 xl:h-10 xl:w-10 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl lg:text-3xl xl:text-4xl font-black text-slate-800">Research Phase</h2>
                  <p className="text-base lg:text-lg xl:text-xl text-slate-600 mt-2 font-medium">
                    Research the topic: <span className="font-bold text-blue-700">{currentResearchTopic}</span>
                  </p>
                  <div className="flex items-center space-x-3 mt-3">
                    <div className={`px-4 lg:px-5 xl:px-6 py-2 lg:py-3 xl:py-3 rounded-full text-sm lg:text-base xl:text-lg font-medium ${
                      selectedPlatform === 'chatgpt' 
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      <div className="flex items-center space-x-2 lg:space-x-3">
                        {selectedPlatform === 'chatgpt' ? (
                          <>
                            <MessageSquare className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
                            <span>ChatGPT Interface</span>
                          </>
                        ) : (
                          <>
                            <Search className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
                            <span>Google Search Interface</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4 lg:space-x-6">
                <div className={`flex items-center space-x-3 lg:space-x-4 px-4 lg:px-5 xl:px-6 py-2 lg:py-3 xl:py-3 rounded-xl lg:rounded-2xl border-2 ${
                  timeLeft < 300 
                    ? 'bg-red-50/80 border-red-200/60 text-red-700' 
                    : 'bg-blue-50/80 border-blue-200/60 text-blue-700'
                } backdrop-blur-sm`}>
                  <Timer className={`h-5 w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 ${timeLeft < 300 ? 'text-red-500' : 'text-blue-500'}`} />
                  <span className={`text-xl lg:text-2xl xl:text-3xl font-black ${timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
            </div>
          </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8 xl:gap-10 p-6 lg:p-8 xl:p-10">
          {/* Platform Interface - Takes up 3/4 of the space on desktop */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-xl lg:rounded-2xl xl:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden h-[650px] lg:h-[750px] xl:h-[800px]">
              {selectedPlatform === 'chatgpt' ? (
                <ChatGPTInterface
                  participant={participant}
                  onQuerySubmit={handleQuerySubmit}
                  onTopicChange={handleTopicChange}
                />
              ) : (
                <GoogleSearchInterface
                  participant={participant}
                  onQuerySubmit={handleQuerySubmit}
                  onSearchBehavior={handleSearchBehavior}
                  onTopicChange={handleTopicChange}
                />
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Sidebar - Below chatbot in desktop view */}
        <div className="mt-6 lg:mt-8 xl:mt-10 space-y-4 lg:space-y-6 xl:space-y-8">
          {/* Research Statistics - Full width below chatbot */}
          <div className="bg-white rounded-lg lg:rounded-xl shadow-lg p-4 lg:p-6 border border-gray-100">
            <h3 className="text-lg lg:text-xl font-bold text-gray-800 mb-4 lg:mb-6">Research Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
              <div className="flex items-center justify-between p-3 lg:p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <span className="text-sm lg:text-base text-gray-700 font-medium">Queries Made</span>
            <span className="text-xl lg:text-2xl font-bold text-blue-600">{queries.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 lg:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
            <span className="text-sm lg:text-base text-gray-700 font-medium">Platform</span>
            <span className={`text-xs lg:text-sm font-medium px-2 lg:px-3 py-1 lg:py-2 rounded-full ${
              selectedPlatform === 'chatgpt' 
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                : 'bg-blue-100 text-blue-700 border border-blue-200'
            }`}>
              {selectedPlatform === 'chatgpt' ? 'ChatGPT' : 'Google'}
            </span>
              </div>
              <div className="flex items-center justify-between p-3 lg:p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
            <span className="text-sm lg:text-base text-gray-700 font-medium">Time Left</span>
            <span className={`text-xl lg:text-2xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-orange-600'}`}>
              {formatTime(timeLeft)}
            </span>
              </div>
            </div>
          </div>

          {/* Research Notes - Full width below statistics */}
          <div className="bg-white rounded-lg lg:rounded-xl shadow-lg p-4 lg:p-6 border border-gray-100">
            <div className="flex items-center space-x-3 mb-4 lg:mb-6">
              <div className="p-2 bg-yellow-100 rounded-full">
            <Lightbulb className="h-4 w-4 lg:h-5 lg:w-5 text-yellow-600" />
              </div>
              <label className="text-lg lg:text-xl font-bold text-slate-800">Research Notes</label>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Take notes about your research findings..."
              className="w-full h-32 lg:h-40 p-3 lg:p-4 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base leading-relaxed bg-white transition-all duration-300 resize-none"
            />
            <div className="flex justify-between items-center mt-3 lg:mt-4">
              <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <FileText className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">
              {notes.split(' ').filter(word => word.length > 0).length} words
            </span>
              </div>
              <button
            onClick={() => {
              const readingContent = queries.join(' | ');
              onComplete(readingContent, notes);
            }}
            className="px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-sm lg:text-base"
              >
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Finish Early</span>
            </div>
              </button>
            </div>
          </div>

          {/* Recent Queries - Full width below notes */}
          {queries.length > 0 && (
            <div className="bg-white rounded-lg lg:rounded-xl shadow-lg p-4 lg:p-6 border border-gray-100">
              <h3 className="text-lg lg:text-xl font-bold text-gray-800 mb-4 lg:mb-6">Recent Queries</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-3">
            {queries.slice(-6).map((query, index) => (
              <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 lg:p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
                <p className="text-sm lg:text-base text-gray-700">{query}</p>
              </div>
            ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};