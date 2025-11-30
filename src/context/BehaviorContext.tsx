/**
 * BehaviorContext - Centralized behavior event tracking for EEG modulation
 * 
 * Tracks user interactions across study phases and provides behavior modifiers
 * for the biosignal service to generate realistic EEG patterns.
 * 
 * Features:
 * - Event queue with exponential decay (10s half-life)
 * - Phase-specific baseline profiles
 * - Aggregate metrics calculation
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export type StudyPhase = 'research' | 'assessment' | 'creativity' | 'results' | 'idle';

export type BehaviorEventType =
  // Time-related events
  | 'time_warning'
  | 'timer_expired'
  // Assessment events
  | 'answer_submitted_correct'
  | 'answer_submitted_incorrect'
  | 'answer_changed'
  | 'question_started'
  // Research events
  | 'query_submitted'
  | 'search_result_clicked'
  | 'off_topic_detected'
  | 'clarification_request'
  // Creativity events
  | 'creative_typing_started'
  | 'creative_typing_active'
  | 'creative_response_submitted'
  // General events
  | 'phase_started'
  | 'phase_completed'
  | 'idle_detected';

export interface BehaviorEvent {
  id: string;
  type: BehaviorEventType;
  timestamp: number;
  intensity: number; // 0-1 impact factor
  metadata?: Record<string, any>;
  phase: StudyPhase;
}

export interface AggregateMetrics {
  avgResponseTime: number;
  totalResponses: number;
  correctCount: number;
  incorrectCount: number;
  clarificationCount: number;
  answerChangeCount: number;
  queryCount: number;
  offTopicCount: number;
  timeWarningCount: number;
}

export interface BehaviorModifiers {
  currentPhase: StudyPhase;
  phaseProgress: number; // 0-1
  phaseStartTime: number;
  recentEvents: BehaviorEvent[];
  aggregateMetrics: AggregateMetrics;
  // Calculated modulation values (with decay applied)
  alphaModifier: number;
  betaModifier: number;
  thetaModifier: number;
}

interface BehaviorState {
  currentPhase: StudyPhase;
  phaseProgress: number;
  phaseStartTime: number;
  events: BehaviorEvent[];
  metrics: AggregateMetrics;
}

// ============================================================================
// Constants
// ============================================================================

const DECAY_HALF_LIFE_MS = 10000; // 10 seconds
const MAX_EVENTS_QUEUE = 50; // Keep last 50 events
const DECAY_CONSTANT = Math.LN2 / DECAY_HALF_LIFE_MS;

// Phase-specific baseline cognitive load profiles
export const PHASE_BASELINES: Record<StudyPhase, { alpha: number; beta: number; theta: number; baseLoad: number }> = {
  idle: { alpha: 1.0, beta: 1.0, theta: 1.0, baseLoad: 20 },
  research: { alpha: 0.95, beta: 1.05, theta: 1.08, baseLoad: 40 }, // Light cognitive engagement
  assessment: { alpha: 0.85, beta: 1.15, theta: 1.12, baseLoad: 65 }, // Higher cognitive demand
  creativity: { alpha: 1.10, beta: 0.95, theta: 1.15, baseLoad: 55 }, // Creative alpha increase
  results: { alpha: 1.05, beta: 0.98, theta: 1.0, baseLoad: 30 }, // Relaxed review
};

// Event-to-EEG modulation mapping
// Values are multipliers: 1.0 = no change, 1.1 = +10%, 0.9 = -10%
export const EVENT_MODULATION: Record<BehaviorEventType, { alpha: number; beta: number; theta: number; duration: number }> = {
  // Time pressure events
  time_warning: { alpha: 0.92, beta: 1.12, theta: 1.05, duration: 8000 },
  timer_expired: { alpha: 0.85, beta: 1.20, theta: 1.15, duration: 10000 },
  
  // Assessment events
  answer_submitted_correct: { alpha: 1.10, beta: 0.95, theta: 1.0, duration: 4000 },
  answer_submitted_incorrect: { alpha: 0.90, beta: 1.15, theta: 1.10, duration: 6000 },
  answer_changed: { alpha: 0.95, beta: 1.05, theta: 1.08, duration: 4000 },
  question_started: { alpha: 0.98, beta: 1.03, theta: 1.02, duration: 3000 },
  
  // Research events
  query_submitted: { alpha: 1.0, beta: 1.03, theta: 1.05, duration: 3000 },
  search_result_clicked: { alpha: 1.02, beta: 1.0, theta: 1.02, duration: 2000 },
  off_topic_detected: { alpha: 0.95, beta: 1.05, theta: 1.05, duration: 4000 },
  clarification_request: { alpha: 0.95, beta: 1.08, theta: 1.10, duration: 5000 },
  
  // Creativity events
  creative_typing_started: { alpha: 1.05, beta: 0.98, theta: 1.05, duration: 5000 },
  creative_typing_active: { alpha: 1.08, beta: 0.97, theta: 1.03, duration: 3000 },
  creative_response_submitted: { alpha: 1.10, beta: 0.95, theta: 0.98, duration: 4000 },
  
  // General events
  phase_started: { alpha: 0.98, beta: 1.02, theta: 1.02, duration: 3000 },
  phase_completed: { alpha: 1.08, beta: 0.95, theta: 0.98, duration: 5000 },
  idle_detected: { alpha: 1.05, beta: 0.95, theta: 0.98, duration: 5000 },
};

// ============================================================================
// Reducer
// ============================================================================

type BehaviorAction =
  | { type: 'ADD_EVENT'; payload: Omit<BehaviorEvent, 'id' | 'timestamp' | 'phase'> }
  | { type: 'SET_PHASE'; payload: { phase: StudyPhase; progress?: number } }
  | { type: 'UPDATE_PROGRESS'; payload: number }
  | { type: 'CLEANUP_OLD_EVENTS' }
  | { type: 'RESET' };

const initialMetrics: AggregateMetrics = {
  avgResponseTime: 0,
  totalResponses: 0,
  correctCount: 0,
  incorrectCount: 0,
  clarificationCount: 0,
  answerChangeCount: 0,
  queryCount: 0,
  offTopicCount: 0,
  timeWarningCount: 0,
};

const initialState: BehaviorState = {
  currentPhase: 'idle',
  phaseProgress: 0,
  phaseStartTime: Date.now(),
  events: [],
  metrics: { ...initialMetrics },
};

function updateMetrics(metrics: AggregateMetrics, eventType: BehaviorEventType, metadata?: Record<string, any>): AggregateMetrics {
  const updated = { ...metrics };
  
  switch (eventType) {
    case 'answer_submitted_correct':
      updated.correctCount++;
      updated.totalResponses++;
      if (metadata?.responseTime) {
        updated.avgResponseTime = 
          (updated.avgResponseTime * (updated.totalResponses - 1) + metadata.responseTime) / updated.totalResponses;
      }
      break;
    case 'answer_submitted_incorrect':
      updated.incorrectCount++;
      updated.totalResponses++;
      if (metadata?.responseTime) {
        updated.avgResponseTime = 
          (updated.avgResponseTime * (updated.totalResponses - 1) + metadata.responseTime) / updated.totalResponses;
      }
      break;
    case 'answer_changed':
      updated.answerChangeCount++;
      break;
    case 'clarification_request':
      updated.clarificationCount++;
      break;
    case 'query_submitted':
      updated.queryCount++;
      break;
    case 'off_topic_detected':
      updated.offTopicCount++;
      break;
    case 'time_warning':
      updated.timeWarningCount++;
      break;
  }
  
  return updated;
}

function behaviorReducer(state: BehaviorState, action: BehaviorAction): BehaviorState {
  switch (action.type) {
    case 'ADD_EVENT': {
      const newEvent: BehaviorEvent = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        phase: state.currentPhase,
        ...action.payload,
      };
      
      const events = [newEvent, ...state.events].slice(0, MAX_EVENTS_QUEUE);
      const metrics = updateMetrics(state.metrics, action.payload.type, action.payload.metadata);
      
      return { ...state, events, metrics };
    }
    
    case 'SET_PHASE':
      return {
        ...state,
        currentPhase: action.payload.phase,
        phaseProgress: action.payload.progress ?? 0,
        phaseStartTime: Date.now(),
        // Reset metrics for new phase
        metrics: action.payload.phase !== state.currentPhase ? { ...initialMetrics } : state.metrics,
      };
    
    case 'UPDATE_PROGRESS':
      return { ...state, phaseProgress: Math.min(1, Math.max(0, action.payload)) };
    
    case 'CLEANUP_OLD_EVENTS': {
      const cutoffTime = Date.now() - (DECAY_HALF_LIFE_MS * 5); // Keep events for 5 half-lives
      const events = state.events.filter(e => e.timestamp > cutoffTime);
      return { ...state, events };
    }
    
    case 'RESET':
      return { ...initialState, phaseStartTime: Date.now() };
    
    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

interface BehaviorContextType {
  state: BehaviorState;
  addEvent: (type: BehaviorEventType, intensity?: number, metadata?: Record<string, any>) => void;
  setPhase: (phase: StudyPhase, progress?: number) => void;
  updateProgress: (progress: number) => void;
  getModifiers: () => BehaviorModifiers;
  reset: () => void;
}

const BehaviorContext = createContext<BehaviorContextType | null>(null);

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate exponential decay factor for an event
 * @param eventTimestamp - When the event occurred
 * @param currentTime - Current time
 * @returns Decay factor between 0 and 1
 */
