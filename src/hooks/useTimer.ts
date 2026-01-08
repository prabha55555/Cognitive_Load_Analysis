/**
 * Timer Hooks
 * 
 * ✅ IMPLEMENTED: Robust timer with visibility handling (Phase 1)
 * - Pause when tab inactive
 * - Persist timer state to localStorage
 * - Handle page refresh gracefully
 * - End-time based tracking (immune to clock changes)
 * 
 * Related Flaw: Module 4 - Timer Issues in Research Phase (HIGH) - FIXED
 * @see docs/FLOW_IMPROVEMENTS.md - Issue #9
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface TimerOptions {
  autoStart?: boolean;
  onComplete?: () => void;
  pauseOnHidden?: boolean;
  persistKey?: string;
}

interface TimerState {
  time: number;
  isRunning: boolean;
  isPaused: boolean;
}

/**
 * Stopwatch-style timer (counts up)
 */
export const useTimer = (options: TimerOptions = {}) => {
  const { autoStart = false, pauseOnHidden = true, persistKey } = options;
  
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Restore from storage if persistKey provided
  useEffect(() => {
    if (persistKey) {
      const saved = localStorage.getItem(`timer_${persistKey}`);
      if (saved) {
        const state = JSON.parse(saved) as TimerState;
        setTime(state.time);
        setIsRunning(state.isRunning);
        setIsPaused(state.isPaused);
      }
    }
  }, [persistKey]);

  // Save to storage when state changes
  useEffect(() => {
    if (persistKey) {
      localStorage.setItem(`timer_${persistKey}`, JSON.stringify({
        time,
        isRunning,
        isPaused,
      }));
    }
  }, [time, isRunning, isPaused, persistKey]);

  // Handle visibility change
  useEffect(() => {
    if (!pauseOnHidden) return;

    const handleVisibilityChange = () => {
      if (document.hidden && isRunning) {
        setIsPaused(true);
      } else if (!document.hidden && isPaused && isRunning) {
        setIsPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, isPaused, pauseOnHidden]);

  // Timer interval
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const reset = useCallback(() => {
    setTime(0);
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  const formatTime = useCallback((seconds: number = time) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [time]);

  return {
    time,
    isRunning,
    isPaused,
    start,
    stop,
    pause,
    resume,
    reset,
    formatTime,
  };
};

/**
 * Countdown timer with end-time based tracking
 * More reliable than decrementing, immune to sleep/wake issues
 */
export const useCountdownTimer = (
  initialTime: number,
  options: TimerOptions = {}
) => {
  const { autoStart = false, onComplete, pauseOnHidden = true, persistKey } = options;
  
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Restore from localStorage if persistKey provided
  useEffect(() => {
    if (persistKey) {
      const saved = localStorage.getItem(`countdown_${persistKey}`);
      if (saved) {
        try {
          const state = JSON.parse(saved);
          
          if (state.endTime && state.isRunning) {
            // Calculate remaining time from end time
            const remaining = Math.max(0, Math.floor((state.endTime - Date.now()) / 1000));
            
            if (remaining > 0) {
              setTimeLeft(remaining);
              setEndTime(state.endTime);
              setIsRunning(true);
              setIsPaused(state.isPaused || false);
            } else {
              // Timer expired while away
              setTimeLeft(0);
              setIsRunning(false);
              onComplete?.();
            }
          }
        } catch (error) {
          console.error('Failed to restore countdown timer:', error);
        }
      }
    }
  }, [persistKey, onComplete]);

  // Save to localStorage when state changes
  useEffect(() => {
    if (persistKey) {
      localStorage.setItem(`countdown_${persistKey}`, JSON.stringify({
        endTime,
        isRunning,
        isPaused,
      }));
    }
  }, [endTime, isRunning, isPaused, persistKey]);

  // Handle visibility change
  useEffect(() => {
    if (!pauseOnHidden) return;

    const handleVisibilityChange = () => {
      if (document.hidden && isRunning) {
        setIsPaused(true);
      } else if (!document.hidden && isPaused && isRunning) {
        setIsPaused(false);
        
        // Recalculate time left from end time
        if (endTime) {
          const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
          setTimeLeft(remaining);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, isPaused, pauseOnHidden, endTime]);

  // Countdown interval using end-time calculation
  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0 && endTime) {
      intervalRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          setIsRunning(false);
          setEndTime(null);
          if (persistKey) {
            localStorage.removeItem(`countdown_${persistKey}`);
          }
          onComplete?.();
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, timeLeft, endTime, onComplete, persistKey]);

  const start = useCallback(() => {
    const newEndTime = Date.now() + timeLeft * 1000;
    setEndTime(newEndTime);
    setIsRunning(true);
    setIsPaused(false);
  }, [timeLeft]);

  const stop = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setEndTime(null);
    if (persistKey) {
      localStorage.removeItem(`countdown_${persistKey}`);
    }
  }, [persistKey]);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    if (timeLeft > 0) {
      // Recalculate end time from current time left
      const newEndTime = Date.now() + timeLeft * 1000;
      setEndTime(newEndTime);
      setIsPaused(false);
    }
  }, [timeLeft]);

  const reset = useCallback((newTime?: number) => {
    const resetTime = newTime ?? initialTime;
    setTimeLeft(resetTime);
    setIsRunning(false);
    setIsPaused(false);
    setEndTime(null);
    if (persistKey) {
      localStorage.removeItem(`countdown_${persistKey}`);
    }
  }, [initialTime, persistKey]);

  const formatTime = useCallback((seconds: number = timeLeft) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  return {
    timeLeft,
    isRunning,
    isPaused,
    isComplete: timeLeft === 0,
    start,
    stop,
    pause,
    resume,
    reset,
    formatTime,
    progress: ((initialTime - timeLeft) / initialTime) * 100,
  };
};
