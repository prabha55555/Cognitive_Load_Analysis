// LLM Service for handling Gemini and Grok API calls
import { API_CONFIG } from '../config/api';
import { TopicValidationResult, topicValidator } from './topicValidationService';
import { PROMPTS } from './prompts';

export interface LLMResponse {
  response: string;
  isSuccess: boolean;
  error?: string;
  platform: 'gemini' | 'grok';
  validationResult?: TopicValidationResult;
  isReal?: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  timestamp: Date;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamingChunk {
  text: string;
  isComplete: boolean;
  isSuccess: boolean;
  validationResult?: TopicValidationResult;
  error?: string;
}

export class LLMService {
  private static instance: LLMService;
  private abortController: AbortController | null = null;
  private retryCount: number = 0;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s

  static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  /**
   * Stream response from Gemini API with retry logic and error handling
   */
  async *streamGeminiResponse(
    query: string,
    researchTopic: string,
    conversationHistory: ChatMessage[] = []
  ): AsyncGenerator<StreamingChunk> {
    console.log('🚀 Starting Gemini streaming for:', query);
    
    // Reset retry count for new request
    this.retryCount = 0;

    // Try with retries
    while (this.retryCount <= this.MAX_RETRIES) {
      try {
        yield* await this.attemptGeminiRequest(query, researchTopic, conversationHistory);
        return; // Success, exit
      } catch (error: any) {
        console.error(`❌ Gemini attempt ${this.retryCount + 1} failed:`, error);

        // Check if it's a retryable error
        const isRetryable = this.isRetryableError(error);
        
        if (isRetryable && this.retryCount < this.MAX_RETRIES) {
          this.retryCount++;
          const delay = this.RETRY_DELAYS[this.retryCount - 1];
          
          console.log(`⏳ Retrying in ${delay}ms... (Attempt ${this.retryCount + 1}/${this.MAX_RETRIES + 1})`);
          
          // Show retry message to user
          yield {
            text: `⏳ The AI service is experiencing high demand. Retrying in ${delay / 1000} seconds... (Attempt ${this.retryCount}/${this.MAX_RETRIES})`,
            isComplete: false,
            isSuccess: false
          };

          await this.delay(delay);
          continue; // Retry
        } else {
          // Not retryable or max retries reached, use fallback
          console.log('🔄 Using fallback response after retries exhausted');
          const fallbackResponse = this.generateEnhancedResponse(query, researchTopic);
          const validation = topicValidator.validateQuery(query, researchTopic);
          
          yield {
            text: `⚠️ The AI service is temporarily unavailable. Here's a helpful response based on our knowledge base:\n\n${fallbackResponse}`,
            isComplete: true,
            isSuccess: false,
            validationResult: validation,
            error: this.getUserFriendlyError(error)
          };
          return;
        }
      }
    }
  }

  /**
   * Attempt Gemini API request (extracted for retry logic)
   */
  private async *attemptGeminiRequest(
    query: string,
    researchTopic: string,
    conversationHistory: ChatMessage[]
  ): AsyncGenerator<StreamingChunk> {
    // Create abort controller for timeout handling
    this.abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      this.abortController?.abort();
    }, 30000); // 30 second timeout (increased for reliability)

