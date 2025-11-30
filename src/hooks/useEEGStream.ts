import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { EEGData } from '../types';
import { biosignalService, BiosignalData, BehaviorModifiers } from '../services/biosignalService';
import { apiConfig } from '../config/apiConfig';

// ============================================================================
// Real-time EEG Wave Generation Constants
// ============================================================================

// Natural EEG frequency bands (Hz)
const EEG_BANDS = {
  theta: { min: 4, max: 8, baseAmplitude: 40 },
  alpha: { min: 8, max: 12, baseAmplitude: 50 },
  beta: { min: 12, max: 30, baseAmplitude: 35 },
};

// Phase-specific modulation profiles
const PHASE_PROFILES: Record<string, { theta: number; alpha: number; beta: number; loadBase: number }> = {
  idle: { theta: 1.0, alpha: 1.1, beta: 0.9, loadBase: 25 },
  research: { theta: 1.1, alpha: 0.95, beta: 1.05, loadBase: 45 },
  assessment: { theta: 1.15, alpha: 0.85, beta: 1.2, loadBase: 65 },
  creativity: { theta: 1.2, alpha: 1.05, beta: 0.95, loadBase: 55 },
  results: { theta: 0.95, alpha: 1.1, beta: 0.9, loadBase: 30 },
};

// Event impact on EEG (immediate effects that decay)
const EVENT_IMPACTS: Record<string, { theta: number; alpha: number; beta: number; load: number; duration: number }> = {
  time_warning: { theta: 1.15, alpha: 0.8, beta: 1.25, load: 15, duration: 8000 },
  answer_submitted_correct: { theta: 0.95, alpha: 1.15, beta: 0.9, load: -10, duration: 4000 },
  answer_submitted_incorrect: { theta: 1.2, alpha: 0.75, beta: 1.3, load: 20, duration: 6000 },
  answer_changed: { theta: 1.1, alpha: 0.9, beta: 1.1, load: 8, duration: 4000 },
  question_started: { theta: 1.05, alpha: 0.95, beta: 1.05, load: 5, duration: 3000 },
  query_submitted: { theta: 1.08, alpha: 0.98, beta: 1.05, load: 3, duration: 3000 },
  topic_changed: { theta: 1.15, alpha: 0.85, beta: 1.15, load: 12, duration: 5000 },
  creative_typing: { theta: 1.1, alpha: 1.1, beta: 0.95, load: -5, duration: 3000 },
  creative_response_submitted: { theta: 0.95, alpha: 1.15, beta: 0.9, load: -8, duration: 4000 },
  phase_started: { theta: 1.05, alpha: 0.95, beta: 1.05, load: 5, duration: 3000 },
};

/**
 * Options for the EEG stream hook
 */
interface UseEEGStreamOptions {
  /** Cognitive load score (0-100) for biosignal generation */
  cognitiveLoadScore?: number;
  /** Metrics for calculating cognitive load if score not provided */
  metrics?: {
    interactionCount: number;
    clarificationRequests: number;
    assessmentTime: number;
    assessmentAccuracy: number;
    timeSpent: number;
  };
  /** Platform being used (chatgpt or google) */
  platform?: 'chatgpt' | 'google';
  /** Whether to use Chronos-generated data (true) or fallback simulation (false) */
  useChronos?: boolean;
  /** Behavior modifiers for real-time EEG modulation */
  behaviorModifiers?: BehaviorModifiers;
  /** Polling interval for behavior-modulated requests (ms) */
  pollingInterval?: number;
}

/**
 * Custom hook for EEG data streaming
 * 
 * Provides real-time EEG visualization data, either from the Chronos-based
 * biosignal service or from fallback simulation.
 */
