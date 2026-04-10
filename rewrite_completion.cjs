const fs = require('fs');
let code = fs.readFileSync('src/components/ParticipantDashboard.tsx', 'utf8');

// 1. the completion screen chunk (case 'completed')
const completedOldStart = code.indexOf(`      case 'completed':`);
const completedOldEnd = code.indexOf(`      default:`, completedOldStart);

const completedNewChunk = `      case 'completed':
        const finalCognitiveScore = participant.cognitiveLoadScore ?? 0;
        const finalCreativityScore = participant.creativityScore ?? 0;
        const timeSpent = '0m 10s'; // Hardcoded as prompt specifies, but ideally dynamic

        return (
          <div className="flex-1 bg-[#090a0c] text-white flex flex-col max-w-full overflow-y-auto">
            {/* Zone 2 — Completion Strip */}
            <div className="w-full px-[2.5rem] pt-[3rem] pb-[2rem] border-b border-white/[0.07]">
              <div className="max-w-[960px] mx-auto text-left">
                <div className="font-mono text-[0.68rem] uppercase text-white/40 mb-[0.6rem]">
                  STUDY SESSION · {(selectedPlatform || participant.assignedPlatform || 'Platform').toUpperCase()} ARM · COMPLETED
                </div>
                <h2 className="font-display font-[900] text-[2.4rem] tracking-[-0.04em] text-white leading-tight">
                  Session complete.
                </h2>
                <div className="mt-[0.6rem] text-[0.9rem] text-white/45 leading-[1.7] max-w-[52ch]">
                  Your participation has been recorded. All behavioral telemetry and assessment data has been anonymized and submitted to the research pipeline.
                </div>
              </div>
            </div>

            {/* Zone 3 — Score Grid */}
            <div className="w-full px-[2.5rem] py-[2rem] border-b border-white/[0.07]">
              <div className="max-w-[960px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white/[0.07] border border-white/[0.07] rounded-[10px] overflow-hidden">
                {/* Cell 1 */}
                <div className="bg-[#0a0b0e] p-[2rem_2.5rem] flex flex-col gap-[0.5rem] relative">
                  <div className="font-mono text-[0.65rem] uppercase text-white/40">COGNITIVE LOAD INDEX</div>
                  <div>
                    <span className="font-display font-[900] text-[3.8rem] tracking-[-0.05em] text-white leading-none">
                      {finalCognitiveScore}
                    </span>
                    <span className="font-mono text-[1rem] text-white/40 ml-2">/ 100</span>
                  </div>
                  <div className="mt-1">
                    <span className="border border-[#e05050]/30 bg-[#e05050]/[0.06] text-[#e05050]/75 rounded-[4px] px-[10px] py-[3px] font-mono text-[0.65rem] uppercase">
                      VERY HIGH LOAD
                    </span>
                  </div>
                  <div className="font-mono text-[0.68rem] text-white/40 mt-[0.4rem]">Average cognitive demand during session</div>
                  
                  {/* Load bar at bottom */}
                  <div className="absolute bottom-[2rem] left-[2.5rem] right-[2.5rem] h-[2px] bg-white/[0.06] rounded-full overflow-hidden mt-[2rem]">
                    <div 
                      className="h-full rounded-full" 
                      style={{
                        width: \`\${finalCognitiveScore}%\`,
                        background: 'linear-gradient(90deg, rgba(0,191,219,0.5) 0%, rgba(224,80,80,0.8) 100%)'
                      }}
                    ></div>
                  </div>
                  {/* Spacer to push content up if needed */}
                  <div className="h-[2rem]"></div>
                </div>

                {/* Cell 2 */}
                <div className="bg-[#0a0b0e] p-[2rem_2.5rem] flex flex-col gap-[0.5rem] relative">
                  <div className="font-mono text-[0.65rem] uppercase text-white/40">CREATIVITY SCORE (AUT)</div>
                  <div>
                    <span className="font-display font-[900] text-[3.8rem] tracking-[-0.05em] text-white leading-none">
                      {finalCreativityScore}
                    </span>
                    <span className="font-mono text-[1rem] text-white/40 ml-2">pts</span>
                  </div>
                  <div className="mt-1">
                    <span className="border border-white/10 bg-white/[0.03] text-white/45 rounded-[4px] px-[10px] py-[3px] font-mono text-[0.65rem] uppercase">
                      MODERATE
                    </span>
                  </div>
                  <div className="font-mono text-[0.68rem] text-white/40 mt-[0.4rem]">Fluency and originality composite</div>
                  
                  {/* Score bar at bottom */}
                  <div className="absolute bottom-[2rem] left-[2.5rem] right-[2.5rem] h-[2px] bg-white/[0.06] rounded-full overflow-hidden mt-[2rem]">
                    <div 
                      className="h-full bg-[#00bfdb] rounded-full" 
                      style={{ width: \`\${Math.min(finalCreativityScore, 100)}%\` }}
                    ></div>
                  </div>
                  <div className="h-[2rem]"></div>
                </div>
              </div>
            </div>

            {/* Zone 4 — Session Summary */}
            <div className="w-full px-[2.5rem] py-[2rem] border-b border-white/[0.07]">
              <div className="max-w-[960px] mx-auto">
                <div className="font-mono text-[0.65rem] uppercase text-white/40 mb-[1rem]">SESSION SUMMARY</div>
                <div className="divide-y divide-white/[0.06]">
                  {[
                    { label: 'Platform', value: (selectedPlatform === 'google' ? 'Google Search' : 'ChatGPT'), style: 'font-display font-[600] text-[0.9rem] text-white' },
                    { label: 'Research Topic', value: participant.researchTopic || 'Climate Change Solutions', style: 'text-[0.88rem] text-white/60' },
                    { label: 'Total Session Time', value: '0m 10s', style: 'font-mono text-[0.9rem] text-[#00bfdb]' },
                    { label: 'Assessment Accuracy', value: '40%', style: 'font-mono text-[0.9rem] text-[#e05050]/80' },
                    { label: 'Questions Answered', value: '5 / 5', style: 'font-mono text-[0.9rem] text-white' },
                    { label: 'Creativity Responses', value: '1 submitted', style: 'font-mono text-[0.9rem] text-white' }
                  ].map((stat, idx) => (
                    <div key={idx} className="py-[0.75rem] flex justify-between items-center">
                      <div className="font-mono text-[0.72rem] text-white/35">{stat.label}</div>
                      <div className={stat.style}>{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Zone 5 — Data Confirmation */}
            <div className="w-full px-[2.5rem] py-[1.5rem] border-b border-white/[0.07]">
              <div className="max-w-[960px] mx-auto flex flex-wrap gap-[2rem] items-start">
                {[
                  "Behavioral data anonymized",
                  "Assessment responses recorded",
                  "IRB protocol followed"
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-[0.5rem] items-center">
                    <div className="w-[6px] h-[6px] rounded-full bg-[#00bfdb]/60"></div>
                    <div className="font-mono text-[0.72rem] text-white/35">{item}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Zone 6 — CTA Area */}
            <div className="w-full px-[2.5rem] pt-[2.5rem] pb-[3rem]">
              <div className="max-w-[960px] mx-auto flex flex-wrap gap-[1rem] items-center">
                <button 
                  onClick={() => {}}
                  className="font-display font-[700] text-[0.92rem] bg-[#00bfdb] text-[#090a0c] rounded-[7px] px-[2rem] py-[0.75rem] transition-all duration-200 hover:opacity-[0.85] hover:translate-y-[-1px] active:scale-[0.98]"
                >
                  View Full Results
                </button>
                <button 
                  onClick={() => {}}
                  className="font-display font-[600] text-[0.88rem] bg-transparent border border-white/[0.12] text-white/45 rounded-[7px] px-[1.5rem] py-[0.75rem] transition-all duration-200 hover:border-white/30 hover:text-white/75"
                >
                  Download Report
                </button>
                <div className="w-full mt-[0.2rem] font-mono text-[0.68rem] text-white/20">
                  You may now close this window or view your detailed cognitive load analysis.
                </div>
              </div>
            </div>

          </div>
        );
`;

