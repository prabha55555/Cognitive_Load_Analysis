# Application Flow Improvements & Issue Resolution

**Last Updated**: January 8, 2026  
**Purpose**: Comprehensive analysis of current flow issues and actionable fixes

---

## Table of Contents
1. [Critical Issues](#critical-issues)
2. [High Priority Issues](#high-priority-issues)
3. [Medium Priority Issues](#medium-priority-issues)
4. [Low Priority Issues](#low-priority-issues)
5. [Implementation Priority Matrix](#implementation-priority-matrix)

---

## Issue Classification

| Priority | Severity | Impact | Examples |
|----------|----------|--------|----------|
| 🔴 **CRITICAL** | System-breaking | Data loss, security risk | No authentication, no database |
| 🟠 **HIGH** | Feature-breaking | Core functionality affected | Service failures, data inconsistency |
| 🟡 **MEDIUM** | User-impacting | Poor UX, potential bugs | Errors, confusing flows |
| 🟢 **LOW** | Polish-level | Code quality, maintainability | Logging, magic numbers |

---

## Critical Issues

### 🔴 Issue #1: No Authentication System

**Location**: [src/services/authService.ts](../src/services/authService.ts), [src/context/AuthContext.tsx](../src/context/AuthContext.tsx)

**Current State**:
```typescript
// authService.ts
export const login = async (email: string, password: string) => {
  throw new Error('Not implemented');
};

export const validateToken = async (token: string) => {
  throw new Error('Not implemented');
};
```

**Problem**:
- Anyone can access admin dashboard by selecting "Admin" role
- No password validation
- No session tokens or JWT authentication
- Email is the only "identifier" (not validated)
- Participant IDs are client-generated UUIDs (can be spoofed)

**Security Risks**:
- Unauthorized access to all research data
- Data manipulation potential
- No audit trail of who accessed what
- GDPR/privacy compliance issues

**Impact Score**: **10/10** - Complete security bypass

---

**Fix Implementation**:

**Phase 1: Basic Email/Password Auth (Quick Fix)**
```typescript
// authService.ts
import bcrypt from 'bcryptjs';

interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'participant' | 'admin';
  createdAt: Date;
}

// Store in database (see DATABASE_PLAN.md)
const users: Map<string, User> = new Map();

export const registerParticipant = async (
  email: string, 
  name: string
): Promise<{ token: string; userId: string }> => {
  // Auto-generate secure password for participants
  const tempPassword = crypto.randomUUID().slice(0, 8);
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  
  const user: User = {
    id: crypto.randomUUID(),
    email,
    passwordHash,
    role: 'participant',
    createdAt: new Date()
  };
  
  // Save to database
  await database.users.create(user);
  
  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
  
  return { token, userId: user.id };
};

export const loginAdmin = async (
  email: string, 
  password: string
): Promise<{ token: string; userId: string }> => {
  const user = await database.users.findByEmail(email);
  
  if (!user || user.role !== 'admin') {
    throw new Error('Invalid credentials');
  }
  
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }
  
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '8h' }
  );
  
  return { token, userId: user.id };
};

export const validateToken = async (token: string): Promise<User> => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: string;
    };
    
    const user = await database.users.findById(decoded.userId);
    if (!user) throw new Error('User not found');
    
    return user;
  } catch (error) {
    throw new Error('Invalid token');
  }
};
```

**Phase 2: Protected Routes**
```typescript
// src/components/ProtectedRoute.tsx
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'participant';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

// Usage in App.tsx
<Route 
  path="/admin" 
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  } 
/>
```

**Phase 3: Token Storage & Refresh**
```typescript
// AuthContext.tsx
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('auth_token')
  );
  
  useEffect(() => {
    if (token) {
      validateToken(token)
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('auth_token');
          setToken(null);
        });
    }
  }, [token]);
  
  const login = async (email: string, password: string) => {
    const { token, userId } = await authService.loginAdmin(email, password);
    localStorage.setItem('auth_token', token);
    setToken(token);
  };
  
  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Files to Modify**:
- [src/services/authService.ts](../src/services/authService.ts)
- [src/context/AuthContext.tsx](../src/context/AuthContext.tsx)
- [src/components/Login.tsx](../src/components/Login.tsx)
- [src/App.tsx](../src/App.tsx)
- [server/src/routes/auth.ts](../server/src/routes/auth.ts) (new)

**Dependencies to Install**:
```bash
npm install bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken
```

**Testing Checklist**:
- [ ] Participant auto-registration works
- [ ] Admin login with password works
- [ ] Invalid credentials are rejected
- [ ] Token expiration is enforced
- [ ] Protected routes redirect unauthorized users
- [ ] Logout clears tokens properly

---

### 🔴 Issue #2: No Data Persistence

**Location**: [src/services/dataPersistenceService.ts](../src/services/dataPersistenceService.ts)

**Current State**:
```typescript
export const saveSession = async (sessionData: SessionData): Promise<void> => {
  // TODO: Implement when backend is ready
  // Currently saves to localStorage (temporary)
  localStorage.setItem('research_sessions', JSON.stringify(sessions));
};
```

**Problem**:
- All research data stored in browser localStorage
- Data lost when:
  - User clears browser cache
  - User switches browsers
  - Browser storage quota exceeded
- No data backup or recovery
- Admin dashboard cannot access other users' data
- No cross-device session continuation

**Data at Risk**:
- Participant responses (15 min of research)
- Assessment answers
- Creativity test submissions
- Behavioral interaction events (1000s of events)
- Cognitive load metrics

**Impact Score**: **10/10** - Research data irretrievable

---

**Fix Implementation**: See [DATABASE_PLAN.md](./DATABASE_PLAN.md) for complete solution

**Quick Overview**:
1. **Immediate**: Implement server-side session storage
2. **Short-term**: Set up Supabase PostgreSQL database
3. **Long-term**: Add data export/backup mechanisms

**Temporary Fallback** (until database ready):
```typescript
// Enhanced localStorage with error handling
export const saveSession = async (sessionData: SessionData): Promise<void> => {
  try {
    // Primary: Try API
    await apiClient.post('/api/sessions', sessionData);
  } catch (apiError) {
    console.warn('API unavailable, using localStorage backup:', apiError);
    
    try {
      // Fallback: localStorage with quota check
      const sessions = getAllSessionsFromStorage();
      sessions.push(sessionData);
      
      const dataString = JSON.stringify(sessions);
      
      // Check quota (most browsers: ~5-10MB)
      if (dataString.length > 4 * 1024 * 1024) { // 4MB warning
        console.error('Storage quota warning: clearing old sessions');
        // Keep only last 10 sessions
        const recentSessions = sessions.slice(-10);
        localStorage.setItem('research_sessions', JSON.stringify(recentSessions));
      } else {
        localStorage.setItem('research_sessions', dataString);
      }
      
      // Also attempt to sync to server in background
      backgroundSync(sessionData);
      
    } catch (storageError) {
      // Last resort: Download as JSON file
      downloadAsJSON(sessionData, `session_backup_${Date.now()}.json`);
      alert('Storage full. Session data downloaded as backup file.');
    }
  }
};

// Background sync queue
const backgroundSync = (data: SessionData) => {
  const syncQueue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
  syncQueue.push({ data, timestamp: Date.now() });
  localStorage.setItem('sync_queue', JSON.stringify(syncQueue));
  
  // Retry sync every 30 seconds
  setTimeout(processSyncQueue, 30000);
};
```

**Files to Modify**:
- [src/services/dataPersistenceService.ts](../src/services/dataPersistenceService.ts)
- [server/src/routes/sessions.ts](../server/src/routes/sessions.ts) (implement endpoints)

---

### 🔴 Issue #3: Session State Lost on Refresh

**Location**: [src/context/SessionContext.tsx](../src/context/SessionContext.tsx)

**Current State**:
```typescript
// Partial localStorage persistence exists, but:
const [sessionData, setSessionData] = useState<SessionData>(() => {
  const saved = localStorage.getItem('current_session');
  return saved ? JSON.parse(saved) : defaultSessionData;
});
```

**Problem**:
- User accidentally refreshes browser during 15-min research phase
- Progress lost: all queries, notes, interaction events
- Timer resets to 0 or becomes out of sync
- User must restart entire study
- Leads to participant frustration and dropout

**Edge Cases**:
- Browser crash during research
- Network disconnection during API calls
- Accidental tab closure
- Page reload during assessment

**Impact Score**: **9/10** - Severe UX issue, data loss

---

**Fix Implementation**:

**Phase 1: Enhanced Session Persistence**
```typescript
// SessionContext.tsx
import { useEffect, useRef } from 'react';

const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionData, setSessionData] = useState<SessionData>(() => {
    return loadSessionFromStorage();
  });
  
  const autoSaveInterval = useRef<NodeJS.Timeout>();
  
  // Auto-save every 10 seconds
  useEffect(() => {
    autoSaveInterval.current = setInterval(() => {
      persistSessionToStorage(sessionData);
      
      // Also try to sync to server
      if (navigator.onLine) {
        dataPersistenceService.saveSession(sessionData).catch(console.error);
      }
    }, 10000);
    
    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, [sessionData]);
  
  // Save on any state change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      persistSessionToStorage(sessionData);
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [sessionData]);
  
  // Save before unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      persistSessionToStorage(sessionData);
      
      // Warn user if session is active
      if (sessionData.currentPhase !== 'completed') {
        e.preventDefault();
        e.returnValue = 'You have an active research session. Are you sure you want to leave?';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionData]);
  
  return (
    <SessionContext.Provider value={{ sessionData, setSessionData }}>
      {children}
    </SessionContext.Provider>
  );
};

const persistSessionToStorage = (data: SessionData) => {
  try {
    localStorage.setItem('current_session', JSON.stringify({
      ...data,
      lastSaved: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Failed to save session:', error);
  }
};

const loadSessionFromStorage = (): SessionData => {
  try {
    const saved = localStorage.getItem('current_session');
    if (!saved) return defaultSessionData;
    
    const parsed = JSON.parse(saved);
    
    // Check if session expired (24 hours)
    const lastSaved = new Date(parsed.lastSaved);
    const hoursSinceLastSave = (Date.now() - lastSaved.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastSave > 24) {
      console.warn('Session expired, starting fresh');
      return defaultSessionData;
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to load session:', error);
    return defaultSessionData;
  }
};
```

**Phase 2: Timer State Recovery**
```typescript
// src/hooks/useTimer.ts
export const useTimer = (initialSeconds: number, onComplete?: () => void) => {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    // Try to restore timer from localStorage
    const saved = localStorage.getItem('timer_state');
    if (saved) {
      const { endTime } = JSON.parse(saved);
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      return remaining;
    }
    return initialSeconds;
  });
  
  const [isRunning, setIsRunning] = useState(false);
  
  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      // Save end time to localStorage
      const endTime = Date.now() + secondsLeft * 1000;
      localStorage.setItem('timer_state', JSON.stringify({ endTime }));
      
      const interval = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            localStorage.removeItem('timer_state');
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isRunning, secondsLeft, onComplete]);
  
  return { secondsLeft, isRunning, start: () => setIsRunning(true) };
};
```

**Phase 3: Resume Session UI**
```typescript
// src/components/SessionRecovery.tsx
export const SessionRecovery: React.FC = () => {
  const { sessionData, setSessionData } = useSession();
  const [showRecovery, setShowRecovery] = useState(false);
  
  useEffect(() => {
    const saved = localStorage.getItem('current_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      const hoursSinceLastSave = (Date.now() - new Date(parsed.lastSaved).getTime()) / (1000 * 60 * 60);
      
      // Show recovery prompt if session is recent and not completed
      if (hoursSinceLastSave < 2 && parsed.currentPhase !== 'completed') {
        setShowRecovery(true);
      }
    }
  }, []);
  
  if (!showRecovery) return null;
  
  return (
    <div className="recovery-modal">
      <h2>Resume Previous Session?</h2>
      <p>We found an incomplete research session from {/* time ago */}.</p>
      <p>Phase: {sessionData.currentPhase}</p>
      <button onClick={() => {
        // Resume session
        setShowRecovery(false);
      }}>
        Resume Session
      </button>
      <button onClick={() => {
        // Start fresh
        localStorage.removeItem('current_session');
        setSessionData(defaultSessionData);
        setShowRecovery(false);
      }}>
        Start New Session
      </button>
    </div>
  );
};
```

**Files to Modify**:
- [src/context/SessionContext.tsx](../src/context/SessionContext.tsx)
- [src/hooks/useTimer.ts](../src/hooks/useTimer.ts)
- [src/components/SessionRecovery.tsx](../src/components/SessionRecovery.tsx) (new)

**Testing Checklist**:
- [ ] Refresh during research phase preserves state
- [ ] Timer continues correctly after refresh
- [ ] Interaction events are not lost
- [ ] Browser warning shown on tab close
- [ ] Old sessions expire after 24 hours
- [ ] Recovery modal offers resume option

---

## High Priority Issues

### 🟠 Issue #4: Platform Label Mismatch

**Location**: [src/components/ChatGPTInterface.tsx](../src/components/ChatGPTInterface.tsx), [src/services/geminiService.ts](../src/services/geminiService.ts)

**Current State**:
- UI displays: "ChatGPT" and "GPT-4"
- Actual backend: Google Gemini API

**Problem**:
```typescript
// ChatGPTInterface.tsx
<h2>Chat with GPT-4</h2>  {/* Misleading label */}

// geminiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
```

**Research Integrity Issues**:
- Participants may have preconceived biases about "ChatGPT"
- Results may be attributed to wrong model
- Violates informed consent principles
- Potential confusion in published research

**Impact Score**: **8/10** - Research validity concern

---

**Fix Implementation**:

**Option A: Honest Labeling** (Recommended)
```typescript
// ChatGPTInterface.tsx - Rename file to AIAssistantInterface.tsx
<div className="interface-header">
  <h2>AI Research Assistant</h2>
  <p className="model-info">Powered by Google Gemini</p>
</div>

// Update all references
// src/components/PlatformSelection.tsx
const platforms = [
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    description: 'Chat with an AI to research your topic',
    icon: '🤖'
  },
  {
    id: 'google-search',
    name: 'Google Search',
    description: 'Use traditional search to research',
    icon: '🔍'
  }
];
```

**Option B: Generic Branding**
```typescript
// If study design requires blinding
<h2>AI Chat Interface</h2>
// No specific model mentioned
```

**Option C: Switch to Actual ChatGPT API** (If needed for research validity)
```typescript
// src/services/openaiService.ts (new)
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY
});

