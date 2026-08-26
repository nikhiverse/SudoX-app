// ═══════════════════════════════════════════
// SudoX — Next.js Middleware
// Adds security headers to all responses.
// ═══════════════════════════════════════════

import { NextResponse } from 'next/server';


export function middleware() {
  const response = NextResponse.next();

  // ── Security Headers ──

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Force HTTPS (Vercel already does this, but belt-and-suspenders)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );

  // Disable unnecessary browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  const isDev = process.env.NODE_ENV === 'development';
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vercel.live"
    : "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://vercel.live";
  const connectSrc = isDev
    ? "connect-src 'self' ws: wss: https://va.vercel-scripts.com https://vitals.vercel-insights.com https://vercel.live wss://ws-us3.pusher.com"
    : "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com https://vercel.live wss://ws-us3.pusher.com";

  // Content Security Policy — allow self, Vercel Analytics, Google Fonts,
  // and the inline theme-restore script (via 'unsafe-inline' for style/script).
  // Vercel toolbar/feedback is injected into ALL deployments (including preview)
  // from vercel.live and vercel.com CDN — these must be whitelisted explicitly.
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://vercel.live",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://vercel.com https://vercel.live",
      connectSrc,
      // 'self' for PWA manifest; vercel.com CDN + vercel.live for Vercel toolbar manifest
      "manifest-src 'self' https://vercel.com https://vercel.live",
      "worker-src 'self' blob:",
      "media-src 'self'",
      // Vercel feedback toolbar renders inside an iframe from vercel.live
      "frame-src 'self' https://vercel.live",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  // Prevent XSS attacks in older browsers
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

// Apply middleware to all routes except static assets and internals
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.png|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml).*)',
  ],
};