code = code.substring(0, completedOldStart) + completedNewChunk + code.substring(completedOldEnd);

// 2. update isEdgeToEdge
code = code.replace(
  `    participant.currentPhase === 'results';`,
  `    participant.currentPhase === 'results' ||
    participant.currentPhase === 'completed';`
);

// 3. update header pills
// Look for `<div className="hidden sm:flex items-center gap-3">` -> replace the currentPhase block
const headerPillRegex = /<div className="hidden sm:flex items-center gap-3">\\s*<div className="font-mono text-\\[0\.65rem\\] uppercase px-2\.5 py-1 border border-white\/20 text-white\/40 rounded-full">\\s*\{participant\.currentPhase\.replace\('_', ' '\)\}\\s*<\/div>\\s*<div className=\{\`font-mono text-\\[0\.65rem\\] uppercase px-2\.5 py-1 border rounded-full transition-colors duration-400 \$\{badgeClass\}\`\}>\\s*\{badgeLabel\}\\s*<\/div>\\s*<\/div>/;

const newHeaderPills = `{participant.currentPhase === 'completed' ? (
            <div className="hidden sm:flex items-center gap-3">
              <div className="font-mono text-[0.65rem] uppercase px-2.5 py-1 border border-[#00bfdb]/30 bg-[#00bfdb]/[0.08] text-[#00bfdb] rounded-full">
                COMPLETED
              </div>
              <div className="font-mono text-[0.65rem] uppercase px-2.5 py-1 border border-white/10 text-white/40 rounded-full">
                {(selectedPlatform || participant.assignedPlatform || '').toUpperCase()}
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <div className="font-mono text-[0.65rem] uppercase px-2.5 py-1 border border-white/20 text-white/40 rounded-full">
                {participant.currentPhase.replace('_', ' ')}
              </div>
              <div className={\`font-mono text-[0.65rem] uppercase px-2.5 py-1 border rounded-full transition-colors duration-400 \${badgeClass}\`}>
                {badgeLabel}
              </div>
            </div>
          )}`;
code = code.replace(headerPillRegex, newHeaderPills);

// 4. Update the header tracker dot (pulse vs static for completed)
code = code.replace(
  `<div className={\`h-1.5 w-1.5 rounded-full \${isTrackingActive ? 'bg-[#00bfdb]/60 pulse-dot' : 'bg-white/20'}\`} />`,
  `<div className={\`h-1.5 w-1.5 rounded-full \${participant.currentPhase === 'completed' ? 'bg-[#00bfdb] opacity-40' : (isTrackingActive ? 'bg-[#00bfdb]/60 pulse-dot' : 'bg-white/20')}\`} />`
);

// 5. Update footer tracker dots for complete phase
code = code.replace(
  `className={\`h-[5px] w-[5px] rounded-full transition-colors duration-400 \${\n                  isTrackingActive ? 'bg-[#00bfdb] pulse-dot' : 'bg-white/[0.15]'\n                }\`} `,
  `className={\`h-[5px] w-[5px] rounded-full transition-colors duration-400 \${\n                  participant.currentPhase === 'completed' ? 'bg-[#00bfdb]/50' : (isTrackingActive ? 'bg-[#00bfdb] pulse-dot' : 'bg-white/[0.15]')\n                }\`} `
);


// 6. Update footer phase pills to force "RESULTS" to be active and others muted when 'completed'
// Actually "Fix phase pill labels — hardcode as ASCII: RESEARCH · ASSESSMENT · CREATIVITY TEST · RESULTS."
const footerRegex = /<div className="flex items-center gap-2">\\s*\{phaseOrder\.map\(\(phase, idx\) => \{\\s*const isActive = participant\.currentPhase === phase \|\|[^}]*?\} \)\\s*<\/div>/g;

const newFooterPills = `
        <div className="flex items-center gap-2">
          {participant.currentPhase === 'completed' ? (
            <>
              {['RESEARCH', 'ASSESSMENT', 'CREATIVITY TEST', 'RESULTS'].map((phase, idx) => (
                <div key={phase} className="flex items-center gap-2">
                  <div className={\`font-mono text-[0.62rem] uppercase px-[8px] py-[3px] rounded-[4px] \${
                    phase === 'RESULTS' 
                      ? 'border border-[#00bfdb]/40 bg-[#00bfdb]/[0.08] text-[#00bfdb]' 
                      : 'border-none text-white/35 opacity-35'
                  }\`}>
                    {phase}
                  </div>
                  {idx < 3 && <div className="font-mono text-[0.7rem] text-white/40 px-1">·</div>}
                </div>
              ))}
            </>
          ) : (
            phaseOrder.map((phase, idx) => {
              const labelMap = {
                'research': 'RESEARCH',
                'assessment': 'ASSESSMENT',
                'creativity_test': 'CREATIVITY TEST',
                'results': 'RESULTS'
              };
              const isActive = participant.currentPhase === phase || 
                              (phase === 'research' && isSelectingPlatform);
              return (
                <div key={phase} className="flex items-center gap-2">
                  <div className={\`font-mono text-[0.62rem] uppercase px-[8px] py-[3px] border rounded-[4px] \${
                    isActive 
                      ? 'border-[#00bfdb] bg-[#00bfdb]/[0.08] text-[#00bfdb]' 
                      : 'border-white/[0.07] text-white/40 opacity-40'
                  }\`}>
                    {labelMap[phase as keyof typeof labelMap]}
                  </div>
                  {idx < phaseOrder.length - 1 && (
                    <div className="font-mono text-[0.7rem] text-white/40 px-1">·</div>
                  )}
                </div>
              );
            })
          )}
        </div>`;

// Apply footer
const footerStr = `<div className="flex items-center gap-2">
          {phaseOrder.map((phase, idx) => {
            const isActive = participant.currentPhase === phase || 
                             (phase === 'research' && isSelectingPlatform);
            return (
              <div key={phase} className="flex items-center gap-2">
                <div className={\`font-mono text-[0.65rem] uppercase px-[10px] py-[3px] border rounded-[4px] \${
                  isActive 
                    ? 'border-[#00bfdb] bg-[#00bfdb]/[0.08] text-[#00bfdb]' 
                    : 'border-white/[0.07] text-white/40 opacity-40'
                }\`}>
                  {phase.replace('_', ' ')}
                </div>
                {idx < phaseOrder.length - 1 && (
                  <div className="font-mono text-[0.7rem] text-white/40 px-1"></div>
                )}
              </div>
            );
          })}
        </div>`;

// Replace using direct string logic
const beforeFooter = code.substring(0, code.indexOf('<div className="flex items-center gap-2">'));
const afterFooter = code.substring(code.indexOf('</footer>'));

code = beforeFooter + newFooterPills + '\n      ' + afterFooter;

fs.writeFileSync('src/components/ParticipantDashboard.tsx', code);
console.log('Update complete.');

