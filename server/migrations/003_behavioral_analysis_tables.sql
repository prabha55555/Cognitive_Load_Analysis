-- Migration: Behavioral Analysis Tables
-- Created: 2026-01-10
-- Description: Add tables for storing behavioral predictions and interaction events

-- ============================================================================
-- 1. BEHAVIORAL PREDICTIONS TABLE
-- ============================================================================
-- Stores cognitive load predictions from the Python behavioral analysis service
CREATE TABLE IF NOT EXISTS behavioral_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  prediction_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Prediction results
  predicted_load_category VARCHAR(50) NOT NULL CHECK (predicted_load_category IN ('low', 'moderate', 'high', 'very-high')),
  predicted_load_score DECIMAL(5,2) CHECK (predicted_load_score >= 0 AND predicted_load_score <= 100),
  confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  
  -- Feature data used for prediction (stored as JSON for flexibility)
  features JSONB,
  
  -- Metadata
  model_version VARCHAR(50),
  prediction_method VARCHAR(50) CHECK (prediction_method IN ('rule-based', 'ml-classifier', 'blended')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for efficient queries
  CONSTRAINT behavioral_predictions_session_fk FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Indexes for behavioral_predictions
CREATE INDEX IF NOT EXISTS idx_behavioral_predictions_session ON behavioral_predictions(session_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_predictions_timestamp ON behavioral_predictions(prediction_timestamp);
CREATE INDEX IF NOT EXISTS idx_behavioral_predictions_category ON behavioral_predictions(predicted_load_category);

-- ============================================================================
-- 2. INTERACTIONS TABLE (Enhanced)
-- ============================================================================
-- Stores individual interaction events for behavioral analysis
-- Note: This complements the existing interaction_events table
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  
  -- Interaction type and timing
  interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN (
    'click', 'keypress', 'scroll', 'mouse_move', 'focus', 'blur',
    'copy', 'paste', 'search', 'navigation', 'dwell', 'tab_switch'
  )),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Interaction details (flexible JSON structure)
  details JSONB,
  
  -- Aggregated metrics (computed from raw events)
  event_count INTEGER DEFAULT 1,
  duration_ms INTEGER,
  
  -- Processing status
  processed BOOLEAN DEFAULT FALSE,
  included_in_prediction UUID REFERENCES behavioral_predictions(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT interactions_session_fk FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  CONSTRAINT interactions_participant_fk FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);

-- Indexes for interactions
CREATE INDEX IF NOT EXISTS idx_interactions_session ON interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_interactions_participant ON interactions(participant_id);
CREATE INDEX IF NOT EXISTS idx_interactions_timestamp ON interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_processed ON interactions(processed) WHERE processed = FALSE;

-- ============================================================================
-- 3. BEHAVIORAL FEATURES TABLE
-- ============================================================================
-- Stores aggregated behavioral features for analysis and model training
CREATE TABLE IF NOT EXISTS behavioral_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Time window for feature calculation
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  window_duration_seconds INTEGER,
  
  -- Mouse features
  mouse_movement_count INTEGER DEFAULT 0,
  mouse_movement_speed_avg DECIMAL(10,2),
  mouse_movement_acceleration_avg DECIMAL(10,2),
  mouse_idle_time_ms INTEGER DEFAULT 0,
  
  -- Click features
  click_count INTEGER DEFAULT 0,
  click_rate_per_minute DECIMAL(10,2),
  double_click_count INTEGER DEFAULT 0,
  
  -- Keyboard features
  keypress_count INTEGER DEFAULT 0,
  typing_speed_wpm DECIMAL(10,2),
  backspace_count INTEGER DEFAULT 0,
  backspace_ratio DECIMAL(5,2),
  
  -- Scroll features
  scroll_count INTEGER DEFAULT 0,
  scroll_speed_avg DECIMAL(10,2),
  scroll_direction_changes INTEGER DEFAULT 0,
  
  -- Navigation features
  page_switches INTEGER DEFAULT 0,
  tab_switches INTEGER DEFAULT 0,
  back_button_count INTEGER DEFAULT 0,
  
  -- Dwell time features
  total_dwell_time_ms INTEGER DEFAULT 0,
  avg_dwell_time_ms INTEGER DEFAULT 0,
  max_dwell_time_ms INTEGER DEFAULT 0,
  
  -- Copy/paste features
  copy_count INTEGER DEFAULT 0,
  paste_count INTEGER DEFAULT 0,
  copy_paste_ratio DECIMAL(5,2),
  
  -- Response time features
  avg_response_time_ms INTEGER,
  max_response_time_ms INTEGER,
  response_time_variance DECIMAL(10,2),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT behavioral_features_session_fk FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  CONSTRAINT behavioral_features_window_check CHECK (window_end > window_start)
);

