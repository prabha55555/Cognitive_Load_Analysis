# Database Implementation Plan

**Last Updated**: January 8, 2026  
**Purpose**: Comprehensive database strategy for Cognitive Load Analysis application using Supabase

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Data Requirements Analysis](#data-requirements-analysis)
3. [Database Selection: Supabase PostgreSQL](#database-selection-supabase-postgresql)
4. [Schema Design](#schema-design)
5. [Supabase Setup Guide](#supabase-setup-guide)
6. [Backend Implementation](#backend-implementation)
7. [Frontend Integration](#frontend-integration)
8. [Data Visualization for Researcher Dashboard](#data-visualization-for-researcher-dashboard)
9. [Migration Strategy](#migration-strategy)
10. [Backup & Recovery](#backup--recovery)

---

## Executive Summary

### Current Problem
- All research data stored in **browser localStorage**
- No persistent storage across sessions or devices
- Data lost when browser cache cleared
- Admin dashboard cannot access participant data

### Proposed Solution
**Supabase PostgreSQL** - Managed database service with:
- ✅ **Free tier**: 500MB database, 2GB bandwidth/month
- ✅ **PostgreSQL 15**: Robust relational database
- ✅ **Built-in Authentication**: Row-level security
- ✅ **Real-time subscriptions**: Live dashboard updates
- ✅ **Automatic backups**: Point-in-time recovery
- ✅ **REST API**: Auto-generated from schema
- ✅ **TypeScript client**: Type-safe queries
- ✅ **Solo-dev friendly**: No DevOps required

### Why Supabase?
| Alternative | Pros | Cons | Verdict |
|-------------|------|------|---------|
| **Self-hosted PostgreSQL** | Full control | Requires server setup, backups, monitoring | ❌ Too complex for solo dev |
| **MongoDB Atlas** | Flexible schema | Less suitable for structured data, query complexity | ❌ Overkill for this use case |
| **Firebase** | Easy setup | NoSQL limitations, expensive at scale | ⚠️ Possible but not ideal |
| **Supabase** | PostgreSQL + free tier + auth + real-time | None for this use case | ✅ **Best choice** |
| **PlanetScale** | MySQL, good free tier | MySQL not PostgreSQL, less features | ⚠️ Good alternative |

---

## Data Requirements Analysis

### Data Volume Estimates
Based on application flow analysis:

| Data Type | Volume per Session | Sessions/Day | Storage/Month |
|-----------|-------------------|--------------|---------------|
| **Participants** | 1 record (~500 bytes) | 10 | ~15 KB |
| **Sessions** | 1 record (~1 KB) | 10 | ~30 KB |
| **Interaction Events** | 5,000-15,000 events (~300 bytes each) | 10 | ~450 MB |
| **Assessment Responses** | 5 records (~500 bytes each) | 10 | ~75 KB |
| **Creativity Responses** | 3 records (~2 KB each) | 10 | ~180 KB |
| **Cognitive Load Metrics** | 1 record (~1 KB) | 10 | ~30 KB |

**Total Monthly Storage**: ~450 MB (interaction events dominate)

### Data Access Patterns
| Operation | Frequency | Type | Optimization Needed |
|-----------|-----------|------|---------------------|
| Insert interaction event | 50-200/min during session | Write-heavy | Batch inserts |
| Insert assessment response | 5/session | Low frequency | Single inserts |
| Retrieve session data | 1/session load | Read | Indexed by participant_id |
| Admin dashboard query | On page load + refresh | Read | Aggregation queries, caching |
| Platform comparison | Admin view | Read | Pre-computed aggregates |

### Data Retention Requirements
- **Interaction Events**: 90 days (research analysis period)
- **Session Data**: Indefinite (core research data)
- **Participant Info**: Indefinite (anonymized after study completion)

---

## Database Selection: Supabase PostgreSQL

### Why Structured Database?
This application requires **structured data** (relational) because:
1. **Fixed Schema**: Participants, sessions, responses have consistent structure
2. **Relationships**: Sessions → Participants, Responses → Sessions
3. **Complex Queries**: Aggregations, joins for dashboard analytics
4. **ACID Compliance**: Research data integrity is critical
5. **Time-Series Data**: Interaction events with timestamps

### Supabase Features Used

#### 1. PostgreSQL Database
```sql
-- Native support for:
- JSONB columns (flexible behavioral features)
- Timestamps with time zones
- Full-text search (future feature)
- Trigrams for fuzzy matching
- Aggregation functions
```

#### 2. Row-Level Security (RLS)
```sql
-- Participants can only see their own data
CREATE POLICY "Participants see own data" ON sessions
  FOR SELECT USING (auth.uid() = participant_id);

-- Admins can see all data
CREATE POLICY "Admins see all data" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

#### 3. Real-Time Subscriptions
```typescript
// Admin dashboard auto-updates when new session completes
const subscription = supabase
  .from('sessions')
  .on('INSERT', payload => {
    console.log('New session:', payload.new);
    refreshDashboard();
  })
  .subscribe();
```

#### 4. Auto-Generated REST API
```typescript
// No backend code needed for basic CRUD
const { data, error } = await supabase
  .from('sessions')
  .select('*')
  .eq('participant_id', userId);
```

---

## Schema Design

### Entity-Relationship Diagram
```
┌─────────────────┐
│  participants   │
├─────────────────┤
│ id (PK)         │──┐
│ email           │  │
│ name            │  │
│ role            │  │
│ created_at      │  │
└─────────────────┘  │
                     │
                     │ 1:N
                     │
         ┌───────────▼──────────┐
         │      sessions        │
         ├──────────────────────┤
         │ id (PK)              │──┐
         │ participant_id (FK)  │  │
         │ platform             │  │
         │ topic                │  │
         │ current_phase        │  │
         │ start_time           │  │
         │ end_time             │  │
         │ research_data (JSONB)│  │
         │ created_at           │  │
         │ updated_at           │  │
         └──────────────────────┘  │
                     │              │
          ┌──────────┼──────────────┼──────────────┐
          │          │              │              │
          │ 1:N      │ 1:N          │ 1:N          │ 1:N
          │          │              │              │
┌─────────▼────┐ ┌──▼─────────┐ ┌──▼──────────┐ ┌─▼──────────────┐
│ interaction_ │ │assessment_ │ │ creativity_ │ │ cognitive_load_│
│   events     │ │ responses  │ │  responses  │ │    metrics     │
├──────────────┤ ├────────────┤ ├─────────────┤ ├────────────────┤
│ id (PK)      │ │ id (PK)    │ │ id (PK)     │ │ id (PK)        │
│ session_id   │ │ session_id │ │ session_id  │ │ session_id     │
│ type         │ │ question_id│ │ question_id │ │ overall_score  │
│ timestamp    │ │ answer     │ │ response    │ │ category       │
│ data (JSONB) │ │ is_correct │ │ scores      │ │ features       │
│ platform     │ │ time_taken │ │ timestamp   │ │ source         │
└──────────────┘ │ score      │ └─────────────┘ │ created_at     │
                 │ difficulty │                 └────────────────┘
                 │ created_at │
                 └────────────┘
```

---

### Table Schemas

#### 1. `participants` Table
```sql
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('participant', 'admin')),
  password_hash TEXT, -- NULL for participants (auto-generated)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_participants_role ON participants(role);

-- Comments
COMMENT ON TABLE participants IS 'Study participants and admin users';
COMMENT ON COLUMN participants.password_hash IS 'bcrypt hash for admins, NULL for participants';
```

#### 2. `sessions` Table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  
  -- Session metadata
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('chatgpt', 'google')),
  topic VARCHAR(500) NOT NULL,
  current_phase VARCHAR(20) NOT NULL CHECK (
    current_phase IN ('research', 'assessment', 'results', 'creativity', 'completed')
  ),
  
  -- Timestamps
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  
  -- Research data (flexible storage)
  research_data JSONB DEFAULT '{}'::jsonb,
  
  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_participant ON sessions(participant_id);
CREATE INDEX idx_sessions_platform ON sessions(platform);
CREATE INDEX idx_sessions_phase ON sessions(current_phase);
CREATE INDEX idx_sessions_created ON sessions(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE sessions IS 'Research sessions with timeline and progress tracking';
COMMENT ON COLUMN sessions.research_data IS 'JSONB storage for queries, notes, time spent';
```

**research_data JSONB Structure**:
```json
{
  "queries": [
    {
      "query": "What is AI?",
      "timestamp": "2026-01-08T10:30:00Z",
      "response": "AI stands for...",
      "clickedResults": ["url1", "url2"]
    }
  ],
  "notes": "User's research notes...",
  "timeSpent": 900,
  "interactionSummary": {
    "totalClicks": 45,
    "totalScrolls": 120,
    "avgResponseTime": 2.3
  }
}
```

#### 3. `interaction_events` Table (Time-Series Data)
```sql
CREATE TABLE interaction_events (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Event details
  type VARCHAR(20) NOT NULL CHECK (
    type IN ('click', 'mousemove', 'scroll', 'keystroke', 'navigation', 'search', 'input')
  ),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  platform VARCHAR(20) NOT NULL,
  
  -- Event data (flexible based on type)
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for time-series queries
CREATE INDEX idx_events_session ON interaction_events(session_id);
CREATE INDEX idx_events_timestamp ON interaction_events(timestamp DESC);
CREATE INDEX idx_events_type ON interaction_events(type);
CREATE INDEX idx_events_platform ON interaction_events(platform);

-- Composite index for common query pattern
CREATE INDEX idx_events_session_timestamp ON interaction_events(session_id, timestamp DESC);

-- Partition by month (for future scaling)
-- CREATE TABLE interaction_events_2026_01 PARTITION OF interaction_events
--   FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Comments
COMMENT ON TABLE interaction_events IS 'High-volume behavioral tracking events';
COMMENT ON COLUMN interaction_events.data IS 'Event-specific data: {x, y, targetElement, velocity, etc.}';
```

**data JSONB Examples by Event Type**:
```json
// Click event
{
  "targetElement": "button.send-message",
  "x": 450,
  "y": 320,
  "ctrlKey": false
}

// Mouse move event
{
  "x": 450,
  "y": 320,
  "velocity": 125.5
}

// Scroll event
{
  "direction": "down",
  "velocity": 50,
  "position": 1250
}

// Keystroke event
{
  "keyDownTime": 1704715800000,
  "keyUpTime": 1704715800150,
  "interKeyInterval": 180
}
```

#### 4. `assessment_responses` Table
```sql
CREATE TABLE assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Question details
  question_id VARCHAR(100) NOT NULL,
  question_text TEXT NOT NULL,
  difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  
  -- Answer details
  answer_index INTEGER NOT NULL CHECK (answer_index BETWEEN 0 AND 3),
  is_correct BOOLEAN NOT NULL,
  
  -- Scoring
  score INTEGER NOT NULL CHECK (score IN (10, 20, 30)), -- Based on difficulty
  earned_points INTEGER NOT NULL,
  
  -- Timing
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  time_taken INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER
  ) STORED,
  
  -- Confidence (derived from time)
  confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_assessment_session ON assessment_responses(session_id);
CREATE INDEX idx_assessment_correct ON assessment_responses(is_correct);
CREATE INDEX idx_assessment_difficulty ON assessment_responses(difficulty);

-- Comments
COMMENT ON TABLE assessment_responses IS 'MCQ assessment answers with timing and scoring';
```

#### 5. `creativity_responses` Table
```sql
CREATE TABLE creativity_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Question
  question_id VARCHAR(100) NOT NULL,
  question_text TEXT NOT NULL,
  
  -- Response
  response_text TEXT NOT NULL,
  
  -- AI Evaluation scores
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  relevance_score INTEGER CHECK (relevance_score BETWEEN 0 AND 100),
  creativity_score INTEGER CHECK (creativity_score BETWEEN 0 AND 100),
  depth_score INTEGER CHECK (depth_score BETWEEN 0 AND 100),
  coherence_score INTEGER CHECK (coherence_score BETWEEN 0 AND 100),
  time_efficiency_score INTEGER CHECK (time_efficiency_score BETWEEN 0 AND 100),
  
  -- AI feedback
  ai_feedback TEXT,
  
  -- Timing
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  time_taken INTEGER, -- Seconds
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_creativity_session ON creativity_responses(session_id);
CREATE INDEX idx_creativity_score ON creativity_responses(overall_score);

-- Comments
COMMENT ON TABLE creativity_responses IS 'Open-ended creativity test responses with AI evaluation';
```

#### 6. `cognitive_load_metrics` Table
```sql
CREATE TABLE cognitive_load_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID UNIQUE NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Overall metrics
  overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  category VARCHAR(20) NOT NULL CHECK (
    category IN ('low', 'moderate', 'high', 'very-high')
  ),
  
  -- Component scores
  assessment_score INTEGER CHECK (assessment_score BETWEEN 0 AND 100),
  behavioral_score INTEGER CHECK (behavioral_score BETWEEN 0 AND 100),
  blended_score INTEGER CHECK (blended_score BETWEEN 0 AND 100),
  
  -- Behavioral features (from ML classifier)
  behavioral_features JSONB,
  
  -- Calculation metadata
  source VARCHAR(50) NOT NULL CHECK (
    source IN ('assessment-only', 'behavioral-only', 'blended', 'local-tfjs', 'ml-service')
  ),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cogload_session ON cognitive_load_metrics(session_id);
CREATE INDEX idx_cogload_category ON cognitive_load_metrics(category);
CREATE INDEX idx_cogload_score ON cognitive_load_metrics(overall_score);

-- Comments
COMMENT ON TABLE cognitive_load_metrics IS 'Final cognitive load scores and classification';
```

**behavioral_features JSONB Example**:
```json
{
  "responseTime": {
    "mean": 2.3,
    "median": 2.1,
    "stdDev": 0.8
  },
  "clickAnalysis": {
    "totalClicks": 45,
    "rageClickCount": 2,
    "clickRate": 3.5
  },
  "mouseAnalysis": {
    "cursorSpeed": 125.5,
    "trajectoryDeviation": 0.15,
    "idleTime": 45
  },
  "engagement": {
    "sessionTime": 900,
    "activeTimeRatio": 0.85,
    "scrollDepth": 0.75
  }
}
```

---

### Materialized Views for Dashboard Performance

```sql
-- Pre-compute platform comparison stats
CREATE MATERIALIZED VIEW platform_comparison_stats AS
SELECT
  s.platform,
  COUNT(DISTINCT s.id) as session_count,
  AVG(cl.overall_score) as avg_cognitive_load,
  AVG(EXTRACT(EPOCH FROM (s.end_time - s.start_time))) as avg_session_duration,
  COUNT(CASE WHEN s.current_phase = 'completed' THEN 1 END) as completed_count
FROM sessions s
LEFT JOIN cognitive_load_metrics cl ON s.id = cl.session_id
WHERE s.current_phase = 'completed'
GROUP BY s.platform;

-- Refresh every hour or on-demand
CREATE INDEX idx_platform_stats_platform ON platform_comparison_stats(platform);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_platform_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY platform_comparison_stats;
END;
$$ LANGUAGE plpgsql;
```

```sql
-- Recent sessions summary
CREATE MATERIALIZED VIEW recent_sessions_summary AS
SELECT
  s.id,
  s.participant_id,
  p.name as participant_name,
  s.platform,
  s.topic,
  s.current_phase,
  cl.overall_score as cognitive_load_score,
  cl.category as load_category,
  s.created_at
FROM sessions s
JOIN participants p ON s.participant_id = p.id
LEFT JOIN cognitive_load_metrics cl ON s.id = cl.session_id
ORDER BY s.created_at DESC
LIMIT 50;

-- Refresh every 5 minutes
CREATE INDEX idx_recent_sessions_created ON recent_sessions_summary(created_at DESC);
```

---

## Supabase Setup Guide

### Step 1: Create Supabase Project

1. **Sign up**: Go to [supabase.com](https://supabase.com) and create account
2. **New Project**:
   ```
   Organization: Your Name
   Project Name: cognitive-load-analysis
   Database Password: [Generate strong password]
   Region: Choose closest to your users (e.g., US East, EU West)
   Pricing Plan: Free (500MB database, 2GB bandwidth)
   ```
3. **Save credentials**:
   ```
   Project URL: https://[project-id].supabase.co
   Project API Key (anon): eyJhbG...
   Service Role Key: eyJhbG... (keep secret!)
   Database Password: [saved password]
   ```

### Step 2: Run Schema Migrations

**Option A: Supabase Dashboard (Quick)**
1. Go to **SQL Editor** in Supabase dashboard
2. Copy entire schema SQL (all CREATE TABLE statements above)
3. Click **Run** to execute

**Option B: Supabase CLI (Recommended)**
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref [your-project-id]

# Create migration file
supabase migration new initial_schema

# Paste schema SQL into: supabase/migrations/[timestamp]_initial_schema.sql

# Apply migration
supabase db push
```

### Step 3: Enable Row-Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE creativity_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_load_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for participants table
CREATE POLICY "Participants can view own profile"
  ON participants FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all participants"
  ON participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for sessions table
CREATE POLICY "Participants can view own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = participant_id);

CREATE POLICY "Participants can update own sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = participant_id);

CREATE POLICY "Participants can insert own sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = participant_id);

CREATE POLICY "Admins can view all sessions"
  ON sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Similar policies for other tables (based on session_id → participant_id)
CREATE POLICY "Users can insert own interaction events"
  ON interaction_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = session_id AND participant_id = auth.uid()
    )
  );

-- etc... (apply to all tables)
```

### Step 4: Set up Supabase Auth

**Enable Email Authentication**:
1. Go to **Authentication → Providers** in dashboard
2. Enable **Email** provider
3. Disable email confirmation (for research study) or configure SMTP

**Create Admin User Manually**:
```sql
-- In SQL Editor
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@research.local',
  crypt('your-admin-password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) RETURNING id;

-- Copy the returned UUID and insert into participants table
INSERT INTO participants (id, email, name, role, password_hash)
VALUES (
  '[uuid-from-above]',
  'admin@research.local',
  'Research Admin',
  'admin',
  '[bcrypt-hash]' -- Or NULL if using Supabase auth
);
```

---

## Backend Implementation

### Install Dependencies
```bash
cd server
npm install @supabase/supabase-js
npm install dotenv
```

### Environment Variables
```bash
# server/.env
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_KEY=eyJhbG... # For admin operations
JWT_SECRET=[your-jwt-secret]
```

### Supabase Client Setup
```typescript
// server/src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Service client (bypasses RLS, use carefully)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// User-scoped client (respects RLS)
export const createUserSupabaseClient = (userToken: string) => {
  return createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!, {
    global: {
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    }
  });
};
```

### API Routes Implementation

#### Sessions Route
```typescript
// server/src/routes/sessions.ts
import { Router } from 'express';
import { supabaseAdmin, createUserSupabaseClient } from '../config/supabase';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Create new session
router.post('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id; // From JWT
    const { platform, topic } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .insert({
        participant_id: userId,
        platform,
        topic,
        current_phase: 'research'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ session: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update session
router.patch('/:sessionId', authenticateUser, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updates = req.body;
    
    const userClient = createUserSupabaseClient(req.token);
    
    const { data, error } = await userClient
      .from('sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ session: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's sessions
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('participant_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ sessions: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get all sessions
router.get('/all', authenticateUser, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select(`
        *,
        participants (name, email),
        cognitive_load_metrics (overall_score, category)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ sessions: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

#### Interaction Events Route (Batch Insert)
```typescript
// server/src/routes/interactions.ts
import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Batch insert interaction events
router.post('/batch', authenticateUser, async (req, res) => {
  try {
    const { sessionId, events } = req.body;
    
    // Validate session belongs to user
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('participant_id')
      .eq('id', sessionId)
      .single();
    
    if (!session || session.participant_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Prepare batch insert
    const eventsToInsert = events.map((event: any) => ({
      session_id: sessionId,
      type: event.type,
      timestamp: event.timestamp,
      platform: event.platform,
      data: event.data
    }));
    
    const { data, error } = await supabaseAdmin
      .from('interaction_events')
      .insert(eventsToInsert);
    
    if (error) throw error;
    
    res.json({ 
      received: true, 
      count: eventsToInsert.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

#### Assessment Responses Route
```typescript
// server/src/routes/assessments.ts
import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Submit assessment responses
router.post('/:sessionId/responses', authenticateUser, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { responses } = req.body;
    
    // Validate session
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('participant_id')
      .eq('id', sessionId)
      .single();
    
    if (!session || session.participant_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Insert responses
    const responsesToInsert = responses.map((r: any) => ({
      session_id: sessionId,
      question_id: r.questionId,
      question_text: r.question,
      difficulty: r.difficulty,
      answer_index: r.answer,
      is_correct: r.isCorrect,
      score: r.score,
      earned_points: r.earnedPoints,
      start_time: r.startTime,
      end_time: r.endTime,
      confidence_level: r.confidenceLevel
    }));
    
    const { data, error } = await supabaseAdmin
      .from('assessment_responses')
      .insert(responsesToInsert)
      .select();
    
    if (error) throw error;
    
    res.json({ responses: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

## Frontend Integration

### Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### Supabase Client Setup
```typescript
// src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type-safe database types (generate with Supabase CLI)
export type Database = {
  public: {
    Tables: {
      participants: { /* ... */ };
      sessions: { /* ... */ };
      // etc.
    };
  };
};
```

### Update Auth Service
```typescript
// src/services/authService.ts
import { supabase } from '../config/supabase';

export const registerParticipant = async (
  email: string,
  name: string
): Promise<{ user: any; session: any }> => {
  // Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: crypto.randomUUID(), // Auto-generated password
    options: {
      data: {
        name,
        role: 'participant'
      }
    }
  });
  
  if (authError) throw authError;
  
  // Create participant record
  const { data: participant, error: dbError } = await supabase
    .from('participants')
    .insert({
      id: authData.user!.id,
      email,
      name,
      role: 'participant'
    })
    .select()
    .single();
  
  if (dbError) throw dbError;
  
  return { user: participant, session: authData.session };
};

export const loginAdmin = async (
  email: string,
  password: string
): Promise<{ user: any; session: any }> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  
  // Get user profile
  const { data: profile } = await supabase
    .from('participants')
    .select('*')
    .eq('id', data.user.id)
    .single();
  
  if (profile?.role !== 'admin') {
    throw new Error('Not authorized');
  }
  
  return { user: profile, session: data.session };
};

export const logout = async () => {
  await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  
  const { data: profile } = await supabase
    .from('participants')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  return profile;
};
```

### Update Data Persistence Service
```typescript
// src/services/dataPersistenceService.ts
import { supabase } from '../config/supabase';

export const saveSession = async (sessionData: SessionData): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .upsert({
        id: sessionData.id,
        participant_id: sessionData.participantId,
        platform: sessionData.platform,
        topic: sessionData.topic,
        current_phase: sessionData.currentPhase,
        research_data: sessionData.researchData,
        end_time: sessionData.currentPhase === 'completed' ? new Date() : null
      });
    
    if (error) throw error;
  } catch (error) {
    console.error('Save failed:', error);
    // Fallback to localStorage
    localStorage.setItem('session_backup', JSON.stringify(sessionData));
  }
};

export const saveInteractionEvents = async (
  sessionId: string,
  events: InteractionEvent[]
): Promise<void> => {
  if (events.length === 0) return;
  
  const { error } = await supabase
    .from('interaction_events')
    .insert(
      events.map(e => ({
        session_id: sessionId,
        type: e.type,
        timestamp: e.timestamp,
        platform: e.platform,
        data: e.data
      }))
    );
  
  if (error) {
    console.error('Interaction save failed:', error);
  }
};

export const saveAssessmentResults = async (
  sessionId: string,
  responses: AssessmentResponse[]
): Promise<void> => {
  const { error } = await supabase
    .from('assessment_responses')
    .insert(
      responses.map(r => ({
        session_id: sessionId,
        question_id: r.questionId,
        question_text: r.question,
        difficulty: r.difficulty,
        answer_index: r.answer,
        is_correct: r.isCorrect,
        score: r.score,
        earned_points: r.earnedPoints,
        start_time: r.startTime,
        end_time: r.endTime,
        confidence_level: r.confidenceLevel
      }))
    );
  
  if (error) {
    console.error('Assessment save failed:', error);
  }
};

export const saveCognitiveLoadMetrics = async (
  sessionId: string,
  metrics: CognitiveLoadMetrics
): Promise<void> => {
  const { error } = await supabase
    .from('cognitive_load_metrics')
    .insert({
      session_id: sessionId,
      overall_score: metrics.overallScore,
      category: metrics.category,
      assessment_score: metrics.assessmentScore,
      behavioral_score: metrics.behavioralScore,
      blended_score: metrics.blendedScore,
      behavioral_features: metrics.behavioralFeatures,
      source: metrics.source
    });
  
  if (error) {
    console.error('Metrics save failed:', error);
  }
};

export const getAllSessions = async (): Promise<SessionData[]> => {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      participants (name, email),
      cognitive_load_metrics (overall_score, category)
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Fetch failed:', error);
    return [];
  }
  
  return data;
};
```

### Real-Time Dashboard Updates
```typescript
// src/components/AdminDashboard.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

const AdminDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  
  useEffect(() => {
    // Initial load
    loadSessions();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'sessions'
        },
        (payload) => {
          console.log('Session changed:', payload);
          loadSessions(); // Refresh data
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const loadSessions = async () => {
    const { data } = await supabase
      .from('sessions')
      .select(`
        *,
        participants (name, email),
        cognitive_load_metrics (overall_score, category)
      `)
      .order('created_at', { ascending: false });
    
    setSessions(data || []);
  };
  
  return (
    <div className="admin-dashboard">
      {/* Dashboard UI */}
    </div>
  );
};
```

---

## Data Visualization for Researcher Dashboard

### Required Visualizations

#### 1. Platform Comparison Chart
```typescript
// Data query
const { data: platformStats } = await supabase
  .from('platform_comparison_stats')
  .select('*');

// Chart data structure
{
  labels: ['ChatGPT', 'Google Search'],
  datasets: [{
    label: 'Average Cognitive Load',
    data: [42.3, 48.1],
    backgroundColor: ['#FF6384', '#36A2EB']
  }]
}
```

**Visualization**: Bar chart or radar chart

#### 2. Cognitive Load Distribution
```typescript
const { data: loadDistribution } = await supabase
  .from('cognitive_load_metrics')
  .select('category')
  .then(data => {
    const counts = data.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
    return counts;
  });

// Result: { low: 5, moderate: 12, high: 7, very-high: 2 }
```

**Visualization**: Pie chart

#### 3. Session Timeline
```typescript
const { data: sessions } = await supabase
  .from('sessions')
  .select('created_at, cognitive_load_metrics(overall_score)')
  .order('created_at', { ascending: true });

// Chart data: x = timestamp, y = cognitive load score
```

**Visualization**: Line chart over time

#### 4. Participant Performance Table
```typescript
const { data: participants } = await supabase
  .from('recent_sessions_summary')
  .select('*')
  .limit(20);

// Table columns: Name, Platform, Load Score, Category, Date
```

**Visualization**: Sortable data table

### Recommended Charting Library
```bash
npm install recharts
# OR
npm install chart.js react-chartjs-2
```

**Example with Recharts**:
```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const PlatformComparisonChart: React.FC = () => {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    loadPlatformStats();
  }, []);
  
  const loadPlatformStats = async () => {
    const { data } = await supabase
      .from('platform_comparison_stats')
      .select('*');
    
    setData(data.map(d => ({
      platform: d.platform,
      avgLoad: d.avg_cognitive_load
    })));
  };
  
  return (
    <BarChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="platform" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="avgLoad" fill="#8884d8" />
    </BarChart>
  );
};
```

---

## Migration Strategy

### Phase 1: Parallel Running (Week 1)
```typescript
// Keep localStorage + write to database
export const saveSession = async (sessionData: SessionData) => {
  // Primary: Database
  try {
    await supabase.from('sessions').upsert(sessionData);
  } catch (error) {
    console.error('DB save failed:', error);
  }
  
  // Backup: localStorage
  localStorage.setItem('session_backup', JSON.stringify(sessionData));
};
```

### Phase 2: Migration Script
```typescript
// scripts/migrate-localStorage-to-db.ts
import { supabase } from '../src/config/supabase';

async function migrateLocalStorageData() {
  const sessions = JSON.parse(
    localStorage.getItem('research_sessions') || '[]'
  );
  
  console.log(`Migrating ${sessions.length} sessions...`);
  
  for (const session of sessions) {
    try {
      await supabase.from('sessions').insert({
        participant_id: session.participantId,
        platform: session.platform,
        topic: session.topic,
        current_phase: session.currentPhase,
        research_data: session.researchData,
        created_at: session.createdAt || new Date()
      });
      console.log(`✓ Migrated session ${session.id}`);
    } catch (error) {
      console.error(`✗ Failed session ${session.id}:`, error);
    }
  }
  
  console.log('Migration complete!');
}

migrateLocalStorageData();
```

### Phase 3: Remove localStorage (Week 2)
After confirming database is stable, remove localStorage fallbacks.

---

## Backup & Recovery

### Automated Backups (Supabase)
- **Daily backups**: Automatic on free tier
- **Point-in-time recovery**: Last 7 days
- **Manual backups**: SQL Editor → Export

### Manual Export Script
```typescript
// scripts/export-data.ts
import { supabase } from '../src/config/supabase';
import { writeFileSync } from 'fs';

async function exportAllData() {
  const timestamp = new Date().toISOString().split('T')[0];
  
  // Export all tables
  const tables = [
    'participants',
    'sessions',
    'interaction_events',
    'assessment_responses',
    'creativity_responses',
    'cognitive_load_metrics'
  ];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*');
    
    if (data) {
      writeFileSync(
        `backups/${table}_${timestamp}.json`,
        JSON.stringify(data, null, 2)
      );
      console.log(`✓ Exported ${table}: ${data.length} rows`);
    }
  }
  
  console.log('Export complete!');
}

exportAllData();
```

---

## Summary Checklist

### Setup Tasks
- [ ] Create Supabase account and project
- [ ] Run schema migrations (all CREATE TABLE statements)
- [ ] Enable Row-Level Security policies
- [ ] Create admin user via SQL
- [ ] Install `@supabase/supabase-js` in frontend and backend
- [ ] Configure environment variables
- [ ] Test database connection

### Backend Tasks
- [ ] Implement `/api/sessions` routes (CRUD)
- [ ] Implement `/api/interactions/batch` route
- [ ] Implement `/api/assessments` routes
- [ ] Implement `/api/creativity` routes
- [ ] Add authentication middleware
- [ ] Test all endpoints with Postman/Thunder Client

### Frontend Tasks
- [ ] Update `authService.ts` to use Supabase Auth
- [ ] Update `dataPersistenceService.ts` to use Supabase
- [ ] Update `interactionTracker.ts` to batch to Supabase
- [ ] Add real-time subscription to Admin Dashboard
- [ ] Implement data visualization charts
- [ ] Test end-to-end flow (signup → research → results)

### Data Migration
- [ ] Run parallel (localStorage + DB) for 1 week
- [ ] Migrate existing localStorage data
- [ ] Verify all data migrated successfully
- [ ] Remove localStorage fallbacks

---

**Estimated Implementation Time**: 16-20 hours total

**Next Step**: Begin with Supabase project creation and schema setup

**End of Document** | *Last Updated: January 8, 2026*
