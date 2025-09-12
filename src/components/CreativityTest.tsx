import { AlertCircle, ArrowRight, Brain, CheckCircle, Lightbulb, Sparkles, Target, Timer, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { CreativityTest as CreativityTestType, TestResponse } from '../types';

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
  const [pulseEffect, setPulseEffect] = useState(false);

  // Animate pulse effect periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseEffect(true);
      setTimeout(() => setPulseEffect(false), 1000);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
      case 'divergent': return 'text-emerald-600';
      default: return 'text-slate-600';
    }
  };

  const getTestTypeBg = (type: string) => {
    switch (type) {
      case 'fluency': return 'bg-blue-50/80 border-blue-200/60';
      case 'originality': return 'bg-purple-50/80 border-purple-200/60';
      case 'divergent': return 'bg-emerald-50/80 border-emerald-200/60';
      default: return 'bg-slate-50/80 border-slate-200/60';
    }
  };

  const getTestTypeIcon = () => {
    return <Brain className="h-6 w-6" />;
  };

  if (isCompleted) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/80 border-2 border-emerald-200/60 rounded-3xl p-12 text-center backdrop-blur-sm shadow-2xl">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full blur-xl opacity-40 animate-pulse"></div>
            <CheckCircle className="h-16 w-16 text-emerald-600 relative z-10 mx-auto" />
          </div>
          <h2 className="text-4xl font-black text-emerald-800 mb-4">Test Completed!</h2>
          <p className="text-emerald-700 text-lg font-medium mb-8">Thank you for completing the creativity assessment.</p>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-emerald-200/60">
            <div className="flex items-center justify-center space-x-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Moving to next phase...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden">
        {/* Enhanced Header */}
        <div className="p-8 border-b border-slate-200/60 bg-gradient-to-r from-slate-50/80 to-white/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className={`absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600 rounded-2xl blur-xl opacity-40 ${pulseEffect ? 'animate-ping' : 'animate-pulse'}`}></div>
                <div className="relative bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                  {getTestTypeIcon()}
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800">Creativity Assessment</h2>
                <span className={`text-lg font-bold ${getTestTypeColor(test.type)}`}>
                  {test.type.charAt(0).toUpperCase() + test.type.slice(1)} Test
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-3 px-4 py-2 rounded-2xl border-2 ${
                timeLeft < 60 
                  ? 'bg-red-50/80 border-red-200/60 text-red-700' 
                  : 'bg-blue-50/80 border-blue-200/60 text-blue-700'
              } backdrop-blur-sm`}>
                <Timer className={`h-5 w-5 ${timeLeft < 60 ? 'text-red-500' : 'text-blue-500'}`} />
                <span className={`text-xl font-black ${timeLeft < 60 ? 'text-red-600' : 'text-blue-600'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Question */}
        <div className="p-8">
          <div className="mb-8">
            <div className={`p-6 rounded-2xl ${getTestTypeBg(test.type)} backdrop-blur-sm border-2 mb-6`}>
              <div className="flex items-center space-x-3 mb-4">
                <Lightbulb className="h-6 w-6 text-yellow-600" />
                <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Question</span>
              </div>
              <label className="block text-2xl font-bold text-slate-800 leading-relaxed">
                {test.question}
              </label>
            </div>
            
            {timeLeft < 60 && (
              <div className="flex items-center space-x-3 mb-6 p-4 bg-gradient-to-br from-amber-50/80 to-orange-50/80 rounded-2xl border-2 border-amber-200/60 backdrop-blur-sm">
                <AlertCircle className="h-6 w-6 text-amber-600" />
                <span className="text-amber-800 font-semibold">Less than 1 minute remaining!</span>
              </div>
            )}
          </div>

          {/* Enhanced Response Area */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <Target className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Your Response</span>
            </div>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Type your creative response here... Be as creative and original as possible!"
              className="w-full h-80 p-6 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-lg leading-relaxed bg-white/80 backdrop-blur-sm transition-all duration-300"
              disabled={isCompleted}
            />
          </div>

          {/* Enhanced Word Count and Submit */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-slate-50/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200/60">
                <Zap className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">
                  {response.trim().split(/\s+/).filter(word => word.length > 0).length} words
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-50/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200/60">
                <Sparkles className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">
                  {new Set(response.toLowerCase().split(/\s+/)).size} unique words
                </span>
              </div>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={!response.trim() || isCompleted}
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 via-purple-600 to-pink-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-3xl disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-3">
                <CheckCircle className="h-5 w-5" />
                <span>Submit Response</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </button>
          </div>
        </div>

        {/* Enhanced Instructions */}
        <div className="p-8 bg-gradient-to-br from-slate-50/80 to-slate-100/80 border-t border-slate-200/60 backdrop-blur-sm">
          <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center">
            <Brain className="h-5 w-5 mr-3 text-purple-600" />
            Instructions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-700">Be as creative and original as possible</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-700">Don't worry about spelling or grammar</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-700">Think outside the box</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-700">Use the full time available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};