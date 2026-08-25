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
  
  // Track start time for background execution accuracy
  const startTimeRef = useRef<number>(0);
  const startSecondsRef = useRef<number>(initialSeconds);

  // Track whether we've already seeded the timer from initialSeconds.
  const initializedRef = useRef(false);

  // When initialSeconds arrive (e.g. restored from localStorage after mount),
  // seed the timer once — but only if it hasn't started yet.
  // NOTE: `seconds` is intentionally NOT in the dep array; including it would
  // create an infinite loop (setSeconds → seconds changes → effect re-fires).
  useEffect(() => {
    if (!isRunning && !initializedRef.current && initialSeconds > 0) {
      initializedRef.current = true;
      setSeconds(initialSeconds);
      startSecondsRef.current = initialSeconds;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSeconds, isRunning]);

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

    startSecondsRef.current = fromSeconds;
    startTimeRef.current = Date.now();
    setSeconds(fromSeconds);
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTimeRef.current) / 1000);
      setSeconds(startSecondsRef.current + elapsedSeconds);
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
    startSecondsRef.current = 0;
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
