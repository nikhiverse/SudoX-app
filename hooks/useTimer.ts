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

export function useTimer(initialSeconds: number = 0): UseTimerResult {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(initialSeconds);

  // When initialSeconds change (e.g. from 0 to the actual saved value on mount),
  // update the state if the timer hasn't started yet.
  useEffect(() => {
    if (!isRunning && initialSeconds > 0 && seconds === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSeconds(initialSeconds);
      secondsRef.current = initialSeconds;
    }
  }, [initialSeconds, isRunning, seconds]);

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
