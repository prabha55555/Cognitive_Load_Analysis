// Grok API Service for research assistance
// This service handles communication with xAI's Grok API

import { API_CONFIG, isApiKeyAvailable } from '../config/api';

interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GrokService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || API_CONFIG.GROK.API_KEY;
    this.baseUrl = API_CONFIG.GROK.BASE_URL;
    this.model = API_CONFIG.GROK.MODEL;
  }

  /**
   * Send a message to Grok and get a response
   */
  async sendMessage(
    userMessage: string, 
    researchTopic: string, 
    conversationHistory: GrokMessage[] = []
  ): Promise<string> {
    if (!isApiKeyAvailable('grok')) {
      throw new Error('Grok API key is required. Please set VITE_GROK_API_KEY in your .env file');
    }

    // Create system message for research context
    const systemMessage: GrokMessage = {
      role: 'system',
      content: `You are Grok, a helpful research assistant specializing in ${researchTopic}. 
      Provide detailed, accurate, and well-structured responses to help users understand this topic. 
      Include relevant examples, cite sources when possible, and maintain a professional yet accessible tone. 
      Focus on providing comprehensive information that would be useful for academic or professional research.
      Use your real-time knowledge to provide the most current information available.`
    };

    // Prepare messages array
    const messages: GrokMessage[] = [
      systemMessage,
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Version': API_CONFIG.GROK.API_VERSION
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          max_tokens: API_CONFIG.GROK.MAX_TOKENS,
          temperature: API_CONFIG.GROK.TEMPERATURE,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GrokResponse = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      } else {
        throw new Error('No response from Grok');
      }
    } catch (error) {
      console.error('Error calling Grok API:', error);
      throw error;
    }
  }

  /**
   * Generate a research-focused response for a specific topic
   */
  async generateResearchResponse(query: string, topic: string): Promise<string> {
    const enhancedQuery = `Please provide a comprehensive research response about ${topic} regarding: ${query}. 
    Include key concepts, recent developments, and practical applications. Use your real-time knowledge to provide current information.`;
    
    return this.sendMessage(enhancedQuery, topic);
  }

  /**
   * Get suggested questions for a research topic
   */
  async getSuggestedQuestions(topic: string): Promise<string[]> {
    const query = `Generate 5 specific research questions about ${topic} that would be helpful for someone conducting research on this topic. 
    Focus on current trends and recent developments. Return only the questions, one per line, without numbering.`;
    
    try {
      const response = await this.sendMessage(query, topic);
      return response.split('\n').filter(q => q.trim().length > 0);
    } catch (error) {
      // Fallback to predefined questions if API fails
      return [
        `What is ${topic} and how does it work?`,
        `What are the main applications of ${topic}?`,
        `What are the current challenges in ${topic}?`,
        `How has ${topic} evolved in recent years?`,
        `What are the future prospects for ${topic}?`
      ];
    }
  }

  /**
   * Analyze research query for cognitive load assessment
   */
  async analyzeQueryComplexity(query: string, topic: string): Promise<{
    complexity: 'low' | 'medium' | 'high';
    reasoning: string;
    suggestedApproach: string;
  }> {
    const analysisQuery = `Analyze the complexity of this research query: "${query}" about ${topic}. 
    Rate it as low, medium, or high complexity and explain why. 
    Also suggest the best approach to research this topic using current information. 
    Format your response as: COMPLEXITY: [low/medium/high] | REASONING: [explanation] | APPROACH: [suggestion]`;
    
    try {
      const response = await this.sendMessage(analysisQuery, topic);
      const parts = response.split('|').map(part => part.trim());
      
      return {
        complexity: parts[0]?.includes('low') ? 'low' : 
                   parts[0]?.includes('high') ? 'high' : 'medium',
        reasoning: parts[1]?.replace('REASONING:', '').trim() || '',
        suggestedApproach: parts[2]?.replace('APPROACH:', '').trim() || ''
      };
    } catch (error) {
      return {
        complexity: 'medium',
        reasoning: 'Unable to analyze complexity',
        suggestedApproach: 'Start with basic research and gradually explore more complex aspects'
      };
    }
  }

  /**
   * Get real-time information about a topic
   */
  async getRealTimeInfo(topic: string): Promise<string> {
    const query = `Provide the most current and up-to-date information about ${topic}. 
    Include recent developments, news, and trends. Focus on information from the last 6 months.`;
    
    try {
      return await this.sendMessage(query, topic);
    } catch (error) {
      return `Unable to fetch real-time information about ${topic}. Please try a different query.`;
    }
  }

  /**
   * Compare different aspects of a topic
   */
  async compareAspects(topic: string, aspects: string[]): Promise<string> {
    const query = `Compare and contrast the following aspects of ${topic}: ${aspects.join(', ')}. 
    Provide a detailed analysis highlighting similarities, differences, and implications.`;
    
    try {
      return await this.sendMessage(query, topic);
    } catch (error) {
      return `Unable to compare aspects of ${topic}. Please try a different approach.`;
    }
  }

  /**
   * Validate if the API key is working
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.sendMessage('Hello', 'test');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get Grok's capabilities and features
   */
  getCapabilities(): string[] {
    return [
      'Real-time knowledge access',
      'Current events awareness',
      'Comprehensive research assistance',
      'Multi-modal understanding',
      'Contextual responses',
      'Source citation',
      'Trend analysis',
      'Comparative analysis'
    ];
  }
}

// Export a singleton instance
export const grokService = new GrokService();
