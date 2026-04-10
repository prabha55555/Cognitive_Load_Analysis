import { AlertCircle } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { geminiService, AssessmentQuestion as GeminiAssessmentQuestion } from '../services/geminiService';
import { AssessmentResponse, Participant } from '../types';

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
  // Use ref to track if questions have been loaded to prevent duplicate loading
  const questionsLoadedRef = useRef(false);
  const mountedRef = useRef(false);

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
      if (timeElapsed > 180) {
        setShowWarning(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeElapsed, isLoading, questions.length]);

  // Reset timer when moving to next question
  useEffect(() => {
    setTimeElapsed(0);
    setShowWarning(false);
  }, [currentQuestionIndex]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

    const newResponses = [...responses, response];
    setResponses(newResponses);
    
    // Move to next question or complete
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer('');
      setQuestionStartTime(new Date());
    } else {
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="loading-screen" style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#090a0c', zIndex: 50 }}>
        <style>{`
          .font-display { font-family: 'Cabinet Grotesk', system-ui, -apple-system, sans-serif; }
          .font-mono { font-family: 'Geist Mono', ui-monospace, SFMono-Regular, monospace; }
          @keyframes bar-wave {
            from { transform: scaleY(0.3); opacity: 0.4; }
            to   { transform: scaleY(1);   opacity: 1;   }
          }
        `}</style>
        <div style={{ display: 'flex', gap: '4px' }}>
           {[...Array(5)].map((_, i) => (
              <div key={i} style={{ width: '3px', borderRadius: '99px', background: '#00bfdb', height: '32px', animation: 'bar-wave 0.8s ease-in-out infinite alternate', animationDelay: `${i * 0.1}s`, transformOrigin: 'center' }} />
           ))}
        </div>
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
           <h2 className="font-display" style={{ fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.03em', color: 'white' }}>Generating Assessment</h2>
           <div className="font-mono" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>Creating questions about:</div>
           <div className="font-display" style={{ fontWeight: 700, fontSize: '1rem', color: '#00bfdb', border: '1px solid rgba(0,191,219,0.2)', borderRadius: '6px', padding: '4px 14px', background: 'rgba(0,191,219,0.06)', display: 'inline-block', marginTop: '0.4rem', textTransform: 'capitalize' }}>{researchTopic || '(No topic found)'}</div>
           <div className="font-mono" style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: '1.2rem' }}>This may take a moment</div>
        </div>
      </div>
    );
  }

  if (error || !currentQuestion) {
    return (
      <div className="flex flex-col h-screen overflow-hidden text-white" style={{ background: '#090a0c', justifyContent: 'center', alignItems: 'center' }}>
        <div className="text-center">
           <AlertCircle style={{ width: '3rem', height: '3rem', color: 'rgba(255,255,255,0.3)', margin: '0 auto 1.5rem' }} />
           <h2 style={{ fontFamily: "'Cabinet Grotesk', system-ui", fontWeight: 700, fontSize: '1.3rem' }}>Assessment Error</h2>
           <p style={{ fontFamily: "'Geist Mono', monospace", color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem', maxWidth: '300px' }}>{error || 'Unable to generate questions.'}</p>
           <button onClick={() => window.location.reload()} style={{ marginTop: '2rem', background: '#00bfdb', color: '#090a0c', border: 'none', borderRadius: '6px', padding: '0.6rem 1.4rem', fontFamily: "'Cabinet Grotesk', system-ui", fontWeight: 700, fontSize: '0.88rem' }}>Reload App</button>
        </div>
      </div>
    );
  }

  const currentQ = currentQuestionIndex + 1;
  const totalQ = questions.length;
  const progressWidth = totalQ > 0 ? (currentQ / totalQ) * 100 : 0;

  return (
    <div className="flex flex-col w-full" style={{ background: '#090a0c', color: 'white', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <style>{`
          .font-display { font-family: 'Cabinet Grotesk', system-ui, -apple-system, sans-serif; }
          .font-mono { font-family: 'Geist Mono', ui-monospace, SFMono-Regular, monospace; }
      `}</style>
      
      {/* Zone 2  Phase Header Strip */}
      <div style={{ width: '100%', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '1.2rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#090a0c', flexShrink: 0 }}>
         <div>
            <div className="font-display" style={{ fontWeight: 800, fontSize: '1.3rem', color: 'white', marginBottom: '0.1rem' }}>Assessment Phase</div>
            <div className="font-mono" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Topic: <span style={{ color: '#00bfdb', textTransform: 'capitalize' }}>{researchTopic}</span></div>
         </div>
         <div style={{ border: '1px solid rgba(0,191,219,0.2)', borderRadius: '8px', padding: '0.4rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="font-mono" style={{ fontWeight: 500, fontSize: '1.5rem', color: '#00bfdb' }}>{formatTime(timeElapsed)}</div>
            <div className="font-mono" style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>Question Time</div>
         </div>
      </div>

      {/* Zone 3 | Progress Bar */}
      <div style={{ width: '100%', padding: '0.8rem 2.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#090a0c', display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
         <div className="font-mono" style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>PROGRESS</div>
         <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '99px' }}>
            <div style={{ background: '#00bfdb', borderRadius: '99px', width: `${progressWidth}%`, height: '100%', transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)' }} />
         </div>
         <div className="font-mono" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Question {currentQ} of {totalQ}</div>
      </div>

      {/* Zone 4 | Question Area */}
      <div className="question-area" style={{ flex: 1, padding: '2rem 2.5rem', width: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
      <div className="question-inner" style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
         <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '0.4rem' }}>
               <div className="font-mono" style={{ fontSize: '0.62rem', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', padding: '3px 8px', color: 'rgba(255,255,255,0.45)' }}>{currentQuestion.difficulty}</div>
               <div className="font-mono" style={{ fontSize: '0.62rem', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', padding: '3px 8px', color: 'rgba(255,255,255,0.45)' }}>{currentQuestion.cognitiveLevel || 'understanding'}</div>
               <div className="font-mono" style={{ fontSize: '0.62rem', textTransform: 'capitalize', border: '1px solid rgba(0,191,219,0.2)', background: 'rgba(0,191,219,0.06)', borderRadius: '4px', padding: '3px 8px', color: '#00bfdb' }}>{currentQuestion.topic || researchTopic}</div>
            </div>
            <div className="font-mono" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>{formatTime(timeElapsed)}</div>
         </div>

         <div className="font-display" style={{ fontWeight: 700, fontSize: '1.15rem', lineHeight: 1.6, color: 'white', marginTop: '0.4rem', maxWidth: '72ch' }}>
            {currentQuestion.question}
         </div>

        {showWarning && (
          <div className="font-mono" style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: '0.2rem' }}>
            You have spent more than 3 minutes on this question.
          </div>
        )}

         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
            {currentQuestion.options.map((option, idx) => {
               const isSelected = selectedAnswer === option;
               return (
                  <div
                     key={idx}
                     onClick={() => setSelectedAnswer(option)}
                     style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.9rem', padding: '0.9rem 1rem',
                        border: `1px solid ${isSelected ? 'rgba(0,191,219,0.4)' : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: '7px',
                        background: isSelected ? 'rgba(0,191,219,0.06)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                     }}
                     onMouseOver={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; } }}
                     onMouseOut={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; } }}
                  >
                     <div style={{
                        width: '18px', height: '18px', borderRadius: '50%', border: `1px solid ${isSelected ? '#00bfdb' : 'rgba(255,255,255,0.2)'}`,
                        flexShrink: 0, marginTop: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                     }}>
                        {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00bfdb' }} />}
                     </div>
                     <div style={{ fontSize: '0.9rem', color: isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{option}</div>
                  </div>
               );
            })}
         </div>

         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <button
               onClick={handlePreviousQuestion}
               disabled={currentQuestionIndex === 0}
               className="font-display"
               style={{
                  fontWeight: 600, fontSize: '0.85rem', background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.6rem 1.2rem',
                  color: 'rgba(255,255,255,0.4)', opacity: currentQuestionIndex === 0 ? 0.25 : 1,
                  cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                  transition: 'border 0.2s ease'
               }}
               onMouseOver={e => { if (currentQuestionIndex > 0) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
               onMouseOut={e => { if (currentQuestionIndex > 0) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
               Previous
            </button>

            <button
               onClick={handleSubmitAnswer}
               disabled={!selectedAnswer.trim()}
               className="font-display flex items-center gap-[0.4rem] transition-all"
               style={{
                  fontWeight: 700, fontSize: '0.88rem', borderRadius: '6px', padding: '0.6rem 1.4rem', border: 'none',
                  background: selectedAnswer.trim() ? '#00bfdb' : 'rgba(255,255,255,0.08)',
                  color: selectedAnswer.trim() ? '#090a0c' : 'rgba(255,255,255,0.3)',
                  cursor: selectedAnswer.trim() ? 'pointer' : 'not-allowed'
               }}
               onMouseOver={e => { if (selectedAnswer.trim()) e.currentTarget.style.opacity = '0.85'; }}
               onMouseOut={e => { if (selectedAnswer.trim()) e.currentTarget.style.opacity = '1'; }}
               onMouseDown={e => { if (selectedAnswer.trim()) e.currentTarget.style.transform = 'scale(0.98)'; }}
               onMouseUp={e => { if (selectedAnswer.trim()) e.currentTarget.style.transform = 'none'; }}
            >
               <span>Submit & Next</span>
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: selectedAnswer.trim() ? '#090a0c' : 'rgba(255,255,255,0.3)' }}><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
         </div>
      </div>

            </div>
    </div>
  );
}
