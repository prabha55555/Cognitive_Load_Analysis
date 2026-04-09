import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Participant } from '../types';

interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  type: 'web' | 'academic' | 'video' | 'news';
  relevance: number;
}

interface GoogleSearchInterfaceProps {
  participant: Participant;
  onQuerySubmit: (query: string) => void;
  onSearchBehavior: (behavior: {
    query: string;
    clickedResults: string[];
    timeSpent: number;
    scrollDepth: number;
  }) => void;
  onTopicChange?: (topic: string) => void;
  sessionId?: string;
  timeLeft: number;
  queriesCount: number;
  notes: string;
  onNotesChange: (notes: string) => void;
  onFinishEarly: () => void;
}

export const GoogleSearchInterface: React.FC<GoogleSearchInterfaceProps> = ({
  participant,
  onQuerySubmit,
  onSearchBehavior,
  onTopicChange,
  sessionId,
  timeLeft,
  queriesCount,
  notes,
  onNotesChange,
  onFinishEarly
}) => {
  const [currentQuery, setCurrentQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [clickedResults, setClickedResults] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'papers' | 'apps' | 'news'>('papers');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState('0.0s');
  
  // Draggable Split Pane State
  const workspaceRef = useRef<HTMLDivElement>(null);
  const paneLeftRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const divider = dividerRef.current;
    const paneLeft = paneLeftRef.current;
    const workspace = workspaceRef.current;
    
    if (!divider || !paneLeft || !workspace) return;
    
    let dragging = false;

    const onMouseDown = (e: MouseEvent) => {
      dragging = true;
      setIsDragging(true);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      divider.classList.add('active');
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const workspaceRect = workspace.getBoundingClientRect();
      const newWidth = e.clientX - workspaceRect.left;
      const minWidth = 380;
      const maxWidth = workspaceRect.width - 260;
      paneLeft.style.width = Math.min(Math.max(newWidth, minWidth), maxWidth) + 'px';
    };

    const onMouseUp = () => {
      if (!dragging) return;
      dragging = false;
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      divider.classList.remove('active');
    };

    const onTouchStart = (e: TouchEvent) => {
      dragging = true;
      setIsDragging(true);
      divider.classList.add('active');
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!dragging) return;
      const touch = e.touches[0];
      const workspaceRect = workspace.getBoundingClientRect();
      const newWidth = touch.clientX - workspaceRect.left;
      paneLeft.style.width = Math.min(Math.max(newWidth, 380), workspaceRect.width - 260) + 'px';
    };

    const onTouchEnd = () => {
      if (!dragging) return;
      dragging = false;
      setIsDragging(false);
      divider.classList.remove('active');
    };

    const onResize = () => {
      if (window.innerWidth < 768) {
        paneLeft.style.width = '100%';
        return;
      }
      const workspaceRect = workspace.getBoundingClientRect();
      const currentWidth = paneLeft.offsetWidth;
      const maxWidth = workspaceRect.width - 260;
      if (currentWidth > maxWidth && maxWidth > 0) {
        paneLeft.style.width = maxWidth + 'px';
      }
    };

    divider.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    divider.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);

    window.addEventListener('resize', onResize);

    return () => {
      divider.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      divider.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', onResize);
      
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);

    setTimeout(() => {
      const results: SearchResult[] = [
        {
          id: '1',
          title: `The ultimate guide to ${currentQuery}`,
          url: `https://example.com/guide-${currentQuery.replace(/\s+/g, '-')}`,
          snippet: `Comprehensive overview of the concepts, applications, and future trends of ${currentQuery} in modern environments.`,
          type: 'web',
          relevance: 100
        },
        {
          id: '2',
          title: `Academic Research on ${currentQuery}`,
          url: `https://scholar.example.org/papers/${currentQuery.replace(/\s+/g, '')}`,
          snippet: `Recent publications covering methodological approaches and systematic reviews concerning ${currentQuery}.`,
          type: 'academic',
          relevance: 95
        },
        {
          id: '3',
          title: `Industry Implementation of ${currentQuery}`,
          url: `https://tech.example.com/industry-${currentQuery.replace(/\s+/g, '-')}`,
          snippet: `How leading organizations are successfully implementing principles of ${currentQuery} to drive innovation.`,
          type: 'web',
          relevance: 88
        }
      ];

      setSearchResults(results);
      setSearchTime((Math.random() * (1.5 - 0.4) + 0.4).toFixed(2) + 's');
      setIsSearching(false);
      setActiveQuery(currentQuery);

      if (!searchHistory.includes(currentQuery)) {
        setSearchHistory(prev => [currentQuery, ...prev].slice(0, 10));
      }

      onQuerySubmit(currentQuery);
      
      const evt = new CustomEvent('tracking-action');
      window.dispatchEvent(evt);
    }, 200);
  };

  const handleResultClick = (id: string, url: string) => {
    if (!clickedResults.includes(id)) {
      setClickedResults(prev => [...prev, id]);
    }
  };

  const wordCount = notes.split(/\s+/).filter(w => w.length > 0).length;
  const currentTopic = participant.researchTopic || 'General Research';

  return (
    <div className="flex flex-col h-full bg-[#090a0c] text-white overflow-hidden">
      <style>{`
        .font-display { font-family: 'Cabinet Grotesk', system-ui, -apple-system, sans-serif; }
        .font-mono { font-family: 'Geist Mono', ui-monospace, SFMono-Regular, monospace; }
        
        .search-results-enter {
          animation: fade-in 0.2s ease forwards;
        }
        
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        .workspace {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
        }
        @media (min-width: 768px) {
          .workspace {
            flex-direction: row;
          }
        }
        
        .pane-left {
          width: 100%;
          flex: 0 0 auto;
          overflow-y: auto;
        }
        @media (min-width: 768px) {
          .pane-left {
            width: 75%;
            min-width: 380px;
            max-width: calc(100% - 260px);
          }
        }

        .pane-divider {
          display: none;
        }
        @media (min-width: 768px) {
          .pane-divider {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 5px;
            cursor: col-resize;
            background: rgba(255,255,255,0.07);
            position: relative;
            transition: background 0.2s ease;
            user-select: none;
          }
          .pane-divider:hover {
            background: rgba(0,191,219,0.3);
          }
          .pane-divider.active {
            background: rgba(0,191,219,0.6);
          }
          
          .pane-divider::before {
            content: '';
            width: 3px;
            height: 24px;
            border-radius: 99px;
            background: rgba(255,255,255,0.2);
            transition: background 0.2s ease;
          }
          .pane-divider:hover::before, .pane-divider.active::before {
            background: rgba(0,191,219,0.8);
          }
        }

        .pane-right {
          width: 100%;
          flex: 1 1 auto;
          overflow-y: auto;
        }
        @media (min-width: 768px) {
          .pane-right {
            width: auto;
            min-width: 260px;
          }
        }

        .workspace.dragging * {
          user-select: none;
          pointer-events: none;
        }
        .workspace.dragging .pane-divider {
          pointer-events: all;
        }
      `}</style>
      
      {/* Zone 2 Header */}
      <div 
        className="w-full flex items-center justify-between flex-shrink-0"
        style={{ padding: '1.2rem 2.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div>
          <div className="font-display font-[800] text-[1.3rem] tracking-wide text-[#f0f2f5] mb-1">
            Research Phase
          </div>
          <div className="font-mono text-[0.72rem] text-white/40 uppercase">
            Research topic: <span className="text-[#00bfdb] capitalize">{currentTopic}</span>
          </div>
        </div>
        <div style={{ border: '1px solid rgba(0,191,219,0.2)', borderRadius: '8px', padding: '0.4rem 1rem' }}>
          <div className="font-mono font-[500] text-[1.6rem] text-[#00bfdb] tracking-tight tabular-nums">
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* 2-col Draggable Workspace */}
      <div 
        ref={workspaceRef}
        className={`workspace ${isDragging ? 'dragging' : ''}`}
        style={{ backgroundColor: '#0f1114' }}
      >
        {/* Left Column - Search Workspace */}
        <div ref={paneLeftRef} className="pane-left">
          <div style={{ padding: '2rem 2.5rem' }}>
            <div className="flex justify-between items-center mb-1">
              <div className="font-mono text-[0.65rem] uppercase text-white/40 tracking-wider">
                GOOGLE SEARCH INTERFACE
              </div>
              <button className="font-mono text-[0.72rem] text-white/40 px-2 py-1 rounded transition-colors" style={{ border: '1px solid rgba(255,255,255,0.1)' }} onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'} onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
                Custom Topic
              </button>
            </div>
            <div className="font-mono text-[0.7rem] text-white/40 mb-6">
              Research: {currentTopic}
            </div>

            <form onSubmit={handleSearch} className="flex w-full">
              <div className="flex flex-1 items-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px 0 0 7px', padding: '0.75rem 1rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40 mr-3">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text"
                  value={currentQuery}
                  onChange={e => setCurrentQuery(e.target.value)}
                  placeholder={`Search for "${currentTopic}"...`}
                  className="w-full bg-transparent font-mono text-[0.9rem] text-[#f0f2f5] outline-none"
                />
              </div>
              <button 
                type="submit"
                className="font-display font-[700] text-[#090a0c] tracking-wide transition-opacity hover:opacity-85"
                style={{ background: '#00bfdb', borderRadius: '0 7px 7px 0', padding: '0.75rem 1.4rem' }}
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap gap-2 mt-[0.8rem] overflow-hidden max-h-[3.2rem]">
              {['Definitions', 'History', 'Impact on Society', 'Technological Advancements', 'Key Principles'].map((chip, idx) => (
                <button 
                  key={idx}
                  onClick={() => { setCurrentQuery(`${currentTopic} ${chip}`); handleSearch(); }}
                  className="font-mono text-[0.72rem] text-white/40 transition-colors whitespace-nowrap"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', padding: '4px 10px' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {activeQuery && (
              <div className="mt-[1.2rem] pt-[0.8rem] flex justify-between items-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="font-mono text-[0.7rem] text-white/40">
                  About {searchResults.length * 42} results for "{activeQuery}"
                </div>
                <div className="font-mono text-[0.7rem] text-white/40">
                  Search time: ~{searchTime}
                </div>
              </div>
            )}

            <div className={`mt-[1rem] flex flex-col gap-0 search-results-enter ${isSearching ? 'opacity-0' : 'opacity-100'}`} style={{ borderTop: searchResults.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              {searchResults.map(result => (
                <div 
                  key={result.id}
                  className="group cursor-pointer transition-colors"
                  style={{ padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => handleResultClick(result.id, result.url)}
                >
                  <div className="flex justify-end gap-2 mb-1">
                    <span className="font-mono text-[0.62rem] text-white/40 px-2 py-0.5 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                      {result.type}
                    </span>
                    <span className="font-mono text-[0.62rem] text-white/40 px-2 py-0.5 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                      {result.relevance}% relevant
                    </span>
                  </div>
                  <div className="font-display font-[700] text-[0.95rem] text-[#00bfdb] mb-0.5 truncate group-hover:underline">
                    {result.title}
                  </div>
                  <div className="font-mono text-[0.68rem] text-[#00bfdb]/45 mb-1.5 truncate">
                    {result.url}
                  </div>
                  <div className="font-mono text-[0.82rem] text-white/50 overflow-hidden line-clamp-2" style={{ lineHeight: '1.6' }}>
                    {result.snippet}
                  </div>
                </div>
              ))}
            </div>

            {activeQuery && (
              <div className="mt-[1.5rem] pt-[1rem] flex gap-[1.5rem] pb-[0.5rem] overflow-x-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                {[
                  { id: 'papers', label: 'Research Papers' },
                  { id: 'apps', label: 'Applications' },
                  { id: 'news', label: 'Latest News' }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`font-mono text-[0.72rem] whitespace-nowrap transition-colors pb-2 ${activeTab === tab.id ? 'text-[#00bfdb]' : 'text-white/40'}`}
                    style={{ borderBottom: activeTab === tab.id ? '1px solid #00bfdb' : 'none' }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
            
            <div className="mt-[2rem]">
               <div className="font-mono text-[0.65rem] uppercase text-white/40 tracking-wider mb-2">
                RECENT SEARCHES
               </div>
               {searchHistory.length === 0 ? (
                  <div className="font-mono text-[0.78rem] text-white/20 italic pb-[0.4rem]">No recent searches.</div>
               ) : (
                  searchHistory.map((hist, idx) => (
                    <div 
                      key={idx}
                      className="font-mono text-[0.78rem] text-white/40 cursor-pointer transition-colors"
                      style={{ padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseOver={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                      onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                      onClick={() => { setCurrentQuery(hist); handleSearch(); }}
                    >
                      {hist}
                    </div>
                  ))
               )}
            </div>

          </div>
        </div>

        {/* Divider Handle */}
        <div ref={dividerRef} className="pane-divider"></div>

        {/* Right Column - Stats + Notes */}
        <div className="pane-right">
          <div style={{ padding: '1.5rem', background: '#0a0b0e', borderLeft: '1px solid rgba(255,255,255,0.07)', minHeight: '100%' }}>
            <div className="mb-[1rem]">
              <div className="font-mono text-[0.65rem] uppercase text-white/40 tracking-wider mb-[1rem]">
                RESEARCH STATISTICS
              </div>
              
              <div className="flex justify-between items-center" style={{ padding: '0.7rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="font-mono text-[0.75rem] text-white/40">Queries Made</span>
                <span className="font-mono font-[500] text-[1.1rem] text-white">{queriesCount}</span>
              </div>
              <div className="flex justify-between items-center" style={{ padding: '0.7rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="font-mono text-[0.75rem] text-white/40">Platform</span>
                <span className="font-display font-[600] text-[0.95rem] text-white tracking-wide">Google</span>
              </div>
              <div className="flex justify-between items-center" style={{ padding: '0.7rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="font-mono text-[0.75rem] text-white/40">Time Left</span>
                <span className="font-mono text-[1.1rem] text-[#00bfdb] tabular-nums">{formatTime(timeLeft)}</span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <div className="font-mono text-[0.65rem] uppercase text-white/40 tracking-wider mb-[0.8rem]">
                RESEARCH NOTES
              </div>
              <textarea 
                value={notes}
                onChange={e => onNotesChange(e.target.value)}
                placeholder="Record your findings here..."
                className="w-full font-mono text-[0.78rem] text-white/60 outline-none transition-colors"
                style={{ 
                  minHeight: '140px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.08)', 
                  borderRadius: '7px', 
                  padding: '0.8rem',
                  resize: 'vertical'
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,191,219,0.3)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
              <div className="flex justify-between items-center" style={{ marginTop: '0.6rem' }}>
                <span className="font-mono text-[0.68rem] text-white/40">{wordCount} words</span>
                <button 
                  onClick={onFinishEarly}
                  className="font-display font-[700] text-[0.82rem] text-white/40 transition-all"
                  style={{ 
                    background: 'transparent', 
                    border: '1px solid rgba(255,255,255,0.15)', 
                    borderRadius: '6px', 
                    padding: '0.5rem 1rem' 
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'none'}
                >
                  Finish Early
                </button>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <div className="font-mono text-[0.65rem] uppercase text-white/40 tracking-wider mb-[0.5rem]">
                RECENT QUERIES
              </div>
              {searchHistory.slice(0, 5).map((q, i) => (
                <div key={i} className="font-mono text-[0.72rem] text-white/40 truncate" style={{ padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {q}
                </div>
              ))}
              {searchHistory.length === 0 && (
                <div className="font-mono text-[0.72rem] text-white/20 italic pt-1">No queries yet</div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
