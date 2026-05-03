// ═══════════════════════════════════════════
// SudoX — Custom 404 Page
// ═══════════════════════════════════════════

import Link from 'next/link';

export default function NotFound() {
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
      <p
        style={{
          fontFamily: "'Courier Prime', monospace",
          fontSize: '64px',
          fontWeight: 700,
          color: 'var(--primary)',
          lineHeight: 1,
        }}
      >
        404
      </p>
      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        Page Not Found
      </h2>
      <p
        style={{
          fontSize: '15px',
          color: 'var(--text-secondary)',
          maxWidth: '360px',
        }}
      >
        This puzzle doesn&apos;t seem to exist. Head back to the home page and pick a variant.
      </p>
      <Link href="/" className="action-btn primary">
        ← All Variants
      </Link>
    </div>
  );
}
