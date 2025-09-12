import { CreativityTest, Participant, ResearchTopic } from '../types';

export const mockParticipants: Participant[] = [
  {
    id: 'p001',
    name: 'Alice Johnson',
    email: 'alice.j@university.edu',
    assignedPlatform: 'chatgpt',
    currentPhase: 'research',
    sessionStart: new Date(Date.now() - 1800000), // 30 minutes ago
    researchTopic: 'Climate Change Solutions',
    cognitiveLoadScore: 65,
    creativityScore: 82,
    isActive: true
  },
  {
    id: 'p002', 
    name: 'Bob Chen',
    email: 'bob.c@university.edu',
    assignedPlatform: 'grok',
    currentPhase: 'creativity_test',
    sessionStart: new Date(Date.now() - 2400000), // 40 minutes ago
    researchTopic: 'Renewable Energy Innovation',
    cognitiveLoadScore: 78,
    creativityScore: 74,
    isActive: true
  },
  {
    id: 'p003',
    name: 'Carol Davis',
    email: 'carol.d@university.edu', 
    assignedPlatform: 'google',
    currentPhase: 'completed',
    sessionStart: new Date(Date.now() - 3600000), // 1 hour ago
    researchTopic: 'Sustainable Transportation',
    cognitiveLoadScore: 58,
    creativityScore: 89,
    isActive: false
  },
  {
    id: 'p004',
    name: 'David Wilson',
    email: 'david.w@university.edu',
    assignedPlatform: 'grok',
    currentPhase: 'research',
    sessionStart: new Date(Date.now() - 900000), // 15 minutes ago  
    researchTopic: 'Future of Work',
    cognitiveLoadScore: 72,
    creativityScore: 76,
    isActive: true
  }
];

export const creativityTests: CreativityTest[] = [
  {
    id: 'ct001',
    question: 'List as many unusual uses for a paperclip as you can think of in 5 minutes.',
    type: 'fluency',
    timeLimit: 300,
    maxScore: 100
  },
  {
    id: 'ct002', 
    question: 'Design a completely new transportation system for your city. Describe its key features and benefits.',
    type: 'originality',
    timeLimit: 600,
    maxScore: 100
  },
  {
    id: 'ct003',
    question: 'What would happen if gravity was 50% weaker? List all the consequences you can imagine.',
    type: 'divergent', 
    timeLimit: 480,
    maxScore: 100
  },
  {
    id: 'ct004',
    question: 'Create a story that connects these three unrelated items: a lighthouse, a violin, and a robot.',
    type: 'originality',
    timeLimit: 420,
    maxScore: 100
  }
];

export const researchTopics: ResearchTopic[] = [
  {
    id: 'rt001',
    title: 'Climate Change Solutions',
    description: 'Research innovative approaches to mitigate climate change impact',
    keywords: ['sustainability', 'carbon reduction', 'renewable energy'],
    difficulty: 'medium'
  },
  {
    id: 'rt002', 
    title: 'Renewable Energy Innovation',
    description: 'Explore cutting-edge renewable energy technologies',
    keywords: ['solar', 'wind', 'hydroelectric', 'innovation'],
    difficulty: 'hard'
  },
  {
    id: 'rt003',
    title: 'Sustainable Transportation',
    description: 'Investigate eco-friendly transportation solutions',
    keywords: ['electric vehicles', 'public transit', 'urban planning'],
    difficulty: 'medium'
  },
  {
    id: 'rt004',
    title: 'Future of Work',
    description: 'Analyze how technology is changing the workplace',
    keywords: ['automation', 'remote work', 'AI', 'employment'],
    difficulty: 'easy'
  }
];