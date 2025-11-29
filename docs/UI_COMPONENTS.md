# UI Components Documentation

This document provides detailed documentation for all UI components in the Cognitive Load Analysis Platform.

---

## Component Overview

```
src/components/
├── LandingPage.tsx          # Entry point / study introduction
├── Login.tsx                # User authentication
├── PlatformSelection.tsx    # Research platform choice
├── ParticipantDashboard.tsx # Main participant orchestrator
├── ResearchInterface.tsx    # Research phase container
├── ChatGPTInterface.tsx     # AI chatbot UI
├── GoogleSearchInterface.tsx # Search tracking UI
├── AssessmentPhase.tsx      # Quiz/assessment UI
├── CognitiveLoadResults.tsx # Results display
├── CreativityTest.tsx       # Creativity assessment UI
├── AdminDashboard.tsx       # Admin analytics panel
├── EEGVisualization.tsx     # EEG data charts
└── ApiKeyStatus.tsx         # API configuration display
```

---

## LandingPage

**File:** `src/components/LandingPage.tsx`

### Purpose
Introduces the EEG Research Platform and encourages users to join the study.

### Props
```typescript
interface LandingPageProps {
  onJoinStudy: () => void;  // Callback when user clicks join
}
```

### Key Features
| Feature | Implementation |
|---------|----------------|
| Animated background | CSS gradients with `animate-pulse` |
| Pulse effect | `useState` + `setInterval` every 4 seconds |
| Step indicators | Array of step objects with icons |
| Responsive design | Tailwind breakpoints (sm, lg, xl) |

### UI Elements
- **Header:** Logo, title, live study indicator
- **Hero Section:** Main CTA with animated brain icon
- **Steps Section:** 5-step process visualization
- **Features Grid:** Study benefits cards

### Styling
```css
/* Background animations */
.animate-pulse { animation: pulse 2s infinite; }

/* Gradient backgrounds */
bg-gradient-to-br from-slate-50 via-white to-blue-50/30

/* Glass morphism effect */
backdrop-blur-sm bg-white/80
```

---

## Login

**File:** `src/components/Login.tsx`

### Purpose
Handles user authentication and role selection.

### Props
```typescript
interface LoginProps {
  onLogin: (email: string, name: string, userType: 'participant' | 'admin') => void;
}
```

### State
```typescript
const [email, setEmail] = useState('');
const [name, setName] = useState('');
const [userType, setUserType] = useState<'participant' | 'admin'>('participant');
```

### Form Validation
- Email: Required, valid email format
- Name: Required, minimum length
- Role: Radio button selection

### UI Elements
- **Form Card:** Centered with shadow and rounded corners
- **Input Fields:** Styled with focus states
- **Role Selector:** Radio buttons with icons
- **Submit Button:** Gradient background with hover effects

---

## PlatformSelection

**File:** `src/components/PlatformSelection.tsx`

### Purpose
Allows participants to choose between ChatGPT or Google Search for research.

### Props
```typescript
interface PlatformSelectionProps {
  participant: Participant;
  onPlatformSelect: (platform: 'chatgpt' | 'google') => void;
}
```

### State
```typescript
const [selectedPlatform, setSelectedPlatform] = useState<'chatgpt' | 'google' | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [showApiStatus, setShowApiStatus] = useState(false);
```

### Platform Cards
| Platform | Icon | Color | Description |
|----------|------|-------|-------------|
| ChatGPT | `MessageSquare` | Emerald | AI-powered assistant |
| Google | `Search` | Blue | Traditional search |

### Loading State
- Shows spinner animation
- Platform setup message
- 1.5 second simulated delay

### API Availability Check
```typescript
const geminiAvailable = isApiKeyAvailable('gemini');
```

---

## ParticipantDashboard

**File:** `src/components/ParticipantDashboard.tsx`

### Purpose
Main orchestrator component that manages participant state and renders the current phase.

### Props
```typescript
interface ParticipantDashboardProps {
  participant: Participant;
  onPhaseComplete: (phase: string) => void;
}
```

### State
```typescript
const [participant, setParticipant] = useState<Participant>(initialParticipant);
const [assessmentResponses, setAssessmentResponses] = useState<AssessmentResponse[]>();
const [creativityEvaluations, setCreativityEvaluations] = useState<CreativityEvaluation[]>([]);
const [readingContent, setReadingContent] = useState<string>('');
const [userNotes, setUserNotes] = useState<string>('');
```

