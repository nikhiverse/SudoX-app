// Yeh file puri website ka dhancha (layout) tayyar karti hai jisme SudoX logo,
// top bar aur menu har webpage par barabar dikhte hain.

import type { Metadata, Viewport } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next";
import dynamic from 'next/dynamic';
const ClientDateDisplay = dynamic(
  () => import('@/components/layout/ClientDateDisplay').then(m => m.ClientDateDisplay),
  { ssr: false }
);
import { ClientHamburgerButton } from '@/components/layout/ClientHamburgerButton';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://sudox-app.vercel.app'),
  title: {
    default: 'SudoX Daily - Daily Sudoku Puzzle Variants',
    template: '%s | SudoX Daily',
  },
  description:
    'Play 16 unique Sudoku variants daily — standard, jigsaw, windoku, twodoku, and more. Free, no login required.',
  keywords: [
    'sudoku', 'puzzle', 'daily puzzle', 'sudoku variants', 'jigsaw sudoku',
    'windoku', 'twodoku', 'sudoku x', 'brain games', 'logic puzzle',
  ],
  openGraph: {
    title: 'SudoX Daily - Daily Sudoku Puzzle Variants',
    description: 'Play 16 unique Sudoku variants daily. Free, no login required.',
    type: 'website',
    url: 'https://sudox-app.vercel.app',
    siteName: 'SudoX',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SudoX Daily — 16 Daily Sudoku Variants',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SudoX Daily - Daily Sudoku Puzzle Variants',
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
  themeColor: '#fef9f0',
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
              document.documentElement.classList.add('force-light');
              document.documentElement.classList.remove('force-dark');
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
              name: 'SudoX Daily',
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
            <Image src="/favicon.png" alt="SudoX Daily Logo" width={28} height={28} style={{ borderRadius: '6px' }} />
            <span className="topbar-name">SudoX Daily</span>
          </div>
          <div className="topbar-right">
            <ClientDateDisplay />
            <ClientHamburgerButton />
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main className="container">{children}</main>

        {/* ── FOOTER ── */}
        <footer>

          <p style={{ marginTop: '6px', fontSize: '12px' }}>
            <Link href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</Link>
            {' · '}
            <Link href="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</Link>
            {' · '}
            <Link href="/copyright" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>© 2026 SudoX Daily</Link>
          </p>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
