// ═══════════════════════════════════════════
// SudoX — Terms of Service
// ═══════════════════════════════════════════

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — SudoX',
  description: 'SudoX terms of service — rules for using SudoX.',
};

export default function TermsPage() {
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
        Terms of Service
      </h1>

      <div style={{ fontSize: '15px', lineHeight: 1.8, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p><strong>Last updated:</strong> May 2026</p>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>Acceptance</h2>
        <p>
          By using SudoX, you agree to these terms. If you do not agree, please do not use the website.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>Service Description</h2>
        <p>
          SudoX is a free, web-based puzzle game that provides 16 unique Sudoku variants daily.
          The service is provided &quot;as is&quot; without warranties of any kind.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>Fair Use</h2>
        <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
          <li>Do not attempt to overload, abuse, or disrupt the service</li>
          <li>Do not scrape, crawl, or programmatically access the API beyond normal gameplay</li>
          <li>Do not attempt to reverse-engineer or tamper with puzzle solutions</li>
        </ul>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>Intellectual Property</h2>
        <p>
          All puzzle generation algorithms, game designs, and website content are the property
          of SudoX and its creator. The daily puzzles themselves are generated procedurally and
          are free to play.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>Limitation of Liability</h2>
        <p>
          SudoX is provided for entertainment purposes. We are not liable for any loss of data,
          progress, or any indirect damages arising from use of the service.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>Availability</h2>
        <p>
          We strive to keep SudoX available 24/7, but we do not guarantee uninterrupted service.
          Puzzles are generated daily, and occasional outages may occur during maintenance.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>Changes</h2>
        <p>We may modify these terms at any time. Continued use constitutes acceptance of updated terms.</p>

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