-- Indexes for behavioral_features
CREATE INDEX IF NOT EXISTS idx_behavioral_features_session ON behavioral_features(session_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_features_window_start ON behavioral_features(window_start);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE behavioral_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_features ENABLE ROW LEVEL SECURITY;

-- Behavioral Predictions Policies
CREATE POLICY "Users can view their own predictions"
  ON behavioral_predictions FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM sessions WHERE participant_id = auth.uid()
    )
  );

CREATE POLICY "Users can create predictions for their sessions"
  ON behavioral_predictions FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM sessions WHERE participant_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all predictions"
  ON behavioral_predictions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM participants WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Interactions Policies
CREATE POLICY "Users can view their own interactions"
  ON interactions FOR SELECT
  USING (participant_id = auth.uid());

CREATE POLICY "Users can create their own interactions"
  ON interactions FOR INSERT
  WITH CHECK (participant_id = auth.uid());

CREATE POLICY "Admins can view all interactions"
  ON interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM participants WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Behavioral Features Policies
CREATE POLICY "Users can view their own features"
  ON behavioral_features FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM sessions WHERE participant_id = auth.uid()
    )
  );

CREATE POLICY "Users can create features for their sessions"
  ON behavioral_features FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM sessions WHERE participant_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all features"
  ON behavioral_features FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM participants WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to get prediction accuracy for a session
CREATE OR REPLACE FUNCTION get_prediction_accuracy(
  p_session_id UUID
) RETURNS TABLE (
  total_predictions INTEGER,
  avg_confidence DECIMAL(5,2),
  actual_category VARCHAR(50),
  predicted_category VARCHAR(50),
  accuracy_match BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(bp.id)::INTEGER as total_predictions,
    AVG(bp.confidence_score)::DECIMAL(5,2) as avg_confidence,
    cl.category as actual_category,
    MODE() WITHIN GROUP (ORDER BY bp.predicted_load_category) as predicted_category,
    (MODE() WITHIN GROUP (ORDER BY bp.predicted_load_category) = cl.category) as accuracy_match
  FROM behavioral_predictions bp
  LEFT JOIN cognitive_load_metrics cl ON cl.session_id = bp.session_id
  WHERE bp.session_id = p_session_id
  GROUP BY cl.category;
END;
$$ LANGUAGE plpgsql;

-- Function to get interaction statistics for a session
CREATE OR REPLACE FUNCTION get_interaction_stats(
  p_session_id UUID
) RETURNS TABLE (
  total_interactions INTEGER,
  unique_interaction_types INTEGER,
  avg_interactions_per_minute DECIMAL(10,2),
  session_duration_minutes DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(i.id)::INTEGER as total_interactions,
    COUNT(DISTINCT i.interaction_type)::INTEGER as unique_interaction_types,
    (COUNT(i.id) / EXTRACT(EPOCH FROM (MAX(i.timestamp) - MIN(i.timestamp))) * 60)::DECIMAL(10,2) as avg_interactions_per_minute,
    (EXTRACT(EPOCH FROM (MAX(i.timestamp) - MIN(i.timestamp))) / 60)::DECIMAL(10,2) as session_duration_minutes
  FROM interactions i
  WHERE i.session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE behavioral_predictions IS 'Stores cognitive load predictions from behavioral analysis ML models';
COMMENT ON TABLE interactions IS 'Stores individual user interaction events for behavioral analysis';
COMMENT ON TABLE behavioral_features IS 'Aggregated behavioral features calculated from interaction events';

COMMENT ON COLUMN behavioral_predictions.predicted_load_category IS 'Predicted cognitive load category: low, moderate, high, very-high';
COMMENT ON COLUMN behavioral_predictions.confidence_score IS 'Model confidence in prediction (0.0 to 1.0)';
COMMENT ON COLUMN behavioral_predictions.features IS 'JSON object containing feature values used for prediction';
COMMENT ON COLUMN behavioral_predictions.prediction_method IS 'Method used: rule-based, ml-classifier, or blended';

COMMENT ON COLUMN interactions.interaction_type IS 'Type of interaction: click, keypress, scroll, mouse_move, etc.';
COMMENT ON COLUMN interactions.details IS 'JSON object with interaction-specific details';
COMMENT ON COLUMN interactions.processed IS 'Whether this interaction has been included in a prediction';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This migration adds comprehensive behavioral analysis capabilities:
-- 1. behavioral_predictions - Store ML model predictions
-- 2. interactions - Track individual user interactions
-- 3. behavioral_features - Aggregated features for analysis
-- 4. RLS policies - Secure access control
-- 5. Helper functions - Convenience queries
