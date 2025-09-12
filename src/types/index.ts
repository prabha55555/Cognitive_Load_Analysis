// Core data types for the EEG research platform

export interface Participant {
  id: string;
  name: string;
  email: string;
  assignedPlatform: 'chatgpt' | 'grok' | 'google';
  currentPhase: 'login' | 'research' | 'creativity_test' | 'completed';
  sessionStart: Date;
  researchTopic: string;
  cognitiveLoadScore: number;
  creativityScore: number;
  isActive: boolean;
}

export interface EEGData {
  participantId: string;
  timestamp: number;
  channels: {
    [key: string]: number; // Channel name to value mapping
  };
  cognitiveLoad: number; // 0-100 scale
  thetaPower: number;
  alphaPower: number;
  betaPower: number;
  engagement: number;
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
  platform: 'chatgpt' | 'grok' | 'google';
  topic: string;
  startTime: Date;
  endTime?: Date;
  searchQueries: string[];
  timeSpent: number;
  cognitiveLoadData: EEGData[];
}

export interface ResearchTopic {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}