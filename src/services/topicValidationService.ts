// Topic validation service to ensure user queries are relevant to assigned research topics

export interface TopicValidationResult {
  isRelevant: boolean;
  confidence: number;
  reason?: string;
}

// Keywords and related terms for different research topics
const topicKeywords: Record<string, string[]> = {
  "Climate Change": [
    "climate", "global warming", "greenhouse gas", "carbon", "emission", "temperature", 
    "weather", "environment", "pollution", "renewable energy", "fossil fuel", "sustainability",
    "carbon dioxide", "methane", "ozone", "deforestation", "ice caps", "sea level", "biodiversity"
  ],
  "Artificial Intelligence": [
    "artificial intelligence", "machine learning", "neural network", "deep learning", "algorithm",
    "automation", "robotics", "natural language processing", "computer vision", "data science",
    "ai", "ml", "nlp", "chatbot", "llm", "gpt", "model", "training", "prediction", "classification"
  ],
  "Space Exploration": [
    "space", "astronomy", "planet", "solar system", "galaxy", "universe", "rocket", "satellite",
    "mars", "moon", "nasa", "spacex", "astronaut", "telescope", "orbit", "cosmic", "stellar",
    "interstellar", "spacecraft", "mission", "exploration", "iss", "international space station"
  ],
  "Renewable Energy": [
    "renewable energy", "solar", "wind", "hydroelectric", "geothermal", "biomass", "energy storage",
    "battery", "grid", "power", "electricity", "turbine", "panel", "sustainable", "clean energy",
    "fossil fuel alternative", "carbon neutral", "energy efficiency", "smart grid"
  ],
  "Cybersecurity": [
    "cybersecurity", "security", "hacking", "malware", "virus", "firewall", "encryption",
    "data protection", "privacy", "breach", "vulnerability", "threat", "attack", "phishing",
    "ransomware", "authentication", "authorization", "network security", "cyber attack"
  ],
  "Quantum Computing": [
    "quantum", "qubit", "superposition", "entanglement", "quantum computer", "quantum algorithm",
    "quantum mechanics", "quantum physics", "quantum gate", "quantum circuit", "decoherence",
    "quantum supremacy", "quantum advantage", "quantum cryptography", "quantum simulation"
  ]
};

// Function to generate keywords for custom topics
const generateTopicKeywords = (topic: string): string[] => {
  const commonResearchTerms = [
    'research', 'study', 'analysis', 'data', 'findings', 'results',
    'applications', 'benefits', 'challenges', 'methods', 'approach',
    'development', 'technology', 'innovation', 'trends', 'future',
    'theory', 'practice', 'implementation', 'impact', 'effect'
  ];

  // Split topic into words and create variations
  const topicWords = topic.toLowerCase().split(/\s+/);
  const variations = [];

  for (const word of topicWords) {
    if (word.length > 2) { // Skip very short words
      variations.push(word);
      // Add plural forms
      if (!word.endsWith('s')) {
        variations.push(word + 's');
      }
      // Add common suffixes
      variations.push(word + 'ing');
      if (!word.endsWith('e')) {
        variations.push(word + 'ed');
      } else {
        variations.push(word + 'd');
      }
    }
  }

  return [...variations, ...commonResearchTerms];
};

export class TopicValidationService {
  private static instance: TopicValidationService;

  static getInstance(): TopicValidationService {
    if (!TopicValidationService.instance) {
      TopicValidationService.instance = new TopicValidationService();
    }
    return TopicValidationService.instance;
  }

