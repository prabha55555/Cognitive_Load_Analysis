import { AlertCircle, CheckCircle, Clock, FileText, Send } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { generateAssessmentQuestions } from '../services/assessmentGenerationService';
import { AssessmentQuestion, AssessmentResponse, Participant } from '../types';

interface AssessmentPhaseProps {
  participant: Participant;
  readingContent?: string;
  userNotes?: string;
  onComplete: (responses: AssessmentResponse[]) => void;
}

export const AssessmentPhase: React.FC<AssessmentPhaseProps> = ({
  participant,
  readingContent = '',
  userNotes = '',
  onComplete
}) => {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Load assessment questions
  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoading(true);
      setError('');
      try {
        console.log('Generating assessment for topic:', participant.researchTopic);
        const generatedQuestions = await generateAssessmentQuestions(
          participant.researchTopic,
          readingContent,
          userNotes
        );
        
        if (!generatedQuestions || generatedQuestions.length === 0) {
          setError(`No assessment questions available for topic: "${participant.researchTopic}". Please ensure you have completed the reading phase.`);
          setIsLoading(false);
          return;
        }
        
        console.log(`Loaded ${generatedQuestions.length} questions`);
        setQuestions(generatedQuestions);
        setQuestionStartTime(new Date());
      } catch (err) {
        console.error('Error loading questions:', err);
        setError('Failed to generate assessment questions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [participant.researchTopic, readingContent, userNotes]);

  // Timer for current question
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
      
      // Show warning if taking too long
      const currentQuestion = questions[currentQuestionIndex];
      if (currentQuestion && timeElapsed > currentQuestion.expectedTimeSeconds * 1.5) {
        setShowWarning(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeElapsed, currentQuestionIndex, questions]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitAnswer = () => {
    if (!currentAnswer.trim()) {
      alert('Please provide an answer before submitting.');
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const endTime = new Date();
    const timeTaken = Math.floor((endTime.getTime() - questionStartTime.getTime()) / 1000);

    // Calculate score based on correctness and time
    let score = 0;
    let isCorrect = false;

    if (currentQuestion.type === 'multiple-choice') {
      isCorrect = currentAnswer === currentQuestion.correctAnswer;
      score = isCorrect ? currentQuestion.points : 0;
    } else if (currentQuestion.type === 'short-answer') {
      // Simple keyword matching for short answers
      const answerLower = currentAnswer.toLowerCase();
      const correctLower = currentQuestion.correctAnswer?.toLowerCase() || '';
      isCorrect = answerLower.includes(correctLower) || correctLower.includes(answerLower);
      score = isCorrect ? currentQuestion.points : currentQuestion.points * 0.5;
    } else {
      // Descriptive questions - partial credit based on length and time
      const wordCount = currentAnswer.split(/\s+/).length;
      if (wordCount > 50) {
        score = currentQuestion.points;
      } else if (wordCount > 20) {
        score = currentQuestion.points * 0.7;
      } else {
        score = currentQuestion.points * 0.4;
      }
    }

    // Calculate confidence level based on time taken
    const calculateConfidence = (actualTime: number, expectedTime: number): number => {
      if (actualTime <= expectedTime * 0.5) return 5; // Very confident
      if (actualTime <= expectedTime) return 4; // Confident
      if (actualTime <= expectedTime * 1.5) return 3; // Moderate
      if (actualTime <= expectedTime * 2) return 2; // Less confident
      return 1; // Not confident
    };

    const response: AssessmentResponse = {
      participantId: participant.id,
      questionId: currentQuestion.id,
      startTime: questionStartTime,
      endTime: endTime,
      timeTaken: timeTaken,
      answer: currentAnswer,
      isCorrect: isCorrect,
      score: score,
      confidenceLevel: calculateConfidence(timeTaken, currentQuestion.expectedTimeSeconds),
      topic: currentQuestion.topic,
      difficulty: currentQuestion.difficulty,
      points: currentQuestion.points,
      earnedPoints: score
    };

    console.log('=== Assessment Response Created ===');
    console.log('Question:', currentQuestion.question);
    console.log('Selected Answer:', currentAnswer);
    console.log('Correct Answer:', currentQuestion.correctAnswer);
    console.log('Is Correct:', isCorrect);
    console.log('Points Available:', currentQuestion.points);
    console.log('Points Earned:', score);
    console.log('Full Response:', response);

    setResponses(prev => [...prev, response]);
    
    // Move to next question or complete
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentAnswer('');
      setQuestionStartTime(new Date());
      setTimeElapsed(0);
      setShowWarning(false);
    } else {
      const finalResponses = [...responses, response];
      console.log('=== Assessment Complete ===');
      console.log('Total Questions:', finalResponses.length);
      console.log('All Responses:', finalResponses);
      console.log('Total Earned Points:', finalResponses.reduce((sum, r) => sum + (r.earnedPoints || 0), 0));
      console.log('Total Possible Points:', finalResponses.reduce((sum, r) => sum + (r.points || 0), 0));
      onComplete(finalResponses);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      // Save current progress before going back
      if (currentAnswer.trim()) {
        handleSubmitAnswer();
      }
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const totalResponses = responses.length;

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 flex items-center justify-center p-6">
        <div className="text-center bg-white rounded-2xl shadow-2xl p-12">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-purple-600 mx-auto mb-6"></div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Generating Your Assessment</h2>
          <p className="text-lg text-gray-600 mb-2">Analyzing your notes and reading content...</p>
          <p className="text-sm text-gray-500">Creating personalized questions based on {participant.researchTopic}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 flex items-center justify-center p-6">
        <div className="max-w-xl text-center bg-white rounded-2xl shadow-xl p-8">
          <div className="inline-block p-3 bg-red-100 rounded-full mb-4">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Assessment Not Available</h2>
          <p className="text-gray-600 mb-4">
            {error || `No assessment questions available for topic: "${participant.researchTopic}"`}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Available topics: Renewable Energy Innovation, Artificial Intelligence, Climate Change
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-800">Assessment Phase</h1>
                <p className="text-gray-600 mt-1">Topic: <span className="font-bold text-purple-600">{participant.researchTopic}</span></p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="flex items-center space-x-2 text-gray-700">
                  <Clock className="h-5 w-5" />
                  <span className="text-2xl font-bold">{formatTime(timeElapsed)}</span>
                </div>
                <p className="text-sm text-gray-500">Question Time</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-medium text-purple-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {/* Question Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {currentQuestion.difficulty.toUpperCase()}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentQuestion.type === 'multiple-choice' ? 'bg-blue-100 text-blue-700' :
                currentQuestion.type === 'short-answer' ? 'bg-indigo-100 text-indigo-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {currentQuestion.type === 'multiple-choice' ? 'Multiple Choice' :
                 currentQuestion.type === 'short-answer' ? 'Short Answer' :
                 'Descriptive'}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Expected: {formatTime(currentQuestion.expectedTimeSeconds)}
            </div>
          </div>

          {/* Warning if taking too long */}
          {showWarning && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-700">
                    You're taking longer than expected on this question. Consider moving on if you're unsure.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {currentQuestion.question}
            </h2>

            {/* Answer Input based on question type */}
            {currentQuestion.type === 'multiple-choice' && currentQuestion.options ? (
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      currentAnswer === option
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      checked={currentAnswer === option}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      className="mr-3 h-5 w-5 text-purple-600"
                    />
                    <span className="text-gray-700 font-medium">{option}</span>
                  </label>
                ))}
              </div>
            ) : currentQuestion.type === 'short-answer' ? (
              <input
                type="text"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            ) : (
              <div>
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Write your detailed answer here... Aim for at least 50 words for full credit."
                  rows={10}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-gray-500">
                    Word count: {currentAnswer.split(/\s+/).filter(w => w).length}
                  </p>
                  <p className="text-sm text-gray-500">
                    Recommended: 50+ words
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            
            <button
              onClick={handleSubmitAnswer}
              disabled={!currentAnswer.trim()}
              className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
            >
              <span>{currentQuestionIndex === questions.length - 1 ? 'Complete Assessment' : 'Submit & Next'}</span>
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Responses Summary */}
        {totalResponses > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="font-bold text-gray-800 mb-4">Completed Questions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Answered</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600 mt-2">{totalResponses}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Avg Time</span>
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {formatTime(
                    Math.floor(responses.reduce((sum, r) => sum + r.timeTaken, 0) / totalResponses)
                  )}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Remaining</span>
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {questions.length - totalResponses}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
