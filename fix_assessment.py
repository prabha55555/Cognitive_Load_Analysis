import re

with open('temp_assessment.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the handleSubmitAnswer logic:
text = text.replace('setIsReadyToSubmit(true);', 'onComplete(newResponses);')

# Split at "    // Show loading state\\n"
parts = text.split('    // Show loading state\\n')
if len(parts) < 2:
    print("Failed to find split point")
    exit(1)

state_portion = parts[0]

ui_portion = \"\"\"    // Show loading state
    if (isLoading) {
      return (
        <div className="flex flex-col h-screen overflow-hidden text-white" style={{ background: '#090a0c', justifyContent: 'center', alignItems: 'center' }}>
          <style>{\
            .font-display { font-family: 'Cabinet Grotesk', system-ui, -apple-system, sans-serif; }
            .font-mono { font-family: 'Geist Mono', ui-monospace, SFMono-Regular, monospace; }
            @keyframes bar-wave {
              from { transform: scaleY(0.3); opacity: 0.4; }
              to   { transform: scaleY(1);   opacity: 1;   }
            }
          \}</style>
          <div style={{ display: 'flex', gap: '4px' }}>
             {[...Array(5)].map((_, i) => (
                <div key={i} style={{ width: '3px', borderRadius: '99px', background: '#00bfdb', height: '32px', animation: 'bar-wave 0.8s ease-in-out infinite alternate', animationDelay: \\s\, transformOrigin: 'center' }} />
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
      <div className="flex flex-col h-screen" style={{ background: '#090a0c', color: 'white', minHeight: '100dvh', display: 'grid', gridTemplateRows: 'auto auto auto 1fr auto' }}>
        <style>{\
            .font-display { font-family: 'Cabinet Grotesk', system-ui, -apple-system, sans-serif; }
            .font-mono { font-family: 'Geist Mono', ui-monospace, SFMono-Regular, monospace; }
        \}</style>
        
        {/* Zone 1 — Header Bar */}
        <div style={{ background: 'rgba(9,10,12,0.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0.85rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div className="flex items-center gap-[0.7rem]">
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,191,219,0.15)', border: '1px solid rgba(0,191,219,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00bfdb', fontSize: '0.75rem', fontWeight: 600 }}>KB</div>
              <div className="flex flex-col">
                  <div className="font-display" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Kishore Balaji</div>
                  <div className="font-mono" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>bkishore368@gmail.com</div>
              </div>
           </div>
           <div className="flex items-center gap-[1.5rem]">
              <div className="flex items-center gap-[0.4rem] font-mono text-[0.62rem] text-white/50 uppercase">
                 <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00bfdb', animation: 'pulse-opacity 1.8s ease-in-out infinite' }} />
                 0 min
              </div>
              <div className="flex gap-[0.5rem]">
                 <div className="font-mono text-[0.65rem] uppercase" style={{ border: '1px solid rgba(0,191,219,0.3)', background: 'rgba(0,191,219,0.08)', color: '#00bfdb', padding: '3px 10px', borderRadius: '4px' }}>ASSESSMENT</div>
                 <div className="font-mono text-[0.65rem] uppercase" style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', padding: '3px 10px', borderRadius: '4px' }}>CHATGPT</div>
              </div>
              <button className="font-mono text-[0.65rem] uppercase text-white/40 hover:text-white transition-colors" style={{ background: 'transparent', border: 'none' }}>Logout</button>
           </div>
        </div>

        {/* Zone 2 — Phase Header Strip */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '1.2rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#090a0c' }}>
           <div>
              <div className="font-display" style={{ fontWeight: 800, fontSize: '1.3rem', color: 'white', marginBottom: '0.1rem' }}>Assessment Phase</div>
              <div className="font-mono" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Topic: <span style={{ color: '#00bfdb', textTransform: 'capitalize' }}>{researchTopic}</span></div>
           </div>
           <div style={{ border: '1px solid rgba(0,191,219,0.2)', borderRadius: '8px', padding: '0.4rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="font-mono" style={{ fontWeight: 500, fontSize: '1.5rem', color: '#00bfdb' }}>{formatTime(timeElapsed)}</div>
              <div className="font-mono" style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>Question Time</div>
           </div>
        </div>

        {/* Zone 3 — Progress Bar */}
        <div style={{ padding: '0.8rem 2.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#090a0c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
           <div className="font-mono" style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>PROGRESS</div>
           <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '99px' }}>
              <div style={{ background: '#00bfdb', borderRadius: '99px', width: \\%\, height: '100%', transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)' }} />
           </div>
           <div className="font-mono" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Question {currentQ} of {totalQ}</div>
        </div>

        {/* Zone 4 — Question Area */}
        <div style={{ flex: 1, padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: '860px', margin: '0 auto', width: '100%', overflowY: 'auto' }}>
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

           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
              {currentQuestion.options.map((option, idx) => {
                 const isSelected = selectedAnswer === option;
                 return (
                    <div
                       key={idx}
                       onClick={() => setSelectedAnswer(option)}
                       style={{
                          display: 'flex', alignItems: 'flex-start', gap: '0.9rem', padding: '0.9rem 1rem',
                          border: \1px solid \\,
                          borderRadius: '7px',
                          background: isSelected ? 'rgba(0,191,219,0.06)' : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                       }}
                       onMouseOver={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; } }}
                       onMouseOut={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; } }}
                    >
                       <div style={{
                          width: '18px', height: '18px', borderRadius: '50%', border: \1px solid \\,
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

        {/* Zone 5 — Telemetry Footer Strip */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '0.85rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#090a0c', flexWrap: 'wrap', gap: '1rem' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="font-mono" style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>BEHAVIORAL TRACKING</span>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                 {['Focus', 'Hesitation', 'Completion', 'Velocity'].map((label, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                       <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: selectedAnswer ? '#00bfdb' : 'rgba(255,255,255,0.15)' }} />
                       <span className="font-mono" style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)' }}>{label}</span>
                    </div>
                 ))}
              </div>
           </div>
           
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div className="font-mono uppercase text-[0.62rem]" style={{ opacity: 0.35, color: 'white' }}>Research</div>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
              <div className="font-mono uppercase text-[0.62rem]" style={{ border: '1px solid #00bfdb', background: 'rgba(0,191,219,0.06)', color: '#00bfdb', padding: '2px 8px', borderRadius: '4px' }}>Assessment</div>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
              <div className="font-mono uppercase text-[0.62rem]" style={{ opacity: 0.25, color: 'white' }}>Creativity Test</div>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
              <div className="font-mono uppercase text-[0.62rem]" style={{ opacity: 0.25, color: 'white' }}>Results</div>
           </div>
        </div>

      </div>
    );
}
\"\"\"

final = state_portion + ui_portion

with open('d:/personal_projects/Cognitive_Load_Analysis/src/components/AssessmentPhase.tsx', 'w', encoding='utf-8') as f:
    f.write(final)

