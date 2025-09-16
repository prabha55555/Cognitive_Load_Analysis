import { Send, Sparkles, User, Bot, AlertTriangle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Participant } from '../types';
import llmService, { ChatMessage } from '../services/llmService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  queryType?: 'research' | 'clarification' | 'analysis' | 'synthesis';
  searchIntent?: string;
  relevanceScore?: number;
  isStreaming?: boolean;
}

// Topic relevance validation function
const validateTopicRelevance = (query: string, topic: string): { isRelevant: boolean; confidence: number; reason: string } => {
  const queryLower = query.toLowerCase().trim();
  const topicLower = topic.toLowerCase();
  const topicWords = topicLower.split(' ');
  
  // Handle basic greetings and conversational starters
  const basicGreetings = [
    'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening',
    'how are you', 'what\'s up', 'greetings', 'start', 'begin'
  ];
  
  const isGreeting = basicGreetings.some(greeting => queryLower === greeting || queryLower.includes(greeting));
  
  if (isGreeting) {
    return {
      isRelevant: true,
      confidence: 0.8,
      reason: 'Greeting or conversation starter - allowing to establish context'
    };
  }
  
  // Check if query contains topic keywords
  const directMatch = topicWords.some(word => word.length > 2 && queryLower.includes(word));
  
  // Check for related research terms
  const relatedTerms = [
    'research', 'study', 'analysis', 'data', 'findings', 'results',
    'applications', 'benefits', 'challenges', 'methods', 'approach',
    'development', 'technology', 'innovation', 'trends', 'future',
    'impact', 'effect', 'influence', 'mechanism', 'process', 'theory',
    'practice', 'implementation', 'evaluation', 'assessment', 'review',
    'what is', 'how does', 'why', 'when', 'where', 'explain', 'describe'
  ];
  
  const hasRelatedTerms = relatedTerms.some(term => queryLower.includes(term));
  
  // Check for completely off-topic queries
  const offTopicIndicators = [
    'weather', 'sports', 'entertainment', 'movies', 'music', 'food',
    'travel', 'politics', 'news', 'celebrities', 'games', 'jokes',
    'personal life', 'dating', 'shopping', 'cooking', 'fashion',
    'help me with homework', 'write my essay', 'do my assignment'
  ];
  
  const isOffTopic = offTopicIndicators.some(indicator => queryLower.includes(indicator));
  
  if (isOffTopic) {
    return {
      isRelevant: false,
      confidence: 0.1,
      reason: 'Query appears to be off-topic from the research subject'
    };
  }
  
  if (directMatch) {
    return {
      isRelevant: true,
      confidence: 0.9,
      reason: 'Query directly relates to the research topic'
    };
  }
  
  if (hasRelatedTerms && queryLower.length > 3) {
    return {
      isRelevant: true,
      confidence: 0.7,
      reason: 'Query contains research-related terms'
    };
  }
  
  // For very short queries, be more lenient
  if (queryLower.length < 5) {
    return {
      isRelevant: true,
      confidence: 0.6,
      reason: 'Short query - giving benefit of doubt for clarification'
    };
  }
  
  return {
    isRelevant: false,
    confidence: 0.3,
    reason: 'Query does not appear to be related to the research topic'
  };
};

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
      content: `Hello! I'm your AI research assistant powered by Google's Gemini model. I'm here to help you explore "${participant.researchTopic}" with detailed, accurate information.

🎯 **Research Focus**: ${participant.researchTopic}

For the best experience and data quality, please keep your questions related to your assigned research topic. I'll help guide you if your questions go off-topic.

What would you like to know about ${participant.researchTopic}?`,
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

    // Validate topic relevance before processing
    const relevanceCheck = validateTopicRelevance(currentInput.trim(), participant.researchTopic);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput.trim(),
      timestamp: new Date(),
      queryType: relevanceCheck.isRelevant ? 'research' : 'clarification',
      relevanceScore: relevanceCheck.confidence
    };

    setMessages(prev => [...prev, userMessage]);
    const queryText = currentInput.trim();
    setCurrentInput('');
    setIsLoading(true);
    onQuerySubmit(queryText);

    // Check if it's a basic greeting
    const basicGreetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
    const isBasicGreeting = basicGreetings.some(greeting => 
      queryText.toLowerCase().trim() === greeting
    );

    // If it's a basic greeting, provide a context-aware response via Gemini
    if (isBasicGreeting) {
      // Create a placeholder assistant message for streaming
      const assistantMessageId = (Date.now() + 1).toString();
      const placeholderMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '💭 *Gemini is thinking...*',
        timestamp: new Date(),
        queryType: 'research',
        relevanceScore: 0.8,
        isStreaming: true
      };
      
      setMessages(prev => [...prev, placeholderMessage]);

      try {
        // Enhanced greeting prompt for Gemini
        const greetingPrompt = `The user just greeted you with "${queryText}". Please respond as a helpful AI research assistant specializing in ${participant.researchTopic}. 

Provide a warm greeting and immediately introduce yourself as an AI assistant focused on ${participant.researchTopic}. Briefly explain what ${participant.researchTopic} is about and offer to help with specific questions about this research topic.

Keep the response conversational but informative, and end with a specific question about ${participant.researchTopic} to encourage engagement.`;

        // Stream response from Gemini API for greeting
        const streamGenerator = llmService.streamGeminiResponse(
          greetingPrompt,
          participant.researchTopic,
          []
        );

        for await (const chunk of streamGenerator) {
          // Update the message content in real-time
          setMessages(prev => prev.map(msg => {
            if (msg.id === assistantMessageId) {
              return {
                ...msg,
                content: chunk.text,
                queryType: 'research',
                relevanceScore: 0.8,
                isStreaming: !chunk.isComplete
              };
            }
            return msg;
          }));

          // If streaming is complete, break
          if (chunk.isComplete) {
            break;
          }
        }

      } catch (error) {
        console.error('Error with Gemini API for greeting:', error);
        // Fallback greeting response
        setMessages(prev => prev.map(msg => {
          if (msg.id === assistantMessageId) {
            return {
              ...msg,
              content: `Hello! I'm your AI research assistant powered by Google Gemini, specialized in ${participant.researchTopic}. 

${participant.researchTopic} is a fascinating field with many applications and ongoing research developments. I'm here to help you explore this topic in depth.

What specific aspect of ${participant.researchTopic} would you like to learn about?`,
              queryType: 'research',
              relevanceScore: 0.8,
              isStreaming: false
            };
          }
          return msg;
        }));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // If query is not relevant (and not a greeting), provide immediate feedback
    if (!relevanceCheck.isRelevant) {
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I notice your question "${queryText}" doesn't seem to be directly related to your assigned research topic: "${participant.researchTopic}". 

${relevanceCheck.reason}

To help with your research study, please ask questions specifically about ${participant.researchTopic}. For example:
• What is ${participant.researchTopic}?
• How does ${participant.researchTopic} work?
• What are the applications of ${participant.researchTopic}?
• What are recent developments in ${participant.researchTopic}?

This helps ensure the quality of data collection for the cognitive load analysis study.`,
        timestamp: new Date(),
        queryType: 'clarification',
        relevanceScore: 0
      };
      
      setMessages(prev => [...prev, systemMessage]);
      setIsLoading(false);
      return;
    }

    // Create a placeholder assistant message for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    const placeholderMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '💭 *Gemini is thinking...*',
      timestamp: new Date(),
      queryType: 'research',
      relevanceScore: 0,
      isStreaming: true
    };
    
    setMessages(prev => [...prev, placeholderMessage]);

    try {
      // Build conversation history for context
      const conversationHistory: ChatMessage[] = messages.slice(-6).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      // Enhanced context for better responses
      const enhancedQuery = `Research Topic: ${participant.researchTopic}
      
User Question: ${queryText}

Please provide a comprehensive, accurate response about ${participant.researchTopic} that directly addresses the user's question. Focus on factual information, current research, and practical applications related to this specific topic.`;

      // Stream response from Gemini API
      const streamGenerator = llmService.streamGeminiResponse(
        enhancedQuery,
        participant.researchTopic,
        conversationHistory
      );

      for await (const chunk of streamGenerator) {
        // Update the message content in real-time
        setMessages(prev => prev.map(msg => {
          if (msg.id === assistantMessageId) {
            // Determine query type and relevance from validation result
            let finalRelevanceScore = relevanceCheck.confidence;
            let finalQueryType: 'research' | 'clarification' = 'research';
            
            if (chunk.validationResult) {
              finalRelevanceScore = chunk.validationResult.confidence || relevanceCheck.confidence;
              finalQueryType = chunk.validationResult.isRelevant ? 'research' : 'clarification';
            }

            return {
              ...msg,
              content: chunk.text,
              queryType: finalQueryType,
              relevanceScore: finalRelevanceScore,
              isStreaming: !chunk.isComplete
            };
          }
          return msg;
        }));

        // If streaming is complete, break
        if (chunk.isComplete) {
          break;
        }
      }

    } catch (error) {
      console.error('Error with Gemini API:', error);
      // Update with error message
      setMessages(prev => prev.map(msg => {
        if (msg.id === assistantMessageId) {
          return {
            ...msg,
            content: `I apologize, but I'm experiencing some technical difficulties connecting to the Gemini API. However, I can still help with your ${participant.researchTopic} question!\n\n${generateIntelligentFallback(queryText, participant.researchTopic)}`,
            queryType: 'research',
            relevanceScore: relevanceCheck.confidence,
            isStreaming: false
          };
        }
        return msg;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Intelligent fallback when Gemini API is unavailable
  const generateIntelligentFallback = (query: string, topic: string): string => {
    const queryLower = query.toLowerCase();
    
    // Handle greetings specifically
    const basicGreetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
    const isGreeting = basicGreetings.some(greeting => queryLower.trim() === greeting);
    
    if (isGreeting) {
      return `Hello! I'm your AI research assistant powered by Google Gemini, specialized in ${topic}. 

${topic} is a fascinating field with many applications and ongoing research developments. I'm here to help you explore this topic in depth with accurate, up-to-date information.

What specific aspect of ${topic} would you like to learn about? For example:
• The fundamentals and core concepts of ${topic}
• Current research trends and developments
• Real-world applications and use cases
• Challenges and future directions in ${topic}`;
    }
    
    if (queryLower.includes('what is') || queryLower.includes('define')) {
      return `${topic} is a significant field of study that encompasses various methodologies, principles, and applications. It involves systematic approaches to understanding complex phenomena and developing practical solutions. Current research in this area continues to evolve with new discoveries and technological advances.`;
    }
    
    if (queryLower.includes('how does') || queryLower.includes('process')) {
      return `The processes involved in ${topic} typically follow established methodologies and best practices. These approaches have been developed through extensive research and real-world application, incorporating both theoretical foundations and practical considerations to achieve optimal outcomes.`;
    }
    
    if (queryLower.includes('benefits') || queryLower.includes('advantages')) {
      return `${topic} offers numerous benefits including improved efficiency, enhanced understanding, and practical applications that can address real-world challenges. The field has shown significant potential for positive impact across various domains and continues to develop new opportunities.`;
    }
    
    if (queryLower.includes('challenges') || queryLower.includes('problems')) {
      return `Like any developing field, ${topic} faces several challenges including technical limitations, resource requirements, and implementation considerations. Researchers and practitioners continue to work on addressing these challenges through innovative approaches and collaborative efforts.`;
    }
    
    return `Your question about ${topic} touches on important aspects of this field. This area continues to be actively researched and developed, with ongoing work focusing on both theoretical understanding and practical applications. Would you like me to elaborate on any specific aspect?`;
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
              <h3 className="font-bold text-lg">ChatGPT-Style Interface</h3>
              <p className="text-sm opacity-90">Powered by Google Gemini • {participant.researchTopic}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm bg-white/20`}>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Gemini API</span>
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
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-5 bg-emerald-500 ml-1 animate-pulse rounded-sm"></span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <p className={`text-xs ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                    {message.relevanceScore !== undefined && (
                      <div className="flex items-center space-x-1">
                        {message.relevanceScore === 0 ? (
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                        ) : (
                          <Sparkles className="h-3 w-3 text-emerald-500" />
                        )}
                        <span className={`text-xs ${
                          message.relevanceScore === 0 
                            ? 'text-orange-600' 
                            : 'text-emerald-600'
                        }`}>
                          {message.relevanceScore === 0 
                            ? 'Off-topic' 
                            : `${(message.relevanceScore * 100).toFixed(0)}% relevant`}
                        </span>
                      </div>
                    )}
                    {message.queryType === 'clarification' && (
                      <div className="flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs text-yellow-600">System</span>
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
            <div className="bg-white border border-gray-200 rounded-2xl p-4 max-w-[85%] shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-gradient-to-br from-emerald-100 to-blue-100">
                  <Bot className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">Gemini is thinking...</span>
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
              placeholder={`Ask Gemini about ${participant.researchTopic}...`}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
              disabled={isLoading}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              Enter to send • Powered by Gemini
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
          <p className="text-sm text-gray-600 mb-2">Quick suggestions for Gemini:</p>
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
                disabled={isLoading}
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
