/**
 * Timer Hooks
 * 
 * TODO: Implement robust timer with visibility handling
 * - Pause when tab inactive
 * - Persist timer state
 * - Handle page refresh
 * 
 * Related Flaw: Module 4 - Timer Issues in Research Phase (HIGH)
 * @see docs/FLAWS_AND_ISSUES.md
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
 * Countdown timer
 */
export const useCountdownTimer = (
  initialTime: number,
  options: TimerOptions = {}
) => {
  const { autoStart = false, onComplete, pauseOnHidden = true, persistKey: _persistKey } = options;
  
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Countdown interval
  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
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
  }, [isRunning, isPaused, timeLeft, onComplete]);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
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

  const reset = useCallback((newTime?: number) => {
    setTimeLeft(newTime ?? initialTime);
    setIsRunning(false);
    setIsPaused(false);
  }, [initialTime]);

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
