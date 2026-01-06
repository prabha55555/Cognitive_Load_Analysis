import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_CONFIG } from '../config/api';
import { PROMPTS } from './prompts';

// ========================================
// API KEY CONFIGURATION & LOAD BALANCING
// ========================================

const PRIMARY_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const CHAT_API_KEY = import.meta.env.VITE_GEMINI_CHAT_API_KEY || '';
const QUESTIONS_API_KEY = import.meta.env.VITE_GEMINI_QUESTIONS_API_KEY || '';

console.log('🔑 GEMINI API KEYS CONFIGURATION:');
console.log('================================');
console.log('Primary API Key:', PRIMARY_API_KEY ? '✅ Loaded' : '❌ Missing');
console.log('Chat API Key:', CHAT_API_KEY ? '✅ Loaded' : '❌ Missing');
console.log('Questions API Key:', QUESTIONS_API_KEY ? '✅ Loaded' : '❌ Missing');
console.log('================================');

// Initialize separate Gemini instances for load distribution
const genAIPrimary = new GoogleGenerativeAI(PRIMARY_API_KEY);
const genAIChat = CHAT_API_KEY ? new GoogleGenerativeAI(CHAT_API_KEY) : genAIPrimary;
const genAIQuestions = QUESTIONS_API_KEY ? new GoogleGenerativeAI(QUESTIONS_API_KEY) : genAIPrimary;

// Use separate API key for question generation (legacy compatibility)
const questionsGenAI = genAIQuestions;

// ========================================
// MODEL SELECTION WITH PURPOSE-BASED ROUTING
// ========================================

const getModel = (purpose: 'chat' | 'questions' | 'evaluation' = 'chat') => {
  console.log(`📡 Selecting Gemini model for purpose: ${purpose.toUpperCase()}`);
  
  try {
    switch (purpose) {
      case 'chat':
        // HIGH FREQUENCY: Use dedicated CHAT API key
        console.log('✅ Using VITE_GEMINI_CHAT_API_KEY for chat interactions');
        return genAIChat.getGenerativeModel({ 
          model: 'gemini-2.5-flash-lite',
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
            topP: 0.9,
          }
        });
        
      case 'questions':
        // MEDIUM FREQUENCY: Use dedicated QUESTIONS API key
        console.log('✅ Using VITE_GEMINI_QUESTIONS_API_KEY for assessment generation');
        return genAIQuestions.getGenerativeModel({ 
          model: 'gemini-2.5-flash-lite',
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2500,
            topP: 0.8,
          }
        });
        
      case 'evaluation':
        // MEDIUM FREQUENCY: Use QUESTIONS API key (shared with assessments)
        console.log('✅ Using VITE_GEMINI_QUESTIONS_API_KEY for creativity evaluation');
        return genAIQuestions.getGenerativeModel({ 
          model: 'gemini-2.5-flash-lite',
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 1500,
            topP: 0.85,
          }
        });
        
      default:
        console.log('⚠️ Using PRIMARY API KEY (fallback)');
        return genAIPrimary.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    }
  } catch (error) {
    console.error('❌ Error initializing model:', error);
    throw error;
  }
};

// ========================================
// RETRY MECHANISM WITH FALLBACK
// ========================================

