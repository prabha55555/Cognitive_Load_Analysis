import { Send, Sparkles, User, Bot, Search, BarChart, Clock, MessageCircle, TrendingUp, Filter, BookOpen, Lightbulb } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Participant } from '../types';
import { chatGPTService } from '../services/chatgptService';
import { analyticsService } from '../services/analyticsService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  queryType?: 'research' | 'clarification' | 'analysis' | 'synthesis';
  searchIntent?: string;
  relevanceScore?: number;
}

interface SearchAnalytics {
  totalQueries: number;
  avgResponseTime: number;
  queryTypes: Record<string, number>;
  searchPatterns: string[];
  cognitiveLoad: number;
}

interface ChatGPTInterfaceProps {
  participant: Participant;
  onQuerySubmit: (query: string, analytics?: any) => void;
}

export const ChatGPTInterface: React.FC<ChatGPTInterfaceProps> = ({
  participant,
  onQuerySubmit
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AI research assistant. I'm here to help you research "${participant.researchTopic}". Ask me any specific questions about this topic, and I'll provide detailed, accurate information to support your research.`,
      timestamp: new Date(),
      queryType: 'research',
      relevanceScore: 1.0
    }
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState<'all' | 'research' | 'analysis' | 'synthesis'>('all');
  const [analytics, setAnalytics] = useState<SearchAnalytics>({
    totalQueries: 0,
    avgResponseTime: 0,
    queryTypes: {},
    searchPatterns: [],
    cognitiveLoad: 0
  });
  const [queryStartTime, setQueryStartTime] = useState<number | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Analytics functions
  const classifyQuery = (query: string): 'research' | 'clarification' | 'analysis' | 'synthesis' => {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('what') || lowerQuery.includes('define') || lowerQuery.includes('explain')) {
      return 'research';
    } else if (lowerQuery.includes('how') || lowerQuery.includes('why') || lowerQuery.includes('analyze')) {
      return 'analysis';
    } else if (lowerQuery.includes('compare') || lowerQuery.includes('synthesize') || lowerQuery.includes('combine')) {
      return 'synthesis';
    }
    return 'clarification';
  };

  const updateAnalytics = (query: string, responseTime: number, queryType: string) => {
    setAnalytics(prev => ({
      totalQueries: prev.totalQueries + 1,
      avgResponseTime: (prev.avgResponseTime * prev.totalQueries + responseTime) / (prev.totalQueries + 1),
      queryTypes: {
        ...prev.queryTypes,
        [queryType]: (prev.queryTypes[queryType] || 0) + 1
      },
      searchPatterns: [...prev.searchPatterns, query].slice(-10), // Keep last 10 patterns
      cognitiveLoad: calculateCognitiveLoad(query, responseTime)
    }));
  };

  const calculateCognitiveLoad = (query: string, responseTime: number): number => {
    // Simple cognitive load calculation based on query complexity and response time
    const queryComplexity = query.split(' ').length / 10; // Normalize by word count
    const timeComplexity = Math.min(responseTime / 5000, 1); // Normalize response time
    return Math.min((queryComplexity + timeComplexity) * 50, 100);
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim() || isLoading) return;

    const queryType = classifyQuery(currentInput.trim());
    const startTime = Date.now();
    setQueryStartTime(startTime);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput.trim(),
      timestamp: new Date(),
      queryType,
      searchIntent: `Research query about ${participant.researchTopic}`,
      relevanceScore: 0.9
    };

    setMessages(prev => [...prev, userMessage]);
    const queryText = currentInput.trim();
    setCurrentInput('');
    setIsLoading(true);

    try {
      // Use actual ChatGPT API
      const response = await chatGPTService.sendMessage(
        queryText,
        participant.researchTopic,
        messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        queryType: 'research',
        relevanceScore: 0.95
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update analytics
      updateAnalytics(queryText, responseTime, queryType);
      
      // Send analytics to parent component
      onQuerySubmit(queryText, {
        queryType,
        responseTime,
        relevanceScore: assistantMessage.relevanceScore,
        cognitiveLoad: calculateCognitiveLoad(queryText, responseTime)
      });

    } catch (error) {
      console.error('Error calling ChatGPT API:', error);
      // Fallback to simulated response
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(queryText, participant.researchTopic),
        timestamp: new Date(),
        queryType: 'research',
        relevanceScore: 0.8
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      updateAnalytics(queryText, responseTime, queryType);
      
      onQuerySubmit(queryText, {
        queryType,
        responseTime,
        relevanceScore: assistantMessage.relevanceScore,
        cognitiveLoad: calculateCognitiveLoad(queryText, responseTime)
      });
    } finally {
      setIsLoading(false);
      setQueryStartTime(null);
    }
  };

  const generateAIResponse = (query: string, topic: string): string => {
    // This would be replaced with actual ChatGPT API call
    const responses = [
      `Based on current research about ${topic}, ${query.toLowerCase()} involves several key factors. Recent studies have shown that this area is particularly important for understanding cognitive processes and decision-making patterns.`,
      `Regarding ${query.toLowerCase()} in the context of ${topic}, there are multiple perspectives to consider. The literature suggests that this is a complex topic with implications for both theoretical understanding and practical applications.`,
      `When examining ${query.toLowerCase()} within ${topic}, it's important to note that this field has evolved significantly in recent years. Current research indicates that this aspect plays a crucial role in overall system performance and user experience.`,
      `The relationship between ${query.toLowerCase()} and ${topic} has been extensively studied. Evidence suggests that this connection is fundamental to understanding the broader implications and applications in real-world scenarios.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Enhanced ChatGPT Header with Analytics - Desktop Optimized */}
      <div className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white p-3 lg:p-4 xl:p-6 shadow-lg">
        <div className="flex items-center justify-between max-w-full mx-auto">
          <div className="flex items-center space-x-3 lg:space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-lg animate-pulse"></div>
              <Bot className="h-5 w-5 lg:h-6 lg:w-6 xl:h-8 xl:w-8 relative z-10" />
            </div>
            <div>
              <h3 className="font-bold text-base lg:text-lg xl:text-xl">ChatGPT Research Assistant</h3>
              <p className="text-emerald-100 text-xs lg:text-sm xl:text-base">Advanced AI for {participant.researchTopic}</p>
            </div>
          </div>
          
          {/* Analytics Panel Toggle - Compact for Desktop */}
          <div className="flex items-center space-x-2 lg:space-x-3">
            <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 lg:px-4 py-2 lg:py-3">
              <BarChart className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
              <div className="text-xs lg:text-sm">
                <div className="font-semibold">{analytics.totalQueries} Queries</div>
                <div className="text-emerald-100 text-xs">Avg: {analytics.avgResponseTime.toFixed(1)}s</div>
              </div>
            </div>
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="p-1 lg:p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
            </button>
          </div>
        </div>
        
        {/* Analytics Dashboard - Compact Desktop View */}
        {showAnalytics && (
          <div className="mt-3 lg:mt-4 p-2 lg:p-3 xl:p-4 bg-white/10 rounded-lg backdrop-blur-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 lg:gap-3">
              <div className="bg-white/20 rounded-lg p-2 lg:p-3">
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-3 w-3 lg:h-4 lg:w-4" />
                  <span className="text-xs lg:text-sm font-medium">Total</span>
                </div>
                <div className="text-sm lg:text-lg xl:text-xl font-bold mt-1">{analytics.totalQueries}</div>
              </div>
              
              <div className="bg-white/20 rounded-lg p-2 lg:p-3">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 lg:h-4 lg:w-4" />
                  <span className="text-xs lg:text-sm font-medium">Avg Time</span>
                </div>
                <div className="text-sm lg:text-lg xl:text-xl font-bold mt-1">{analytics.avgResponseTime.toFixed(1)}s</div>
              </div>
              
              <div className="bg-white/20 rounded-lg p-2 lg:p-3">
                <div className="flex items-center space-x-1">
                  <Search className="h-3 w-3 lg:h-4 lg:w-4" />
                  <span className="text-xs lg:text-sm font-medium">Types</span>
                </div>
                <div className="text-xs mt-1">
                  {Object.entries(analytics.queryTypes).slice(0, 2).map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span className="capitalize">{type}:</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white/20 rounded-lg p-2 lg:p-3">
                <div className="flex items-center space-x-1">
                  <Lightbulb className="h-3 w-3 lg:h-4 lg:w-4" />
                  <span className="text-xs lg:text-sm font-medium">Load</span>
                </div>
                <div className="text-sm lg:text-lg xl:text-xl font-bold mt-1">{analytics.cognitiveLoad.toFixed(0)}%</div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Messages Container - Desktop Optimized */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-full mx-auto p-3 lg:p-4 xl:p-6 space-y-3 lg:space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[92%] lg:max-w-[88%] xl:max-w-[85%] rounded-lg xl:rounded-xl p-3 lg:p-4 xl:p-5 shadow-md lg:shadow-lg ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                    : 'bg-gradient-to-br from-gray-50 to-white border border-gray-200 text-gray-800'
                }`}
              >
                <div className="flex items-start space-x-2 lg:space-x-3">
                  <div className={`p-1 lg:p-2 rounded-full flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-white/20' 
                      : 'bg-gradient-to-br from-emerald-100 to-blue-100'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-white" />
                    ) : (
                      <Bot className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs lg:text-sm xl:text-base leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                    <div className="flex items-center space-x-1 lg:space-x-2 xl:space-x-3 mt-1 lg:mt-2">
                      <p className={`text-xs ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                      {message.relevanceScore && (
                        <div className="flex items-center space-x-1">
                          <Sparkles className="h-2 w-2 lg:h-3 lg:w-3 text-emerald-500" />
                          <span className="text-xs text-emerald-600 font-medium">
                            {(message.relevanceScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-3 lg:p-4 max-w-[92%] lg:max-w-[88%] xl:max-w-[85%] shadow-md lg:shadow-lg">
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <div className="p-1 lg:p-2 rounded-full bg-gradient-to-br from-emerald-100 to-blue-100 flex-shrink-0">
                    <Bot className="h-3 w-3 lg:h-4 lg:w-4 text-emerald-600" />
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 lg:w-2 lg:h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 lg:w-2 lg:h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 lg:w-2 lg:h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>      {/* Input Area - Desktop Optimized */}
      <div className="border-t border-gray-200 p-3 lg:p-4 xl:p-6 bg-white">
        <div className="max-w-full mx-auto">
          {/* Search Filters - Compact */}
          <div className="flex items-center space-x-1 lg:space-x-2 xl:space-x-3 mb-2 lg:mb-3 xl:mb-4">
            <Filter className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-gray-500" />
            <span className="text-xs lg:text-sm font-medium text-gray-700">Type:</span>
            {(['all', 'research', 'analysis', 'synthesis'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSearchFilter(type)}
                className={`px-1 lg:px-2 xl:px-3 py-1 rounded text-xs lg:text-sm font-medium transition-colors ${
                  searchFilter === type
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1, 3)}
              </button>
            ))}
          </div>

          <div className="flex items-start space-x-2 lg:space-x-3 xl:space-x-4 mb-3 lg:mb-4 xl:mb-6">
            <div className="flex-1 relative">
              <textarea
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Ask ChatGPT about ${participant.researchTopic}...`}
                className="w-full px-3 lg:px-4 xl:px-5 py-2 lg:py-3 xl:py-4 border-2 border-gray-200 rounded-lg xl:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none shadow-md text-xs lg:text-sm xl:text-base"
                rows={2}
                style={{ minHeight: '50px', maxHeight: '120px' }}
              />
              <div className="absolute bottom-2 lg:bottom-3 right-3 lg:right-4 text-xs text-gray-400">
                Enter to send
              </div>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!currentInput.trim() || isLoading}
              className="flex-shrink-0 self-start mt-1 px-3 lg:px-4 xl:px-6 py-2 lg:py-3 xl:py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg xl:rounded-xl shadow-lg hover:shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center space-x-1 lg:space-x-2">
                <Send className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
                <span className="text-xs lg:text-sm xl:text-base">Send</span>
              </div>
            </button>
          </div>
          
          {/* Enhanced Smart Suggestions - Compact Desktop */}
          <div className="space-y-2 lg:space-y-3 xl:space-y-4">
            <div className="flex items-center space-x-2 lg:space-x-3">
              <Lightbulb className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 text-emerald-500" />
              <p className="text-sm lg:text-base xl:text-lg text-gray-700 font-semibold">Smart Research Suggestions</p>
            </div>
            
            <div className="grid grid-cols-1 gap-2 lg:gap-3 xl:gap-4">
              {/* Research Questions */}
              <div>
                <h4 className="text-xs lg:text-sm xl:text-base font-medium text-gray-600 mb-1 lg:mb-2 flex items-center space-x-1 lg:space-x-2">
                  <BookOpen className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
                  <span>Research Questions</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 lg:gap-2 xl:gap-3">
                  {[
                    `What is ${participant.researchTopic}?`,
                    `How does ${participant.researchTopic} work?`,
                    `What are the applications of ${participant.researchTopic}?`
                  ].map((suggestion, index) => (
                    <button
                      key={`research-${index}`}
                      onClick={() => setCurrentInput(suggestion)}
                      className="px-2 lg:px-3 xl:px-4 py-2 lg:py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs lg:text-sm xl:text-base rounded-lg xl:rounded-xl transition-colors text-left border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Analysis Questions */}
              <div>
                <h4 className="text-xs lg:text-sm xl:text-base font-medium text-gray-600 mb-1 lg:mb-2 flex items-center space-x-1 lg:space-x-2">
                  <BarChart className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
                  <span>Analysis Questions</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 lg:gap-2 xl:gap-3">
                  {[
                    `Analyze the benefits of ${participant.researchTopic}`,
                    `What are the challenges in ${participant.researchTopic}?`,
                    `Compare different approaches to ${participant.researchTopic}`
                  ].map((suggestion, index) => (
                    <button
                      key={`analysis-${index}`}
                      onClick={() => setCurrentInput(suggestion)}
                      className="px-2 lg:px-3 xl:px-4 py-2 lg:py-3 bg-green-50 hover:bg-green-100 text-green-700 text-xs lg:text-sm xl:text-base rounded-lg xl:rounded-xl transition-colors text-left border border-green-200 hover:border-green-300 shadow-sm hover:shadow-md"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
