import React, { useState, useEffect, useRef } from 'react';
import { Participant } from '../types';
import llmService, { ChatMessage } from '../services/llmService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  relevanceScore?: number;
}

interface ChatGPTInterfaceProps {
  participant: Participant;
  onQuerySubmit: (query: string, analytics?: any) => void;
  onTopicChange?: (topic: string) => void;
  sessionId?: string;
  timeLeft: number;
  queriesCount: number;
  notes: string;
  onNotesChange: (notes: string) => void;
  onFinishEarly: () => void;
}

export const ChatGPTInterface: React.FC<ChatGPTInterfaceProps> = ({
  participant,
  onQuerySubmit,
  timeLeft,
  queriesCount,
  notes,
  onNotesChange,
  onFinishEarly
}) => {

  const initialTopic = participant.researchTopic || 'General Research';
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AI research assistant. I'm here to help you explore "${initialTopic}" with detailed, accurate information.\n\n[TOPIC] **Research Focus**: ${initialTopic}\n\nFor the best experience and data quality, please keep your questions related to your assigned research topic. I'll help guide you if your questions go off-topic.\n\nWhat would you like to know about ${initialTopic}?`,
      timestamp: new Date(),
      relevanceScore: 100
    }
  ]);
  
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [avgResponse, setAvgResponse] = useState(1.2);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Draggable Split Pane State
  const workspaceRef = useRef<HTMLDivElement>(null);
  const paneLeftRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    const divider = dividerRef.current;
    const paneLeft = paneLeftRef.current;
    const workspace = workspaceRef.current;
    
    if (!divider || !paneLeft || !workspace) return;
    
    let dragging = false;

    const onMouseDown = () => {
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
      const minWidth = 420;
      const maxWidth = workspaceRect.width - 280;
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

    const onTouchStart = () => {
      dragging = true;
      setIsDragging(true);
      divider.classList.add('active');
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!dragging) return;
      const touch = e.touches[0];
      const workspaceRect = workspace.getBoundingClientRect();
      const newWidth = touch.clientX - workspaceRect.left;
      paneLeft.style.width = Math.min(Math.max(newWidth, 420), workspaceRect.width - 280) + 'px';
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
      const maxWidth = workspaceRect.width - 280;
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

  const handleInputResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 140) + 'px';
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentInput.trim()) return;

    if (queriesCount === 0) {
      const evt = new CustomEvent('tracking-action');
      window.dispatchEvent(evt); // Activate tracker dots
    }

    const newMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMsg]);
    const queryText = currentInput.trim();
    setCurrentInput('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }

    setIsTyping(true);
    onQuerySubmit(queryText);

    try {
      const conversationHistory: ChatMessage[] = messages.slice(-6).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const streamGenerator = llmService.streamGeminiResponse(
        queryText,
        initialTopic,
        conversationHistory
      );

      const assistantMessageId = (Date.now() + 1).toString();
      
      // Setup streaming state message
      setMessages(prev => [
        ...prev, 
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          relevanceScore: Math.floor(Math.random() * 20 + 80)
        }
      ]);
      setIsTyping(false); // remove dots since we are streaming text now

      let accumulatedText = "";
      
      for await (const chunk of streamGenerator) {
        accumulatedText = chunk.text;
        
        // Update the streaming message in place
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: accumulatedText + (chunk.isComplete ? '' : '▋') }
            : msg
        ));
      }
      
      setAvgResponse(prev => (prev * queriesCount + (Math.random() * 0.8 + 1.2)) / (queriesCount + 1));
      
    } catch (error) {
      console.error('Error generating response:', error);
      setMessages(prev => [
        ...prev, 
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '**Error:** Failed to communicate with the LLM service. Please check your API keys or connection and try again.',
          timestamp: new Date()
        }
      ]);
      setIsTyping(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' });
  };

  const renderContent = (content: string) => {
    const rendered = content.split('\n\n').map((para, i) => (
      <p key={i} className={i > 0 ? "mt-3" : ""}>
        {para.split(/(?=\[TOPIC\]|\*\*.*\*\*)/g).map((segment, j) => {
          if (segment.startsWith('[TOPIC]')) {
            const rest = segment.substring(7);
            return (
              <React.Fragment key={j}>
                <span className="inline-block" style={{ background: 'rgba(0,191,219,0.08)', border: '1px solid rgba(0,191,219,0.18)', borderRadius: '4px', padding: '2px 7px', fontSize: '0.65rem', color: '#00bfdb', fontFamily: "'Geist Mono', monospace" }}>[TOPIC]</span>
                {renderContent(rest)}
              </React.Fragment>
            );
          } else if (segment.match(/^\*\*.*\*\*/)) {
            const match = /^\*\*(.*?)\*\*(.*)$/s.exec(segment);
            if (match) {
              return (
                <React.Fragment key={j}>
                  <strong style={{ fontFamily: "'Cabinet Grotesk', system-ui", fontWeight: 700, color: 'white' }}>{match[1]}</strong>
                  {renderContent(match[2])}
                </React.Fragment>
              );
            }
          }
          return segment;
        })}
      </p>
    ));

    return rendered;
  };

  const wordCount = notes.split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className="flex flex-col h-full bg-[#090a0c] text-white overflow-hidden">
      <style>{`
        .font-display { font-family: 'Cabinet Grotesk', system-ui, -apple-system, sans-serif; }
        .font-mono { font-family: 'Geist Mono', ui-monospace, SFMono-Regular, monospace; }
        
        .workspace { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
        @media (min-width: 768px) { .workspace { flex-direction: row; } }
        
        .pane-left { width: 100%; flex: 0 0 auto; min-height: 0; overflow: hidden; display: flex; flex-direction: column; background: #0a0b0e; overscroll-behavior: contain; }
        @media (min-width: 768px) { .pane-left { width: 72%; min-width: 420px; max-width: calc(100% - 280px); } }

        .pane-divider { display: none; }
        @media (min-width: 768px) {
          .pane-divider {
            display: flex; align-items: center; justify-content: center; flex: 0 0 5px;
            cursor: col-resize; background: rgba(255,255,255,0.07); position: relative;
            transition: background 0.2s ease; user-select: none;
          }
          .pane-divider:hover { background: rgba(0,191,219,0.3); }
          .pane-divider.active { background: rgba(0,191,219,0.6); }
          .pane-divider::before {
            content: ''; width: 3px; height: 24px; border-radius: 99px;
            background: rgba(255,255,255,0.2); transition: background 0.2s ease;
          }
          .pane-divider:hover::before, .pane-divider.active::before { background: rgba(0,191,219,0.8); }
        }

        .pane-right { width: 100%; flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; background: #0a0b0e; border-left: 1px solid rgba(255,255,255,0.07); }
        @media (min-width: 768px) { .pane-right { width: auto; min-width: 280px; } }

        .workspace.dragging * { user-select: none; pointer-events: none; }
        .workspace.dragging .pane-divider { pointer-events: all; }
        
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }

        @keyframes bounce-dot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        .typing-dot {
          width: 6px; height: 6px; border-radius: 50%; background: rgba(0,191,219,0.5);
          animation: bounce-dot 1.2s ease-in-out infinite;
        }
        .pulse-dot {
          animation: pulse-opacity 1.8s ease-in-out infinite;
        }
        @keyframes pulse-opacity {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
      
      {/* Zone 2 Header Strip - Passed down rendering identical to Google */}
      <div className="w-full flex items-center justify-between flex-shrink-0" style={{ padding: '1.2rem 2.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div>
          <div className="font-display font-[800] text-[1.3rem] tracking-wide text-[#f0f2f5] mb-1">
            Research Phase
          </div>
          <div className="font-mono text-[0.72rem] text-white/40 uppercase">
            Research topic: <span className="text-[#00bfdb] capitalize">{initialTopic}</span>
          </div>
        </div>
        <div style={{ border: '1px solid rgba(0,191,219,0.2)', borderRadius: '8px', padding: '0.4rem 1rem' }}>
          <div className="font-mono font-[500] text-[1.6rem] text-[#00bfdb] tracking-tight tabular-nums">
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Resizable Workspace */}
      <div ref={workspaceRef} className={`workspace ${isDragging ? 'dragging' : ''}`} style={{ backgroundColor: '#0f1114' }}>
        
        {/* Left Pane - Chat Workspace */}
        <div ref={paneLeftRef} className="pane-left">
          
          {/* Chat Header Strip */}
          <div className="flex justify-between items-center flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '1rem 1.5rem' }}>
            <div>
              <div className="font-display font-[700] text-[1rem] text-white">Chat Assistant</div>
              <div className="font-mono text-[0.7rem] text-white/40">Powered by OpenAI | {initialTopic}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2" style={{ border: '1px solid rgba(0,191,219,0.2)', borderRadius: '4px', padding: '3px 10px' }}>
                <div className="w-[5px] h-[5px] rounded-full bg-[#00bfdb]/70 pulse-dot" />
                <span className="font-mono text-[0.7rem] text-[#00bfdb]">GPT API</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40 cursor-pointer hover:text-white transition-colors">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
              </svg>
            </div>
          </div>

          {/* Message Thread */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-[1.2rem]" style={{ padding: '1.5rem', overscrollBehavior: 'contain' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={msg.role === 'user' ? "flex flex-col self-end" : "flex gap-[0.8rem] items-start w-full relative"}>
                
                {msg.role === 'assistant' && (
                  <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,191,219,0.08)', border: '1px solid rgba(0,191,219,0.2)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00bfdb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                      <rect x="9" y="9" width="6" height="6"></rect>
                      <line x1="9" y1="1" x2="9" y2="4"></line>
                      <line x1="15" y1="1" x2="15" y2="4"></line>
                      <line x1="9" y1="20" x2="9" y2="23"></line>
                      <line x1="15" y1="20" x2="15" y2="23"></line>
                      <line x1="20" y1="9" x2="23" y2="9"></line>
                      <line x1="20" y1="14" x2="23" y2="14"></line>
                      <line x1="1" y1="9" x2="4" y2="9"></line>
                      <line x1="1" y1="14" x2="4" y2="14"></line>
                    </svg>
                  </div>
                )}
                
                <div style={msg.role === 'assistant' ? {
                  border: '1px solid rgba(255,255,255,0.07)', borderRadius: '2px 10px 10px 10px', padding: '1rem 1.2rem', background: 'rgba(255,255,255,0.02)', maxWidth: '90%'
                } : {
                  border: '1px solid rgba(0,191,219,0.2)', borderRadius: '10px 2px 10px 10px', background: 'rgba(0,191,219,0.06)', padding: '0.8rem 1.1rem', alignSelf: 'flex-end', maxWidth: '85%'
                }}>
                  <div style={{ fontSize: '0.88rem', color: msg.role === 'assistant' ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.8)', lineHeight: '1.75' }}>
                    {renderContent(msg.content)}
                  </div>
                  {msg.role === 'assistant' && (
                    <div className="flex gap-[0.8rem] items-center" style={{ marginTop: '0.8rem' }}>
                      <div className="font-mono text-[0.65rem] text-white/40">{formatMessageTime(msg.timestamp)}</div>
                      <div className="font-mono text-[0.62rem] text-white/40" style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '2px 7px' }}>
                        {msg.relevanceScore}% relevant
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
               <div className="flex gap-[0.8rem] items-start w-full relative">
                 <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,191,219,0.08)', border: '1px solid rgba(0,191,219,0.2)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00bfdb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                      <rect x="9" y="9" width="6" height="6"></rect>
                      <line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line>
                    </svg>
                  </div>
                  <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '2px 10px 10px 10px', padding: '1.2rem 1.6rem', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex gap-[4px] items-center">
                      <div className="typing-dot" style={{ animationDelay: '0s' }}></div>
                      <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
                      <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="flex gap-[0.5rem] flex-nowrap overflow-x-auto flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0.8rem 1.5rem', scrollbarWidth: 'none' }}>
            {['Latest Developments', 'Compare Approaches', 'Applications', 'Key Challenges', 'Future Outlook'].map((chip, i) => (
              <button key={i} onClick={() => setCurrentInput(chip)} className="font-mono text-[0.72rem] whitespace-nowrap text-white/40 transition-all hover:text-white/70 transform hover:-translate-y-px" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', padding: '5px 12px' }}>
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="flex flex-shrink-0 items-end gap-[0.7rem]" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '1rem 1.5rem' }}>
            <textarea
              ref={textareaRef}
              value={currentInput}
              onChange={e => { setCurrentInput(e.target.value); handleInputResize(); }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={`Ask about ${initialTopic}...`}
              className="flex-1 font-mono text-[0.85rem] text-white/80 outline-none transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', minHeight: '44px', maxHeight: '140px', resize: 'none' }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,191,219,0.35)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button
              onClick={handleSend}
              disabled={!currentInput.trim() || isTyping}
              className="flex items-center justify-center transition-all flex-shrink-0"
              style={{ width: '44px', height: '44px', borderRadius: '7px', background: currentInput.trim() ? '#00bfdb' : 'rgba(255,255,255,0.06)', border: 'none' }}
              onMouseOver={e => { if (currentInput.trim()) e.currentTarget.style.opacity = '0.85'; }}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
              onMouseDown={e => { if (currentInput.trim()) e.currentTarget.style.transform = 'scale(0.96)'; }}
              onMouseUp={e => e.currentTarget.style.transform = 'none'}
            >
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={currentInput.trim() ? "#090a0c" : "rgba(255,255,255,0.4)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <line x1="12" y1="19" x2="12" y2="5"></line>
                 <polyline points="5 12 12 5 19 12"></polyline>
               </svg>
            </button>
          </div>
        </div>

        {/* Divider Handle */}
        <div ref={dividerRef} className="pane-divider"></div>

        {/* Right Pane - Stats + Notes */}
        <div className="pane-right">
          <div style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="mb-[1rem]">
              <div className="font-mono text-[0.65rem] uppercase text-white/40 tracking-wider mb-[1rem]">
                RESEARCH STATISTICS
              </div>
              <div className="flex justify-between items-center" style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="font-mono text-[0.75rem] text-white/40">Queries Made</span>
                <span className="font-mono font-[500] text-[1.1rem] text-white">{queriesCount}</span>
              </div>
              <div className="flex justify-between items-center" style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="font-mono text-[0.75rem] text-white/40">Platform</span>
                <span className="font-display font-[600] text-[0.95rem] text-white tracking-wide">ChatGPT</span>
              </div>
              <div className="flex justify-between items-center" style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
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
                  minHeight: '160px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.08)', 
                  borderRadius: '7px', 
                  padding: '0.85rem',
                  resize: 'vertical'
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,191,219,0.3)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
              <div className="flex justify-between items-center" style={{ marginTop: '0.6rem' }}>
                <span className="font-mono text-[0.68rem] text-white/40">{wordCount} words</span>
                <button 
                  onClick={onFinishEarly}
                  className="font-display font-[700] text-[0.82rem] text-white/50 transition-all"
                  style={{ 
                    background: 'transparent', 
                    border: '1px solid rgba(255,255,255,0.15)', 
                    borderRadius: '6px', 
                    padding: '0.5rem 1rem' 
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'none'}
                >
                  Finish Early
                </button>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
               <div className="font-mono text-[0.65rem] uppercase text-white/40 tracking-wider mb-[0.8rem]">
                 SESSION ACTIVITY
               </div>
               <div className="flex gap-[3rem]">
                 <div>
                   <div className="font-mono text-[1rem] text-white">{messages.length}</div>
                   <div className="font-mono text-[0.65rem] text-white/40 mt-1">Messages</div>
                 </div>
                 <div>
                   <div className="font-mono text-[1rem] text-white">~{avgResponse.toFixed(1)}s</div>
                   <div className="font-mono text-[0.65rem] text-white/40 mt-1">Avg Response</div>
                 </div>
               </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
};