export const sendMessage = async (
  message: string,
  conversationHistory: Message[]
): Promise<string> => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: conversationHistory,
    stream: true
  });
  
  // Stream handling
  let fullResponse = '';
  for await (const chunk of response) {
    fullResponse += chunk.choices[0]?.delta?.content || '';
  }
  
  return fullResponse;
};
```

**Files to Modify**:
- [src/components/ChatGPTInterface.tsx](../src/components/ChatGPTInterface.tsx) → Rename to `AIAssistantInterface.tsx`
- [src/components/PlatformSelection.tsx](../src/components/PlatformSelection.tsx)
- [src/types/index.ts](../src/types/index.ts) - Update platform type

**Decision Required**: Consult with research team on proper labeling

---

### 🟠 Issue #5: Behavioral Service Dependency

**Location**: [src/services/behavioralClassificationService.ts](../src/services/behavioralClassificationService.ts), `behavioral-service/`

**Current State**:
```typescript
export const classify = async (sessionId: string): Promise<ClassificationResult> => {
  try {
    const response = await fetch('http://localhost:8000/api/classify', {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    });
    return await response.json();
  } catch (error) {
    console.warn('Behavioral service unavailable, using fallback');
    return calculateLocalFallback(); // Simplified calculation
  }
};
```

**Problem**:
- FastAPI service must be running separately
- If service down: features degraded
  - No behavioral classification
  - No platform comparison
  - No ML-based cognitive load
- Docker setup required (complexity for solo dev)
- Different language stack (Python vs TypeScript)

**User Impact**:
- Inconsistent results across sessions
- Reduced accuracy when service unavailable
- Admin dashboard shows incomplete data

**Impact Score**: **7/10** - Core feature degradation

---

**Fix Implementation**:

**Option A: Embedded Lightweight Classifier** (Recommended for solo dev)
```typescript
// src/services/behavioralClassificationService.ts
import * as tf from '@tensorflow/tfjs';

