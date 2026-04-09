import React from 'react';

interface LandingPageProps {
  onJoinStudy: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onJoinStudy }) => {
  return (
    <div className="min-h-screen bg-[#090a0c] text-[#ececf1] selection:bg-[#00bfdb] selection:text-[#090a0c] overflow-x-hidden">
      <style>{`
        .font-display {
          font-family: 'Cabinet Grotesk', system-ui, -apple-system, sans-serif;
        }
        .font-mono-data {
          font-family: 'Geist Mono', ui-monospace, SFMono-Regular, monospace;
        }
        .track-h1 { letter-spacing: -0.04em; }
        .track-h2 { letter-spacing: -0.03em; }

        @keyframes wave-loop {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-wave {
          animation: wave-loop 8s linear infinite;
        }

        @keyframes stagger-grow {
          0% { transform: scaleX(0); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: scaleX(1); opacity: 1; }
        }
        .participant-bar {
          transform-origin: left;
          transform: scaleX(0);
          opacity: 0;
          animation: stagger-grow 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Sticky nav */}
      <header className="sticky top-0 z-50 border-b border-[#1f2128] bg-[#090a0c]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00bfdb] opacity-60"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00bfdb]"></span>
            </div>
            <span className="font-display font-extrabold tracking-tight text-white mb-[2px]">Cognitive Load Lab</span>
          </div>
          <div className="flex items-center gap-8">
            <nav className="hidden space-x-6 text-sm font-medium text-[#8a8f98] md:block">
              <a href="#pipeline" className="hover:text-white transition-colors">Pipeline</a>
              <a href="#platforms" className="hover:text-white transition-colors">Platforms</a>
              <a href="#about" className="hover:text-white transition-colors">Protocol & IRB</a>
            </nav>
            <button 
              onClick={onJoinStudy} 
              className="bg-[#00bfdb] px-5 py-2 text-sm font-bold text-[#090a0c] transition-transform hover:-translate-y-[1px]"
            >
              Join Cohort
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1400px] grid-cols-1 border-x border-[#1f2128] lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col justify-center p-8 md:p-16 lg:p-20">
          <p className="font-mono-data text-xs uppercase tracking-widest text-[#8a8f98]">IRB-Approved Behavioral Study</p>
          <h1 className="mt-8 font-display font-[900] text-[clamp(2.6rem,5vw,4.2rem)] leading-[1.05] track-h1 text-white">
            Quantifying the cognitive cost of conversational AI.
          </h1>
          <p className="mt-8 max-w-lg text-[1rem] leading-[1.7] text-[#8b949e]">
            An empirical comparison of ChatGPT versus traditional search architecture, recording cognitive load (CLI) and divergent thinking metrics across controlled information retrieval operations.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            <button 
              onClick={onJoinStudy} 
              className="bg-[#00bfdb] px-8 py-4 text-sm font-bold text-[#090a0c] transition-transform hover:-translate-y-[1px]"
            >
              Initialize Session
            </button>
            <a 
              href="#pipeline" 
              className="border border-[#1f2128] flex justify-center items-center px-8 py-4 text-sm font-bold text-white transition-colors hover:border-[#30363d] hover:bg-[#1f2128]/20"
            >
              View Methodology
            </a>
          </div>
        </div>

        {/* Hero Right - Telemetry Animation */}
        <div className="relative border-t md:border-t-0 lg:border-l border-[#1f2128] bg-[#0c0d10] p-8 md:p-12 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center border-b border-[#1f2128] pb-6">
            <div className="font-mono-data text-[10px] tracking-widest text-[#00bfdb] flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-[#00bfdb] rounded-full animate-pulse" />
              LIVE TELEMETRY
            </div>
            <div className="flex bg-[#090a0c] border border-[#1f2128] p-1 font-mono-data">
              <div className="bg-[#1f2128] px-3 py-1 text-[11px] text-white">ChatGPT</div>
              <div className="px-3 py-1 text-[11px] text-[#8a8f98]">Google</div>
            </div>
          </div>
          
          <div className="flex-1 mt-12 z-10 space-y-5">
            {[ 
              { id: 1042, val: 47, user: 'R. Anand' },
              { id: 1043, val: 82, user: 'M. Kessler' },
              { id: 1044, val: 35, user: 'J. Chen' },
              { id: 1045, val: 68, user: 'A. Patel' },
              { id: 1046, val: 21, user: 'S. Weber' }
            ].map((usr, i) => (
              <div key={usr.id} className="flex items-center gap-4">
                <div className="w-24 font-mono-data text-[11px] text-[#8a8f98]">Sub-{usr.id}</div>
                <div className="h-[2px] flex-1 bg-[#1f2128] relative">
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-[#00bfdb] participant-bar"
                    style={{ width: `${usr.val}%`, animationDelay: `${i * 150 + 300}ms` }}
                  />
                </div>
                <div className="w-8 text-right font-mono-data text-[11px] text-white">{usr.val}</div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-48 opacity-20 pointer-events-none">
            <div className="absolute inset-0 w-[200%] h-full flex items-end">
              <svg preserveAspectRatio="none" viewBox="0 0 1000 100" className="h-2/3 w-full stroke-[#00bfdb] fill-none stroke-[2] animate-wave">
                <path d="M0,50 L40,50 L45,30 L55,80 L65,20 L75,60 L80,50 L150,50 L155,40 L165,70 L170,50 L250,50 L255,10 L265,90 L275,30 L280,50 L350,50 L360,20 L370,80 L380,50 L450,50 L460,40 L470,60 L480,50 L500,50 L540,50 L545,30 L555,80 L565,20 L575,60 L580,50 L650,50 L655,40 L665,70 L670,50 L750,50 L755,10 L765,90 L775,30 L780,50 L850,50 L860,20 L870,80 L880,50 L950,50 L960,40 L970,60 L980,50 L1000,50" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Data strip */}
      <section className="border-y border-[#1f2128] bg-[#090a0c]">
        <div className="mx-auto max-w-[1400px] border-x border-[#1f2128]">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#1f2128]">
            {[
              { label: 'Session Duration', value: '30–45m' },
              { label: 'Test Conditions', value: '2 Platforms' },
              { label: 'Data Collection', value: 'Live Telemetry' },
              { label: 'Protocol Status', value: 'IRB Approved' }
            ].map(stat => (
              <div key={stat.label} className="p-6 md:p-8 flex flex-col justify-between md:items-start items-center text-center md:text-left min-h-[120px]">
                <p className="font-mono-data text-[#8a8f98] text-[10px] uppercase tracking-widest mb-4">{stat.label}</p>
                <p className="font-mono-data text-white text-xl">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Study Pipeline */}
      <section id="pipeline" className="py-32 px-6 max-w-[1400px] mx-auto border-x border-[#1f2128]">
        <h2 className="font-display font-[800] text-3xl track-h2 text-white mb-20 text-center md:text-left">
          Study Pipeline
        </h2>
        
        <div className="relative">
          {/* Connector Line */}
          <div className="hidden md:block absolute top-[20px] left-[20px] right-[20px] h-px bg-[#1f2128]" />
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {[
              { t: 'Join', d: 'Cohort assignment and platform selection.' },
              { t: 'Baseline', d: 'Telemetry initialization and calibration.' },
              { t: 'Task', d: 'Information retrieval across constraints.' },
              { t: 'Creativity', d: 'Standardized AUT and RAT measurements.' },
              { t: 'Results', d: 'CLI scoring and phase comparison.' }
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-row md:flex-col items-start gap-6 group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#090a0c] border border-[#1f2128] text-[#8a8f98] font-mono-data text-xs transition-colors group-hover:border-[#00bfdb] group-hover:text-[#00bfdb]">
                  0{i + 1}
                </div>
                <div>
                  <h3 className="text-white font-bold mb-2 text-sm">{step.t}</h3>
                  <p className="text-[#8a8f98] text-sm leading-[1.7]">{step.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section id="platforms" className="py-32 px-6 max-w-[1400px] mx-auto border-t border-x border-[#1f2128]">
        <h2 className="font-display font-[800] text-3xl track-h2 text-white mb-20">
          Target Paradigms
        </h2>

        {/* ChatGPT */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 items-stretch border border-[#1f2128] mb-12">
          <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-[#1f2128] relative overflow-hidden group">
            <div className="absolute inset-0 border border-[#00bfdb] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="p-10 md:p-14 relative z-10 h-full flex flex-col justify-center">
              <div className="font-mono-data text-[10px] text-[#00bfdb] tracking-widest mb-8 uppercase">Primary Condition (A)</div>
              <h3 className="font-display font-[900] text-4xl text-white mb-6">ChatGPT</h3>
              <p className="text-[#8b949e] leading-[1.7] mb-8 max-w-xl text-[1rem]">
                Measuring cognitive reliance and analytical delegation in conversational interfaces during complex reasoning scenarios.
              </p>
              <ul className="space-y-4 font-mono-data text-xs text-[#8a8f98] mt-auto">
                <li className="flex items-center gap-4"><span className="text-[#00bfdb] text-base leading-none">]</span> Context retention tracking</li>
                <li className="flex items-center gap-4"><span className="text-[#00bfdb] text-base leading-none">]</span> Query refinement latency</li>
                <li className="flex items-center gap-4"><span className="text-[#00bfdb] text-base leading-none">]</span> Output verification effort</li>
              </ul>
            </div>
            {/* Ambient glow */}
            <div className="absolute -top-[50%] -right-[20%] w-[80%] h-[150%] bg-[#00bfdb]/[0.02] transform rotate-12 pointer-events-none" />
          </div>
          <div className="lg:col-span-2 bg-[#0c0d10] p-10 md:p-14 flex flex-col justify-center">
            <div className="font-mono-data text-[10px] text-[#8a8f98] mb-6 tracking-widest uppercase">Target Metric</div>
            <div className="text-5xl text-white font-mono-data mb-4">47.3%</div>
            <p className="text-[#8b949e] leading-[1.7] text-sm">
              Expected variance in active formulation time versus control architecture.
            </p>
          </div>
        </div>

        {/* Google Search */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 items-stretch border border-[#1f2128]">
          <div className="lg:col-span-2 bg-[#0c0d10] p-10 md:p-14 order-2 lg:order-1 flex flex-col justify-center border-t lg:border-t-0 lg:border-r border-[#1f2128]">
            <div className="font-mono-data text-[10px] text-[#8a8f98] mb-6 tracking-widest uppercase">Target Metric</div>
            <div className="text-5xl text-white font-mono-data mb-4">2.1&times;</div>
            <p className="text-[#8b949e] leading-[1.7] text-sm">
              Hypothesized increase in source cross-referencing actions.
            </p>
          </div>
          <div className="lg:col-span-3 relative overflow-hidden group order-1 lg:order-2">
            <div className="absolute inset-0 border border-[#30363d] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="p-10 md:p-14 relative z-10 h-full flex flex-col justify-center">
              <div className="font-mono-data text-[10px] text-[#8a8f98] tracking-widest mb-8 uppercase">Control Condition (B)</div>
              <h3 className="font-display font-[900] text-4xl text-white mb-6">Google Search</h3>
              <p className="text-[#8b949e] leading-[1.7] mb-8 max-w-xl text-[1rem]">
                Evaluating the baseline traditional information architecture. Quantifying navigational burden and memory allocation across SERP layers.
              </p>
              <ul className="space-y-4 font-mono-data text-xs text-[#8a8f98] mt-auto">
                <li className="flex items-center gap-4"><span className="text-[#30363d] text-base leading-none">/</span> Tab management overhead</li>
                <li className="flex items-center gap-4"><span className="text-[#30363d] text-base leading-none">/</span> Depth-first scanning patterns</li>
                <li className="flex items-center gap-4"><span className="text-[#30363d] text-base leading-none">/</span> Direct synthesis cognitive friction</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* About / Mission */}
      <section id="about" className="py-32 px-6 max-w-[1400px] mx-auto border-t border-x border-[#1f2128] bg-[#0c0d10]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          <div className="md:px-8">
            <h2 className="font-display font-[800] text-3xl track-h2 text-white mb-8">
              Research Mission
            </h2>
            <p className="text-[#8b949e] leading-[1.7] mb-10 text-[1rem]">
              The Cognitive Load Lab investigates the intersection of semantic retrieval and human cognition. By employing standardized psychometric measures—such as the Alternative Uses Test (AUT) and Remote Associates Test (RAT)—we quantify how differing information paradigms impact divergent thinking capabilities and cognitive exhaustion.
            </p>
            <div className="flex items-start gap-4 border border-[#1f2128] bg-[#090a0c] p-6">
              <div className="text-[#00bfdb] font-mono-data text-sm mt-0.5">*</div>
              <p className="text-xs text-[#8a8f98] leading-[1.6]">
                <strong className="text-white font-medium mr-1">Ethics & Privacy:</strong> 
                This platform operates strictly under approved IRB protocols. Telemetry capture is restricted to generic interactions and anonymized via secure hashes. No personally identifiable search data is retained beyond the consented demographic linkage.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#1f2128] border-y lg:border-l lg:border-y-0 border-[#1f2128]">
            <div className="bg-[#0c0d10] p-10 flex flex-col justify-center">
              <div className="font-mono-data text-4xl text-white mb-3 tracking-tight">n=284</div>
              <div className="font-mono-data text-[10px] text-[#8a8f98] uppercase tracking-widest">Active Datapoints</div>
            </div>
            <div className="bg-[#0c0d10] p-10 flex flex-col justify-center">
              <div className="font-mono-data text-4xl text-[#00bfdb] mb-3 tracking-tight">47.3</div>
              <div className="font-mono-data text-[10px] text-[#8a8f98] uppercase tracking-widest">Mean Dataset CLI</div>
            </div>
            <div className="bg-[#0c0d10] p-10 flex flex-col justify-center sm:col-span-2">
              <div className="font-mono-data text-xl text-white mb-3">M. Kessler, et al.</div>
              <div className="font-mono-data text-[10px] text-[#8a8f98] uppercase tracking-widest">Principal Investigators</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-y border-[#1f2128] bg-[#090a0c] py-12 px-6">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <span className="font-display font-[800] text-white tracking-tight">Cognitive Load Lab</span>
            <span className="w-1 h-1 bg-[#1f2128] rounded-full" />
            <span className="font-mono-data text-[10px] text-[#8a8f98] tracking-widest">EST. 2026</span>
          </div>
          <div className="text-[10px] text-[#8a8f98] font-mono-data tracking-widest">
            IRB PROTOCOL #492-B. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
};
 