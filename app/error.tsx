// ═══════════════════════════════════════════
// SudoX — Error Boundary
// Catches runtime errors and shows a recovery UI.
// ═══════════════════════════════════════════

'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('SudoX Error:', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        gap: '16px',
        textAlign: 'center',
        padding: '24px',
      }}
    >
      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '28px',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        Something went wrong
      </h2>
      <p
        style={{
          fontSize: '15px',
          color: 'var(--text-secondary)',
          maxWidth: '400px',
        }}
      >
        An unexpected error occurred. Please try again.
      </p>
      <button
        className="action-btn primary"
        onClick={reset}
      >
        Try Again
      </button>
    </div>
  );
}