// Load pre-trained TensorFlow.js model
let model: tf.LayersModel | null = null;

const loadModel = async () => {
  if (!model) {
    model = await tf.loadLayersModel('/models/cognitive-load-classifier/model.json');
  }
  return model;
};

export const classifyLocal = async (features: BehavioralFeatures): Promise<string> => {
  const model = await loadModel();
  
  // Normalize features
  const inputTensor = tf.tensor2d([[
    features.meanResponseTime / 1000,
    features.rageClickCount / 10,
    features.cursorSpeed / 100,
    // ... other normalized features
  ]]);
  
  const prediction = model.predict(inputTensor) as tf.Tensor;
  const scores = await prediction.data();
  
  const labels = ['low', 'moderate', 'high', 'very-high'];
  const maxIndex = scores.indexOf(Math.max(...scores));
  
  return labels[maxIndex];
};

export const classify = async (
  sessionId: string,
  features: BehavioralFeatures
): Promise<ClassificationResult> => {
  try {
    // Try FastAPI first
    const response = await fetch('http://localhost:8000/api/classify', {
      method: 'POST',
      body: JSON.stringify({ sessionId, features })
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('FastAPI unavailable, using local TensorFlow.js model');
  }
  
  // Fallback to local model
  const classification = await classifyLocal(features);
  return {
    cognitiveLoad: classification,
    score: mapClassificationToScore(classification),
    source: 'local-tfjs'
  };
};
```

**Option B: Containerized Service with Health Checks**
```typescript
// Add health check before attempting classification
export const checkServiceHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:8000/health', {
      method: 'GET',
      signal: AbortSignal.timeout(2000) // 2 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
};

// In component
const [serviceAvailable, setServiceAvailable] = useState(false);

useEffect(() => {
  checkServiceHealth().then(setServiceAvailable);
}, []);

// Show UI indicator
{serviceAvailable ? (
  <Badge color="green">Enhanced Analysis Available</Badge>
) : (
  <Badge color="yellow">Using Standard Analysis</Badge>
)}
```

**Option C: Cloud-Hosted Service** (Best for production)
```typescript
// Deploy FastAPI to free tier service (Railway, Render, Fly.io)
const BEHAVIORAL_API_URL = process.env.VITE_BEHAVIORAL_API_URL || 'http://localhost:8000';

// No changes needed, just environment variable
```

**Files to Modify**:
- [src/services/behavioralClassificationService.ts](../src/services/behavioralClassificationService.ts)
- [src/components/CognitiveLoadResults.tsx](../src/components/CognitiveLoadResults.tsx) - Add status indicator

**Dependencies** (if using Option A):
```bash
npm install @tensorflow/tfjs
```

**Decision Required**: Choose based on deployment strategy

---

### 🟠 Issue #6: Admin Dashboard Mock Data Fallback

**Location**: [src/components/AdminDashboard.tsx](../src/components/AdminDashboard.tsx)

**Current State**:
```typescript
useEffect(() => {
  const loadData = async () => {
    try {
      const sessions = await dataPersistenceService.getAllSessions();
      setParticipants(sessions);
    } catch (error) {
      console.error('Failed to load data, using mock:', error);
      setParticipants(mockParticipants); // Hardcoded data
    }
  };
  loadData();
}, []);
```

**Problem**:
- Dashboard shows fake data when API fails
- No clear indication to admin that data is mock
- Platform comparison stats are hardcoded:
  ```typescript
  const platformStats = {
    chatgpt: { avgLoad: 42.3, count: 12 }, // Fake numbers
    google: { avgLoad: 48.1, count: 12 }
  };
  ```
- Can lead to false conclusions in research analysis

**Impact Score**: **7/10** - Data integrity issue

---

**Fix Implementation**:

**Phase 1: Clear Status Indicators**
```typescript
// AdminDashboard.tsx
const [dataSource, setDataSource] = useState<'live' | 'mock' | 'loading'>('loading');

useEffect(() => {
  const loadData = async () => {
    try {
      const sessions = await dataPersistenceService.getAllSessions();
      
      if (sessions.length === 0) {
        // No real data yet
        setDataSource('mock');
        setParticipants(mockParticipants);
      } else {
        setDataSource('live');
        setParticipants(sessions);
      }
    } catch (error) {
      console.error('Data load failed:', error);
      setDataSource('mock');
      setParticipants(mockParticipants);
    }
  };
  
  loadData();
}, []);

// UI indicator
return (
  <div className="admin-dashboard">
    {dataSource === 'mock' && (
      <div className="warning-banner">
        ⚠️ Showing sample data - No real participant data available
      </div>
    )}
    
    {dataSource === 'live' && (
      <div className="success-banner">
        ✓ Live data - {participants.length} participants
      </div>
    )}
    
    {/* Rest of dashboard */}
  </div>
);
```

**Phase 2: Graceful Empty States**
```typescript
// Instead of mock data, show helpful empty state
const EmptyDashboard: React.FC = () => (
  <div className="empty-state">
    <h2>No Participant Data Yet</h2>
    <p>Participant data will appear here once users complete the study.</p>
    
    <div className="getting-started">
      <h3>Getting Started:</h3>
      <ol>
        <li>Share the study link with participants</li>
        <li>Ensure database is connected (see DATABASE_PLAN.md)</li>
        <li>Data will sync automatically as participants complete sessions</li>
      </ol>
    </div>
    
    <button onClick={loadMockDataForTesting}>
      Load Sample Data (Testing Only)
    </button>
  </div>
);

// Use in dashboard
{participants.length === 0 ? (
  <EmptyDashboard />
) : (
  <DashboardCharts data={participants} />
)}
```

**Phase 3: Real-Time Updates**
```typescript
// Add polling or WebSocket for live updates
useEffect(() => {
  if (dataSource === 'live') {
    const pollInterval = setInterval(async () => {
      const freshData = await dataPersistenceService.getAllSessions();
      setParticipants(freshData);
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(pollInterval);
  }
}, [dataSource]);
```

**Files to Modify**:
- [src/components/AdminDashboard.tsx](../src/components/AdminDashboard.tsx)
- [src/data/mockData.ts](../src/data/mockData.ts) - Add clear labeling

---

## Medium Priority Issues

### 🟡 Issue #7: API Keys Exposed in Frontend

**Location**: [src/services/geminiService.ts](../src/services/geminiService.ts), [.env](../.env)

**Current State**:
```typescript
// geminiService.ts
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// .env
VITE_GEMINI_API_KEY=AIzaSy... // Visible in browser network tab
```

**Problem**:
- API keys embedded in frontend bundle
- Visible in:
  - Browser DevTools → Network tab
  - Vite build output
  - Client-side JavaScript
- Can be extracted and misused
- Potential quota exhaustion or bill shock

**Risk**:
- Unauthorized API usage
- API key revocation needed if leaked
- Violates API provider terms of service

**Impact Score**: **6/10** - Security risk

---

**Fix Implementation**:

**Solution: Backend Proxy for API Calls**

```typescript
// server/src/routes/ai.ts (new)
import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

// API key stored securely in server environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

router.post('/ai/chat', async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    
    // Validate request (prevent abuse)
    if (!message || message.length > 1000) {
      return res.status(400).json({ error: 'Invalid message' });
    }
    
    // Rate limiting (see rateLimiter.ts)
    // ...
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const chat = model.startChat({
      history: conversationHistory
    });
    
    const result = await chat.sendMessageStream(message);
    
    // Stream response to client
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    for await (const chunk of result.stream) {
      const text = chunk.text();
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
    
    res.end();
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

export default router;
```

```typescript
// src/services/geminiService.ts (updated)
export const sendMessage = async (
  message: string,
  conversationHistory: Message[]
): Promise<AsyncGenerator<string>> => {
  // Call backend instead of direct API
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}` // User auth
    },
    body: JSON.stringify({ message, conversationHistory })
  });
  
  if (!response.ok) {
    throw new Error('AI service error');
  }
  
  // Stream response
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  
  async function* streamGenerator() {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          yield data.text;
        }
      }
    }
  }
  
  return streamGenerator();
};
```

**Environment Variables**:
```bash
# Frontend (.env) - REMOVE API keys
# VITE_GEMINI_API_KEY=... <-- DELETE THIS

# Backend (server/.env) - ADD API keys
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-...
JWT_SECRET=your-secret-key
```

**Additional Security**:
```typescript
// server/src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const aiChatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: 'Too many AI requests, please try again later'
});

// Apply to route
router.post('/ai/chat', aiChatLimiter, async (req, res) => { ... });
```

**Files to Modify**:
- [server/src/routes/ai.ts](../server/src/routes/ai.ts) (new)
- [src/services/geminiService.ts](../src/services/geminiService.ts)
- [server/src/index.ts](../server/src/index.ts) - Add route
- `.env` files (both frontend and backend)

**Testing Checklist**:
- [ ] API key not visible in browser network requests
- [ ] Rate limiting prevents abuse
- [ ] Streaming still works correctly
- [ ] Error handling for API failures

---

### 🟡 Issue #8: No Input Sanitization

**Location**: Multiple components ([ChatGPTInterface.tsx](../src/components/ChatGPTInterface.tsx), [GoogleSearchInterface.tsx](../src/components/GoogleSearchInterface.tsx))

**Current State**:
```typescript
// User input passed directly to AI
const handleSendMessage = async () => {
  const response = await geminiService.sendMessage(userInput);
  // userInput not sanitized
};

// Custom topic input
const handleTopicChange = (newTopic: string) => {
  setResearchTopic(newTopic); // No validation
};
```

**Problem**:
- Potential XSS vulnerabilities
- Malicious input could be stored and displayed
- No length limits on inputs
- Special characters not escaped

**Impact Score**: **5/10** - Security vulnerability

---

**Fix Implementation**:

```typescript
// src/utils/validation.ts (enhanced)
import DOMPurify from 'dompurify';

export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  // Remove dangerous HTML/script tags
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML allowed
    ALLOWED_ATTR: []
  });
  
  // Trim and limit length
  return cleaned.trim().slice(0, maxLength);
};

export const validateTopic = (topic: string): { valid: boolean; error?: string } => {
  const sanitized = sanitizeInput(topic, 200);
  
  if (sanitized.length < 3) {
    return { valid: false, error: 'Topic must be at least 3 characters' };
  }
  
  if (!/^[a-zA-Z0-9\s\-,.:]+$/.test(sanitized)) {
    return { valid: false, error: 'Topic contains invalid characters' };
  }
  
  return { valid: true };
};

export const validateMessage = (message: string): { valid: boolean; error?: string } => {
  const sanitized = sanitizeInput(message, 1000);
  
  if (sanitized.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  if (sanitized.length < 2) {
    return { valid: false, error: 'Message too short' };
  }
  
  return { valid: true };
};
```

```typescript
// Usage in ChatGPTInterface.tsx
import { sanitizeInput, validateMessage } from '../utils/validation';

const handleSendMessage = async () => {
  const cleaned = sanitizeInput(userInput);
  const validation = validateMessage(cleaned);
  
  if (!validation.valid) {
    setError(validation.error);
    return;
  }
  
  const response = await geminiService.sendMessage(cleaned);
  // ...
};
```

**Files to Modify**:
- [src/utils/validation.ts](../src/utils/validation.ts)
- [src/components/ChatGPTInterface.tsx](../src/components/ChatGPTInterface.tsx)
- [src/components/GoogleSearchInterface.tsx](../src/components/GoogleSearchInterface.tsx)
- [src/components/ParticipantDashboard.tsx](../src/components/ParticipantDashboard.tsx)

**Dependencies**:
```bash
npm install dompurify
npm install -D @types/dompurify
```

---

### 🟡 Issue #9: Timer Continues During API Errors

**Location**: [src/components/AssessmentPhase.tsx](../src/components/AssessmentPhase.tsx)

**Problem**:
```typescript
useEffect(() => {
  // Generate questions via API
  assessmentGenerationService.generateQuestions(topic)
    .then(setQuestions)
    .catch(error => {
      setError('Failed to generate questions');
      // Timer still running! User loses time.
    });
}, []);
```

**Impact**: User loses research time due to system errors

**Fix**:
```typescript
const [isLoading, setIsLoading] = useState(true);
const { pauseTimer, resumeTimer } = useTimer();

useEffect(() => {
  pauseTimer(); // Stop timer during loading
  
  assessmentGenerationService.generateQuestions(topic)
    .then(questions => {
      setQuestions(questions);
      setIsLoading(false);
      resumeTimer(); // Resume after success
    })
    .catch(error => {
      setError('Failed to generate questions');
      // Timer stays paused
      // Show retry button
    });
}, []);
```

---

### 🟡 Issue #10: Complex Topic Propagation

**Location**: [src/components/ChatGPTInterface.tsx](../src/components/ChatGPTInterface.tsx) → [ResearchInterface.tsx](../src/components/ResearchInterface.tsx) → [ParticipantDashboard.tsx](../src/components/ParticipantDashboard.tsx)

**Problem**: Topic changes passed through 3+ callback layers

**Fix**: Use Context API
```typescript
// src/context/ResearchContext.tsx
const ResearchContext = createContext<{
  topic: string;
  setTopic: (topic: string) => void;
}>(null!);

export const useResearch = () => useContext(ResearchContext);

// Any component can now update topic directly
const { topic, setTopic } = useResearch();
setTopic(newTopic); // No callback hell
```

---

## Low Priority Issues

### 🟢 Issue #11: Console Logging in Production

**Location**: Throughout codebase

**Fix**: Environment-based logging
```typescript
// src/utils/logger.ts
const isDev = import.meta.env.DEV;

export const logger = {
  debug: (...args: any[]) => isDev && console.log('[DEBUG]', ...args),
  info: (...args: any[]) => console.log('[INFO]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args)
};

// Replace all console.log with logger.debug
```

---

### 🟢 Issue #12: Magic Numbers

**Location**: Multiple files

**Fix**: Configuration file
```typescript
// src/config/constants.ts
export const CONFIG = {
  RESEARCH_DURATION_SECONDS: 15 * 60,
  BATCH_SIZE: 50,
  BATCH_INTERVAL_MS: 5000,
  MAX_MESSAGE_LENGTH: 1000,
  AUTO_SAVE_INTERVAL_MS: 10000
};
```

---

## Implementation Priority Matrix

Based on selected priority order: **C → B → A** (Stability → Database → Authentication)

### Phase 1: Critical Flow Issues (Priority C)
| Task | Files | Effort | Impact |
|------|-------|--------|--------|
| Session state recovery | SessionContext.tsx, useTimer.ts | 4 hours | High |
| Enhanced localStorage fallback | dataPersistenceService.ts | 2 hours | High |
| Before-unload warnings | SessionContext.tsx, App.tsx | 1 hour | Medium |
| API key proxy (backend) | server/src/routes/ai.ts | 3 hours | High |
| Input sanitization | validation.ts, all input components | 3 hours | Medium |

**Total Phase 1**: ~13 hours

---

### Phase 2: Database Setup (Priority B)
See [DATABASE_PLAN.md](./DATABASE_PLAN.md) for complete implementation

| Task | Effort |
|------|--------|
| Supabase setup & schema | 4 hours |
| Backend API implementation | 6 hours |
| Frontend integration | 4 hours |
| Data migration tools | 2 hours |

**Total Phase 2**: ~16 hours

---

### Phase 3: Authentication System (Priority A)
| Task | Files | Effort |
|------|-------|--------|
| Backend auth routes | server/src/routes/auth.ts | 4 hours |
| JWT implementation | authService.ts | 3 hours |
| Protected routes | ProtectedRoute.tsx, App.tsx | 2 hours |
| Login UI updates | Login.tsx | 2 hours |
| Admin password setup | Database seed script | 1 hour |

**Total Phase 3**: ~12 hours

---

### Phase 4: Polish & Enhancement
| Task | Effort |
|------|--------|
| Platform label fixes | 1 hour |
| Admin dashboard status indicators | 2 hours |
| Error handling improvements | 3 hours |
| Logging cleanup | 2 hours |

**Total Phase 4**: ~8 hours

---

## Grand Total Estimated Effort
**~49 hours** for complete resolution of all identified issues

---

**Next Steps**: See [DATABASE_PLAN.md](./DATABASE_PLAN.md) for Phase 2 details

**End of Document** | *Last Updated: January 8, 2026*