function calculateDecay(eventTimestamp: number, currentTime: number): number {
  const age = currentTime - eventTimestamp;
  return Math.exp(-DECAY_CONSTANT * age);
}

/**
 * Calculate combined modulation from all recent events with decay
 */
function calculateEventModulation(events: BehaviorEvent[], currentTime: number): { alpha: number; beta: number; theta: number } {
  let alpha = 1.0;
  let beta = 1.0;
  let theta = 1.0;
  
  for (const event of events) {
    const modulation = EVENT_MODULATION[event.type];
    if (!modulation) continue;
    
    const age = currentTime - event.timestamp;
    if (age > modulation.duration * 3) continue; // Skip events past 3x duration
    
    const decay = calculateDecay(event.timestamp, currentTime);
    const intensity = event.intensity * decay;
    
    // Apply modulation with intensity scaling
    // Convert multiplier to deviation, apply intensity, then convert back
    alpha *= 1 + (modulation.alpha - 1) * intensity;
    beta *= 1 + (modulation.beta - 1) * intensity;
    theta *= 1 + (modulation.theta - 1) * intensity;
  }
  
  return { alpha, beta, theta };
}

// ============================================================================
// Provider
// ============================================================================

export function BehaviorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(behaviorReducer, initialState);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup old events periodically
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(() => {
      dispatch({ type: 'CLEANUP_OLD_EVENTS' });
    }, 30000); // Every 30 seconds
    
    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, []);
  
  const addEvent = useCallback((
    type: BehaviorEventType,
    intensity: number = 1.0,
    metadata?: Record<string, any>
  ) => {
    dispatch({
      type: 'ADD_EVENT',
      payload: { type, intensity: Math.min(1, Math.max(0, intensity)), metadata },
    });
  }, []);
  
  const setPhase = useCallback((phase: StudyPhase, progress?: number) => {
    dispatch({ type: 'SET_PHASE', payload: { phase, progress } });
    // Auto-add phase_started event
    dispatch({
      type: 'ADD_EVENT',
      payload: { type: 'phase_started', intensity: 0.5 },
    });
  }, []);
  
  const updateProgress = useCallback((progress: number) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: progress });
  }, []);
  
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);
  
  const getModifiers = useCallback((): BehaviorModifiers => {
    const currentTime = Date.now();
    const phaseBaseline = PHASE_BASELINES[state.currentPhase];
    const eventModulation = calculateEventModulation(state.events, currentTime);
    
    // Combine phase baseline with event modulation
    const alphaModifier = phaseBaseline.alpha * eventModulation.alpha;
    const betaModifier = phaseBaseline.beta * eventModulation.beta;
    const thetaModifier = phaseBaseline.theta * eventModulation.theta;
    
    // Get recent events (last 10 with significant decay factor)
    const recentEvents = state.events
      .filter(e => calculateDecay(e.timestamp, currentTime) > 0.1)
      .slice(0, 10);
    
    return {
      currentPhase: state.currentPhase,
      phaseProgress: state.phaseProgress,
      phaseStartTime: state.phaseStartTime,
      recentEvents,
      aggregateMetrics: state.metrics,
      alphaModifier,
      betaModifier,
      thetaModifier,
    };
  }, [state]);
  
  const value: BehaviorContextType = {
    state,
    addEvent,
    setPhase,
    updateProgress,
    getModifiers,
    reset,
  };
  
  return (
    <BehaviorContext.Provider value={value}>
      {children}
    </BehaviorContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useBehavior() {
  const context = useContext(BehaviorContext);
  if (!context) {
    throw new Error('useBehavior must be used within a BehaviorProvider');
  }
  return context;
}

// ============================================================================
// Utility Hook for Phase-specific Behavior Tracking
// ============================================================================

/**
 * Hook for tracking behavior within a specific phase
 * Automatically sets phase on mount and tracks progress
 */
export function usePhaseTracker(phase: StudyPhase, totalDuration?: number) {
  const { setPhase, updateProgress, addEvent } = useBehavior();
  const startTimeRef = useRef<number>(Date.now());
  
  useEffect(() => {
    startTimeRef.current = Date.now();
    setPhase(phase);
    
    return () => {
      addEvent('phase_completed', 0.5);
    };
  }, [phase, setPhase, addEvent]);
  
  // Update progress if duration is provided
  useEffect(() => {
    if (!totalDuration) return;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(1, elapsed / totalDuration);
      updateProgress(progress);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [totalDuration, updateProgress]);
  
  return { addEvent };
}

export default BehaviorContext;
