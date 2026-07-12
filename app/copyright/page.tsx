// ═══════════════════════════════════════════
// SudoX Daily — Copyright Policy
// ═══════════════════════════════════════════

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Copyright Policy — SudoX Daily',
  description: 'SudoX Daily copyright policy and intellectual property notice.',
};

export default function CopyrightPage() {
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          Copyright Policy
        </h1>
        <Link href="/" className="nav-back" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: '12px', height: '12px' }}
          >
            <line x1="4" y1="4" x2="12" y2="12" />
            <line x1="12" y1="4" x2="4" y2="12" />
          </svg>
          Close
        </Link>
      </div>

      <div style={{ fontSize: '15px', lineHeight: 1.8, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p><strong>Last updated:</strong> July 2026</p>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>Ownership of Content</h2>
        <p>
          All content on the SudoX Daily platform, including but not limited to the underlying code,
          proprietary C++ puzzle generation algorithms, visual design, graphics, layouts,
          and trademarks, are the exclusive property of SudoX Daily and its creator, Nikhil Rathod{' '}
          <a href="https://www.linkedin.com/in/rathodnk" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
            (rathodnk)
          </a>.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>Puzzles</h2>
        <p>
          The daily puzzles presented on this site (including Jigsaw, Windoku, Twodoku, and all X-variants)
          are procedurally generated daily by our proprietary engine. While the concept of Sudoku
          is in the public domain, the specific arrangements, source code, and daily puzzle
          files hosted on SudoX Daily are copyrighted material.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>Prohibited Actions</h2>
        <p>
          Without explicit written permission, you may not:
        </p>
        <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
          <li>Copy, redistribute, or commercially exploit our daily generated puzzle data.</li>
          <li>Scrape or reverse-engineer the API to build competing products.</li>
          <li>Clone or redistribute the source code or visual assets of this web application.</li>
        </ul>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>Licensing</h2>
        <p>
          If you are interested in licensing our puzzles or puzzle-generation engine for your own
          publication, application, or event, please reach out to us to discuss a formal agreement.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>Contact Information</h2>
        <p>
          For copyright concerns or licensing inquiries, please contact:
        </p>
        <p>
          <a href="mailto:nikhil.sudox@gmail.com" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
            nikhil.sudox@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
