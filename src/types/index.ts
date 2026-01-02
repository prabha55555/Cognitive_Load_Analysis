// Core data types for the Cognitive Load Research Platform

export interface Participant {
  id: string;
  name: string;
  email: string;
  assignedPlatform: 'chatgpt' | 'google';
  currentPhase: 'login' | 'research' | 'assessment' | 'results' | 'creativity_test' | 'completed';
  sessionStart: Date;
  researchTopic: string;
  cognitiveLoadScore: number;
  creativityScore: number;
  isActive: boolean;
  assessmentResponses?: AssessmentResponse[];
  cognitiveLoadMetrics?: CognitiveLoadMetrics;
  // Behavioral tracking session ID for cognitive load classification
  behavioralSessionId?: string;
  // Selected platform during research phase (may differ from assignedPlatform)
  selectedPlatform?: 'chatgpt' | 'google';
}

export interface BehavioralData {
  participantId: string;
  timestamp: number;
  cognitiveLoad: number; // 0-100 scale
  confidence: number; // 0-1 scale
  engagement: number;
  features?: {
    meanResponseTime: number;
    rageClickCount: number;
    trajectoryDeviation: number;
    revisitRatio: number;
  };
}

export interface CreativityTest {
  id: string;
  question: string;
  type: 'divergent' | 'originality' | 'fluency';
  timeLimit: number; // in seconds
  maxScore: number;
}

export interface TestResponse {
  participantId: string;
  testId: string;
  response: string;
  timestamp: number;
  score: number;
}

export interface ExperimentSession {
  id: string;
  participantId: string;
  platform: 'chatgpt' | 'google';
  topic: string;
  startTime: Date;
  endTime?: Date;
  searchQueries: string[];
  timeSpent: number;
  behavioralData: BehavioralData[];
}

export interface ResearchTopic {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

// Cognitive Load Measurement Types
export interface LearningPhaseData {
  participantId: string;
  topic: string;
  startTime: Date;
  endTime?: Date;
  totalLearningTime: number; // in seconds
  chatbotInteractions: number;
  questionsViewed: string[];
  clarificationsAsked: string[];
  interactionTimestamps: Date[];
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'descriptive' | 'short-answer';
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedTimeSeconds: number;
  options?: string[]; // For multiple choice
  correctAnswer?: string;
  points: number;
}

export interface AssessmentResponse {
  participantId: string;
  questionId: string;
  startTime: Date;
  endTime?: Date;
  timeTaken: number; // in seconds
  answer: string;
  isCorrect?: boolean;
  confidenceLevel?: number; // 1-5 scale
  score: number;
  // Additional fields for better cognitive load calculation
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
  earnedPoints?: number;
}

export interface CognitiveLoadMetrics {
  participantId: string;
  topic: string;
  learningPhase: {
    totalTime: number;
    interactionCount: number;
    averageInteractionTime: number;
    clarificationRequests: number;
  };
  assessmentPhase: {
    totalTime: number;
    averageTimePerQuestion: number;
    questionsAnswered: number;
    descriptiveQuestionsTime: number;
    totalScore: number;
    accuracy: number; // percentage
  };
  overallCognitiveLoad: number; // 0-100 scale
  cognitiveLoadCategory: 'Low' | 'Moderate' | 'High' | 'Very High';
  timestamp: Date;
}

export interface QuestionAndAnswer {
  id: string;
  topic: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}