### Phase Rendering
```typescript
const renderCurrentPhase = () => {
  switch (participant.currentPhase) {
    case 'research':
      return <ResearchInterface ... />;
    case 'assessment':
      return <AssessmentPhase ... />;
    case 'results':
      return <CognitiveLoadResults ... />;
    case 'creativity_test':
      return <CreativityTest ... />;
    case 'completed':
      return <CompletedView ... />;
  }
};
```

### Event Handlers
| Handler | Purpose |
|---------|---------|
| `handleCreativityComplete` | Processes creativity scores, transitions phase |
| `handleAssessmentComplete` | Saves assessment responses |
| `handleResultsComplete` | Saves cognitive load score |
| `handleTopicChange` | Updates research topic |

### Header Display
- Participant name and email
- Current phase badge with icon
- Assigned platform indicator
- Session duration timer
- EEG visualization (simulated)

---

## ResearchInterface

**File:** `src/components/ResearchInterface.tsx`

### Purpose
Container for the research phase with timer and platform interface.

### Props
```typescript
interface ResearchInterfaceProps {
  participant: Participant;
  onComplete: (readingContent?: string, userNotes?: string) => void;
  onTopicChange?: (topic: string) => void;
}
```

### State
```typescript
const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
const [queries, setQueries] = useState<string[]>([]);
const [notes, setNotes] = useState('');
const [isActive, setIsActive] = useState(true);
const [selectedPlatform, setSelectedPlatform] = useState<'chatgpt' | 'google' | null>(null);
```

### Timer Logic
```typescript
useEffect(() => {
  if (timeLeft > 0 && isActive && selectedPlatform) {
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  } else if (timeLeft === 0) {
    handleTimeUp();
  }
}, [timeLeft, isActive, selectedPlatform]);
```

### UI Layout
```
┌─────────────────────────────────────────┐
│ Header: Topic, Platform, Timer          │
├─────────────────────────────────────────┤
│                                         │
│   ChatGPTInterface / GoogleSearch       │
│   (Main research area)                  │
│                                         │
├─────────────────────────────────────────┤
│ Stats: Queries, Time remaining          │
└─────────────────────────────────────────┘
```

---

## ChatGPTInterface

**File:** `src/components/ChatGPTInterface.tsx`

### Purpose
AI chatbot interface with streaming responses and topic validation.

### Props
```typescript
interface ChatGPTInterfaceProps {
  participant: Participant;
  onQuerySubmit: (query: string, analytics?: any) => void;
  onTopicChange?: (topic: string) => void;
}
```

### State
```typescript
const [currentInput, setCurrentInput] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [messages, setMessages] = useState<Message[]>([]);
const [isCustomTopicMode, setIsCustomTopicMode] = useState(false);
const [currentActiveTopic, setCurrentActiveTopic] = useState(participant.researchTopic);
```

### Message Structure
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  queryType?: 'research' | 'clarification' | 'analysis' | 'synthesis';
  relevanceScore?: number;
  isStreaming?: boolean;
}
```

### Streaming Implementation
```typescript
// Uses refs for smooth streaming without re-renders
const streamingMessageRef = useRef<HTMLDivElement | null>(null);
const streamingContentRef = useRef<HTMLDivElement | null>(null);

