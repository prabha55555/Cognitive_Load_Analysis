import { useState, useEffect, useRef, useCallback } from 'react';
import { EEGData } from '../types';
import { biosignalService, BiosignalData } from '../services/biosignalService';
import { apiConfig } from '../config/apiConfig';

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
  const dataIndexRef = useRef(0);
  
  const {
    cognitiveLoadScore,
    metrics,
    platform = 'unknown',
    useChronos = apiConfig.FEATURES?.ENABLE_EEG ?? false,
  } = options;

  /**
   * Fetch biosignal data from Chronos service
   */
  const fetchBiosignalData = useCallback(async () => {
    if (!participantId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await biosignalService.generateBiosignal({
        participantId,
        cognitiveLoadScore,
        metrics,
        platform,
        numPoints: 50,
      });
      
      setBiosignalData(data);
      dataIndexRef.current = 0;
      console.log('[useEEGStream] Biosignal data loaded:', data.metadata);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch biosignal data';
      setError(errorMessage);
      console.error('[useEEGStream] Error:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [participantId, cognitiveLoadScore, metrics, platform]);

  /**
   * Generate EEG reading from Chronos biosignal data
   */
  const generateFromBiosignal = useCallback((): EEGData | null => {
    if (!biosignalData) return null;
    
    const { cognitiveLoadTimeline, brainwavePatterns, metadata } = biosignalData;
    const numPoints = cognitiveLoadTimeline.length;
    
    // Get current index and wrap around
    const index = dataIndexRef.current % numPoints;
    dataIndexRef.current++;
    
    const timestamp = Date.now();
    const cognitiveLoad = cognitiveLoadTimeline[index];
    
    // Add slight real-time variation for natural appearance
    const noise = (Math.random() - 0.5) * 3;
    
    return {
      participantId,
      timestamp,
      channels: {
        'Fp1': brainwavePatterns.theta[index] * 0.8 + noise,
        'Fp2': brainwavePatterns.theta[index] * 0.75 + noise,
        'F3': brainwavePatterns.alpha[index] * 0.9 + noise,
        'F4': brainwavePatterns.alpha[index] * 0.85 + noise,
        'C3': brainwavePatterns.beta[index] * 0.7 + noise,
        'C4': brainwavePatterns.beta[index] * 0.65 + noise,
      },
      cognitiveLoad: Math.max(0, Math.min(100, cognitiveLoad + noise)),
      thetaPower: brainwavePatterns.theta[index] + noise,
      alphaPower: brainwavePatterns.alpha[index] + noise,
      betaPower: brainwavePatterns.beta[index] + noise,
      engagement: Math.max(0, Math.min(100, cognitiveLoad * 0.85 + noise * 2)),
    };
  }, [biosignalData, participantId]);

  /**
   * Generate simulated EEG reading (fallback)
   */
  const generateSimulatedReading = useCallback((): EEGData => {
    const baseFreq = 0.1;
    const timestamp = Date.now();
    
    // Use provided cognitive load or simulate
    const targetLoad = cognitiveLoadScore ?? 50;
    const cognitiveLoad = Math.max(0, Math.min(100, 
      targetLoad + Math.sin(timestamp * baseFreq * 0.001) * 15 + 
      (Math.random() - 0.5) * 10
    ));
    
    // Scale brainwave patterns based on cognitive load
    const loadFactor = cognitiveLoad / 100;
    
    return {
      participantId,
      timestamp,
      channels: {
        'Fp1': Math.sin(timestamp * baseFreq * 0.001) * 50 + (Math.random() - 0.5) * 10,
        'Fp2': Math.cos(timestamp * baseFreq * 0.001) * 45 + (Math.random() - 0.5) * 10,
        'F3': Math.sin(timestamp * baseFreq * 0.0015) * 40 + (Math.random() - 0.5) * 8,
        'F4': Math.cos(timestamp * baseFreq * 0.0015) * 42 + (Math.random() - 0.5) * 8,
        'C3': Math.sin(timestamp * baseFreq * 0.0008) * 35 + (Math.random() - 0.5) * 6,
        'C4': Math.cos(timestamp * baseFreq * 0.0008) * 38 + (Math.random() - 0.5) * 6,
      },
      cognitiveLoad,
      // Theta increases with load
      thetaPower: 30 + loadFactor * 20 + Math.sin(timestamp * baseFreq * 0.0005) * 10 + (Math.random() - 0.5) * 5,
      // Alpha decreases with load
      alphaPower: 55 - loadFactor * 20 + Math.cos(timestamp * baseFreq * 0.0007) * 15 + (Math.random() - 0.5) * 8,
      // Beta increases with load
      betaPower: 25 + loadFactor * 25 + Math.sin(timestamp * baseFreq * 0.0012) * 10 + (Math.random() - 0.5) * 4,
      engagement: Math.max(0, Math.min(100, cognitiveLoad * 0.8 + (Math.random() - 0.5) * 10))
    };
  }, [participantId, cognitiveLoadScore]);

  /**
   * Generate EEG reading (uses Chronos data if available, fallback otherwise)
   */
  const generateEEGReading = useCallback((): EEGData => {
    if (useChronos && biosignalData) {
      const chronosReading = generateFromBiosignal();
      if (chronosReading) return chronosReading;
    }
    return generateSimulatedReading();
  }, [useChronos, biosignalData, generateFromBiosignal, generateSimulatedReading]);

  // Fetch biosignal data when Chronos is enabled and conditions change
  useEffect(() => {
    if (useChronos && isActive && participantId && (cognitiveLoadScore !== undefined || metrics)) {
      fetchBiosignalData();
    }
  }, [useChronos, isActive, participantId, cognitiveLoadScore, metrics, fetchBiosignalData]);

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