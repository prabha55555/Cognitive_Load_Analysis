import React, { useState, useEffect } from 'react';
import { CreativityTest as CreativityTestType, TestResponse } from '../types';
import { Clock, CheckCircle, AlertCircle, Brain } from 'lucide-react';

interface CreativityTestProps {
  test: CreativityTestType;
  participantId: string;
  onComplete: (response: TestResponse) => void;
}

export const CreativityTest: React.FC<CreativityTestProps> = ({
  test,
  participantId,
  onComplete
}) => {
  const [response, setResponse] = useState('');
  const [timeLeft, setTimeLeft] = useState(test.timeLimit);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (timeLeft > 0 && !isCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isCompleted) {
      handleSubmit();
    }
  }, [timeLeft, isCompleted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateScore = (response: string, testType: CreativityTestType['type']): number => {
    // Simplified scoring algorithm
    const wordCount = response.trim().split(/\s+/).length;
    const uniqueWords = new Set(response.toLowerCase().split(/\s+/)).size;
    
    switch (testType) {
      case 'fluency':
        // Score based on quantity and variety
        return Math.min(100, (wordCount * 2) + (uniqueWords * 0.5));
      case 'originality':
        // Score based on uniqueness and depth
        return Math.min(100, (uniqueWords * 1.5) + (wordCount * 0.8));
      case 'divergent':
        // Score based on different ideas/perspectives
        const ideas = response.split(/[.!?]/).filter(s => s.trim().length > 0);
        return Math.min(100, (ideas.length * 8) + (uniqueWords * 0.3));
      default:
        return Math.min(100, wordCount * 1.2);
    }
  };

  const handleSubmit = () => {
    if (isCompleted) return;
    
    const score = calculateScore(response, test.type);
    const testResponse: TestResponse = {
      participantId,
      testId: test.id,
      response,
      timestamp: Date.now(),
      score
    };
    
    setIsCompleted(true);
    onComplete(testResponse);
  };

  const getTestTypeColor = (type: string) => {
    switch (type) {
      case 'fluency': return 'text-blue-600';
      case 'originality': return 'text-purple-600';
      case 'divergent': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getTestTypeIcon = () => {
    return <Brain className="h-5 w-5" />;
  };

  if (isCompleted) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-green-800 mb-2">Test Completed!</h2>
          <p className="text-green-700">Thank you for completing the creativity assessment.</p>
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
            <div className="flex items-center space-x-3">
              {getTestTypeIcon()}
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">Creativity Assessment</h2>
                <span className={`text-sm font-medium ${getTestTypeColor(test.type)}`}>
                  {test.type.charAt(0).toUpperCase() + test.type.slice(1)} Test
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className={`h-5 w-5 ${timeLeft < 60 ? 'text-red-500' : 'text-blue-500'}`} />
              <span className={`text-lg font-mono ${timeLeft < 60 ? 'text-red-600' : 'text-blue-600'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="p-6">
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-800 mb-4">
              {test.question}
            </label>
            {timeLeft < 60 && (
              <div className="flex items-center space-x-2 mb-4 p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-800 text-sm">Less than 1 minute remaining!</span>
              </div>
            )}
          </div>

          {/* Response Area */}
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Type your creative response here..."
            className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base"
            disabled={isCompleted}
          />

          {/* Word Count and Submit */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-500">
              {response.trim().split(/\s+/).filter(word => word.length > 0).length} words
            </span>
            <button
              onClick={handleSubmit}
              disabled={!response.trim() || isCompleted}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Submit Response
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Instructions:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Be as creative and original as possible in your response</li>
            <li>• Don't worry about spelling or grammar - focus on ideas</li>
            <li>• Think outside the box and explore unusual perspectives</li>
            <li>• Use the full time available to develop your thoughts</li>
          </ul>
        </div>
      </div>
    </div>
  );
};