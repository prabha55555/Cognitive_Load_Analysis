import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

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
   * Generate creativity questions based on topic
   */
  async generateCreativityQuestions(
    topic: string,
    notes: string
  ): Promise<CreativityQuestion[]> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
      console.log('Generating creativity questions with Gemini...');
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
      console.log('Evaluating response with Gemini...');
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
  }
};