export const useEEGStream = (
  participantId: string,
  isActive: boolean = true,
  options: UseEEGStreamOptions = {}
) => {
  const [eegData, setEEGData] = useState<EEGData[]>([]);
  const [currentReading, setCurrentReading] = useState<EEGData | null>(null);
  const [biosignalData, setBiosignalData] = useState<BiosignalData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const dataIndexRef = useRef(0);
  const behaviorModifiersRef = useRef<BehaviorModifiers | undefined>(undefined);
  
  const {
    cognitiveLoadScore,
    metrics,
    platform = 'unknown',
    useChronos = apiConfig.FEATURES?.ENABLE_EEG ?? false,
    behaviorModifiers,
    pollingInterval = 2500, // Default 2.5s polling for behavior updates
  } = options;

  /**
   * Fetch biosignal data from Chronos service (with optional behavior modifiers)
   */
  const fetchBiosignalData = useCallback(async (withBehavior: boolean = false) => {
    if (!participantId) return;
    
    // Only set loading on initial fetch, not on behavior updates
    if (!withBehavior) {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      const data = await biosignalService.generateBiosignal({
        participantId,
        cognitiveLoadScore,
        metrics,
        platform,
        numPoints: 50,
        behaviorModifiers: withBehavior ? behaviorModifiers : undefined,
      });
      
      setBiosignalData(data);
      
      // Only reset index on initial load, not behavior updates
      if (!withBehavior) {
        dataIndexRef.current = 0;
      }
      
      console.log('[useEEGStream] Biosignal data loaded:', {
        phase: data.metadata.behaviorModulation?.phase || 'none',
        alphaModifier: data.metadata.behaviorModulation?.alphaModifier?.toFixed(3) || 'N/A',
        effectiveLoad: data.metadata.effectiveLoad || data.metadata.cognitiveLoadScore,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch biosignal data';
      setError(errorMessage);
      console.error('[useEEGStream] Error:', errorMessage);
    } finally {
      if (!withBehavior) {
        setIsLoading(false);
      }
    }
  }, [participantId, cognitiveLoadScore, metrics, platform, behaviorModifiers]);

  /**
   * Calculate event-based modulation from recent behavior events
   */
  const calculateEventModulation = useCallback(() => {
    const modifiers = behaviorModifiersRef.current;
    const now = Date.now();
    
    let thetaMod = 1.0;
    let alphaMod = 1.0;
    let betaMod = 1.0;
    let loadMod = 0;
    
    if (modifiers?.recentEvents) {
      for (const event of modifiers.recentEvents) {
        const impact = EVENT_IMPACTS[event.type];
        if (!impact) continue;
        
        const age = now - event.timestamp;
        if (age > impact.duration * 2) continue; // Skip old events
        
        // Exponential decay
        const decay = Math.exp(-age / impact.duration);
        const intensity = event.intensity * decay;
        
        // Apply modulation
        thetaMod *= 1 + (impact.theta - 1) * intensity;
        alphaMod *= 1 + (impact.alpha - 1) * intensity;
        betaMod *= 1 + (impact.beta - 1) * intensity;
        loadMod += impact.load * intensity;
      }
    }
    
    return { thetaMod, alphaMod, betaMod, loadMod };
  }, []);

  /**
   * Generate realistic real-time EEG waveform with behavior modulation
   */
  const generateRealtimeEEG = useCallback((): EEGData => {
    const timestamp = Date.now();
    const timeSeconds = timestamp / 1000;
    const modifiers = behaviorModifiersRef.current;
    
    // Get phase profile
    const phase = modifiers?.currentPhase || 'idle';
    const profile = PHASE_PROFILES[phase] || PHASE_PROFILES.idle;
    
    // Calculate event-based modulation
    const eventMod = calculateEventModulation();
    
    // Base cognitive load from phase + score + events
    const baseLoad = cognitiveLoadScore ?? profile.loadBase;
    
    // Generate natural-looking oscillations for each band
    // Using multiple sine waves at different frequencies creates realistic EEG-like patterns
    
    // Theta band (4-8 Hz) - memory, drowsiness
    const thetaFreq1 = 5 + Math.sin(timeSeconds * 0.3) * 1.5;
    const thetaFreq2 = 6.5 + Math.cos(timeSeconds * 0.5) * 1;
    const thetaBase = EEG_BANDS.theta.baseAmplitude * profile.theta * eventMod.thetaMod;
    const thetaPower = thetaBase + 
      Math.sin(timeSeconds * thetaFreq1) * 8 +
      Math.sin(timeSeconds * thetaFreq2) * 5 +
      (Math.random() - 0.5) * 6;
    
    // Alpha band (8-12 Hz) - relaxation, reduced attention
    const alphaFreq1 = 10 + Math.sin(timeSeconds * 0.4) * 1.5;
    const alphaFreq2 = 9 + Math.cos(timeSeconds * 0.6) * 1;
    const alphaBase = EEG_BANDS.alpha.baseAmplitude * profile.alpha * eventMod.alphaMod;
    const alphaPower = alphaBase +
      Math.sin(timeSeconds * alphaFreq1) * 10 +
      Math.sin(timeSeconds * alphaFreq2) * 6 +
      (Math.random() - 0.5) * 8;
    
    // Beta band (12-30 Hz) - active thinking, focus, anxiety
    const betaFreq1 = 18 + Math.sin(timeSeconds * 0.2) * 4;
    const betaFreq2 = 22 + Math.cos(timeSeconds * 0.35) * 3;
    const betaBase = EEG_BANDS.beta.baseAmplitude * profile.beta * eventMod.betaMod;
    const betaPower = betaBase +
      Math.sin(timeSeconds * betaFreq1) * 7 +
      Math.sin(timeSeconds * betaFreq2) * 4 +
      (Math.random() - 0.5) * 5;
    
    // Cognitive load with natural variation
    const loadVariation = Math.sin(timeSeconds * 0.15) * 8 + Math.sin(timeSeconds * 0.4) * 5;
    const cognitiveLoad = Math.max(0, Math.min(100, 
      baseLoad + eventMod.loadMod + loadVariation + (Math.random() - 0.5) * 6
    ));
    
    // Engagement derived from beta/alpha ratio and load
    const engagementBase = (betaPower / Math.max(alphaPower, 20)) * 40 + cognitiveLoad * 0.3;
    const engagement = Math.max(0, Math.min(100, engagementBase + (Math.random() - 0.5) * 8));
    
    return {
      participantId,
      timestamp,
      channels: {
        'Fp1': thetaPower * 0.9 + (Math.random() - 0.5) * 4,
        'Fp2': thetaPower * 0.85 + (Math.random() - 0.5) * 4,
        'F3': alphaPower * 0.95 + (Math.random() - 0.5) * 5,
        'F4': alphaPower * 0.9 + (Math.random() - 0.5) * 5,
        'C3': betaPower * 0.85 + (Math.random() - 0.5) * 3,
        'C4': betaPower * 0.8 + (Math.random() - 0.5) * 3,
      },
      cognitiveLoad,
      thetaPower: Math.max(0, thetaPower),
      alphaPower: Math.max(0, alphaPower),
      betaPower: Math.max(0, betaPower),
      engagement,
    };
  }, [participantId, cognitiveLoadScore, calculateEventModulation]);

  /**
   * Generate EEG reading from Chronos biosignal data (uses base patterns as seed)
   */
  const generateFromBiosignal = useCallback((): EEGData | null => {
    if (!biosignalData) return null;
    
    // Use Chronos data as baseline reference, but generate real-time variations
    const { metadata } = biosignalData;
    const modifiers = behaviorModifiersRef.current;
    
    // Get effective load from backend (includes phase baseline)
    const effectiveLoad = metadata.effectiveLoad || metadata.cognitiveLoadScore || cognitiveLoadScore || 50;
    
    // Generate real-time reading with Chronos-influenced baseline
    const reading = generateRealtimeEEG();
    
    // Blend with Chronos baseline if behavior modulation is present
    if (metadata.behaviorModulation) {
      const { alphaModifier, betaModifier, thetaModifier } = metadata.behaviorModulation;
      reading.alphaPower *= alphaModifier;
      reading.betaPower *= betaModifier;
      reading.thetaPower *= thetaModifier;
      
      // Adjust cognitive load towards effective load
      reading.cognitiveLoad = reading.cognitiveLoad * 0.3 + effectiveLoad * 0.7;
    }
    
    return reading;
  }, [biosignalData, cognitiveLoadScore, generateRealtimeEEG]);

  /**
   * Generate simulated EEG reading (fallback - uses same real-time generator)
   */
  const generateSimulatedReading = useCallback((): EEGData => {
    // Use the real-time generator for consistent behavior
    return generateRealtimeEEG();
  }, [generateRealtimeEEG]);

  /**
   * Generate EEG reading (uses Chronos data if available, fallback otherwise)
   */
  const generateEEGReading = useCallback((): EEGData => {
    // Always use real-time generation for responsive visualization
    // Chronos data influences the baseline through behaviorModifiers
    if (useChronos && biosignalData) {
      const chronosReading = generateFromBiosignal();
      if (chronosReading) return chronosReading;
    }
    return generateRealtimeEEG();
  }, [useChronos, biosignalData, generateFromBiosignal, generateRealtimeEEG]);

  // Keep behaviorModifiers ref updated
  useEffect(() => {
    behaviorModifiersRef.current = behaviorModifiers;
  }, [behaviorModifiers]);

  // Fetch biosignal data when Chronos is enabled and conditions change
  useEffect(() => {
    if (useChronos && isActive && participantId && (cognitiveLoadScore !== undefined || metrics)) {
      fetchBiosignalData(false);
    }
  }, [useChronos, isActive, participantId, cognitiveLoadScore, metrics, fetchBiosignalData]);

  // Set up polling for behavior-modulated updates (uses ref to avoid interval reset)
  useEffect(() => {
    if (!useChronos || !isActive) return;
    
    // Poll for behavior-modulated biosignal data
    const pollForBehavior = async () => {
      const modifiers = behaviorModifiersRef.current;
      if (!modifiers) return;
      
      // Only poll if there are recent events (within last 30 seconds)
      const hasRecentEvents = modifiers.recentEvents && modifiers.recentEvents.some(
        e => Date.now() - e.timestamp < 30000
      );
      
      // Also poll if phase is active (not idle)
      const isActivePhase = modifiers.currentPhase && modifiers.currentPhase !== 'idle';
      
      if (hasRecentEvents || isActivePhase) {
        console.log('[useEEGStream] Polling with behavior:', {
          phase: modifiers.currentPhase,
          recentEventsCount: modifiers.recentEvents?.length || 0,
          hasRecentEvents,
        });
        
        try {
          const data = await biosignalService.generateBiosignal({
            participantId,
            cognitiveLoadScore,
            metrics,
            platform,
            numPoints: 50,
            behaviorModifiers: modifiers,
          });
          setBiosignalData(data);
        } catch (err) {
          console.error('[useEEGStream] Polling error:', err);
        }
      }
    };
    
    pollingRef.current = setInterval(pollForBehavior, pollingInterval);
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [useChronos, isActive, participantId, cognitiveLoadScore, metrics, platform, pollingInterval]);

  // Start EEG data streaming
  useEffect(() => {
    if (isActive && participantId) {
      // If using Chronos, wait for data or error before starting
      // But if cognitiveLoadScore is not provided, use fallback immediately
      const shouldWaitForChronos = useChronos && 
        (cognitiveLoadScore !== undefined || metrics) && 
        !biosignalData && 
        !error;
      
      if (shouldWaitForChronos) {
        return;
      }
      
      intervalRef.current = setInterval(() => {
        const newReading = generateEEGReading();
        setCurrentReading(newReading);
        setEEGData(prev => [...prev.slice(-100), newReading]); // Keep last 100 readings
      }, 100); // Update every 100ms for smooth visualization
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [participantId, isActive, useChronos, biosignalData, error, cognitiveLoadScore, metrics, generateEEGReading]);

  /**
   * Refresh biosignal data
   */
  const refresh = useCallback(() => {
    if (useChronos) {
      fetchBiosignalData();
    }
  }, [useChronos, fetchBiosignalData]);

  /**
   * Clear all data
   */
  const reset = useCallback(() => {
    setEEGData([]);
    setCurrentReading(null);
    setBiosignalData(null);
    dataIndexRef.current = 0;
    setError(null);
    
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
  }, []);

  return {
    eegData,
    currentReading,
    biosignalData,
    isLoading,
    error,
    refresh,
    reset,
  };
};