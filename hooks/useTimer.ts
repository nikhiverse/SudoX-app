// ═══════════════════════════════════════════
// useTimer — React hook for the timer
// ═══════════════════════════════════════════

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { formatTimer, getClockEmoji } from '@/lib/grid-utils';

interface UseTimerResult {
  seconds: number;
  display: string;
  emoji: string;
  start: (fromSeconds?: number) => void;
  stop: () => void;
  reset: () => void;
  isRunning: boolean;
}

export function useTimer(): UseTimerResult {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const start = useCallback((fromSeconds: number = 0) => {
    // Clear any existing interval
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }

    secondsRef.current = fromSeconds;
    setSeconds(fromSeconds);
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    secondsRef.current = 0;
    setSeconds(0);
    setIsRunning(false);
  }, []);

  return {
    seconds,
    display: formatTimer(seconds),
    emoji: getClockEmoji(seconds),
    start,
    stop,
    reset,
    isRunning,
  };
}
