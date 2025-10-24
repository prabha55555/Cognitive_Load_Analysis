import { Brain, Clock, MessageSquare, Search, Sparkles, Target } from 'lucide-react';
import { useState } from 'react';
import { isApiKeyAvailable } from '../config/api';
import { Participant } from '../types';
import { ApiKeyStatus } from './ApiKeyStatus';

interface PlatformSelectionProps {
  participant: Participant;
  onPlatformSelect: (platform: 'chatgpt' | 'google') => void;
}

export const PlatformSelection: React.FC<PlatformSelectionProps> = ({
  participant,
  onPlatformSelect
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<'chatgpt' | 'grok' | 'google' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiStatus, setShowApiStatus] = useState(false);

  const geminiAvailable = isApiKeyAvailable('gemini'); // ChatGPT interface uses Gemini


  const handlePlatformSelect = async (platform: 'chatgpt' | 'google') => {
    // Always allow platform selection - APIs will handle fallbacks gracefully
    setSelectedPlatform(platform);

    setSelectedPlatform(platform);
    setIsLoading(true);
    
    // Simulate loading time for platform setup
    setTimeout(() => {
      setIsLoading(false);
      onPlatformSelect(platform);
    }, 1500);
  };

  const platforms = [
    {
      id: 'chatgpt' as const,
      name: 'ChatGPT',
      description: 'AI-powered research assistant with direct Q&A interface',
      icon: MessageSquare,
      color: 'emerald',
      features: [
        'Direct question-answer interface',
        'AI-powered research assistance',
        'Real-time cognitive load monitoring',
        'Structured conversation tracking'
      ],
      setupTime: '2-3 minutes',
      requiresApiKey: true,
      apiKeyAvailable: geminiAvailable
    },
   
    {
      id: 'google' as const,
      name: 'Google Search',
      description: 'Traditional web search with enhanced analytics tracking',
      icon: Search,
      color: 'blue',
      features: [
        'Real Google search interface',
        'Search behavior analytics',
        'EEG/EDA data integration ready',
        'Comprehensive search tracking'
      ],
      setupTime: '1-2 minutes',
      requiresApiKey: false,
      apiKeyAvailable: true
    }
  ];

  if (showApiStatus) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <ApiKeyStatus onClose={() => setShowApiStatus(false)} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden">
          <div className="p-12 text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
              <Sparkles className="h-16 w-16 text-blue-600 relative z-10 mx-auto" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Setting up {selectedPlatform === 'chatgpt' ? 'ChatGPT' : selectedPlatform === 'grok' ? 'Grok' : 'Google Search'}...
            </h2>
            <p className="text-gray-600 mb-8">
              Configuring research interface and analytics tracking for optimal data collection.
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-slate-200/60 bg-gradient-to-r from-slate-50/80 to-white/80">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-lg opacity-40 animate-pulse"></div>
                <Target className="h-8 w-8 text-blue-600 relative z-10" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Choose Your Research Platform</h1>
            </div>
            <p className="text-gray-600 text-lg">
              Select your preferred research method for studying: <span className="font-semibold text-blue-700">{participant.researchTopic}</span>
            </p>
          </div>
        </div>

        {/* Platform Options */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {platforms.map((platform) => (
                              <div
                  key={platform.id}
                  className={`relative group transition-all duration-300 transform hover:scale-105 ${
                    selectedPlatform === platform.id ? 'ring-4 ring-blue-500' : ''
                  } cursor-pointer`}
                  onClick={() => handlePlatformSelect(platform.id)}
                >
                <div className={`bg-gradient-to-br from-${platform.color}-50/80 to-${platform.color}-100/80 rounded-2xl p-8 border-2 border-${platform.color}-200/60 backdrop-blur-sm h-full`}>
                  {/* Platform Icon */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative">
                      <div className={`absolute inset-0 bg-gradient-to-r from-${platform.color}-400 to-${platform.color}-600 rounded-full blur-xl opacity-40 animate-pulse`}></div>
                      <platform.icon className={`h-16 w-16 text-${platform.color}-600 relative z-10`} />
                    </div>
                  </div>

                  {/* Platform Info */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{platform.name}</h3>
                    <p className="text-gray-600 leading-relaxed">{platform.description}</p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Key Features:</h4>
                    {platform.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className={`w-2 h-2 bg-${platform.color}-500 rounded-full`}></div>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Setup Time */}
                  <div className={`bg-${platform.color}-100/60 p-4 rounded-xl border border-${platform.color}-200/60`}>
                    <div className="flex items-center justify-center space-x-2">
                      <Clock className={`h-4 w-4 text-${platform.color}-600`} />
                      <span className={`text-sm font-semibold text-${platform.color}-700`}>
                        Setup time: {platform.setupTime}
                      </span>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {selectedPlatform === platform.id && (
                    <div className="absolute top-4 right-4">
                      <div className={`bg-${platform.color}-600 text-white p-2 rounded-full`}>
                        <Sparkles className="h-5 w-5" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Research Topic Info */}
          <div className="mt-8 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 rounded-2xl p-6 border border-indigo-200/60">
            <div className="flex items-center space-x-3 mb-4">
              <Brain className="h-6 w-6 text-indigo-600" />
              <h3 className="text-lg font-bold text-gray-800">Research Topic</h3>
            </div>
            <div className="bg-white/80 p-4 rounded-xl border border-indigo-200/60">
              <p className="text-xl font-bold text-indigo-700">{participant.researchTopic}</p>
              <p className="text-sm text-gray-600 mt-2">
                Both platforms will help you research this topic while collecting cognitive load data for analysis.
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Click on your preferred platform to begin the research phase. 
              Your choice will determine the interface and data collection method used during the study.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
