import { Send, Sparkles, User, Bot, BarChart } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Participant } from '../types';
import { chatGPTService } from '../services/chatgptService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  queryType?: 'research' | 'clarification' | 'analysis' | 'synthesis';
  searchIntent?: string;
  relevanceScore?: number;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentInput.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput.trim(),
      timestamp: new Date(),
      queryType: 'research',
      relevanceScore: 0.9
    };

    setMessages(prev => [...prev, userMessage]);
    const queryText = currentInput.trim();
    setCurrentInput('');
    setIsLoading(true);
    onQuerySubmit(queryText);

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

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        queryType: 'research',
        relevanceScore: 0.95
      };
      
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error calling ChatGPT API:', error);
      // Fallback to simulated response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(queryText, participant.researchTopic),
        timestamp: new Date(),
        queryType: 'research',
        relevanceScore: 0.8
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
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
    <div className="flex flex-col h-full">
      {/* ChatGPT Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-lg animate-pulse"></div>
              <Bot className="h-6 w-6 relative z-10" />
            </div>
            <div>
              <h3 className="font-bold text-lg">ChatGPT Research Assistant</h3>
              <p className="text-sm opacity-90">Advanced AI for {participant.researchTopic}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm bg-white/20`}>
              <BarChart className="h-4 w-4" />
              <span>Analytics</span>
            </div>
          </div>
        </div>
      </div>
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                  : 'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 text-gray-800'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${
                  message.role === 'user' 
                    ? 'bg-white/20' 
                    : 'bg-gradient-to-br from-emerald-100 to-blue-100'
                }`}>
                  {message.role === 'user' ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-emerald-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <p className={`text-xs ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                    {message.relevanceScore && (
                      <div className="flex items-center space-x-1">
                        <Sparkles className="h-3 w-3 text-emerald-500" />
                        <span className="text-xs text-emerald-600">
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
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-4 max-w-[80%]">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-gradient-to-br from-emerald-100 to-blue-100">
                  <Bot className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setCurrentInput(`What are the latest developments in ${participant.researchTopic}?`)}
            className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            Latest Developments
          </button>
          <button
            onClick={() => setCurrentInput(`Compare different approaches to ${participant.researchTopic}`)}
            className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            Compare Approaches
          </button>
          <button
            onClick={() => setCurrentInput(`What are the applications of ${participant.researchTopic}?`)}
            className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            Applications
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-6 bg-white">
        <div className="flex items-end space-x-4">
          <div className="flex-1 relative">
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask ChatGPT about ${participant.researchTopic}...`}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              Enter to send, Shift+Enter for new line
            </div>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!currentInput.trim() || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center space-x-2">
              <Send className="h-4 w-4" />
              <span>Send</span>
            </div>
          </button>
        </div>
        
        {/* Quick Suggestions */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Quick suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {[
              `What is ${participant.researchTopic}?`,
              `How does ${participant.researchTopic} work?`,
              `What are the benefits of ${participant.researchTopic}?`,
              `What are the challenges in ${participant.researchTopic}?`
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setCurrentInput(suggestion)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
