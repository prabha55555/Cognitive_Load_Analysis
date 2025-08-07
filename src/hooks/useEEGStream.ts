import { useState, useEffect, useRef } from 'react';
import { EEGData } from '../types';

// Simulate real-time EEG data streaming
export const useEEGStream = (participantId: string, isActive: boolean = true) => {
  const [eegData, setEEGData] = useState<EEGData[]>([]);
  const [currentReading, setCurrentReading] = useState<EEGData | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate EEG data generation
  const generateEEGReading = (): EEGData => {
    const baseFreq = 0.1;
    const timestamp = Date.now();
    
    // Simulate realistic EEG patterns
    const cognitiveLoad = Math.max(0, Math.min(100, 
      50 + Math.sin(timestamp * baseFreq * 0.001) * 20 + 
      (Math.random() - 0.5) * 15
    ));
    
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
      thetaPower: 30 + Math.sin(timestamp * baseFreq * 0.0005) * 15 + (Math.random() - 0.5) * 5,
      alphaPower: 40 + Math.cos(timestamp * baseFreq * 0.0007) * 20 + (Math.random() - 0.5) * 8,
      betaPower: 25 + Math.sin(timestamp * baseFreq * 0.0012) * 12 + (Math.random() - 0.5) * 4,
      engagement: Math.max(0, Math.min(100, cognitiveLoad * 0.8 + (Math.random() - 0.5) * 10))
    };
  };

  useEffect(() => {
    if (isActive && participantId) {
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
  }, [participantId, isActive]);

  return { eegData, currentReading };
};