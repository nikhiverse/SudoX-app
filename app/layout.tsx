// Yeh file puri website ka dhancha (layout) tayyar karti hai jisme SudoX logo,
// top bar aur menu har webpage par barabar dikhte hain.

import type { Metadata } from 'next';
import Image from 'next/image';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next";
import './globals.css';

export const metadata: Metadata = {
  title: 'SudoX - Sudoku Puzzle Variants',
  description:
    'Play 16 unique Sudoku variants daily — standard, jigsaw, windoku, twodoku, and more. Free, no login required.',
  openGraph: {
    title: 'SudoX - Sudoku Puzzle Variants',
    description: 'Play 16 unique Sudoku variants daily.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" defer></script>
        {/* Restore saved theme before first paint to avoid flash */}
        <script dangerouslySetInnerHTML={{
          __html: `
          (function() {
            try {
              var t = localStorage.getItem('sudox:theme');
              if (t === 'dark') document.documentElement.classList.add('force-dark');
              else if (t === 'light') document.documentElement.classList.add('force-light');
            } catch(e) {}
          })();
        `}} />
      </head>
      <body>
        {/* ── TOP BAR ── */}
        <header className="topbar">
          {/* Brand is a non-interactive element — clicking logo should NOT navigate.
              The game page has its own "All Variants" back button for navigation. */}
          <div className="topbar-brand">
            <Image src="/favicon.png" alt="SudoX Logo" width={28} height={28} style={{ borderRadius: '6px' }} />
            <span className="topbar-name">SudoX</span>
          </div>
          <div className="topbar-right">
            <DateDisplay />
            <HamburgerButton />
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main className="container">{children}</main>

        {/* ── FOOTER ── */}
        <footer>
          <p>
            created by{' '}
            <a
              href="https://www.linkedin.com/in/rathodnk"
              target="_blank"
              rel="noopener noreferrer"
            >
              rathodnk
            </a>
          </p>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

// ── Client Components inlined for simplicity ──

function DateDisplay() {
  return <ClientDateDisplay />;
}

function HamburgerButton() {
  return <ClientHamburgerButton />;
}

// These are separate client components imported below
import { ClientDateDisplay } from '@/components/layout/ClientDateDisplay';
import { ClientHamburgerButton } from '@/components/layout/ClientHamburgerButton';
