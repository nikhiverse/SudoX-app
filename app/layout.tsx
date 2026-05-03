// Yeh file puri website ka dhancha (layout) tayyar karti hai jisme SudoX logo,
// top bar aur menu har webpage par barabar dikhte hain.

import type { Metadata, Viewport } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next";
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://sudox-app.vercel.app'),
  title: {
    default: 'SudoX - Daily Sudoku Puzzle Variants',
    template: '%s | SudoX',
  },
  description:
    'Play 16 unique Sudoku variants daily — standard, jigsaw, windoku, twodoku, and more. Free, no login required.',
  keywords: [
    'sudoku', 'puzzle', 'daily puzzle', 'sudoku variants', 'jigsaw sudoku',
    'windoku', 'twodoku', 'sudoku x', 'brain games', 'logic puzzle',
  ],
  openGraph: {
    title: 'SudoX - Daily Sudoku Puzzle Variants',
    description: 'Play 16 unique Sudoku variants daily. Free, no login required.',
    type: 'website',
    url: 'https://sudox-app.vercel.app',
    siteName: 'SudoX',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SudoX — 16 Daily Sudoku Variants',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SudoX - Daily Sudoku Puzzle Variants',
    description: 'Play 16 unique Sudoku variants daily. Free, no login required.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fef9f0' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
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
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/favicon.png" />
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
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'SudoX',
              description:
                'Play 16 unique Sudoku variants daily — standard, jigsaw, windoku, twodoku, and more. Free, no login required.',
              applicationCategory: 'GameApplication',
              operatingSystem: 'Any',
              url: 'https://sudox-app.vercel.app',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
            }),
          }}
        />
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
          <p style={{ marginTop: '6px', fontSize: '12px' }}>
            <Link href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</Link>
            {' · '}
            <Link href="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</Link>
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
