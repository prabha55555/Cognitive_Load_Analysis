import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_CONFIG } from '../config/api';

// Use separate API key for question generation
const questionsGenAI = new GoogleGenerativeAI(API_CONFIG.GEMINI_QUESTIONS.API_KEY || '');

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
    notes: string, // Keep parameter for compatibility but won't use it
    count: number = 5
  ): Promise<AssessmentQuestion[]> {
    const model = questionsGenAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // More forceful prompt that emphasizes the EXACT topic
    const prompt = `You are an expert educational assessment designer. Create ${count} multiple-choice questions SPECIFICALLY AND EXCLUSIVELY about: "${topic}"

🎯 CRITICAL REQUIREMENTS:
1. EVERY question must be DIRECTLY about "${topic}" - use the exact topic name in questions
2. Questions MUST test knowledge of "${topic}" concepts, applications, and principles
3. DO NOT create generic questions - make them specific to "${topic}"
4. Each question has 4 options - one correct, three plausible but wrong
5. Use simple, clear language that students can understand
6. Make questions practical and applicable to understanding "${topic}"

📚 TOPIC: ${topic}

⚠️ IMPORTANT: If the topic is "${topic}", then questions should explicitly mention or be clearly about "${topic}". For example:
- If topic is "Quantum Computing": Ask "What is a qubit in Quantum Computing?"
- If topic is "Climate Change": Ask "What is the primary cause of Climate Change?"
- If topic is "Machine Learning": Ask "What is supervised learning in Machine Learning?"

📊 DIFFICULTY MIX:
- 2 EASY questions: Basic facts and definitions of "${topic}"
- 2 MEDIUM questions: Understanding how "${topic}" works
- 1 HARD question: Applying "${topic}" knowledge to solve problems

🧠 COGNITIVE LEVELS:
- Remembering: Basic facts about "${topic}"
- Understanding: Explaining "${topic}" concepts
- Application: Using "${topic}" in real scenarios
- Analysis: Analyzing "${topic}" components

EXAMPLE for "Blockchain Technology":
{
  "id": "q1",
  "question": "What is the primary purpose of Blockchain Technology?",
  "options": [
    "To create a secure, decentralized ledger for recording transactions",
    "To store files in the cloud",
    "To send emails securely",
    "To compress video files"
  ],
  "correctAnswer": "To create a secure, decentralized ledger for recording transactions",
  "difficulty": "easy",
  "topic": "Blockchain Technology",
  "cognitiveLevel": "remembering"
}

NOW CREATE ${count} QUESTIONS SPECIFICALLY ABOUT: "${topic}"

RESPOND WITH ONLY THIS JSON ARRAY (NO MARKDOWN, NO CODE BLOCKS, NO EXTRA TEXT):
[
  {
    "id": "q1",
    "question": "What is [specific aspect of ${topic}]?",
    "options": ["Correct answer about ${topic}", "Wrong but plausible", "Wrong but plausible", "Wrong but plausible"],
    "correctAnswer": "Correct answer about ${topic}",
    "difficulty": "easy",
    "topic": "${topic}",
    "cognitiveLevel": "remembering"
  }
]`;

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
      console.log('📋 USING FALLBACK QUESTIONS FOR:', topic);
      console.log('==========================================');
      
      return this.getFallbackAssessmentQuestions(topic);
    }
  },

  /**
   * Generate creativity questions based on topic
   */
  async generateCreativityQuestions(
    topic: string,
    notes: string
  ): Promise<CreativityQuestion[]> {
    const model = questionsGenAI.getGenerativeModel({ model: API_CONFIG.GEMINI_QUESTIONS.MODEL });

    const prompt = `You are an expert educational psychologist specializing in creativity assessment and cognitive load measurement.

Topic: ${topic}

Student's Notes/Content:
${notes}

Generate 3 creativity assessment questions specifically related to this topic. Each question should test different aspects of creative thinking:

1. **Fluency Question** (Easy-Medium): Tests ability to generate multiple ideas quickly
2. **Originality Question** (Medium): Tests uniqueness and novel thinking
3. **Divergent Thinking Question** (Hard): Tests ability to see multiple perspectives and make connections

Requirements:
- Questions MUST be directly related to the topic content
- Questions should be open-ended
- Include time limits appropriate for cognitive load measurement
- Provide evaluation criteria weights

Return ONLY a valid JSON array with this exact structure (no markdown, no code blocks):
[
  {
    "id": "unique-id-1",
    "question": "question text here",
    "type": "fluency",
    "difficulty": "medium",
    "timeLimit": 180,
    "topic": "${topic}",
    "evaluationCriteria": {
      "relevance": 30,
      "creativity": 25,
      "depth": 20,
      "coherence": 25
    }
  }
]`;

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
    const model = questionsGenAI.getGenerativeModel({ model: API_CONFIG.GEMINI_QUESTIONS.MODEL });

    const timeRatio = timeSpent / question.timeLimit;
    const timeUsageDescription = 
      timeRatio < 0.3 ? 'very rushed (used less than 30% of time)' :
      timeRatio < 0.5 ? 'somewhat rushed (used less than 50% of time)' :
      timeRatio < 0.8 ? 'adequate time usage' :
      timeRatio <= 1.0 ? 'good time usage (used most of available time)' :
      'exceeded time limit';

    const prompt = `You are an expert in creativity assessment and cognitive load analysis.

**Topic**: ${question.topic}
**Question Type**: ${question.type}
**Question**: ${question.question}

**Student Response**:
${response}

**Time Analysis**:
- Time Spent: ${timeSpent} seconds
- Time Limit: ${question.timeLimit} seconds
- Time Usage: ${timeUsageDescription}

**Evaluation Criteria Weights**:
- Relevance: ${question.evaluationCriteria.relevance}%
- Creativity: ${question.evaluationCriteria.creativity}%
- Depth: ${question.evaluationCriteria.depth}%
- Coherence: ${question.evaluationCriteria.coherence}%

Evaluate the response on these dimensions (0-100 scale each):

1. **Relevance Score**: How well does it relate to the topic?
2. **Creativity Score**: How original, innovative, and unique is it?
3. **Depth Score**: How thorough and detailed is the thinking?
4. **Coherence Score**: How well-structured and clear is it?
5. **Time Efficiency Score**: Quality achieved relative to time spent

**Cognitive Load Indicators** (0-100 scale):
- **Processing Speed**: How quickly did they generate ideas? (faster = lower cognitive load)
- **Mental Effort**: How much cognitive resources were required? (complex response in short time = high effort)
- **Cognitive Strain**: Overall cognitive demand experienced

Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "relevanceScore": 0-100,
  "creativityScore": 0-100,
  "depthScore": 0-100,
  "coherenceScore": 0-100,
  "timeEfficiencyScore": 0-100,
  "feedback": "2-3 sentences of constructive feedback",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement area 1", "improvement area 2"],
  "cognitiveLoadIndicators": {
    "processingSpeed": 0-100,
    "mentalEffort": 0-100,
    "cognitiveStrain": 0-100
  }
}`;

    try {
      console.log('🔑 Evaluating response using QUESTIONS API key');
      const result = await model.generateContent(prompt);
      const responseObj = await result.response;
      const text = responseObj.text();
      
      console.log('Gemini evaluation raw response:', text);
      
      // Clean response
      const cleanText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const evaluation = JSON.parse(cleanText);
      
      console.log('Parsed evaluation:', evaluation);
      
      // Calculate weighted overall score
      const weights = question.evaluationCriteria;
      const score = (
        (evaluation.relevanceScore * weights.relevance / 100) +
        (evaluation.creativityScore * weights.creativity / 100) +
        (evaluation.depthScore * weights.depth / 100) +
        (evaluation.coherenceScore * weights.coherence / 100)
      );

      return {
        score: Math.round(score),
        relevanceScore: evaluation.relevanceScore || 0,
        creativityScore: evaluation.creativityScore || 0,
        depthScore: evaluation.depthScore || 0,
        coherenceScore: evaluation.coherenceScore || 0,
        timeEfficiencyScore: evaluation.timeEfficiencyScore || 50,
        feedback: evaluation.feedback || 'Response evaluated.',
        strengths: evaluation.strengths || [],
        improvements: evaluation.improvements || [],
        cognitiveLoadIndicators: {
          processingSpeed: evaluation.cognitiveLoadIndicators?.processingSpeed || 50,
          mentalEffort: evaluation.cognitiveLoadIndicators?.mentalEffort || 50,
          cognitiveStrain: evaluation.cognitiveLoadIndicators?.cognitiveStrain || 50
        }
      };
    } catch (error) {
      console.error('Gemini evaluation error:', error);
      return this.getFallbackEvaluation(response, timeSpent, question.timeLimit);
    }
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