  /**
   * Validates if a user query is relevant to the assigned research topic
   */
  validateQuery(query: string, researchTopic: string): TopicValidationResult {
    if (!query || query.trim().length === 0) {
      return {
        isRelevant: false,
        confidence: 0,
        reason: "Please enter a valid query."
      };
    }

    const normalizedQuery = query.toLowerCase().trim();
    
    // Handle basic greetings
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
    const isBasicGreeting = greetings.some(greeting => 
      normalizedQuery === greeting || normalizedQuery.startsWith(greeting + ' ')
    ) && normalizedQuery.split(' ').length <= 3;
    
    if (isBasicGreeting) {
      return { 
        isRelevant: true, 
        confidence: 0.8, 
        reason: 'Greeting message' 
      };
    }

    // Get keywords for the topic (predefined or generated)
    let keywords = topicKeywords[researchTopic];
    if (!keywords) {
      // Generate keywords for custom topics
      keywords = generateTopicKeywords(researchTopic);
    }

    // Check for exact topic match
    if (normalizedQuery.includes(researchTopic.toLowerCase())) {
      return {
        isRelevant: true,
        confidence: 1.0,
        reason: 'Query directly mentions the research topic'
      };
    }

    // Check for keyword matches
    let matchCount = 0;
    const matchedKeywords: string[] = [];

    for (const keyword of keywords) {
      if (normalizedQuery.includes(keyword.toLowerCase())) {
        matchCount++;
        matchedKeywords.push(keyword);
      }
    }

    const confidence = keywords.length > 0 ? Math.min((matchCount / keywords.length) * 2, 1.0) : 0;
    const isRelevant = matchCount > 0 || confidence > 0.3;

    if (!isRelevant) {
      return {
        isRelevant: false,
        confidence: 0,
        reason: `Your query doesn't seem related to your assigned research topic: "${researchTopic}". Please ask questions specifically about ${researchTopic}.`
      };
    }

    return {
      isRelevant: true,
      confidence: Math.max(confidence, 0.5),
      reason: matchedKeywords.length > 0 ? `Matched keywords: ${matchedKeywords.slice(0, 3).join(', ')}` : 'General research relevance'
    };
  }

  /**
   * Get suggested questions for a research topic
   */
  getSuggestedQuestions(researchTopic: string): string[] {
    const suggestions: Record<string, string[]> = {
      "Climate Change": [
        "What are the main causes of climate change?",
        "How do greenhouse gases affect global temperature?",
        "What are the impacts of climate change on biodiversity?",
        "What renewable energy solutions can help reduce emissions?"
      ],
      "Artificial Intelligence": [
        "How do neural networks learn from data?",
        "What are the ethical implications of AI?",
        "How is machine learning used in healthcare?",
        "What are the limitations of current AI systems?"
      ],
      "Space Exploration": [
        "What are the challenges of human missions to Mars?",
        "How do rockets escape Earth's gravity?",
        "What have we learned from the James Webb Space Telescope?",
        "How do satellites help us study Earth?"
      ],
      "Renewable Energy": [
        "How efficient are modern solar panels?",
        "What are the challenges of wind energy storage?",
        "How do smart grids improve energy distribution?",
        "What role does hydroelectric power play in renewable energy?"
      ],
      "Cybersecurity": [
        "How do firewalls protect networks?",
        "What are the most common types of cyber attacks?",
        "How does encryption secure data transmission?",
        "What are best practices for password security?"
      ],
      "Quantum Computing": [
        "How do qubits differ from classical bits?",
        "What problems can quantum computers solve faster?",
        "How does quantum entanglement work?",
        "What are the challenges in building quantum computers?"
      ]
    };

    // Return predefined suggestions if available
    if (suggestions[researchTopic]) {
      return suggestions[researchTopic];
    }

    // Generate suggestions for custom topics
    return [
      `What is ${researchTopic} and why is it important?`,
      `What are the main challenges in ${researchTopic}?`,
      `What are recent developments in ${researchTopic}?`,
      `How does ${researchTopic} impact society?`,
      `What are the future prospects of ${researchTopic}?`,
      `What methods are used to study ${researchTopic}?`
    ];
  }

  /**
   * Generate a contextual system prompt for LLM
   */
  generateSystemPrompt(researchTopic: string): string {
    return `You are a research assistant specialized in ${researchTopic}. 
    - Only answer questions related to ${researchTopic}
    - Provide detailed, accurate, and up-to-date information
    - If asked about unrelated topics, politely redirect to ${researchTopic}
    - Use academic language but keep explanations accessible
    - Include relevant examples and current research when possible`;
  }

  /**
   * Check if the query is trying to change topics inappropriately
   */
  isTopicChangingAttempt(query: string, currentTopic: string): boolean {
    const otherTopics = Object.keys(topicKeywords).filter(topic => topic !== currentTopic);
    
    for (const topic of otherTopics) {
      if (query.toLowerCase().includes(topic.toLowerCase())) {
        const keywords = topicKeywords[topic] || [];
        let matchCount = 0;
        
        for (const keyword of keywords) {
          if (query.toLowerCase().includes(keyword.toLowerCase())) {
            matchCount++;
          }
        }
        
        // If there are multiple matches with another topic, it's likely topic changing
        if (matchCount >= 2) {
          return true;
        }
      }
    }
    
    return false;
  }
}

export const topicValidator = TopicValidationService.getInstance();