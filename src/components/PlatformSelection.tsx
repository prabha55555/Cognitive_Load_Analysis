import React, { useState } from 'react';
import { Participant } from '../types';
import { Bot, Search, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface PlatformSelectionProps {
  participant: Participant;
  onPlatformSelect: (platform: 'chatgpt' | 'google') => void;
}

export const PlatformSelection: React.FC<PlatformSelectionProps> = ({
  participant,
  onPlatformSelect
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<'chatgpt' | 'google' | null>(null);

  const handleStart = () => {
    if (selectedPlatform) {
      onPlatformSelect(selectedPlatform);
    }
  };

  return (
    <>
      <style>{`
        .font-display { font-family: 'Cabinet Grotesk', system-ui, -apple-system, sans-serif; }
        .font-mono { font-family: 'Geist Mono', ui-monospace, SFMono-Regular, monospace; }
        
        .glow-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 50%, rgba(0, 191, 219, 0.08) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.5s ease;
          pointer-events: none;
        }
        .card-container:hover .glow-overlay { opacity: 1; }
      `}</style>
      
      <div className="w-full flex justify-center mt-8">
        <div className="flex flex-col md:grid md:grid-cols-[2fr_3fr] gap-12 md:gap-16 items-start w-full">
          {/* Left Column: Context */}
          <div className="flex flex-col gap-6 pt-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00bfdb]/30 bg-[#00bfdb]/5 text-[#00bfdb] font-mono text-[0.65rem] uppercase tracking-wider w-fit">
              <Zap className="w-3 h-3" />
              Phase 1 / Research
            </div>
            
            <h1 className="font-display font-[700] text-[2.8rem] leading-[1.1] text-[#f0f2f5] tracking-tight">
              Select Your<br />Research Tool
            </h1>
            
            <p className="text-[1.1rem] leading-relaxed text-[#8a8f98] font-[400] max-w-[90%] mt-2">
              You will investigate a given topic using either an LLM or traditional search. We track cognitive load via interaction patterns.
            </p>

            <div className="flex flex-col gap-4 mt-8 bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 w-fit">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#00bfdb]" />
                <span className="font-mono text-sm text-[#c0c4cc]">Anonymous Tracking Active</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border border-white/[0.1] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                </div>
                <span className="font-mono text-sm text-[#c0c4cc]">Time limit: 15 minutes</span>
              </div>
            </div>
          </div>

          {/* Right Column: Cards */}
          <div className="flex flex-col gap-5 w-full relative z-10">
            {/* ChatGPT Card */}
            <button
              onClick={() => setSelectedPlatform('chatgpt')}
              className={`group card-container relative w-full text-left p-6 md:p-8 rounded-2xl border transition-all duration-500 overflow-hidden ${
                selectedPlatform === 'chatgpt' 
                  ? 'border-[#00bfdb] bg-[#00bfdb]/[0.03] shadow-[0_0_30px_rgba(0,191,219,0.1)]' 
                  : 'border-white/[0.08] bg-[#111214] hover:bg-[#15161A] hover:border-white/[0.15]'
              }`}
            >
              <div className="glow-overlay" />
              <div className="relative z-10 flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl flex items-center justify-center border transition-colors duration-500 ${
                  selectedPlatform === 'chatgpt' ? 'bg-[#00bfdb]/10 border-[#00bfdb]/30 text-[#00bfdb]' : 'bg-white/[0.03] border-white/[0.05] text-[#8a8f98] group-hover:text-white group-hover:bg-white/[0.06]'
                }`}>
                  <Bot size={28} strokeWidth={1.5} />
                </div>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors duration-500 ${
                  selectedPlatform === 'chatgpt' ? 'border-[#00bfdb] bg-[#00bfdb]/20' : 'border-white/[0.1]'
                }`}>
                  {selectedPlatform === 'chatgpt' && <div className="w-2.5 h-2.5 rounded-full bg-[#00bfdb]" />}
                </div>
              </div>
              
              <div className="relative z-10">
                <h3 className="font-display font-[600] text-[1.5rem] text-[#f0f2f5] tracking-wide mb-2 transition-colors">
                  ChatGPT Interface
                </h3>
                <p className="font-mono text-[0.85rem] text-[#8a8f98] leading-relaxed transition-colors group-hover:text-[#a0a5ad]">
                  Conduct research using an AI assistant. Formulate queries, evaluate responses, and synthesize information through dialogue.
                </p>
              </div>
            </button>

            {/* Google Card */}
            <button
              onClick={() => setSelectedPlatform('google')}
              className={`group card-container relative w-full text-left p-6 md:p-8 rounded-2xl border transition-all duration-500 overflow-hidden ${
                selectedPlatform === 'google' 
                  ? 'border-[#00bfdb] bg-[#00bfdb]/[0.03] shadow-[0_0_30px_rgba(0,191,219,0.1)]' 
                  : 'border-white/[0.08] bg-[#111214] hover:bg-[#15161A] hover:border-white/[0.15]'
              }`}
            >
              <div className="glow-overlay" />
              <div className="relative z-10 flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl flex items-center justify-center border transition-colors duration-500 ${
                  selectedPlatform === 'google' ? 'bg-[#00bfdb]/10 border-[#00bfdb]/30 text-[#00bfdb]' : 'bg-white/[0.03] border-white/[0.05] text-[#8a8f98] group-hover:text-white group-hover:bg-white/[0.06]'
                }`}>
                  <Search size={28} strokeWidth={1.5} />
                </div>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors duration-500 ${
                  selectedPlatform === 'google' ? 'border-[#00bfdb] bg-[#00bfdb]/20' : 'border-white/[0.1]'
                }`}>
                  {selectedPlatform === 'google' && <div className="w-2.5 h-2.5 rounded-full bg-[#00bfdb]" />}
                </div>
              </div>
              
              <div className="relative z-10">
                <h3 className="font-display font-[600] text-[1.5rem] text-[#f0f2f5] tracking-wide mb-2 transition-colors">
                  Google Search
                </h3>
                <p className="font-mono text-[0.85rem] text-[#8a8f98] leading-relaxed transition-colors group-hover:text-[#a0a5ad]">
                  Navigate traditional web search. Construct operators, evaluate disparate sources, and synthesize information manually.
                </p>
              </div>
            </button>

            {/* Action Area */}
            <div className={`mt-4 transition-all duration-500 flex justify-end ${selectedPlatform ? 'opacity-100 transform-none' : 'opacity-50 pointer-events-none translate-y-2'}`}>
              <button
                onClick={handleStart}
                disabled={!selectedPlatform}
                className="group relative px-6 py-3.5 bg-[#f0f2f5] hover:bg-white text-[#090a0c] font-display font-[600] tracking-wide rounded-xl flex items-center gap-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(240,242,245,0.2)] disabled:hover:shadow-none"
              >
                <span>Initialize Environment</span>
                <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
