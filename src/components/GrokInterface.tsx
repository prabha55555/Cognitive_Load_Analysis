import { Bot, Send, TrendingUp, User, AlertTriangle, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import llmService, { ChatMessage } from '../services/llmService';
import { Participant } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string; 
  timestamp: Date;
  queryType?: 'research' | 'clarification' | 'analysis' | 'synthesis';
  relevanceScore?: number;
  isStreaming?: boolean;
}

// Topic relevance validation function
const validateTopicRelevance = (query: string, topic: string): { isRelevant: boolean; confidence: number; reason: string } => {
  const queryLower = query.toLowerCase();
  const topicLower = topic.toLowerCase();
  const topicWords = topicLower.split(' ');
  
  // Check if query contains topic keywords
  const directMatch = topicWords.some(word => word.length > 2 && queryLower.includes(word));
  
  // Check for related research terms
  const relatedTerms = [
    'research', 'study', 'analysis', 'data', 'findings', 'results',
    'applications', 'benefits', 'challenges', 'methods', 'approach',
    'development', 'technology', 'innovation', 'trends', 'future',
    'impact', 'effect', 'influence', 'mechanism', 'process', 'theory',
    'practice', 'implementation', 'evaluation', 'assessment', 'review'
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
  
  if (hasRelatedTerms && queryLower.length > 10) {
    return {
      isRelevant: true,
      confidence: 0.7,
      reason: 'Query contains research-related terms'
    };
  }
  
  // For short or unclear queries, give benefit of doubt but lower confidence
  if (queryLower.length < 10) {
    return {
      isRelevant: true,
      confidence: 0.5,
      reason: 'Query is too short to determine relevance accurately'
    };
  }
  
  return {
    isRelevant: false,
    confidence: 0.3,
    reason: 'Query does not appear to be related to the research topic'
  };
};

interface GrokInterfaceProps {
  participant: Participant;
  onQuerySubmit: (query: string) => void;
}

export const GrokInterface: React.FC<GrokInterfaceProps> = ({
  participant,
  onQuerySubmit
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm Cognitive Load Analyser, your AI research assistant with real-time knowledge. I'm here to help you research "${participant.researchTopic}" with the most current information available. Ask me anything about this topic!`,
      timestamp: new Date(),
      queryType: 'research',
      relevanceScore: 1.0
    }
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [realTimeMode] = useState(true);
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

    // If query is not relevant, provide immediate feedback with Grok's witty style
    if (!relevanceCheck.isRelevant) {
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `🚫 **Off-Topic Query Detected** (Classic human behavior, really!)

Your question "${queryText}" doesn't appear to be related to your assigned research topic: **${participant.researchTopic}**.

${relevanceCheck.reason}

Look, I get it - the human mind wanders. But let's focus on what matters here: **${participant.researchTopic}**. Try asking:
• What is ${participant.researchTopic} and why should I care?
• How does ${participant.researchTopic} actually work in practice?
• What are the real-world applications of ${participant.researchTopic}?
• What challenges exist in ${participant.researchTopic} research?

This helps maintain the integrity of the cognitive load research study (and keeps the scientists happy). 🧠`,
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
      content: '🧠 *Processing with real-time intelligence...*',
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

Please provide a comprehensive, witty response about ${participant.researchTopic} that directly addresses the user's question. Use Grok's characteristic style - be informative but engaging, with occasional humor and real-world insights.`;

      // Stream response from Grok API
      const streamGenerator = llmService.streamGrokResponse(
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
      console.error('Error streaming Grok response:', error);
      // Update with error message
      setMessages(prev => prev.map(msg => {
        if (msg.id === assistantMessageId) {
          return {
            ...msg,
            content: `❌ **Grok Error**: ${error instanceof Error ? error.message : 'Unknown error occurred'}\n\n**Fallback**: ${generateGrokResponse(queryText, participant.researchTopic)}`,
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

  const generateGrokResponse = (query: string, topic: string): string => {
    // This would be replaced with actual Grok API call
    const responses = [
      `Based on current real-time information about ${topic}, ${query.toLowerCase()} involves several key factors. Recent developments have shown significant progress in this area, particularly in understanding cognitive processes and decision-making patterns.`,
      `Regarding ${query.toLowerCase()} in the context of ${topic}, there are multiple perspectives to consider. The latest research suggests that this is a complex topic with implications for both theoretical understanding and practical applications.`,
      `When examining ${query.toLowerCase()} within ${topic}, it's important to note that this field has evolved significantly in recent years. Current data indicates that this aspect plays a crucial role in overall system performance and user experience.`,
      `The relationship between ${query.toLowerCase()} and ${topic} has been extensively studied with real-time data. Evidence suggests that this connection is fundamental to understanding the broader implications and applications in real-world scenarios.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRealTimeInfo = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    // Create a streaming message for real-time info
    const messageId = Date.now().toString();
    const streamingMessage: Message = {
      id: messageId,
      role: 'assistant',
      content: '🔥 **Getting latest updates...**',
      timestamp: new Date(),
      queryType: 'research',
      relevanceScore: 0,
      isStreaming: true
    };
    
    setMessages(prev => [...prev, streamingMessage]);
    
    try {
      // Get real-time information using Grok streaming
      const streamGenerator = llmService.streamGrokResponse(
        `What are the latest developments and current trends in ${participant.researchTopic}?`,
        participant.researchTopic,
        []
      );
      
      for await (const chunk of streamGenerator) {
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              content: `🔥 **Latest ${participant.researchTopic} Updates**\n\n${chunk.text}`,
              relevanceScore: chunk.validationResult?.confidence || 1.0,
              isStreaming: !chunk.isComplete
            };
          }
          return msg;
        }));
        
        if (chunk.isComplete) break;
      }
    } catch (error) {
      console.error('Error getting real-time info:', error);
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            content: `❌ **Real-time Update Error**: Failed to get latest information, but I'm still here to help with your ${participant.researchTopic} research!`,
            queryType: 'clarification',
            relevanceScore: 0,
            isStreaming: false
          };
        }
        return msg;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full  ">
      {/* Grok Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-lg animate-pulse"></div>
              <Bot className="h-6 w-6 relative z-10" />
            </div>
            <div >
              <h3 className="font-bold text-lg">Grok Research Assistant</h3>
              <p className="text-sm opacity-90">Real-time knowledge powered by xAI</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              realTimeMode ? 'bg-white/20' : 'bg-white/10'
            }`}>
              <TrendingUp className="h-4 w-4" />
              <span>Real-time</span>
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
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                  : 'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 text-gray-800'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${
                  message.role === 'user' 
                    ? 'bg-white/20' 
                    : 'bg-gradient-to-br from-purple-100 to-pink-100'
                }`}>
                  {message.role === 'user' ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-purple-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <p className={`text-xs ${
                      message.role === 'user' ? 'text-purple-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                    {message.relevanceScore !== undefined && (
                      <div className="flex items-center space-x-1">
                        {message.relevanceScore === 0 ? (
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                        ) : (
                          <Sparkles className="h-3 w-3 text-purple-500" />
                        )}
                        <span className={`text-xs ${
                          message.relevanceScore === 0 
                            ? 'text-orange-600' 
                            : 'text-purple-600'
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
                    {message.role === 'assistant' && message.queryType !== 'clarification' && (
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-3 w-3 text-purple-500" />
                        <span className="text-xs text-purple-600">Real-time</span>
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
                <div className="p-2 rounded-full bg-gradient-to-br from-purple-100 to-pink-100">
                  <Bot className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
            onClick={handleRealTimeInfo}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Get Real-time Info</span>
          </button>
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
              placeholder={`Ask Grok about ${participant.researchTopic} with real-time knowledge...`}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
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
            className="group relative px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center space-x-2">
              <Send className="h-4 w-4" />
              <span>Ask Grok</span>
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
              `What are the challenges in ${participant.researchTopic}?`,
              `Latest news about ${participant.researchTopic}`
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

