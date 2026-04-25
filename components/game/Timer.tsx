// ═══════════════════════════════════════════
// Timer — display component
// ═══════════════════════════════════════════

'use client';

interface TimerProps {
  display: string;
  emoji: string;
}

export function Timer({ display, emoji }: TimerProps) {
  return (
    <div className="puzzle-timer">
      <span className="timer-icon">{emoji}</span>
      <span className="timer-display">{display}</span>
    </div>
  );
}
