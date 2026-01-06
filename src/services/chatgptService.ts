// ChatGPT API Service for research assistance
// This service handles communication with OpenAI's ChatGPT API

import { API_CONFIG, isApiKeyAvailable } from '../config/api';
import { PROMPTS } from './prompts';

interface ChatGPTMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatGPTResponse {
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

export class ChatGPTService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || API_CONFIG.OPENAI.API_KEY;
    this.baseUrl = API_CONFIG.OPENAI.BASE_URL;
    this.model = API_CONFIG.OPENAI.MODEL;
  }

  /**
   * Send a message to ChatGPT and get a response
   */
  async sendMessage(
    userMessage: string, 
    researchTopic: string, 
    conversationHistory: ChatGPTMessage[] = []
  ): Promise<string> {
    if (!isApiKeyAvailable('openai')) {
      throw new Error('OpenAI API key is required. Please set REACT_APP_OPENAI_API_KEY in your .env file');
    }

    // Create system message for research context
    const systemMessage: ChatGPTMessage = {
      role: 'system',
      content: PROMPTS.CHATGPT_SYSTEM(researchTopic)
    };

    // Prepare messages array
    const messages: ChatGPTMessage[] = [
      systemMessage,
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          max_tokens: API_CONFIG.OPENAI.MAX_TOKENS,
          temperature: API_CONFIG.OPENAI.TEMPERATURE,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatGPTResponse = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      } else {
        throw new Error('No response from ChatGPT');
      }
    } catch (error) {
      console.error('Error calling ChatGPT API:', error);
      throw error;
    }
  }

  /**
   * Generate a research-focused response for a specific topic
   */
  async generateResearchResponse(query: string, topic: string): Promise<string> {
    const enhancedQuery = `Please provide a comprehensive research response about ${topic} regarding: ${query}. 
    Include key concepts, recent developments, and practical applications.`;
    
    return this.sendMessage(enhancedQuery, topic);
  }

  /**
   * Get suggested questions for a research topic
   */
  async getSuggestedQuestions(topic: string): Promise<string[]> {
    const query = `Generate 5 specific research questions about ${topic} that would be helpful for someone conducting research on this topic. 
    Return only the questions, one per line, without numbering.`;
    
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
    Also suggest the best approach to research this topic. 
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
}

// Export a singleton instance
export const chatGPTService = new ChatGPTService();
