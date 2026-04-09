import fs from 'fs';

let content = fs.readFileSync('src/components/CognitiveLoadResults.tsx', 'utf-8');

const replacement = `
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'Low': return { text: 'LOW LOAD', border: 'rgba(0,191,219,0.3)', bg: 'rgba(0,191,219,0.06)', color: 'rgba(0,191,219,0.8)', dot: 'rgba(0,191,219,0.9)' };
      case 'Moderate': return { text: 'MODERATE LOAD', border: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', dot: 'rgba(255,255,255,0.9)' };
      case 'High': return { text: 'HIGH LOAD', border: 'rgba(224,150,80,0.3)', bg: 'rgba(224,150,80,0.06)', color: 'rgba(224,150,80,0.8)', dot: 'rgba(224,150,80,0.9)' };
      case 'Very High': return { text: 'VERY HIGH LOAD', border: 'rgba(224,80,80,0.3)', bg: 'rgba(224,80,80,0.06)', color: 'rgba(224,80,80,0.8)', dot: 'rgba(224,80,80,0.9)' };
      default: return { text: 'UNKNOWN LOAD', border: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', dot: 'rgba(255,255,255,0.9)' };
    }
  };

  const theme = getCategoryTheme(metrics.cognitiveLoadCategory);

  return (
    <div className="flex flex-col h-screen overflow-hidden text-white" style={{ background: '#090a0c', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <style>{\`
          .font-display { font-family: 'Cabinet Grotesk', system-ui, -apple-system, sans-serif; }
          .font-mono { font-family: 'Geist Mono', ui-monospace, SFMono-Regular, monospace; }
      \`}</style>

      {/* Zone 1 — Header Bar */}
      <div style={{ background: 'rgba(9,10,12,0.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0.85rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
         <div className="flex items-center gap-[0.7rem]">
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,191,219,0.15)', border: '1px solid rgba(0,191,219,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00bfdb', fontSize: '0.75rem', fontWeight: 600 }}>
              KB
            </div>
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
               <div className="font-mono text-[0.65rem] uppercase" style={{ border: '1px solid rgba(0,191,219,0.3)', background: 'rgba(0,191,219,0.08)', color: '#00bfdb', padding: '3px 10px', borderRadius: '4px' }}>RESULTS</div>
               <div className="font-mono text-[0.65rem] uppercase" style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', padding: '3px 10px', borderRadius: '4px' }}>{platform === 'chatgpt' ? 'CHATGPT' : 'GOOGLE'}</div>
            </div>
            <button className="font-mono text-[0.65rem] uppercase text-white/40 hover:text-white transition-colors" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>Logout</button>
         </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
      
        {/* Zone 2 — Page Title Strip */}
        <div style={{ width: '100%', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '2rem 2.5rem 1.5rem', background: '#090a0c' }}>
            <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                <div className="font-mono" style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>
                    STUDY RESULTS · {platform === 'chatgpt' ? 'CHATGPT ARM' : 'GOOGLE SEARCH ARM'}
                </div>
                <div className="font-display" style={{ fontWeight: 900, fontSize: '2rem', letterSpacing: '-0.03em', color: 'white', lineHeight: 1.2 }}>
                    Cognitive Load Analysis
                </div>
                <div style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.3rem' }}>
                    Complete assessment results for this session
                </div>
            </div>
        </div>

        {/* Zone 3 — Score Hero */}
        <div style={{ width: '100%', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '2rem 2.5rem', background: '#090a0c' }}>
            <div style={{ maxWidth: '960px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                
                <div>
                    <div className="font-mono" style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '0.8rem' }}>
                        OVERALL COGNITIVE LOAD INDEX
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '0.8rem' }}>
                        <div className="font-display" style={{ fontWeight: 900, fontSize: '5rem', letterSpacing: '-0.05em', color: 'white', lineHeight: 1 }}>
                            {Math.round(metrics.overallCognitiveLoad)}
                        </div>
                        <div className="font-mono" style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.5rem' }}>
                            / 100
                        </div>
                    </div>
                    <div className="font-mono" style={{ fontSize: '0.78rem', textTransform: 'uppercase', border: \`1px solid \${theme.border}\`, background: theme.bg, color: theme.color, borderRadius: '4px', padding: '3px 10px', display: 'inline-block' }}>
                        {theme.text}
                    </div>
                    <div style={{ marginTop: '1.2rem', height: '3px', width: '100%', background: 'rgba(255,255,255,0.07)', borderRadius: '99px', position: 'relative' }}>
                        <div style={{ width: \`\${Math.round(metrics.overallCognitiveLoad)}%\`, height: '100%', background: 'linear-gradient(to right, rgba(0,191,219,0.6), rgba(224,80,80,0.8))', borderRadius: '99px' }} />
                        <div style={{ position: 'absolute', top: '50%', left: \`\${Math.round(metrics.overallCognitiveLoad)}%\`, transform: 'translate(-50%, -50%)', width: '8px', height: '8px', borderRadius: '50%', background: theme.dot }} />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.7rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="font-mono" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Platform</div>
                        <div className="font-display" style={{ fontWeight: 600, color: 'white' }}>{platform === 'chatgpt' ? 'ChatGPT' : 'Google Search'}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.7rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="font-mono" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Session Duration</div>
                        <div className="font-mono" style={{ color: '#00bfdb' }}>{formatTime(metrics.assessmentPhase.totalTime)}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.7rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="font-mono" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Questions</div>
                        <div className="font-mono" style={{ color: 'white' }}>{metrics.assessmentPhase.questionsAnswered} answered</div>
                    </div>
                </div>

            </div>
        </div>

        {/* Zone 4 — Behavioral Analysis */}
        {behavioralServiceAvailable && (
        <div style={{ width: '100%', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '2rem 2.5rem', background: '#090a0c' }}>
            <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div className="font-mono" style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                        BEHAVIORAL ANALYSIS
                    </div>
                    {platform && (
                        <div className="font-mono" style={{ fontSize: '0.65rem', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', padding: '3px 10px', borderRadius: '4px' }}>
                            {platform === 'chatgpt' ? 'ChatGPT' : 'Google Search'}
                        </div>
                    )}
                </div>

                {!behavioralResult ? (
                    <div style={{ marginTop: '1.5rem', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', textAlign: 'center' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto 0.5rem' }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                        <div className="font-mono" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.2rem' }}>No behavioral telemetry recorded for this session</div>
                        <div className="font-mono" style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)' }}>Tracking requires active interaction during the research phase</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.7rem 0', position: 'relative' }}>
                            <div className="font-mono" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Raw Click Events</div>
                            <div className="font-mono" style={{ fontWeight: 500, color: 'white' }}>{behavioralResult.features.total_clicks} clicks</div>
                            <div style={{ position: 'absolute', bottom: 0, left: 0, height: '1px', background: 'rgba(255,255,255,0.05)', width: '100%' }} />
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.7rem 0', position: 'relative' }}>
                            <div className="font-mono" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Average Response Time</div>
                            <div className="font-mono" style={{ fontWeight: 500, color: 'white' }}>{behavioralResult.features.mean_response_time.toFixed(1)}s</div>
                            <div style={{ position: 'absolute', bottom: 0, left: 0, height: '1px', background: 'rgba(255,255,255,0.05)', width: '100%' }} />
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.7rem 0', position: 'relative' }}>
                            <div className="font-mono" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Scroll Depth Coverage</div>
                            <div className="font-mono" style={{ fontWeight: 500, color: 'white' }}>{Math.round(behavioralResult.features.scroll_depth * 100)}%</div>
                            <div style={{ position: 'absolute', bottom: 0, left: 0, height: '1px', background: 'rgba(255,255,255,0.05)', width: '100%' }}>
                                <div style={{ height: '1px', background: '#00bfdb', width: \`\${Math.round(behavioralResult.features.scroll_depth * 100)}%\` }} />
                            </div>
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.7rem 0', position: 'relative' }}>
                            <div className="font-mono" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Active Tracking Time</div>
                            <div className="font-mono" style={{ fontWeight: 500, color: 'white' }}>{Math.round(behavioralResult.features.active_time_ratio * 100)}%</div>
                            <div style={{ position: 'absolute', bottom: 0, left: 0, height: '1px', background: 'rgba(255,255,255,0.05)', width: '100%' }}>
                               <div style={{ height: '1px', background: '#00bfdb', width: \`\${Math.round(behavioralResult.features.active_time_ratio * 100)}%\` }} />
                            </div>
                       </div>
                    </div>
                )}
            </div>
        </div>
        )}

        {/* Zone 5 — Assessment Phase Stats */}
        <div style={{ width: '100%', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '2rem 2.5rem', background: '#090a0c' }}>
            <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                <div className="font-mono" style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
                    ASSESSMENT PHASE
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="font-display" style={{ fontWeight: 500, fontSize: '0.9rem', color: 'rgba(255,255,255,0.55)' }}>Total Time</div>
                        <div className="font-mono" style={{ fontSize: '1rem', fontWeight: 500, color: '#00bfdb' }}>{formatTime(metrics.assessmentPhase.totalTime)}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="font-display" style={{ fontWeight: 500, fontSize: '0.9rem', color: 'rgba(255,255,255,0.55)' }}>Questions Answered</div>
                        <div className="font-mono" style={{ fontSize: '1rem', color: 'white' }}>{metrics.assessmentPhase.questionsAnswered}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="font-display" style={{ fontWeight: 500, fontSize: '0.9rem', color: 'rgba(255,255,255,0.55)' }}>Avg Time / Question</div>
                        <div className="font-mono" style={{ fontSize: '1rem', color: 'white' }}>{formatTime(Math.round(metrics.assessmentPhase.averageTimePerQuestion))}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="font-display" style={{ fontWeight: 500, fontSize: '0.9rem', color: 'rgba(255,255,255,0.55)' }}>Accuracy</div>
                        <div className="font-mono" style={{ 
                            fontSize: '1rem', 
                            fontWeight: 500, 
                            color: metrics.assessmentPhase.accuracy < 50 ? 'rgba(224,80,80,0.8)' : (metrics.assessmentPhase.accuracy >= 80 ? '#00bfdb' : 'white') 
                        }}>
                            {Math.round(metrics.assessmentPhase.accuracy)}%
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Zone 6 — Recommendations */}
        {recommendations.length > 0 && (
        <div style={{ width: '100%', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '2rem 2.5rem', background: '#090a0c' }}>
            <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                <div className="font-mono" style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
                    RECOMMENDATIONS
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {recommendations.map((rec, idx) => (
                        <div key={idx} style={{ padding: '0.85rem 0', display: 'flex', gap: '0.9rem', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="font-mono" style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', minWidth: '18px', paddingTop: '0.1rem' }}>
                                {String(idx + 1).padStart(2, '0')}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.65 }}>
                                {rec}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        )}

        {/* Zone 7 — Performance Summary + CTA */}
        <div style={{ width: '100%', padding: '2rem 2.5rem 3rem', background: '#090a0c' }}>
            <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', overflow: 'hidden', marginBottom: '2rem' }}>
                    <div style={{ background: '#0a0b0e', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div className="font-mono" style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Total Score</div>
                        <div className="font-display" style={{ fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.03em', color: 'white' }}>
                            {Math.round(metrics.assessmentPhase.totalScore)}
                        </div>
                    </div>
                    <div style={{ background: '#0a0b0e', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div className="font-mono" style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Understanding Level</div>
                        <div className="font-display" style={{ 
                            fontWeight: 800, 
                            fontSize: '2rem', 
                            letterSpacing: '-0.03em', 
                            color: metrics.assessmentPhase.accuracy < 50 ? 'rgba(224,80,80,0.85)' : 'white'
                        }}>
                            {metrics.assessmentPhase.accuracy > 80 ? 'Excellent' :
                             metrics.assessmentPhase.accuracy > 60 ? 'Good' :
                             metrics.assessmentPhase.accuracy > 40 ? 'Fair' : 'Needs Improvement'}
                        </div>
                    </div>
                </div>

                <div style={{ width: '100%' }}>
                    <button
                        onClick={() => onComplete(metrics.overallCognitiveLoad)}
                        className="font-display"
                        style={{
                            fontWeight: 700, fontSize: '0.95rem', background: '#00bfdb', color: '#090a0c', border: 'none', borderRadius: '7px', padding: '0.85rem', width: '100%', cursor: 'pointer', transition: 'all 0.15s ease'
                        }}
                        onMouseOver={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseOut={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; }}
                        onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    >
                        Complete & Continue
                    </button>
                </div>
            </div>
        </div>

      </div>

      {/* Zone 8 — Footer Strip */}
      <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '0.85rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#090a0c', flexShrink: 0 }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="font-mono" style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>BEHAVIORAL TRACKING</span>
            <div style={{ display: 'flex', gap: '0.8rem' }}>
               {['Click Events', 'Mouse Movement', 'Scroll Behavior', 'Navigation'].map(label => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                     <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00bfdb' }} />
                     <span className="font-mono" style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)' }}>{label}</span>
                  </div>
               ))}
            </div>
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="font-mono" style={{ fontSize: '0.62rem', textTransform: 'uppercase', opacity: 0.35, color: 'white', padding: '3px 9px', borderRadius: '4px' }}>RESEARCH</div>
            <div className="font-mono" style={{ fontSize: '0.62rem', textTransform: 'uppercase', opacity: 0.35, color: 'white', padding: '3px 9px', borderRadius: '4px' }}>ASSESSMENT</div>
            <div className="font-mono" style={{ fontSize: '0.62rem', textTransform: 'uppercase', opacity: 0.35, color: 'white', padding: '3px 9px', borderRadius: '4px' }}>CREATIVITY TEST</div>
            <div className="font-mono" style={{ fontSize: '0.62rem', textTransform: 'uppercase', border: '1px solid rgba(0,191,219,0.4)', background: 'rgba(0,191,219,0.08)', color: '#00bfdb', padding: '3px 9px', borderRadius: '4px' }}>RESULTS</div>
         </div>
      </div>

    </div>
  );
};
`;

const startIndex = content.indexOf('  const getCategoryColor = (category: string) => {');
const endIndex = content.lastIndexOf('};');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + replacement;
}

fs.writeFileSync('src/components/CognitiveLoadResults.tsx', content);

console.log('Update generated.');