// Direct DOM manipulation for performance
streamingContentRef.current.textContent += chunk.text;
```

### UI Elements
| Element | Description |
|---------|-------------|
| Message List | Scrollable chat history |
| Input Area | Text input with send button |
| Topic Badge | Current research topic display |
| Typing Indicator | Shows when AI is responding |
| Quick Suggestions | Pre-made topic-relevant questions |

### Custom Topic Feature
- Toggle button to enable custom topic mode
- Input field for new topic
- Validation before topic change
- Updates initial message dynamically

---

## AssessmentPhase

**File:** `src/components/AssessmentPhase.tsx`

### Purpose
Displays AI-generated questions and tracks responses.

### Props
```typescript
interface AssessmentPhaseProps {
  participant: Participant;
  onComplete: (responses: AssessmentResponse[]) => void;
  readingContent?: string;
  userNotes?: string;
}
```

### State
```typescript
const [questions, setQuestions] = useState<GeminiAssessmentQuestion[]>([]);
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
const [responses, setResponses] = useState<AssessmentResponse[]>([]);
const [selectedAnswer, setSelectedAnswer] = useState<string>('');
const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
const [timeElapsed, setTimeElapsed] = useState(0);
const [isLoading, setIsLoading] = useState(true);
```

### Question Loading
```typescript
useEffect(() => {
  const loadQuestions = async () => {
    const generatedQuestions = await geminiService.generateAssessmentQuestions(
      researchTopic,
      "", // Notes not used
      5   // Number of questions
    );
    setQuestions(generatedQuestions);
  };
  loadQuestions();
}, [researchTopic]);
```

### UI Layout
```
┌─────────────────────────────────────────┐
│ Progress: Question X of Y              │
├─────────────────────────────────────────┤
│                                         │
│ Question Text                           │
│                                         │
│ ○ Option A                              │
│ ○ Option B                              │
│ ○ Option C                              │
│ ○ Option D                              │
│                                         │
├─────────────────────────────────────────┤
│ Timer | [Submit Button]                 │
└─────────────────────────────────────────┘
```

### Answer Handling
```typescript
const handleSubmit = () => {
  const response: AssessmentResponse = {
    participantId: participant.id,
    questionId: currentQuestion.id,
    startTime: questionStartTime,
    endTime: new Date(),
    timeTaken: timeElapsed,
    answer: selectedAnswer,
    isCorrect: selectedAnswer === currentQuestion.correctAnswer,
    score: calculateScore(),
    // ...
  };
  setResponses([...responses, response]);
};
```

---

## CognitiveLoadResults

**File:** `src/components/CognitiveLoadResults.tsx`

### Purpose
Displays cognitive load metrics and recommendations.

### Props
```typescript
interface CognitiveLoadResultsProps {
  assessmentResponses: AssessmentResponse[];
  creativityEvaluations?: CreativityEvaluation[];
  onComplete: (cognitiveLoadScore: number) => void;
  topic?: string;
  participantId?: string;
}
```

### Metrics Calculation
```typescript
const metrics: CognitiveLoadMetrics = cognitiveLoadService.calculateCognitiveLoad(
  learningData,
  assessmentResponses
);
```

### UI Elements
| Element | Description |
|---------|-------------|
| Score Circle | Large circular progress indicator |
| Category Badge | Low/Moderate/High/Very High label |
| Metrics Grid | Individual metric cards |
| Recommendations | Actionable suggestions list |
| Continue Button | Advances to creativity test |

### Color Coding
```typescript
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Low': return 'from-green-500 to-emerald-600';
    case 'Moderate': return 'from-blue-500 to-indigo-600';
    case 'High': return 'from-orange-500 to-red-500';
    case 'Very High': return 'from-red-500 to-pink-600';
  }
};
```

---

## CreativityTest

**File:** `src/components/CreativityTest.tsx`

### Purpose
Administers creativity challenges and collects responses for AI evaluation.

### Props
```typescript
interface CreativityTestProps {
  topic: string;
  notes: string;
  participantId: string;
  onComplete: (responses: TestResponse[], evaluations: CreativityEvaluation[]) => void;
}
```

### State
```typescript
const [questions, setQuestions] = useState<CreativityQuestion[]>([]);
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
const [response, setResponse] = useState('');
const [timeLeft, setTimeLeft] = useState(0);
const [responses, setResponses] = useState<TestResponse[]>([]);
const [evaluations, setEvaluations] = useState<CreativityEvaluation[]>([]);
const [isEvaluating, setIsEvaluating] = useState(false);
```

### Question Types Display
| Type | Icon | Color | Badge Text |
|------|------|-------|------------|
| Fluency | `Zap` | Blue | "Generate Ideas" |
| Originality | `Lightbulb` | Purple | "Be Original" |
| Divergent | `Target` | Orange | "Think Different" |

### UI Layout
```
┌─────────────────────────────────────────┐
│ Question Type Badge | Timer             │
├─────────────────────────────────────────┤
│                                         │
│ Creativity Question                     │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │ Text Area for Response              │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│ Word Count | [Submit Button]            │
└─────────────────────────────────────────┘
```

### Evaluation Display
After submission, shows:
- Overall score (0-100)
- Individual criteria scores
- Strengths list
- Improvement suggestions
- Cognitive load indicators

---

## AdminDashboard

**File:** `src/components/AdminDashboard.tsx`

### Purpose
Administrative interface for managing participants and viewing analytics.

### State
```typescript
const [showSettings, setShowSettings] = useState(false);
const [dashboardData, setDashboardData] = useState<DashboardAnalytics | null>(null);
const [participants, setParticipants] = useState<Participant[]>(mockParticipants);
const [topicSelectionMode, setTopicSelectionMode] = useState<'random' | 'custom'>('random');
```

### Dashboard Analytics
```typescript
interface DashboardAnalytics {
  overview: {
    totalParticipants: number;
    activeSessions: number;
    avgCognitiveLoad: number;
    avgCreativity: number;
  };
  platformComparison: Array<{
    platform: string;
    participantCount: number;
    avgCognitiveLoad: number;
    avgCreativity: number;
  }>;
  participantData: Array<{ x, y, platform, name, engagement }>;
}
```

### UI Sections
| Section | Components Used |
|---------|-----------------|
| Overview Cards | Stats with icons |
| Platform Comparison | `BarChart` from Recharts |
| Scatter Plot | `ScatterChart` (Cognitive Load vs Creativity) |
| Participant List | Table with status badges |
| Settings Panel | Topic configuration |

### Charts
```jsx
<ResponsiveContainer>
  <BarChart data={platformComparison}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="platform" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="avgCognitiveLoad" fill="#8884d8" />
    <Bar dataKey="avgCreativity" fill="#82ca9d" />
  </BarChart>
