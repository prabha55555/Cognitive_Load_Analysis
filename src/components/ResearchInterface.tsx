import React, { useState, useEffect } from 'react';
import { Participant } from '../types';
import { Search, ExternalLink, Clock, MessageSquare, FileText } from 'lucide-react';

interface ResearchInterfaceProps {
  participant: Participant;
  onComplete: () => void;
}

export const ResearchInterface: React.FC<ResearchInterfaceProps> = ({
  participant,
  onComplete
}) => {
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [queries, setQueries] = useState<string[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (timeLeft > 0 && isActive) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleTimeUp();
    }
  }, [timeLeft, isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSearch = () => {
    if (currentQuery.trim()) {
      setQueries([...queries, currentQuery.trim()]);
      setCurrentQuery('');
    }
  };

  const handleTimeUp = () => {
    setIsActive(false);
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  const renderPlatformInterface = () => {
    if (participant.assignedPlatform === 'chatgpt') {
      return (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <span className="font-medium text-gray-800">ChatGPT Research Assistant</span>
            </div>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-600 mb-2">System:</p>
                <p className="text-gray-800">
                  I'm here to help you research "{participant.researchTopic}". 
                  Ask me specific questions and I'll provide detailed, accurate information.
                </p>
              </div>
              {queries.map((query, index) => (
                <div key={index} className="space-y-2">
                  <div className="bg-blue-50 p-3 rounded-lg ml-8">
                    <p className="text-sm text-blue-800">You: {query}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-2">ChatGPT:</p>
                    <p className="text-gray-800">
                      {/* Simulated AI response */}
                      Based on current research, {participant.researchTopic.toLowerCase()} involves multiple 
                      interconnected factors. Here are the key considerations... [This would be a detailed 
                      AI-generated response about the topic]
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Search className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-800">Google Search Results</span>
            </div>
            {queries.map((query, index) => (
              <div key={index} className="mb-4 p-3 bg-white rounded-lg border">
                <p className="text-sm text-gray-600 mb-2">Search: "{query}"</p>
                <div className="space-y-3">
                  {[1, 2, 3].map((result) => (
                    <div key={result} className="border-l-2 border-blue-500 pl-3">
                      <div className="flex items-center space-x-2">
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                        <a href="#" className="text-blue-600 hover:underline text-sm">
                          Research Article {result} - {participant.researchTopic}
                        </a>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Comprehensive analysis of {participant.researchTopic.toLowerCase()} 
                        with evidence-based solutions...
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  if (!isActive) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <Clock className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-yellow-800 mb-2">Time's Up!</h2>
          <p className="text-yellow-700">Moving to the creativity assessment phase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Research Phase</h2>
              <p className="text-gray-600 mt-1">
                Research the topic: <span className="font-semibold">{participant.researchTopic}</span>
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className={`h-5 w-5 ${timeLeft < 300 ? 'text-red-500' : 'text-blue-500'}`} />
              <span className={`text-lg font-mono ${timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Search Interface */}
        <div className="p-6">
          <div className="flex space-x-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                value={currentQuery}
                onChange={(e) => setCurrentQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={
                  participant.assignedPlatform === 'chatgpt' 
                    ? `Ask ChatGPT about ${participant.researchTopic}...`
                    : `Search Google for ${participant.researchTopic}...`
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!currentQuery.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {participant.assignedPlatform === 'chatgpt' ? 'Ask' : 'Search'}
            </button>
          </div>

          {/* Platform-specific Interface */}
          {renderPlatformInterface()}
        </div>

        {/* Notes Section */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <FileText className="h-5 w-5 text-gray-600" />
            <label className="font-medium text-gray-800">Research Notes</label>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Take notes about your research findings..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">
              {queries.length} queries made • {notes.split(' ').filter(word => word.length > 0).length} notes words
            </span>
            <button
              onClick={onComplete}
              className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              Finish Early
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};