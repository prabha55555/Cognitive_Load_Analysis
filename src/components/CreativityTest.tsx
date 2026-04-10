import React, { useEffect, useState } from 'react';
import { geminiService, CreativityQuestion, CreativityEvaluation } from '../services/geminiService';
import { TestResponse } from '../types';
import { ArrowRight } from 'lucide-react';

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
  const [hasInteracted, setHasInteracted] = useState(false);

  // Generate questions on mount
  useEffect(() => {
    generateQuestions();
  }, [topic, notes]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !isCompleted && !isEvaluating) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && questions.length > 0 && !isCompleted && !isEvaluating) {
      handleSubmit();
    }
  }, [timeLeft, isCompleted, isEvaluating, questions.length]);

  const generateQuestions = async () => {
    setIsLoading(true);
    try {
      const generated = await geminiService.generateCreativityQuestions(topic, notes);
      setQuestions(generated);
      if (generated.length > 0) {
        setTimeLeft(generated[0].timeLimit);
        setStartTime(Date.now());
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

    try {
      const evaluation = await geminiService.evaluateCreativityResponse(
        currentQuestion,
        response,
        timeSpent
      );

      const testResponse: TestResponse = {
        participantId,
        testId: currentQuestion.id,
        response,
        timestamp: Date.now(),
        score: evaluation.score
      };

      const newResponses = [...responses, testResponse];
      const newEvaluations = [...evaluations, evaluation];
      
      setResponses(newResponses);
      setEvaluations(newEvaluations);

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setResponse('');
        setTimeLeft(questions[currentQuestionIndex + 1].timeLimit);
        setStartTime(Date.now());
        setHasInteracted(false);
      } else {
        setIsCompleted(true);
        onComplete(newResponses, newEvaluations);
      }
    } catch (error) {
      console.error('Error during evaluation:', error);
      alert('Error evaluating response. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const wordCount = response.trim().length > 0 ? response.trim().split(/\s+/).length : 0;
  const uniqueWords = response.trim().length > 0 ? new Set(response.split('\n').map(s => s.trim()).filter(s => s.length > 0)).size : 0;
  
  const handleInteraction = () => {
    if (!hasInteracted) setHasInteracted(true);
  };

  // View 1: Loading State
  if (isLoading || isEvaluating) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#090a0c] flex flex-col items-center justify-center text-center">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes bar-wave {
            from { transform: scaleY(0.25); opacity: 0.3; }
            to   { transform: scaleY(1);   opacity: 1;   }
          }
          .loading-bars { display: flex; gap: 0.3rem; height: 2rem; align-items: center; justify-content: center; }
          .bar { width: 4px; height: 100%; background: #00bfdb; border-radius: 99px; animation: bar-wave 0.9s infinite alternate ease-in-out; }
          .bar:nth-child(1) { animation-delay: 0s; }
          .bar:nth-child(2) { animation-delay: 0.12s; }
          .bar:nth-child(3) { animation-delay: 0.24s; }
          .bar:nth-child(4) { animation-delay: 0.36s; }
          .bar:nth-child(5) { animation-delay: 0.48s; }
        `}} />
        <div className="loading-bars">
          <div className="bar"></div><div className="bar"></div><div className="bar"></div><div className="bar"></div><div className="bar"></div>
        </div>
        <div className="mt-8">
          <div className="font-mono text-[0.65rem] uppercase text-white/40 mb-2">CREATIVITY ASSESSMENT</div>
          <h2 className="font-display font-[800] text-[1.6rem] tracking-[-0.03em] text-white">
            {isEvaluating ? "Evaluating your creative response" : "Preparing your creativity test"}
          </h2>
          <div className="mt-[0.6rem] inline-block border border-[#00bfdb]/20 bg-[#00bfdb]/[0.06] rounded-[6px] px-[14px] py-[4px] font-display font-[600] text-[0.9rem] text-[#00bfdb]">
            {topic}
          </div>
          <div className="mt-[1.4rem] font-mono text-[0.68rem] text-white/25">
            {isEvaluating ? "Analyzing fluency and originality \u00B7 This may take a moment" : "Generating AUT prompt \u00B7 This may take a moment"}
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 bg-[#090a0c]">
        <div className="text-center">
          <h2 className="mb-2 text-[1.6rem] font-display font-[800] text-white tracking-[-0.03em]">Unable to Generate Questions</h2>
          <p className="mb-6 font-mono text-[0.8rem] text-white/40">
            Please make sure you've completed the reading phase with sufficient notes about the topic.
          </p>
          <button onClick={generateQuestions} className="px-6 py-3 bg-[#00bfdb] text-[#090a0c] font-display font-[700] rounded-[7px] text-[0.88rem]">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex) / questions.length) * 100;
  // User spec: 1 of 1 -> 100% complete
  const finalPercent = questions.length === 1 ? 100 : progressPercent;

  // Since we rely on participant dashboard for Zone 1 and Zone 5, we only render Zone 2, 3, 4 here.
  // We need to dispatch the active status to global state or context if possible, but the user spec just says "both must match dark system" and gives us a visual map.
  return (
    <div className="flex flex-col flex-1 bg-[#090a0c] text-white w-full h-full">
      {/* Zone 2 — Phase Header Strip */}
      <div className="w-full px-[2.5rem] py-[1.2rem] border-b border-white/[0.07] flex justify-between items-center bg-[#090a0c]">
        <div>
          <h2 className="font-display font-[800] text-[1.3rem] text-white">Creativity Assessment</h2>
          <div className="font-mono text-[0.72rem] text-white/40 mt-1">
            Test type: <span className="text-[#00bfdb]">{currentQuestion.type === 'fluency' ? 'Fluency Test (AUT)' : (currentQuestion.type + ' Test')}</span>
          </div>
        </div>
        <div className="border border-[#00bfdb]/20 rounded-[8px] px-[1rem] py-[0.4rem] text-center bg-[#090a0c]">
          <div className="font-mono font-[500] text-[1.5rem] text-[#00bfdb] leading-none mb-1">{formatTime(timeLeft)}</div>
          <div className="font-mono text-[0.6rem] text-white/40 leading-none">Time Remaining</div>
        </div>
      </div>

      {/* Zone 3 — Progress Strip */}
      <div className="w-full px-[2.5rem] py-[0.7rem] border-b border-white/[0.07] flex items-center gap-[1.2rem] bg-[#090a0c]">
        <div className="font-mono text-[0.65rem] uppercase text-white/40 whitespace-nowrap">
          QUESTION {currentQuestionIndex + 1} OF {questions.length}
        </div>
        <div className="flex-1 h-[3px] bg-white/[0.07] rounded-full overflow-hidden">
          <div className="h-full bg-[#00bfdb]" style={{ width: `${finalPercent}%` }}></div>
        </div>
        <div className="font-mono text-[0.65rem] text-white/40 whitespace-nowrap">
          {finalPercent}% Complete
        </div>
      </div>

      {/* Zone 4 — Main Workspace (2-col) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_320px] max-w-full bg-[#090a0c]">
        {/* Left Column */}
        <div className="px-[1rem] md:px-[2.5rem] py-[2rem] flex flex-col h-full max-w-[100%] overflow-x-hidden min-h-[500px]">
          {/* Question block */}
          <div className="mb-[1.5rem]">
            <div className="font-mono text-[0.65rem] uppercase text-white/40 mb-[0.5rem]">QUESTION</div>
            <div className="border-t border-white/[0.07] pt-[1rem]">
              <div className="font-display font-[700] text-[1.1rem] leading-[1.65] text-white max-w-[68ch]" dangerouslySetInnerHTML={{__html: currentQuestion.question.replace(new RegExp(`(${topic})`, "ig"), '<span class="text-[#00bfdb]">$1</span>')}} />
            </div>
          </div>

          {/* Response block */}
          <div className="flex flex-col flex-1">
            <div className="font-mono text-[0.65rem] uppercase text-white/40 mt-[1.5rem] mb-[0.5rem]">YOUR RESPONSE</div>
            <div className="border-t border-white/[0.07] pt-[1rem] flex-1 flex flex-col min-h-0">
              <textarea
                value={response}
                onChange={(e) => { setResponse(e.target.value); handleInteraction(); }}
                onInput={() => handleInteraction()}
                placeholder="List your ideas here — one per line. Be specific and original."
                className="w-full min-h-[280px] flex-1 bg-white/[0.03] border border-white/[0.08] rounded-[8px] p-[1rem_1.1rem] font-mono text-[0.85rem] text-white/75 leading-[1.7] resize-y focus:border-[#00bfdb]/35 focus:outline-none"
                disabled={isEvaluating}
              />
            </div>
            
            {/* Bottom action row */}
            <div className="mt-[1rem] flex justify-between items-center shrink-0">
              <div className="flex gap-[1.2rem]">
                <div className="font-mono text-[0.72rem] text-white/40">{wordCount} words</div>
                <div className="font-mono text-[0.72rem] text-white/40">{uniqueWords} unique</div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!response.trim().length || isEvaluating}
                className="font-display font-[700] text-[0.88rem] rounded-[7px] px-[1.4rem] py-[0.65rem] flex items-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:bg-white/[0.07] disabled:text-white/25 disabled:cursor-not-allowed hover:disabled:opacity-100 hover:disabled:translate-y-0"
                style={{
                  backgroundColor: response.trim().length ? '#00bfdb' : undefined,
                  color: response.trim().length ? '#090a0c' : undefined,
                  opacity: response.trim().length ? 0.85 : undefined,
                  transform: response.trim().length ? 'translateY(-1px)' : undefined
                }}
                onMouseOver={(e) => {
                  if (response.trim().length) {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
                onMouseOut={(e) => {
                  if (response.trim().length) {
                    e.currentTarget.style.opacity = '0.85';
                  }
                }}
              >
                Submit Response
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:border-l border-white/[0.07] p-[1.5rem] bg-[#0a0b0e] overflow-y-auto">
          {/* Instructions section */}
          <div className="mb-[1.8rem]">
            <div className="font-mono text-[0.65rem] uppercase text-white/40 mb-[1rem]">INSTRUCTIONS</div>
            <div className="divide-y divide-white/[0.05]">
              {[
                "Be as creative and original as possible",
                "Provide detailed, specific responses",
                "Think divergently — avoid obvious answers",
                "Your response is evaluated for fluency and originality"
              ].map((text, i) => (
                <div key={i} className="py-[0.7rem] flex gap-[0.7rem] items-start">
                  <div className="font-mono text-[0.65rem] text-white/20 min-w-[16px]">0{i + 1}</div>
                  <div className="text-[0.8rem] text-white/50 leading-[1.6]">{text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Scoring Criteria section */}
          <div className="mb-[1.8rem] mt-[1.8rem]">
            <div className="font-mono text-[0.65rem] uppercase text-white/40 mb-[1rem]">SCORING CRITERIA</div>
            <div className="divide-y divide-white/[0.05]">
              {[
                { name: "Fluency", desc: "# of valid ideas" },
                { name: "Originality", desc: "Uniqueness score" },
                { name: "Elaboration", desc: "Detail level" }
              ].map((item, i) => (
                <div key={i} className="py-[0.7rem] flex justify-between items-start">
                  <div className="font-mono text-[0.72rem] text-white/40">{item.name}</div>
                  <div className="font-mono text-[0.72rem] text-white">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Session Stats section */}
          <div className="mt-[1.8rem]">
            <div className="font-mono text-[0.65rem] uppercase text-white/40 mb-[0.8rem]">SESSION</div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="font-mono text-[0.72rem] text-white/40">Platform</div>
                <div className="font-display font-[600] text-white">ChatGPT</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="font-mono text-[0.72rem] text-white/40">Research Topic</div>
                <div className="font-mono text-[0.72rem] text-white/45 truncate max-w-[140px]">{topic}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* We add a style tag to apply hover styles inline cleanly since standard React inline styles for hover don't work */}
      <style dangerouslySetInnerHTML={{__html: `
        button.submit-btn:enabled {
          background: #00bfdb !important;
          color: #090a0c !important;
        }
        button.submit-btn:enabled:hover {
          opacity: 0.85;
          transform: translateY(-1px);
        }
      `}} />
    </div>
  );
};