</ResponsiveContainer>
```

---

## EEGVisualization

**File:** `src/components/EEGVisualization.tsx`

### Purpose
Displays simulated real-time EEG data visualization.

### Data Source
Uses `useEEGStream` hook for simulated data:
```typescript
const { eegData, currentReading } = useEEGStream(participantId, isActive);
```

### Displayed Metrics
| Metric | Description | Range |
|--------|-------------|-------|
| Cognitive Load | Mental effort indicator | 0-100 |
| Theta Power | 4-8 Hz brain waves | 0-100 |
| Alpha Power | 8-13 Hz brain waves | 0-100 |
| Beta Power | 13-30 Hz brain waves | 0-100 |
| Engagement | User focus level | 0-100 |

### Visualization
- Line chart showing wave patterns
- Real-time updates (100ms intervals)
- Color-coded channel indicators
- Current value displays

---

## ApiKeyStatus

**File:** `src/components/ApiKeyStatus.tsx`

### Purpose
Displays the configuration status of all API keys.

### Checked APIs
| API | Environment Variable |
|-----|---------------------|
| Gemini (Main) | `VITE_GEMINI_API_KEY` |
| Gemini (Chat) | `VITE_GEMINI_CHAT_API_KEY` |
| Gemini (Questions) | `VITE_GEMINI_QUESTIONS_API_KEY` |
| OpenAI | `VITE_OPENAI_API_KEY` |
| Grok | `VITE_GROK_API_KEY` |
| Google Search | `VITE_GOOGLE_SEARCH_API_KEY` |

### Status Indicators
- ✅ Green: API key configured and valid
- ❌ Red: API key missing or invalid
- ⚠️ Yellow: Optional API not configured

---

## Shared UI Patterns

### Gradient Backgrounds
```css
/* Primary gradient */
bg-gradient-to-br from-blue-500 to-purple-600

/* Glass effect */
bg-white/80 backdrop-blur-sm

/* Card shadows */
shadow-xl hover:shadow-2xl transition-shadow
```

### Animation Classes
```css
/* Pulse effect */
animate-pulse

/* Spin loader */
animate-spin

/* Custom ping */
animate-ping
```

### Responsive Breakpoints
```css
/* Mobile first */
p-4        /* Base */
lg:p-6     /* Large screens */
xl:p-8     /* Extra large */
```

### Icon Usage (Lucide React)
```jsx
import { 
  Brain,      // Cognitive load
  Target,     // Assessment
  Sparkles,   // Creativity
  Clock,      // Timer
  Send,       // Submit
  AlertCircle // Warning
} from 'lucide-react';
```

---

## Component Dependencies

```
App.tsx
├── LandingPage
├── Login
└── ParticipantDashboard
    ├── ResearchInterface
    │   ├── PlatformSelection
    │   ├── ChatGPTInterface
    │   └── GoogleSearchInterface
    ├── AssessmentPhase
    ├── CognitiveLoadResults
    ├── CreativityTest
    └── EEGVisualization

AdminDashboard (standalone)
├── ApiKeyStatus
└── (Recharts components)
```

---

## Related Documentation

- [Codebase Index](./CODEBASE_INDEX.md) - Project structure
- [Application Flow](./APPLICATION_FLOW.md) - User journey
- [Architecture](../ARCHITECTURE.md) - System design
