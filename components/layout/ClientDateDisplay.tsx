'use client';

import { formatDisplayDate } from '@/lib/date-utils';
import { useSyncExternalStore } from 'react';

function subscribeToTime(callback: () => void) {
  const interval = setInterval(callback, 1000);
  return () => clearInterval(interval);
}

function getClientTime() {
  // IMPORTANT: useSyncExternalStore requires getSnapshot to return the *same*
  // value (Object.is-equal) when the external store hasn't changed.
  // Date.now() returns a different number every millisecond, causing React to
  // see a "changed store" after every single commit → schedules a synchronous
  // re-render → repeat 50× → React error #185 (Maximum update depth exceeded).
  // Rounding to the nearest second matches our 1-second setInterval and keeps
  // the snapshot stable between ticks.
  return Math.floor(Date.now() / 1000);
}

function getServerTime() {
  return null;
}

function getCountdownString(clientTime: number | null): string | null {
  if (!clientTime) return null;
  // clientTime is Unix seconds (Math.floor(Date.now()/1000)) — convert to ms for Date
  const istString = new Date(clientTime * 1000).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
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
    return `${mm}:${ss}`;
  }
  return null;
}

export function ClientDateDisplay() {
  const clientTime = useSyncExternalStore(subscribeToTime, getClientTime, getServerTime);

  if (!clientTime) return null; // Prevents hydration mismatch and UI flicker

  const countdown = getCountdownString(clientTime);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
      <span className="topbar-date">{formatDisplayDate()}</span>
      {countdown && (
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>
          Puzzle reset in <span style={{ color: 'var(--correct-text)', fontWeight: 600 }}>{countdown}</span>
        </span>
      )}
    </div>
  );
}

export default ClientDateDisplay;



