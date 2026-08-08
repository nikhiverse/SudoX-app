'use client';

import { formatDisplayDate } from '@/lib/date-utils';
import { useSyncExternalStore, useEffect, useState } from 'react';

// Client-side date display — avoids useEffect+setState pattern
// which triggers cascading renders in React 19 strict lint.

function subscribeNoop() {
  return () => {};
}

function getClientDate() {
  return formatDisplayDate();
}

function getServerDate() {
  return '';
}

export function ClientDateDisplay({ serverTimeNow }: { serverTimeNow: number }) {
  const date = useSyncExternalStore(subscribeNoop, getClientDate, getServerDate);
  const [countdown, setCountdown] = useState<string | null>(null);
  
  // Calculate offset between server and client clock ONCE
  const [timeOffset] = useState(() => serverTimeNow - Date.now());

  useEffect(() => {
    const updateCountdown = () => {
      // Adjust client clock using the server offset
      const adjustedTime = new Date(Date.now() + timeOffset);
      // Localize adjusted time to IST
      const istString = adjustedTime.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      const current = new Date(istString);
      
      const nextMidnight = new Date(current);
      nextMidnight.setHours(24, 0, 0, 0);
      
      const msUntilMidnight = nextMidnight.getTime() - current.getTime();
      
      if (msUntilMidnight <= 60 * 60 * 1000 && msUntilMidnight > 0) {
        const totalSeconds = Math.floor(msUntilMidnight / 1000);
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        
        const mm = String(m).padStart(2, '0');
        const ss = String(s).padStart(2, '0');
        setCountdown(`${mm}:${ss}`);
      } else {
        setCountdown(null);
      }
    };
    
    // Evaluate immediately but asynchronously to respect React 19's effect rule
    setTimeout(updateCountdown, 0);
    
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [timeOffset]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
      <span className="topbar-date">{date}</span>
      {countdown && (
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>
          Puzzle reset in <span style={{ color: 'var(--correct-text)', fontWeight: 600 }}>{countdown}</span>
        </span>
      )}
    </div>
  );
}

