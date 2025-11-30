/**
 * Context Exports
 * 
 * Centralized exports for all React Context providers
 */

export { AuthProvider, useAuth } from './AuthContext';
export { SessionProvider, useSession } from './SessionContext';
export { 
  BehaviorProvider, 
  useBehavior, 
  usePhaseTracker,
  PHASE_BASELINES,
  EVENT_MODULATION,
  type StudyPhase,
  type BehaviorEventType,
  type BehaviorEvent,
  type BehaviorModifiers,
} from './BehaviorContext';
