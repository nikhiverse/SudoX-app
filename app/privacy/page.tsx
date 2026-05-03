// ═══════════════════════════════════════════
// SudoX — Privacy Policy
// ═══════════════════════════════════════════

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — SudoX',
  description: 'SudoX privacy policy — how we handle your data.',
};

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '28px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '24px',
        }}
      >
        Privacy Policy
      </h1>

      <div style={{ fontSize: '15px', lineHeight: 1.8, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p><strong>Last updated:</strong> May 2026</p>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>What We Collect</h2>
        <p>
          SudoX is a free puzzle game that requires <strong>no account</strong> and <strong>no login</strong>.
          We do not collect personal information such as names, email addresses, or payment details.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>Analytics</h2>
        <p>
          We use <strong>Vercel Analytics</strong> and <strong>Vercel Speed Insights</strong> to understand
          how our website performs. These tools collect anonymous, aggregate data such as:
        </p>
        <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
          <li>Page views and visitor counts</li>
          <li>Page load times and web vitals</li>
          <li>Device type and browser (anonymized)</li>
          <li>Geographic region (country-level, no precise location)</li>
        </ul>
        <p>No personally identifiable information is collected by these tools.</p>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>Local Storage</h2>
        <p>
          Your puzzle progress, game state, and theme preference are stored locally in your browser
          using <strong>localStorage</strong>. This data never leaves your device and is not sent to
          our servers. Data older than 7 days is automatically cleaned up.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>Cookies</h2>
        <p>
          SudoX does not set any first-party cookies. Vercel Analytics may use minimal,
          privacy-respecting techniques to measure traffic, but no tracking cookies are placed.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>Third-Party Services</h2>
        <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
          <li><strong>Vercel</strong> — hosting, analytics, and speed insights</li>
          <li><strong>Google Fonts</strong> — web fonts (Playfair Display, DM Sans, Courier Prime)</li>
          <li><strong>MongoDB Atlas</strong> — puzzle data storage (no personal data stored)</li>
        </ul>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>Changes</h2>
        <p>We may update this policy from time to time. Changes will be reflected on this page.</p>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>Contact</h2>
        <p>
          Questions? Reach out at{' '}
          <a href="mailto:nikhil.webdna@gmail.com" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
            nikhil.webdna@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