async function retryWithFallback<T>(
  operation: (model: any) => Promise<T>,
  purpose: 'chat' | 'questions' | 'evaluation',
  _maxRetries: number = 2
): Promise<T> {
  const apiKeys = [
    { name: 'Dedicated', model: getModel(purpose) },
    { name: 'Primary', model: genAIPrimary.getGenerativeModel({ model: 'gemini-2.5-flash-lite' }) },
  ];

  for (let i = 0; i < apiKeys.length; i++) {
    try {
      console.log(`🔄 Attempt ${i + 1}: Using ${apiKeys[i].name} API key for ${purpose}`);
      return await operation(apiKeys[i].model);
    } catch (error: any) {
      const isOverloaded = error.message?.includes('503') || error.message?.includes('overloaded');
      const isLastAttempt = i === apiKeys.length - 1;

      if (isOverloaded && !isLastAttempt) {
        console.warn(`⚠️ ${apiKeys[i].name} API key overloaded, trying next fallback...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        continue;
      }

      if (isLastAttempt) {
        console.error('❌ All API keys exhausted for', purpose);
        throw error;
      }

      throw error;
    }
  }

  throw new Error('All retry attempts failed');
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  cognitiveLevel: 'remembering' | 'understanding' | 'application' | 'analysis';
}

export interface CreativityQuestion {
  id: string;
  question: string;
  type: 'fluency' | 'originality' | 'divergent';
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  topic: string;
  evaluationCriteria: {
    relevance: number;
    creativity: number;
    depth: number;
    coherence: number;
  };
}

export interface CreativityEvaluation {
  score: number;
  relevanceScore: number;
  creativityScore: number;
  depthScore: number;
  coherenceScore: number;
  timeEfficiencyScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  cognitiveLoadIndicators: {
    processingSpeed: number; // Based on time taken
    mentalEffort: number; // Based on response quality vs time
    cognitiveStrain: number; // Overall cognitive demand
  };
}

export const geminiService = {
  /**
   * Generate assessment questions based on TOPIC ONLY (not notes)
   * Questions are clear, understandable, and applicable
   */
  async generateAssessmentQuestions(
    topic: string,
    _notes: string, // Keep parameter for compatibility but won't use it
    count: number = 5
  ): Promise<AssessmentQuestion[]> {
    console.log(`📝 GENERATING ASSESSMENT QUESTIONS for topic: "${topic}"`);
    
    return retryWithFallback(async (model) => {
      // Use centralized assessment questions prompt
      const prompt = PROMPTS.ASSESSMENT_QUESTIONS(topic, count);

      try {
        console.log('==========================================');
        console.log('🎯 ASSESSMENT GENERATION FOR CUSTOM TOPIC');
        console.log('Topic provided:', topic);
        console.log('Topic length:', topic.length);
        console.log('Calling Gemini API with Questions API Key...');
        console.log('==========================================');
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('📡 RAW GEMINI RESPONSE:');
        console.log(text.substring(0, 500));
        console.log('==========================================');
        
        // Aggressive cleaning to extract JSON
        let cleanText = text.trim();
        
        // Remove all markdown
        cleanText = cleanText.replace(/```json\s*/g, '');
        cleanText = cleanText.replace(/```\s*/g, '');
        
        // Find JSON array boundaries
        const startIdx = cleanText.indexOf('[');
        const endIdx = cleanText.lastIndexOf(']');
        
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          cleanText = cleanText.substring(startIdx, endIdx + 1);
        }
        
        console.log('🧹 CLEANED JSON:');
        console.log(cleanText.substring(0, 300));
        console.log('==========================================');
        
        const questions = JSON.parse(cleanText);
        
        console.log('✅ PARSED QUESTIONS SUCCESSFULLY');
        console.log('Number of questions:', questions.length);
        console.log('==========================================');
        
        // Log each question to verify topic relevance
        questions.forEach((q: any, idx: number) => {
          console.log(`Question ${idx + 1}:`, q.question?.substring(0, 100));
          console.log(`Topic field:`, q.topic);
          console.log(`Difficulty:`, q.difficulty);
          console.log('---');
        });
        console.log('==========================================');
        
        // Validate and ensure all questions are about the correct topic
        const validatedQuestions = questions.map((q: any, idx: number) => {
          const questionText = q.question || `Question ${idx + 1} about ${topic}`;
          
          // Double-check the question is about the topic
          const lowerQuestion = questionText.toLowerCase();
          const lowerTopic = topic.toLowerCase();
          
          // Warn if topic not mentioned in question
          if (!lowerQuestion.includes(lowerTopic) && !lowerQuestion.includes('this') && !lowerQuestion.includes('it')) {
            console.warn(`⚠️ Question ${idx + 1} may not be specific to topic "${topic}":`, questionText);
          }
          
          return {
            id: q.id || `assessment-${Date.now()}-${idx}`,
            question: questionText,
            options: Array.isArray(q.options) && q.options.length === 4 
              ? q.options 
              : [
                  `Correct answer specifically about ${topic}`,
                  `Incorrect option related to ${topic}`,
                  `Another incorrect option about ${topic}`,
                  `Third incorrect option for ${topic}`
                ],
            correctAnswer: q.correctAnswer || (Array.isArray(q.options) ? q.options[0] : `Correct answer about ${topic}`),
            difficulty: q.difficulty || 'medium',
            topic: topic, // Force the topic to be correct
            cognitiveLevel: q.cognitiveLevel || 'understanding'
          };
        });
        
        console.log('==========================================');
        console.log('✅ FINAL VALIDATED QUESTIONS:');
        validatedQuestions.forEach((q: any, idx: number) => {
          console.log(`${idx + 1}. ${q.question.substring(0, 80)}...`);
        });
        console.log('==========================================');
        
        return validatedQuestions;
        
      } catch (error) {
        console.error('==========================================');
        console.error('❌ GEMINI API ERROR:');
        console.error(error);
        console.error('==========================================');
        throw error; // Let retry mechanism handle it
      }
    }, 'questions').catch(() => {
      console.log('📋 ALL API KEYS FAILED, USING FALLBACK QUESTIONS FOR:', topic);
      console.log('==========================================');
      return this.getFallbackAssessmentQuestions(topic);
    });
  },

  /**
   * Generate creativity questions based on topic
   */
  async generateCreativityQuestions(
    topic: string,
    notes: string
  ): Promise<CreativityQuestion[]> {
    const model = questionsGenAI.getGenerativeModel({ model: API_CONFIG.GEMINI_QUESTIONS.MODEL });

    const prompt = PROMPTS.CREATIVITY_QUESTIONS(topic, notes);

    try {
      console.log('🔑 Generating creativity questions using QUESTIONS API key');
      console.log('Topic:', topic);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini raw response:', text);
      
      // Clean the response - remove markdown code blocks if present
      const cleanText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const questions = JSON.parse(cleanText);
      
      console.log('Parsed questions:', questions);
      
      return questions.map((q: any, idx: number) => ({
        id: q.id || `creativity-${Date.now()}-${idx}`,
        question: q.question,
        type: q.type || 'fluency',
        difficulty: q.difficulty || 'medium',
        timeLimit: q.timeLimit || 180,
        topic: topic,
        evaluationCriteria: q.evaluationCriteria || {
          relevance: 25,
          creativity: 25,
          depth: 25,
          coherence: 25
        }
      }));
    } catch (error) {
      console.error('Gemini question generation error:', error);
      return this.getFallbackQuestions(topic);
    }
  },

  /**
   * Evaluate creativity response using Gemini AI
   */
  async evaluateCreativityResponse(
    question: CreativityQuestion,
    response: string,
    timeSpent: number       
  ): Promise<CreativityEvaluation> {
    console.log('==========================================');
    console.log('🎨 GEMINI AI CREATIVITY EVALUATION STARTED');
    console.log('Question ID:', question.id);
    console.log('Question Type:', question.type);
    console.log('Question:', question.question);
    console.log('Topic:', question.topic);
    console.log('Response Length:', response.length, 'characters');
    console.log('Time Spent:', timeSpent, 'seconds');
    console.log('Time Limit:', question.timeLimit, 'seconds');
    console.log('Response Preview:', response.substring(0, 150) + '...');
    console.log('==========================================');
    
    return retryWithFallback(async (model) => {
      const timeRatio = timeSpent / question.timeLimit;
      const timeUsageDescription = 
        timeRatio < 0.3 ? 'very rushed (used less than 30% of time)' :
        timeRatio < 0.5 ? 'somewhat rushed (used less than 50% of time)' :
        timeRatio < 0.8 ? 'adequate time usage' :
        timeRatio <= 1.0 ? 'good time usage (used most of available time)' :
        'exceeded time limit';

      console.log('⏱️ Time Analysis:', timeUsageDescription);
      console.log('Time Ratio:', (timeRatio * 100).toFixed(1) + '%');

      const prompt = PROMPTS.CREATIVITY_EVALUATION(question, response, timeSpent, timeRatio, timeUsageDescription);

      console.log('� Sending evaluation request to Gemini AI...');
      console.log('Using EVALUATION API key with retry mechanism');
      console.log('Model: gemini-2.5-flash-lite');
      
      const result = await model.generateContent(prompt);
      const responseObj = await result.response;
      const text = responseObj.text();
      
      console.log('==========================================');
      console.log('📥 GEMINI RAW RESPONSE RECEIVED');
      console.log('Response length:', text.length, 'characters');
      console.log('Response preview:', text.substring(0, 300));
      console.log('==========================================');
      
      // Clean response
      let cleanText = text.trim();
      cleanText = cleanText.replace(/```json\n?/g, '');
      cleanText = cleanText.replace(/```\n?/g, '');
      
      // Extract JSON
      const startIdx = cleanText.indexOf('{');
      const endIdx = cleanText.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        cleanText = cleanText.substring(startIdx, endIdx + 1);
      }
      
      console.log('🧹 Cleaned JSON:', cleanText.substring(0, 200));
      
      const evaluation = JSON.parse(cleanText);
      
      console.log('==========================================');
      console.log('✅ EVALUATION PARSED SUCCESSFULLY');
      console.log('📊 Individual Scores:');
      console.log('  - Relevance:', evaluation.relevanceScore, '/100');
      console.log('  - Creativity:', evaluation.creativityScore, '/100');
      console.log('  - Depth:', evaluation.depthScore, '/100');
      console.log('  - Coherence:', evaluation.coherenceScore, '/100');
      console.log('  - Time Efficiency:', evaluation.timeEfficiencyScore, '/100');
      console.log('==========================================');
      
      // Calculate weighted overall score
      const weights = question.evaluationCriteria;
      const score = (
        (evaluation.relevanceScore * weights.relevance / 100) +
        (evaluation.creativityScore * weights.creativity / 100) +
        (evaluation.depthScore * weights.depth / 100) +
        (evaluation.coherenceScore * weights.coherence / 100)
      );

      console.log('==========================================');
      console.log('🎯 WEIGHTED SCORE CALCULATION');
      console.log('Weights:', weights);
      console.log('Relevance contribution:', (evaluation.relevanceScore * weights.relevance / 100).toFixed(2));
      console.log('Creativity contribution:', (evaluation.creativityScore * weights.creativity / 100).toFixed(2));
      console.log('Depth contribution:', (evaluation.depthScore * weights.depth / 100).toFixed(2));
      console.log('Coherence contribution:', (evaluation.coherenceScore * weights.coherence / 100).toFixed(2));
      console.log('FINAL WEIGHTED SCORE:', Math.round(score), '/100');
      console.log('==========================================');

      const finalEvaluation = {
        score: Math.round(score),
        relevanceScore: evaluation.relevanceScore || 0,
        creativityScore: evaluation.creativityScore || 0,
        depthScore: evaluation.depthScore || 0,
        coherenceScore: evaluation.coherenceScore || 0,
        timeEfficiencyScore: evaluation.timeEfficiencyScore || 50,
        feedback: evaluation.feedback || 'Response evaluated by AI.',
        strengths: evaluation.strengths || ['Response provided'],
        improvements: evaluation.improvements || ['Consider adding more detail'],
        cognitiveLoadIndicators: {
          processingSpeed: evaluation.cognitiveLoadIndicators?.processingSpeed || 50,
          mentalEffort: evaluation.cognitiveLoadIndicators?.mentalEffort || 50,
          cognitiveStrain: evaluation.cognitiveLoadIndicators?.cognitiveStrain || 50
        }
      };

      console.log('==========================================');
      console.log('✅ FINAL EVALUATION OBJECT CREATED');
      console.log('Overall Score:', finalEvaluation.score);
      console.log('Feedback:', finalEvaluation.feedback);
      console.log('Strengths:', finalEvaluation.strengths);
      console.log('Improvements:', finalEvaluation.improvements);
      console.log('==========================================');

      return finalEvaluation;
      
    }, 'evaluation').catch((error) => {
      console.error('==========================================');
      console.error('❌ ALL GEMINI API KEYS FAILED FOR EVALUATION');
      console.error('Error:', error.message);
      console.error('Falling back to heuristic evaluation...');
      console.error('==========================================');
      return this.getFallbackEvaluation(response, timeSpent, question.timeLimit);
    });
  },

  /**
   * Fallback questions if API fails
   */
  getFallbackQuestions(topic: string): CreativityQuestion[] {
    console.log('Using fallback questions for topic:', topic);
    return [
      {
        id: `fallback-fluency-${Date.now()}`,
        question: `List as many creative applications of "${topic}" as you can think of. Be specific and innovative.`,
        type: 'fluency',
        difficulty: 'medium',
        timeLimit: 180,
        topic,
        evaluationCriteria: { relevance: 30, creativity: 25, depth: 20, coherence: 25 }
      },
      {
        id: `fallback-originality-${Date.now()}`,
        question: `Imagine "${topic}" didn't exist. Describe a completely different solution to solve the same problems. Be original!`,
        type: 'originality',
        difficulty: 'medium',
        timeLimit: 240,
        topic,
        evaluationCriteria: { relevance: 25, creativity: 35, depth: 20, coherence: 20 }
      },
      {
        id: `fallback-divergent-${Date.now()}`,
        question: `Connect "${topic}" with three completely unrelated fields or concepts. Explain the surprising connections you discover.`,
        type: 'divergent',
        difficulty: 'hard',
        timeLimit: 300,
        topic,
        evaluationCriteria: { relevance: 20, creativity: 30, depth: 30, coherence: 20 }
      }
    ];
  },

  /**
   * Fallback evaluation if API fails
   */
  getFallbackEvaluation(
    response: string,
    timeSpent: number,
    timeLimit: number
  ): CreativityEvaluation {
    console.log('Using fallback evaluation');
    const wordCount = response.trim().split(/\s+/).length;
    const uniqueWords = new Set(response.toLowerCase().split(/\s+/)).size;
    const diversity = uniqueWords / Math.max(wordCount, 1);
    const timeRatio = timeSpent / timeLimit;
    
    const baseScore = Math.min(100, wordCount * 1.5 + diversity * 50);
    const timeEfficiency = Math.max(0, 100 - Math.abs(timeRatio - 0.8) * 50);
    
    // Estimate cognitive load from time and response quality
    const processingSpeed = Math.max(0, 100 - (timeSpent / timeLimit) * 100);
    const mentalEffort = Math.min(100, (wordCount / timeSpent) * 20);
    const cognitiveStrain = (mentalEffort + (100 - timeEfficiency)) / 2;
    
    return {
      score: Math.round(baseScore),
      relevanceScore: Math.min(100, wordCount * 2),
      creativityScore: Math.min(100, diversity * 100),
      depthScore: Math.min(100, wordCount * 1.8),
      coherenceScore: 70,
      timeEfficiencyScore: Math.round(timeEfficiency),
      feedback: 'Response evaluated using basic metrics. AI evaluation unavailable.',
      strengths: ['Provided a response', 'Attempted the task'],
      improvements: ['Add more detail', 'Explore different perspectives'],
      cognitiveLoadIndicators: {
        processingSpeed: Math.round(processingSpeed),
        mentalEffort: Math.round(mentalEffort),
        cognitiveStrain: Math.round(cognitiveStrain)
      }
    };
  },

  /**
   * Fallback assessment questions if API fails
   * Clear, understandable, and applicable questions about the topic
   */
  getFallbackAssessmentQuestions(topic: string): AssessmentQuestion[] {
    console.log('==========================================');
    console.log('🔄 GENERATING FALLBACK QUESTIONS');
    console.log('Topic:', topic);
    console.log('==========================================');
    
    // Create topic-specific fallback questions
    return [
      {
        id: `fallback-assess-1-${Date.now()}`,
        question: `What is ${topic}?`,
        options: [
          `${topic} is a field/concept that studies specific principles and methods`,
          `${topic} is unrelated to its commonly understood meaning`,
          `${topic} is an outdated concept with no modern applications`,
          `${topic} is purely theoretical with no practical use`
        ],
        correctAnswer: `${topic} is a field/concept that studies specific principles and methods`,
        difficulty: 'easy',
        topic,
        cognitiveLevel: 'remembering'
      },
      {
        id: `fallback-assess-2-${Date.now()}`,
        question: `Why is ${topic} important in modern society?`,
        options: [
          `${topic} provides valuable solutions to real-world problems and challenges`,
          `${topic} has minimal relevance to everyday life`,
          `${topic} is only relevant to academic researchers`,
          `${topic} was important in the past but not anymore`
        ],
        correctAnswer: `${topic} provides valuable solutions to real-world problems and challenges`,
        difficulty: 'easy',
        topic,
        cognitiveLevel: 'understanding'
      },
      {
        id: `fallback-assess-3-${Date.now()}`,
        question: `How is ${topic} applied in practical scenarios?`,
        options: [
          `${topic} is used to solve specific problems and improve outcomes in various fields`,
          `${topic} cannot be applied outside of controlled environments`,
          `${topic} only exists in theory without real applications`,
          `${topic} requires resources that are not widely available`
        ],
        correctAnswer: `${topic} is used to solve specific problems and improve outcomes in various fields`,
        difficulty: 'medium',
        topic,
        cognitiveLevel: 'application'
      },
      {
        id: `fallback-assess-4-${Date.now()}`,
        question: `What are the key benefits of understanding ${topic}?`,
        options: [
          `Understanding ${topic} leads to better problem-solving and innovation capabilities`,
          `There are no significant benefits to studying ${topic}`,
          `${topic} only benefits a narrow group of specialists`,
          `The benefits of ${topic} are impossible to measure`
        ],
        correctAnswer: `Understanding ${topic} leads to better problem-solving and innovation capabilities`,
        difficulty: 'medium',
        topic,
        cognitiveLevel: 'understanding'
      },
      {
        id: `fallback-assess-5-${Date.now()}`,
        question: `What challenges exist when implementing ${topic} principles?`,
        options: [
          `Challenges include complexity, resource requirements, and need for specialized knowledge`,
          `There are no challenges when working with ${topic}`,
          `The only challenge is lack of interest from people`,
          `All challenges related to ${topic} have been completely solved`
        ],
        correctAnswer: `Challenges include complexity, resource requirements, and need for specialized knowledge`,
        difficulty: 'hard',
        topic,
        cognitiveLevel: 'analysis'
      }
    ];
  }
};