    try {
      // First validate the query
      const validation = topicValidator.validateQuery(query, researchTopic);
      console.log('✅ Validation result:', validation);

      // Check CHAT API key
      if (!API_CONFIG.GEMINI_CHAT.API_KEY) {
        console.warn('⚠️ No Gemini Chat API key found, using fallback');
        const fallbackResponse = this.generateEnhancedResponse(query, researchTopic);
        yield* this.streamText(fallbackResponse, true, validation);
        clearTimeout(timeoutId);
        return;
      }

      // If not relevant and low confidence, provide guidance
      if (!validation.isRelevant && validation.confidence < 0.1) {
        const suggestions = topicValidator.getSuggestedQuestions(researchTopic);
        const response = `I'd love to help you with your ${researchTopic} research! ${validation.reason}\n\n**Here are some relevant questions to explore:**\n${suggestions.slice(0, 3).map(q => `• ${q}`).join('\n')}\n\nFeel free to ask me anything about ${researchTopic}!`;
        
        yield* this.streamText(response, false, validation);
        clearTimeout(timeoutId);
        return;
      }

      console.log('� Using CHAT API key for chatbot interaction');
      console.log('� Attempting Gemini API call...');
      
      const systemPrompt = topicValidator.generateSystemPrompt(researchTopic);
      const prompt = this.buildContextualPrompt(query, researchTopic, systemPrompt, conversationHistory);

      // Call Gemini CHAT API
      const response = await fetch(
        `${API_CONFIG.GEMINI_CHAT.BASE_URL}?key=${API_CONFIG.GEMINI_CHAT.API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: API_CONFIG.GEMINI_CHAT.TEMPERATURE,
              maxOutputTokens: API_CONFIG.GEMINI_CHAT.MAX_TOKENS,
            }
          }),
          signal: this.abortController.signal
        }
      );

      clearTimeout(timeoutId);
      console.log('📡 Gemini Chat API Response Status:', response.status);

      // Handle different error status codes
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini Chat API Error Details:', errorText);
        
        // Parse error
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: errorText, code: response.status } };
        }

        // Throw with structured error
        const error: any = new Error(errorData.error?.message || 'API request failed');
        error.status = response.status;
        error.code = errorData.error?.code;
        error.retryable = this.isRetryableStatusCode(response.status);
        throw error;
      }

      const data = await response.json();
      console.log('✅ Gemini Chat API Response received');
      
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 
        'I apologize, but I couldn\'t generate a proper response. Please try rephrasing your question.';

      yield* this.streamText(content, true, validation);

    } catch (error) {
      clearTimeout(timeoutId);
      throw error; // Re-throw for retry logic
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Network errors
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return true;
    }

    // Check HTTP status code
    if (error.status) {
      return this.isRetryableStatusCode(error.status);
    }

    // Check error message
    const message = error.message?.toLowerCase() || '';
    return message.includes('overloaded') ||
           message.includes('unavailable') ||
           message.includes('timeout') ||
           message.includes('network') ||
           message.includes('503') ||
           message.includes('429');
  }

  /**
   * Check if HTTP status code is retryable
   */
  private isRetryableStatusCode(status: number): boolean {
    return [429, 500, 502, 503, 504].includes(status);
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyError(error: any): string {
    const status = error.status;
    const message = error.message?.toLowerCase() || '';

    if (status === 503 || message.includes('overloaded')) {
      return 'The AI service is experiencing high demand right now.';
    }
    if (status === 429 || message.includes('quota')) {
      return 'API rate limit reached. Please wait a moment.';
    }
    if (status === 401 || message.includes('unauthorized')) {
      return 'API authentication failed. Please check your API key.';
    }
    if (message.includes('timeout')) {
      return 'The request took too long. Please try again.';
    }
    return 'Unable to connect to the AI service.';
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Stream response from Grok API with timeout handling
   */
  async *streamGrokResponse(
    query: string,
    researchTopic: string,
    conversationHistory: ChatMessage[] = []
  ): AsyncGenerator<StreamingChunk> {
    console.log('🚀 Starting Grok streaming for:', query);
    
    // Create abort controller for timeout handling
    this.abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      this.abortController?.abort();
    }, 15000); // 15 second timeout

    try {
      // First validate the query
      const validation = topicValidator.validateQuery(query, researchTopic);
      
      // If not relevant and low confidence, provide guidance
      if (!validation.isRelevant && validation.confidence < 0.1) {
        const suggestions = topicValidator.getSuggestedQuestions(researchTopic);
        const response = `🤔 Hey! I'm all about helping you explore ${researchTopic}! ${validation.reason}\n\n**Let's dive into some fascinating ${researchTopic} questions:**\n${suggestions.slice(0, 3).map(q => `• ${q}`).join('\n')}\n\n*I'm here to make your research journey both informative and fun!* 🚀`;
        
        yield* this.streamText(response, false, validation);
        clearTimeout(timeoutId);
        return;
      }

      // Check API key
      if (!API_CONFIG.GROK.API_KEY) {
        console.warn('⚠️ No Grok API key found, using fallback');
        const fallbackResponse = this.generateEnhancedResponse(query, researchTopic, 'grok');
        yield* this.streamText(fallbackResponse, true, validation);
        clearTimeout(timeoutId);
        return;
      }

      const systemPrompt = topicValidator.generateSystemPrompt(researchTopic) + 
        "\n\nRespond in Grok's characteristic style: witty, informative, and engaging.";

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-4),
        { role: 'user', content: `Research Topic: ${researchTopic}\n\nQuestion: ${query}` }
      ];

      // Call Grok API with timeout
      const response = await Promise.race([
        fetch(API_CONFIG.GROK.BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_CONFIG.GROK.API_KEY}`
          },
          body: JSON.stringify({
            model: API_CONFIG.GROK.MODEL,
            messages,
            max_tokens: API_CONFIG.GROK.MAX_TOKENS,
            temperature: API_CONFIG.GROK.TEMPERATURE,
            stream: false
          }),
          signal: this.abortController.signal
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('API timeout')), 10000)
        )
      ]);

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || 
        'Oops! I hit a snag there, but I\'m still eager to help with your research!';
      
      yield* this.streamText(content, true, validation);

    } catch (error) {
      clearTimeout(timeoutId);
      console.error('❌ Grok API error:', error);
      
      // Generate enhanced fallback response
      const fallbackResponse = this.generateEnhancedResponse(query, researchTopic, 'grok');
      const validation = topicValidator.validateQuery(query, researchTopic);
      yield* this.streamText(fallbackResponse, false, validation, error as Error);
    }
  }

  /**
   * Stop any ongoing streaming
   */
  stopStreaming() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Stream text with timeout and safe error handling
   */
  private async *streamText(
    content: string, 
    isSuccess: boolean, 
    validationResult?: TopicValidationResult,
    error?: Error
  ): AsyncGenerator<StreamingChunk> {
    if (!content || content.trim().length === 0) {
      yield {
        text: "I apologize, but I couldn't generate a proper response. Please try rephrasing your question.",
        isComplete: true,
        isSuccess: false,
        validationResult,
        error: error?.message
      };
      return;
    }

    const words = content.split(' ');
    let currentContent = '';
    
    for (let i = 0; i < words.length; i++) {
      // Check if streaming was aborted
      if (this.abortController?.signal.aborted) {
        console.log('🛑 Streaming aborted');
        break;
      }

      currentContent += (i > 0 ? ' ' : '') + words[i];
      
      yield {
        text: currentContent,
        isComplete: i === words.length - 1,
        isSuccess,
        validationResult,
        error: error?.message
      };
      
      // Non-blocking delay with shorter intervals
      await new Promise(resolve => {
        const timeoutId = setTimeout(resolve, 30 + Math.random() * 20); // 30-50ms
        if (this.abortController?.signal.aborted) {
          clearTimeout(timeoutId);
          resolve(undefined);
        }
      });
    }
  }

  /**
   * Generate enhanced contextual response
   */
  private generateEnhancedResponse(
    query: string, 
    researchTopic: string,
    style: 'academic' | 'grok' = 'academic'
  ): string {
    const queryLower = query.toLowerCase();
    
    // Handle greetings specifically
    const basicGreetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
    const isGreeting = basicGreetings.some(greeting => queryLower.trim() === greeting);
    
    if (isGreeting) {
      if (style === 'grok') {
        return `🚀 Hey there! I'm Grok, your witty AI research companion for ${researchTopic}. I'm here to make learning about this topic both insightful and fun. What fascinating aspect would you like to explore?`;
      }
      return `Hello! I'm your AI research assistant powered by Google Gemini, specialized in ${researchTopic}. 

${researchTopic} is a fascinating field with many applications and ongoing research developments. I'm here to help you explore this topic in depth with accurate, up-to-date information.

What specific aspect of ${researchTopic} would you like to learn about? For example:
• The fundamentals and core concepts of ${researchTopic}
• Current research trends and developments
• Real-world applications and use cases
• Challenges and future directions in ${researchTopic}`;
    }
    
    // Analyze intent and generate response
    return this.generateContextualResponse(query, researchTopic, style);
  }

  /**
   * Generate contextual response based on query and topic
   */
  private generateContextualResponse(query: string, researchTopic: string, style: 'academic' | 'grok' = 'academic'): string {
    const queryLower = query.toLowerCase();
    const isGrok = style === 'grok';
    
    // Analyze query intent
    let responseTemplate = '';
    if (queryLower.includes('what is') || queryLower.includes('define')) {
      responseTemplate = `${researchTopic} is a significant area of study that encompasses various methodologies, principles, and applications. It involves systematic approaches to understanding complex phenomena and developing practical solutions. Current research continues to evolve with new discoveries and technological advances.`;
    } else if (queryLower.includes('how does') || queryLower.includes('how do')) {
      responseTemplate = `The processes and mechanisms in ${researchTopic} typically follow established methodologies and best practices. These approaches have been developed through extensive research and real-world application, incorporating both theoretical foundations and practical considerations.`;
    } else if (queryLower.includes('benefits') || queryLower.includes('advantages')) {
      responseTemplate = `${researchTopic} offers numerous benefits including improved efficiency, enhanced understanding, and practical applications that address real-world challenges. The field shows significant potential for positive impact across various domains.`;
    } else if (queryLower.includes('challenges') || queryLower.includes('problems')) {
      responseTemplate = `Like any developing field, ${researchTopic} faces several challenges including technical limitations, resource requirements, and implementation considerations. Researchers continue to work on addressing these challenges through innovative approaches.`;
    } else {
      responseTemplate = `Your question about ${researchTopic} touches on important aspects of this field. This area continues to be actively researched and developed, with ongoing work focusing on both theoretical understanding and practical applications.`;
    }

    return isGrok 
      ? `${responseTemplate}\n\n*That's the gist of it! Got any more specific questions about ${researchTopic}? I'm here to help make this topic as clear as possible!* 🤓`
      : responseTemplate;
  }

  /**
   * Build contextual prompt for better API responses
   */
  private buildContextualPrompt(
    query: string,
    researchTopic: string,
    systemPrompt: string,
    conversationHistory: ChatMessage[]
  ): string {
    const context = conversationHistory.length > 0 
      ? `\n\nPrevious conversation context:\n${conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n`
      : '';

    return PROMPTS.CONTEXTUAL_RESPONSE(systemPrompt, context, researchTopic, query);
  }
}

export default LLMService.getInstance();
