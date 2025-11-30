import { AlertCircle, CheckCircle, Clock, FileText, Send } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { geminiService, AssessmentQuestion as GeminiAssessmentQuestion } from '../services/geminiService';
import { AssessmentResponse, Participant } from '../types';
import { usePhaseTracker } from '../context/BehaviorContext';

interface AssessmentPhaseProps {
  participant: Participant;
  onComplete: (responses: AssessmentResponse[]) => void;
  readingContent?: string;
  userNotes?: string;
}

export default function AssessmentPhase({ 
  participant, 
  onComplete,
}: AssessmentPhaseProps) {
  // Behavior tracking for EEG modulation
  const { addEvent } = usePhaseTracker('assessment');
  
  // Use ref to track if questions have been loaded to prevent duplicate loading
  const questionsLoadedRef = useRef(false);
  const mountedRef = useRef(false);
  const previousAnswerRef = useRef<string>('');

  // Use STATE instead of const - makes it reactive to participant changes
  const [researchTopic, setResearchTopic] = useState(participant?.researchTopic?.trim() || '');

  // Watch for participant changes and update topic
  useEffect(() => {
    const newTopic = participant?.researchTopic?.trim() || '';
    
    console.log('==========================================');
    console.log('🔄 PARTICIPANT PROP CHANGED IN ASSESSMENT');
    console.log('Previous topic in state:', researchTopic);
    console.log('New topic from participant:', newTopic);
    console.log('participant._topicUpdatedAt:', (participant as any)?._topicUpdatedAt);
    console.log('Full participant object:', participant);
    console.log('==========================================');
    
    if (newTopic !== researchTopic && newTopic !== '') {
      console.log('✅ Updating research topic state to:', newTopic);
      console.log('🔄 Resetting questions to force reload with new topic');
      
      // Reset everything to reload with new topic
      setResearchTopic(newTopic);
      questionsLoadedRef.current = false; // Force reload
      setQuestions([]);
      setIsLoading(true);
      setError('');
    }
  }, [participant, participant?.researchTopic, (participant as any)?._topicUpdatedAt]);

  // ONLY LOG ONCE on initial mount
  useEffect(() => {
    if (!mountedRef.current) {
      console.log('==========================================');
      console.log('🎯 ASSESSMENT PHASE COMPONENT MOUNTED');
      console.log('Participant ID:', participant.id);
      console.log('Participant Name:', participant.name);
      console.log('Participant Email:', participant.email);
      console.log('Research Topic from participant:', participant.researchTopic);
      console.log('Research Topic variable:', researchTopic);
      console.log('Topic length:', researchTopic?.length);
      console.log('Topic empty?:', !researchTopic || researchTopic.trim() === '');
      console.log('Full participant object:', JSON.stringify(participant, null, 2));
      console.log('==========================================');
      mountedRef.current = true;
    }
  }, []); // Empty dependency array - runs only once

  const [questions, setQuestions] = useState<GeminiAssessmentQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Load assessment questions - Watch for topic changes
  useEffect(() => {
    // Prevent loading if already loaded
    if (questionsLoadedRef.current) {
      console.log('⏭️ Questions already loaded, skipping...');
      return;
    }

    // Don't load if topic is empty
    if (!researchTopic || researchTopic.trim() === '') {
      console.log('⏸️ Waiting for topic to be set... Current topic:', researchTopic);
      return;
    }

    const loadQuestions = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        console.log('==========================================');
        console.log('🔄 STARTING QUESTION GENERATION');
        console.log('Step 1: Extract topic from participant');
        console.log('  participant object:', participant);
        console.log('  participant.researchTopic:', participant?.researchTopic);
        console.log('  researchTopic variable:', researchTopic);
        console.log('==========================================');
        
        // CRITICAL: Validate topic exists
        if (!researchTopic || researchTopic.trim() === '') {
          const errorDetails = `
==========================================
❌ CRITICAL ERROR: No Research Topic Found!

Participant Details:
- ID: ${participant?.id || 'undefined'}
- Name: ${participant?.name || 'undefined'}
- Email: ${participant?.email || 'undefined'}
- researchTopic field: ${participant?.researchTopic || 'undefined'}
- Extracted topic: ${researchTopic || 'undefined'}

Full Participant Object:
${JSON.stringify(participant, null, 2)}

This means:
1. The topic was not set when creating the participant
2. OR the topic field is named differently
3. OR the participant object is corrupted
==========================================`;
          
          console.error(errorDetails);
          setError('No research topic found. Please go back and select a topic before starting the assessment.');
          setIsLoading(false);
          return;
        }

        const topicToUse = researchTopic.trim();
        
        console.log('==========================================');
        console.log('✅ TOPIC VALIDATED');
        console.log('Topic to use:', topicToUse);
        console.log('Topic length:', topicToUse.length);
        console.log('==========================================');

        console.log('==========================================');
        console.log('🔑 CALLING GEMINI SERVICE');
        console.log('Function: geminiService.generateAssessmentQuestions');
        console.log('Arguments:');
        console.log('  [0] topic:', topicToUse);
        console.log('  [1] notes:', '""');
        console.log('  [2] count:', 5);
        console.log('==========================================');
        
        // Generate questions
        const generatedQuestions = await geminiService.generateAssessmentQuestions(
          topicToUse,
          '', // Empty string - questions based on topic only
          5
        );
        
        if (!generatedQuestions || generatedQuestions.length === 0) {
          console.error('==========================================');
          console.error('❌ NO QUESTIONS GENERATED');
          console.error('Topic used:', topicToUse);
          console.error('This could mean:');
          console.error('1. Gemini API failed');
          console.error('2. API key is invalid');
          console.error('3. Network error');
          console.error('==========================================');
          setError(`Failed to generate questions for topic: "${topicToUse}".`);
          setIsLoading(false);
          return;
        }
        
        console.log('==========================================');
        console.log('✅ QUESTIONS LOADED SUCCESSFULLY');
        console.log('Number of questions:', generatedQuestions.length);
        console.log('Questions generated for topic:', topicToUse);
        console.log('Expected topic:', topicToUse);
        console.log('==========================================');
        
        generatedQuestions.forEach((q, idx) => {
          console.log(`\n📝 Question ${idx + 1}:`);
          console.log(`  Topic field: "${q.topic}"`);
          console.log(`  Expected: "${topicToUse}"`);
          console.log(`  Match: ${q.topic === topicToUse ? '✅' : '❌'}`);
          console.log(`  Question: "${q.question.substring(0, 80)}..."`);
          console.log(`  Difficulty: ${q.difficulty}`);
          console.log(`  Cognitive Level: ${q.cognitiveLevel}`);
          console.log('---');
        });
        
        console.log('==========================================');
        
        // VERIFY: Check if questions match the topic
        const topicsMatch = generatedQuestions.every(q => 
          q.topic.toLowerCase() === topicToUse.toLowerCase()
        );
        
        if (!topicsMatch) {
          console.warn('==========================================');
          console.warn('⚠️ WARNING: Some questions have different topics!');
          generatedQuestions.forEach((q, idx) => {
            if (q.topic.toLowerCase() !== topicToUse.toLowerCase()) {
              console.warn(`  Question ${idx + 1} topic: "${q.topic}" (expected: "${topicToUse}")`);
            }
          });
          console.warn('==========================================');
        } else {
          console.log('✅ All questions match the topic:', topicToUse);
        }
        
        setQuestions(generatedQuestions);
        setQuestionStartTime(new Date());
        
        // Mark as loaded to prevent reloading
        questionsLoadedRef.current = true;
        
      } catch (err) {
        console.error('==========================================');
        console.error('❌ CRITICAL ERROR LOADING QUESTIONS');
        console.error('Error object:', err);
        console.error('Error message:', err instanceof Error ? err.message : 'Unknown error');
        console.error('Topic was:', researchTopic);
        console.error('Participant was:', participant);
        console.error('==========================================');
        setError(`Failed to generate assessment questions. Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [researchTopic]); // Re-run when researchTopic changes

  // Timer for current question
  useEffect(() => {
    // Only run timer when questions are loaded
    if (isLoading || questions.length === 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
      
      // Show warning if taking too long (more than 3 minutes)
      if (timeElapsed > 180 && !showWarning) {
        setShowWarning(true);
        // Track time warning event for EEG modulation
        addEvent('time_warning', 0.9, { 
          questionIndex: currentQuestionIndex,
          timeElapsed: timeElapsed 
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeElapsed, isLoading, questions.length, showWarning, addEvent, currentQuestionIndex]);

  // Reset timer when moving to next question
  useEffect(() => {
    setTimeElapsed(0);
    setShowWarning(false);
    previousAnswerRef.current = '';
    
    // Track question start event for EEG modulation
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const question = questions[currentQuestionIndex];
      addEvent('question_started', 0.6, {
        questionIndex: currentQuestionIndex,
        difficulty: question?.difficulty,
        cognitiveLevel: question?.cognitiveLevel,
      });
    }
  }, [currentQuestionIndex, questions, addEvent]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle answer selection with behavior tracking
  const handleAnswerChange = (newAnswer: string) => {
    const previousAnswer = previousAnswerRef.current;
    
    // Track answer change if this is not the first selection
    if (previousAnswer && previousAnswer !== newAnswer) {
      addEvent('answer_changed', 0.6, {
        questionIndex: currentQuestionIndex,
        previousAnswer: previousAnswer.substring(0, 30),
        newAnswer: newAnswer.substring(0, 30),
        timeElapsed,
      });
    }
    
    previousAnswerRef.current = newAnswer;
    setSelectedAnswer(newAnswer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer.trim()) {
      alert('Please select an answer before submitting.');
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const endTime = new Date();
    const timeTaken = Math.floor((endTime.getTime() - questionStartTime.getTime()) / 1000);

    // Check if answer is correct
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const pointsPerQuestion = 20; // 100 points total / 5 questions
    const score = isCorrect ? pointsPerQuestion : 0;

    // Calculate confidence level based on time taken
    const calculateConfidence = (actualTime: number): number => {
      if (actualTime <= 30) return 5; // Very confident (< 30s)
      if (actualTime <= 60) return 4; // Confident (< 1min)
      if (actualTime <= 120) return 3; // Moderate (< 2min)
      if (actualTime <= 180) return 2; // Less confident (< 3min)
      return 1; // Not confident (> 3min)
    };

    const response: AssessmentResponse = {
      participantId: participant.id,
      questionId: currentQuestion.id,
      startTime: questionStartTime,
      endTime: endTime,
      timeTaken: timeTaken,
      answer: selectedAnswer,
      isCorrect: isCorrect,
      score: score,
      confidenceLevel: calculateConfidence(timeTaken),
      topic: currentQuestion.topic,
      difficulty: currentQuestion.difficulty,
      points: pointsPerQuestion,
      earnedPoints: score
    };

    console.log(`✅ Answer submitted for Q${currentQuestionIndex + 1}:`);
    console.log(`   Topic: ${currentQuestion.topic}`);
    console.log(`   Question: ${currentQuestion.question.substring(0, 50)}...`);
    console.log(`   Selected: ${selectedAnswer.substring(0, 40)}...`);
    console.log(`   Correct: ${isCorrect ? '✓' : '✗'}`);
    console.log(`   Time: ${timeTaken}s`);

    // Track answer submission event for EEG modulation
    addEvent(isCorrect ? 'answer_submitted_correct' : 'answer_submitted_incorrect', isCorrect ? 0.7 : 0.9, {
      questionIndex: currentQuestionIndex,
      timeTaken,
      difficulty: currentQuestion.difficulty,
      confidenceLevel: calculateConfidence(timeTaken),
    });

    const newResponses = [...responses, response];
    setResponses(newResponses);
    
    // Move to next question or complete
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer('');
      setQuestionStartTime(new Date());
    } else {
      console.log('==========================================');
      console.log('✅ ASSESSMENT COMPLETE');
      console.log('Topic:', researchTopic);
      console.log('Total Questions:', newResponses.length);
      console.log('Correct Answers:', newResponses.filter(r => r.isCorrect).length);
      console.log('Total Points:', newResponses.reduce((sum, r) => sum + (r.earnedPoints || 0), 0));
      console.log('==========================================');
      onComplete(newResponses);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer('');
      setQuestionStartTime(new Date());
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const totalResponses = responses.length;

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 flex items-center justify-center p-6">
        <div className="text-center bg-white rounded-2xl shadow-2xl p-12 max-w-md">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-purple-600 mx-auto mb-6"></div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Generating Assessment</h2>
          <div className="mb-4 p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">Creating questions about:</p>
            <p className="text-2xl font-bold text-purple-600">{researchTopic || '(No topic found)'}</p>
            {!researchTopic && (
              <p className="text-xs text-red-500 mt-2">⚠️ Warning: No topic detected!</p>
            )}
          </div>
          <p className="text-sm text-gray-500">This may take a moment</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 flex items-center justify-center p-6">
        <div className="max-w-2xl bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="inline-block p-3 bg-red-100 rounded-full mb-4">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Assessment Not Available</h2>
          </div>
          
          <div className="mb-6 p-4 bg-gray-50 rounded-lg text-sm space-y-2">
            <p className="font-bold text-gray-700">Debug Information:</p>
            <p><strong>Participant ID:</strong> {participant?.id || 'undefined'}</p>
            <p><strong>Participant Name:</strong> {participant?.name || 'undefined'}</p>
            <p><strong>Research Topic:</strong> <span className="text-purple-600 font-bold">{participant?.researchTopic || '(empty)'}</span></p>
            <p><strong>Extracted Topic:</strong> <span className="text-purple-600 font-bold">{researchTopic || '(empty)'}</span></p>
          </div>
          
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <p className="text-red-700 font-medium">{error || 'Unable to generate assessment questions.'}</p>
          </div>
          
          <div className="text-center">
            <button
              onClick={() => {
                questionsLoadedRef.current = false;
                window.location.reload();
              }}
              className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors"
            >
              Reload and Try Again
            </button>
          </div>
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
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-gray-600">Topic:</span>
                  <span className="font-bold text-purple-600 text-lg">{researchTopic}</span>
                </div>
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
            <div className="flex items-center space-x-3 flex-wrap">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {currentQuestion.difficulty.toUpperCase()}
              </div>
              <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                {currentQuestion.cognitiveLevel.toUpperCase()}
              </div>
              <div className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                📚 {currentQuestion.topic}
              </div>
            </div>
            <div className="text-sm text-gray-500 flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeElapsed)}</span>
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

            {/* Answer Options - Multiple Choice */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => (
                <label
                  key={idx}
                  className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedAnswer === option
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={option}
                    checked={selectedAnswer === option}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    className="mr-3 h-5 w-5 text-purple-600"
                  />
                  <span className="text-gray-700 font-medium">{option}</span>
                </label>
              ))}
            </div>
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
              disabled={!selectedAnswer.trim()}
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
