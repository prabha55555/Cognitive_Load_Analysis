-- =============================================================================
-- Cognitive Load Analysis - Database Schema
-- =============================================================================
-- Phase 2: Supabase PostgreSQL Implementation
-- Created: January 8, 2026
-- Database: Supabase PostgreSQL 15
--
-- Run this in Supabase SQL Editor or via Supabase CLI
-- @see docs/DATABASE_PLAN.md for detailed documentation
-- =============================================================================

-- =============================================================================
-- 1. PARTICIPANTS TABLE
-- =============================================================================

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

-- =============================================================================
-- 2. SESSIONS TABLE
-- =============================================================================

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

-- =============================================================================
-- 3. INTERACTION EVENTS TABLE (Time-Series Data)
-- =============================================================================

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

-- Comments
COMMENT ON TABLE interaction_events IS 'High-volume behavioral tracking events';
COMMENT ON COLUMN interaction_events.data IS 'Event-specific data: {x, y, targetElement, velocity, etc.}';

-- =============================================================================
-- 4. ASSESSMENT RESPONSES TABLE
-- =============================================================================

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

-- =============================================================================
-- 5. CREATIVITY RESPONSES TABLE
-- =============================================================================

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

-- =============================================================================
-- 6. COGNITIVE LOAD METRICS TABLE
-- =============================================================================

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

-- =============================================================================
-- 7. ROW-LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE creativity_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_load_metrics ENABLE ROW LEVEL SECURITY;

-- Participants table policies
CREATE POLICY "Participants can view own profile"
  ON participants FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Participants can update own profile"
  ON participants FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all participants"
  ON participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Sessions table policies
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
  ON sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Interaction events policies
CREATE POLICY "Users can insert own interaction events"
  ON interaction_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = session_id AND participant_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own interaction events"
  ON interaction_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = session_id AND participant_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all interaction events"
  ON interaction_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Assessment responses policies
CREATE POLICY "Users can insert own assessment responses"
  ON assessment_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = session_id AND participant_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own assessment responses"
  ON assessment_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = session_id AND participant_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all assessment responses"
  ON assessment_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Creativity responses policies
CREATE POLICY "Users can insert own creativity responses"
  ON creativity_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = session_id AND participant_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own creativity responses"
  ON creativity_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = session_id AND participant_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all creativity responses"
  ON creativity_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Cognitive load metrics policies
CREATE POLICY "Users can view own cognitive load metrics"
  ON cognitive_load_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = session_id AND participant_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all cognitive load metrics"
  ON cognitive_load_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- 8. UTILITY FUNCTIONS
-- =============================================================================

-- Function to get session statistics
CREATE OR REPLACE FUNCTION get_session_statistics(p_session_id UUID)
RETURNS TABLE (
  total_events BIGINT,
  total_clicks BIGINT,
  total_scrolls BIGINT,
  session_duration INTERVAL,
  assessment_score INTEGER,
  creativity_score INTEGER,
  cognitive_load INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_events,
    COUNT(*) FILTER (WHERE type = 'click')::BIGINT as total_clicks,
    COUNT(*) FILTER (WHERE type = 'scroll')::BIGINT as total_scrolls,
    (SELECT end_time - start_time FROM sessions WHERE id = p_session_id) as session_duration,
    (SELECT AVG(earned_points)::INTEGER FROM assessment_responses WHERE session_id = p_session_id) as assessment_score,
    (SELECT AVG(overall_score)::INTEGER FROM creativity_responses WHERE session_id = p_session_id) as creativity_score,
    (SELECT overall_score FROM cognitive_load_metrics WHERE session_id = p_session_id) as cognitive_load
  FROM interaction_events
  WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SCHEMA CREATION COMPLETE
-- =============================================================================
-- Next steps:
-- 1. Verify all tables created successfully
-- 2. Test RLS policies with authenticated users
-- 3. Create initial admin user in auth.users table
-- =============================================================================
