// ═══════════════════════════════════════════
// useWebviewDetect — In-App Browser Detection
// Detects if the app is running inside a social
// media in-app browser (Instagram, Facebook,
// Twitter, TikTok, LinkedIn, Snapchat, etc.)
// ═══════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';

/**
 * Checks the User Agent string to determine if the browser
 * is an in-app webview from a social media platform.
 *
 * Common social media webview identifiers:
 * - Instagram: "Instagram" in UA
 * - Facebook:  "FBAN" or "FBAV" in UA
 * - Twitter/X: "Twitter" in UA
 * - TikTok:    "BytedanceWebview" or "musical_ly" in UA
 * - LinkedIn:  "LinkedInApp" in UA
 * - Snapchat:  "Snapchat" in UA
 * - Pinterest: "Pinterest" in UA
 * - Telegram:  "TelegramBot" in UA (rare for user-facing)
 * - Generic:   "wv" flag (Android WebView) or missing "Safari" token
 */
function detectWebview(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent || navigator.vendor || '';

  // Specific social media in-app browser identifiers
  const webviewPatterns = [
    /Instagram/i,
    /FBAN|FBAV/i,        // Facebook App
    /Twitter/i,
    /BytedanceWebview|musical_ly/i, // TikTok
    /LinkedInApp/i,
    /Snapchat/i,
    /Pinterest/i,
  ];

  for (const pattern of webviewPatterns) {
    if (pattern.test(ua)) return true;
  }

  // Android generic WebView detection:
  // Android WebViews include "wv" in the UA but real Chrome does not
  if (/Android/.test(ua) && /wv/.test(ua)) {
    return true;
  }

  return false;
}

/**
 * React hook that returns whether the current browser is an
 * in-app webview. Safe for SSR (returns false on server).
 */
export function useWebviewDetect(): boolean {
  const [isWebview, setIsWebview] = useState(false);

  useEffect(() => {
    setIsWebview(detectWebview());
  }, []);

  return isWebview;
}
