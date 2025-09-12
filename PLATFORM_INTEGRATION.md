# Platform Integration Documentation

## Overview

The Cognitive Load Analysis platform now supports three distinct research interfaces:

1. **ChatGPT Interface** - AI-powered research assistant with direct Q&A
2. **Grok Interface** - Real-time AI assistant with current knowledge and trends
3. **Google Search Interface** - Traditional web search with enhanced analytics

## Features

### Platform Selection
- Users can choose between ChatGPT, Grok, and Google Search before starting research
- Platform selection affects the entire research experience
- Real-time switching between platforms is not supported (session-based)

### ChatGPT Interface
- **Direct Q&A**: Users ask questions directly to AI assistant
- **Context Awareness**: AI understands the research topic and provides relevant responses
- **Conversation History**: Maintains chat history throughout the session
- **API Integration**: Uses OpenAI's ChatGPT API for real responses
- **Fallback System**: Simulated responses if API is unavailable

### Grok Interface
- **Real-time Knowledge**: Access to current information and trends
- **Current Events Awareness**: Up-to-date information about recent developments
- **Trend Analysis**: Insights into emerging patterns and changes
- **Multi-modal Understanding**: Advanced comprehension of complex topics
- **API Integration**: Uses xAI's Grok API for real responses
- **Real-time Features**: Quick access to latest developments and comparisons

### Google Search Interface
- **Real Google Integration**: Direct links to actual Google search results
- **Search Analytics**: Tracks user search behavior and patterns
- **Result Categorization**: Academic, web, video, and news results
- **Behavior Tracking**: Monitors clicks, time spent, scroll depth
- **Search History**: Maintains recent searches for quick access

## Technical Implementation

### Services

#### ChatGPT Service (`src/services/chatgptService.ts`)
```typescript
// Initialize service
const chatGPTService = new ChatGPTService(apiKey);

// Send message
const response = await chatGPTService.sendMessage(
  userMessage,
  researchTopic,
  conversationHistory
);

// Get suggested questions
const questions = await chatGPTService.getSuggestedQuestions(topic);

// Analyze query complexity
const analysis = await chatGPTService.analyzeQueryComplexity(query, topic);
```

#### Grok Service (`src/services/grokService.ts`)
```typescript
// Initialize service
const grokService = new GrokService(apiKey);

// Send message
const response = await grokService.sendMessage(
  userMessage,
  researchTopic,
  conversationHistory
);

// Get real-time information
const realTimeInfo = await grokService.getRealTimeInfo(topic);

// Compare aspects
const comparison = await grokService.compareAspects(topic, ['aspect1', 'aspect2']);

// Get suggested questions
const questions = await grokService.getSuggestedQuestions(topic);
```

#### Analytics Service (`src/services/analyticsService.ts`)
```typescript
// Start tracking session
const sessionId = analyticsService.startSession(
  participantId,
  platform,
  topic
);

// Track search behavior
analyticsService.trackSearchBehavior(sessionId, {
  query: "search term",
  clickedResults: ["result1", "result2"],
  timeSpent: 5000,
  scrollDepth: 75,
  searchType: "google",
  resultCount: 10,
  sessionDuration: 300000
});

// Track user interactions
analyticsService.trackUserInteraction(
  sessionId,
  "click",
  "https://example.com",
  { resultId: "123", relevance: 95 }
);

// End session
const sessionData = analyticsService.endSession(sessionId, 100);
```

### Components

#### Platform Selection (`src/components/PlatformSelection.tsx`)
- Displays platform options with feature comparisons
- Handles platform selection and setup
- Shows loading state during initialization

#### ChatGPT Interface (`src/components/ChatGPTInterface.tsx`)
- Real-time chat interface
- Message history with timestamps
- Loading states and error handling
- Quick suggestion buttons

#### Grok Interface (`src/components/GrokInterface.tsx`)
- Real-time chat interface with Grok branding
- Real-time knowledge indicators
- Quick action buttons for real-time info
- Current events and trend analysis features

#### Google Search Interface (`src/components/GoogleSearchInterface.tsx`)
- Search input with suggestions
- Result display with categorization
- Direct Google search integration
- Behavior tracking integration

## Data Collection

### Search Behavior Data
- Query terms and frequency
- Clicked results and relevance
- Time spent on searches
- Scroll depth and interaction patterns
- Session duration and completion rates

### User Interaction Data
- Click events on search results
- Scroll behavior
- Hover patterns
- Copy and bookmark actions

### Cognitive Load Data
- EEG data integration ready
- EDA (Electrodermal Activity) data ready
- Self-reported load scales
- Task complexity assessments

## API Configuration

### ChatGPT API Setup
1. Obtain OpenAI API key
2. Set environment variable: `REACT_APP_OPENAI_API_KEY`
3. Configure API parameters in `chatgptService.ts`

```bash
# .env file
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

### Grok API Setup
1. Obtain xAI Grok API key
2. Set environment variable: `REACT_APP_GROK_API_KEY`
3. Configure API parameters in `grokService.ts`

```bash
# .env file
REACT_APP_GROK_API_KEY=your_grok_api_key_here
```

### Google Search Integration
- Uses direct Google search URLs
- No API key required for basic search
- Custom search engine can be configured for enhanced results

## Usage Flow

1. **Participant Login**: User logs into the system
2. **Platform Selection**: User chooses between ChatGPT, Grok, or Google Search
3. **Research Phase**: User conducts research using selected platform
4. **Data Collection**: System tracks behavior and interactions
5. **Creativity Test**: User completes creativity assessment
6. **Session Complete**: Data is compiled and analyzed

## Future Enhancements

### EEG/EDA Integration
- Real-time EEG data streaming
- EDA sensor integration
- Cognitive load correlation analysis
- Biometric feedback loops

### Advanced Analytics
- Machine learning models for behavior prediction
- Cognitive load pattern recognition
- Search efficiency optimization
- Personalized research recommendations

### Platform Extensions
- Additional AI assistants (Claude, Gemini, Perplexity)
- Academic database integration (PubMed, IEEE)
- Social media research tools
- Collaborative research features

## Troubleshooting

### ChatGPT API Issues
- Check API key configuration
- Verify network connectivity
- Monitor API rate limits
- Check error logs for details

### Grok API Issues
- Check API key configuration
- Verify xAI API access
- Monitor API rate limits
- Check error logs for details

### Analytics Tracking Issues
- Verify session initialization
- Check browser console for errors
- Ensure proper data format
- Validate session IDs

### Platform Selection Issues
- Clear browser cache
- Restart application
- Check component imports
- Verify participant data

## Security Considerations

- API keys are stored in environment variables
- User data is anonymized for analysis
- HTTPS required for production deployment
- Regular security audits recommended

## Performance Optimization

- Lazy loading of platform components
- Debounced search inputs
- Efficient data structures for analytics
- Optimized API calls with caching
