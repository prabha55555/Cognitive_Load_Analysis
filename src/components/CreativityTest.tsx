import { AlertCircle, ArrowRight, Brain, CheckCircle, Lightbulb, Sparkles, Target, Timer, Zap } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { geminiService, CreativityQuestion, CreativityEvaluation } from '../services/geminiService';
import { useBehavior } from '../context';
import { TestResponse } from '../types';

interface CreativityTestProps {
  topic: string;
  notes: string;
  participantId: string;
  onComplete: (responses: TestResponse[], evaluations: CreativityEvaluation[]) => void;
}

export const CreativityTest: React.FC<CreativityTestProps> = ({
  topic,
  notes,
  participantId,
  onComplete
}) => {
  const [questions, setQuestions] = useState<CreativityQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [responses, setResponses] = useState<TestResponse[]>([]);
  const [evaluations, setEvaluations] = useState<CreativityEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [pulseEffect, setPulseEffect] = useState(false);

  // Behavior tracking for EEG modulation
  const { addEvent, setPhase } = useBehavior();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastResponseLengthRef = useRef(0);

  // Track phase start
  useEffect(() => {
    setPhase('creativity');
    addEvent('phase_started', 0.5, { phase: 'creativity', topic });
  }, [setPhase, addEvent, topic]);

  // Pulse animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseEffect(true);
      setTimeout(() => setPulseEffect(false), 1000);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Generate questions on mount
  useEffect(() => {
    generateQuestions();
  }, [topic, notes]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !isCompleted && !isEvaluating) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      
      // Track time warnings for EEG modulation
      if (timeLeft === 60) { // 1 minute left
        addEvent('time_warning', 0.7, { minutesRemaining: 1, phase: 'creativity', questionIndex: currentQuestionIndex });
      } else if (timeLeft === 30) { // 30 seconds left
        addEvent('time_warning', 0.85, { secondsRemaining: 30, phase: 'creativity', questionIndex: currentQuestionIndex });
      } else if (timeLeft === 10) { // 10 seconds left
        addEvent('time_warning', 0.95, { secondsRemaining: 10, phase: 'creativity', questionIndex: currentQuestionIndex });
      }
      
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && questions.length > 0 && !isCompleted && !isEvaluating) {
      handleSubmit();
    }
  }, [timeLeft, isCompleted, isEvaluating, addEvent, currentQuestionIndex]);

  const generateQuestions = async () => {
    setIsLoading(true);
    try {
      console.log('Generating creativity questions for topic:', topic);
      const generated = await geminiService.generateCreativityQuestions(topic, notes);
      console.log('Generated questions:', generated);
      
      setQuestions(generated);
      if (generated.length > 0) {
        setTimeLeft(generated[0].timeLimit);
        setStartTime(Date.now());
        
        // Track first question start for EEG modulation
        addEvent('question_started', 0.6, {
          questionIndex: 0,
          questionType: generated[0].type,
          timeLimit: generated[0].timeLimit,
        });
      }
    } catch (error) {
      console.error('Failed to generate questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (isEvaluating || !response.trim()) return;
    
    setIsEvaluating(true);
    const currentQuestion = questions[currentQuestionIndex];
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    console.log('==========================================');
    console.log('🎨 CREATIVITY TEST - SUBMITTING RESPONSE');
    console.log('Question ID:', currentQuestion.id);
    console.log('Question:', currentQuestion.question);
    console.log('Question Type:', currentQuestion.type);
    console.log('Topic:', currentQuestion.topic);
    console.log('Response length:', response.length, 'characters');
    console.log('Response word count:', response.trim().split(/\s+/).length, 'words');
    console.log('Time spent:', timeSpent, 'seconds');
    console.log('Time limit:', currentQuestion.timeLimit, 'seconds');
    console.log('Time usage:', ((timeSpent / currentQuestion.timeLimit) * 100).toFixed(1) + '%');
    console.log('Response preview:', response.substring(0, 200));
    console.log('==========================================');

    try {
      console.log('📡 Calling Gemini AI for evaluation...');
      console.log('Using geminiService.evaluateCreativityResponse()');
      
      // Evaluate response using Gemini AI
      const evaluation = await geminiService.evaluateCreativityResponse(
        currentQuestion,
        response,
        timeSpent
      );

      console.log('==========================================');
      console.log('✅ EVALUATION RECEIVED FROM GEMINI');
      console.log('Overall Score:', evaluation.score);
      console.log('Relevance Score:', evaluation.relevanceScore);
      console.log('Creativity Score:', evaluation.creativityScore);
      console.log('Depth Score:', evaluation.depthScore);
      console.log('Coherence Score:', evaluation.coherenceScore);
      console.log('Time Efficiency Score:', evaluation.timeEfficiencyScore);
      console.log('Feedback:', evaluation.feedback);
      console.log('Strengths:', evaluation.strengths);
      console.log('Improvements:', evaluation.improvements);
      console.log('Cognitive Load Indicators:', evaluation.cognitiveLoadIndicators);
      console.log('==========================================');

      const testResponse: TestResponse = {
        participantId,
        testId: currentQuestion.id,
        response,
        timestamp: Date.now(),
        score: evaluation.score
      };

      // Track creative response submission for EEG modulation
      addEvent('creative_response_submitted', 0.7, {
        questionIndex: currentQuestionIndex,
        questionType: currentQuestion.type,
        responseLength: response.length,
        wordCount: response.trim().split(/\s+/).length,
        timeSpent,
        score: evaluation.score,
        creativityScore: evaluation.creativityScore,
      });

      const newResponses = [...responses, testResponse];
      const newEvaluations = [...evaluations, evaluation];
      
      setResponses(newResponses);
      setEvaluations(newEvaluations);

      console.log('==========================================');
      console.log('📊 UPDATED STATE');
      console.log('Total responses:', newResponses.length);
      console.log('Total evaluations:', newEvaluations.length);
      console.log('All evaluation scores:', newEvaluations.map(e => e.score));
      console.log('==========================================');

      // Move to next question or complete
      if (currentQuestionIndex < questions.length - 1) {
        console.log('➡️ Moving to next question:', currentQuestionIndex + 1);
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setResponse('');
        setTimeLeft(questions[nextIndex].timeLimit);
        setStartTime(Date.now());
        
        // Track next question start for EEG modulation
        addEvent('question_started', 0.6, {
          questionIndex: nextIndex,
          questionType: questions[nextIndex].type,
          timeLimit: questions[nextIndex].timeLimit,
        });
      } else {
        setIsCompleted(true);
        console.log('==========================================');
        console.log('🎨 CREATIVITY ASSESSMENT COMPLETE');
        console.log('Total Responses:', newResponses.length);
        console.log('Total Evaluations:', newEvaluations.length);
        console.log('All Evaluations:', newEvaluations);
        console.log('Evaluation Scores:', newEvaluations.map(e => e.score));
        console.log('Average Score:', newEvaluations.reduce((sum, e) => sum + e.score, 0) / newEvaluations.length);
        console.log('Calling onComplete with:', { responses: newResponses, evaluations: newEvaluations });
        console.log('==========================================');
        onComplete(newResponses, newEvaluations);
      }
    } catch (error) {
      console.error('==========================================');
      console.error('❌ ERROR DURING EVALUATION');
      console.error('Error:', error);
      console.error('Question:', currentQuestion.question);
      console.error('Response:', response.substring(0, 100));
      console.error('==========================================');
      alert('Error evaluating response. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Handle response input with typing activity tracking
  const handleResponseChange = (newResponse: string) => {
    setResponse(newResponse);
    
    // Track typing bursts (debounced to avoid too many events)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      const wordsTyped = newResponse.trim().split(/\s+/).filter(w => w).length;
      const previousWords = lastResponseLengthRef.current;
      const wordsDelta = wordsTyped - previousWords;
      
      // Only track significant typing activity (5+ new words)
      if (wordsDelta >= 5) {
        addEvent('creative_typing', 0.4, {
          questionIndex: currentQuestionIndex,
          wordCount: wordsTyped,
          wordsDelta,
          timeRemaining: timeLeft,
        });
        lastResponseLengthRef.current = wordsTyped;
      }
    }, 1500); // Debounce for 1.5 seconds
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center bg-white rounded-2xl shadow-2xl p-12 max-w-md">
          <Brain className="h-16 w-16 text-purple-600 animate-pulse mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Generating Creativity Questions</h2>
          <p className="text-gray-600">Using AI to create personalized questions about <span className="font-bold text-purple-600">{topic}</span>...</p>
          <div className="mt-4 text-sm text-gray-500">This may take a moment</div>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-3xl p-12 text-center shadow-2xl">
          <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-4xl font-black text-emerald-800 mb-4">Creativity Assessment Complete!</h2>
          <p className="text-emerald-700 text-lg mb-8">
            Your responses have been evaluated by AI. Analyzing cognitive load patterns...
          </p>
          <div className="bg-white/80 p-6 rounded-2xl">
            <Sparkles className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-emerald-700 font-semibold">Processing results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-xl text-center bg-white rounded-2xl shadow-xl p-8">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Unable to Generate Questions</h2>
          <p className="text-gray-600 mb-6">
            Please make sure you've completed the reading phase with sufficient notes about the topic.
          </p>
          <button
            onClick={generateQuestions}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const wordCount = response.trim().split(/\s+/).filter(w => w.length > 0).length;
  const uniqueWords = new Set(response.toLowerCase().split(/\s+/)).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-6 bg-white rounded-2xl p-4 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-gray-700">Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span className="text-sm font-bold text-purple-600">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Main Question Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-slate-200/60 bg-gradient-to-r from-slate-50/80 to-white/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className={`absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600 rounded-2xl blur-xl opacity-40 ${pulseEffect ? 'animate-ping' : 'animate-pulse'}`}></div>
                  <div className={`relative p-3 rounded-2xl shadow-lg ${getTestTypeBg(currentQuestion.type)}`}>
                    <Brain className="h-6 w-6" />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-800">Creativity Assessment</h2>
                  <span className={`text-lg font-bold ${getTestTypeColor(currentQuestion.type)}`}>
                    {currentQuestion.type.charAt(0).toUpperCase() + currentQuestion.type.slice(1)} Test
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

          {/* Question Content */}
          <div className="p-8">
            <div className="mb-8">
              <div className={`p-6 rounded-2xl ${getTestTypeBg(currentQuestion.type)} backdrop-blur-sm border-2 mb-6`}>
                <div className="flex items-center space-x-3 mb-4">
                  <Lightbulb className="h-6 w-6 text-yellow-600" />
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Question</span>
                </div>
                <label className="block text-2xl font-bold text-slate-800 leading-relaxed">
                  {currentQuestion.question}
                </label>
              </div>
              
              {timeLeft < 60 && (
                <div className="flex items-center space-x-3 mb-6 p-4 bg-gradient-to-br from-amber-50/80 to-orange-50/80 rounded-2xl border-2 border-amber-200/60 backdrop-blur-sm">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                  <span className="text-amber-800 font-semibold">Less than 1 minute remaining!</span>
                </div>
              )}
            </div>

            {/* Response Area */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <Target className="h-5 w-5 text-slate-600" />
                <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Your Response</span>
              </div>
              <textarea
                value={response}
                onChange={(e) => handleResponseChange(e.target.value)}
                placeholder="Type your creative response here... Be as detailed and original as possible!"
                className="w-full h-80 p-6 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-lg leading-relaxed bg-white/80 backdrop-blur-sm transition-all duration-300"
                disabled={isEvaluating}
              />
            </div>

            {/* Word Count and Submit */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-slate-50/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200/60">
                  <Zap className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">
                    {wordCount} words
                  </span>
                </div>
                <div className="flex items-center space-x-2 bg-slate-50/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200/60">
                  <Sparkles className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">
                    {uniqueWords} unique
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={!response.trim() || isEvaluating}
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 via-purple-600 to-pink-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-3xl disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                {isEvaluating ? (
                  <div className="flex items-center space-x-3">
                    <Brain className="h-5 w-5 animate-pulse" />
                    <span>AI Evaluating...</span>
                  </div>
                ) : (
                  <div className="relative flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5" />
                    <span>Submit Response</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Instructions */}
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
                  <span className="text-sm font-medium text-slate-700">Provide detailed and thoughtful responses</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700">Think deeply about the topic</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700">Your response will be evaluated by AI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};