// ═══════════════════════════════════════════
// useScreenshotPrevention — blocks screenshot
// attempts on the puzzle page.
//
// ⚠️  Disabled on localhost & test environments
// so devs can inspect the UI freely.
//
// Strategy (browser-side — best-effort):
//  1. CSS: user-select:none + print media query
//     hides the grid from the print spooler
//     (which screenshot tools like iOS/Android
//     Share Sheet use internally).
//  2. JS keydown: intercepts common OS hotkeys
//     (PrintScreen, Meta+Shift+3/4/S, Win+PrintScreen)
//     and shows a toast instead.
//  3. visibilitychange: blurs sensitive content
//     when the tab loses focus (Android screenshot
//     typically fires this during capture).
//
// NOTE: This can never be 100% foolproof — OS-level
// screenshots bypass the browser entirely.
// The PDF download is the canonical export path.
// ═══════════════════════════════════════════

'use client';

import { useEffect, useRef } from 'react';

/** Returns true when running in a dev/test environment */
function isDevOrTest(): boolean {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname;
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('192.168.') ||
    host.endsWith('.local') ||
    host.endsWith('.test') ||
    // Vercel preview deployments contain "vercel.app" but not the prod domain
    (host.endsWith('vercel.app') && !host.startsWith('sudox-app'))
  );
}

interface Options {
  /** CSS selector of the element to blur on focus-loss (default: '.sudoku-grid') */
  targetSelector?: string;
  /** Callback fired when a screenshot attempt is detected */
  onAttempt?: () => void;
}

export function useScreenshotPrevention({ targetSelector = '.sudoku-grid', onAttempt }: Options = {}) {
  const onAttemptRef = useRef(onAttempt);
  onAttemptRef.current = onAttempt;

  useEffect(() => {
    // Skip entirely in dev / test / preview
    if (isDevOrTest()) return;

    // ── 1. CSS print-media hide + user-select none ──
    const styleEl = document.createElement('style');
    styleEl.id = 'sudox-no-screenshot';
    styleEl.textContent = `
      @media print {
        .sudoku-grid,
        .puzzle-output,
        .grid-cell {
          visibility: hidden !important;
          opacity: 0 !important;
        }
      }
      .sudoku-grid,
      .grid-cell {
        -webkit-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
    `;
    document.head.appendChild(styleEl);

    // ── 2. Keyboard intercept ──
    const BLOCKED_KEYS = new Set([
      'PrintScreen',
      'F13', // some keyboards map PrtSc to F13
    ]);

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');

      const isScreenshotHotkey =
        BLOCKED_KEYS.has(e.key) ||
        // macOS: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
        (isMac && e.metaKey && e.shiftKey && ['3', '4', '5', 's'].includes(e.key.toLowerCase())) ||
        // Windows: Win+PrintScreen or plain PrintScreen
        (e.key === 'PrintScreen') ||
        // Some Linux WMs
        (e.key === 'SysRq');

      if (isScreenshotHotkey) {
        e.preventDefault();
        e.stopImmediatePropagation();
        onAttemptRef.current?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });

    // ── 3. Blur grid on visibility change (mobile screenshot) ──
    let blurTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleVisibilityChange = () => {
      const target = document.querySelector<HTMLElement>(targetSelector);
      if (!target) return;

      if (document.visibilityState === 'hidden') {
        // Obscure the grid immediately when tab/app is backgrounded
        target.style.filter = 'blur(12px)';
        target.style.transition = 'filter 0ms';
      } else {
        // Restore after a short delay to avoid flash on normal tab-switching
        blurTimeout = setTimeout(() => {
          target.style.filter = '';
          target.style.transition = 'filter 300ms ease';
        }, 400);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      styleEl.remove();
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (blurTimeout) clearTimeout(blurTimeout);

      // Restore any residual blur
      const target = document.querySelector<HTMLElement>(targetSelector);
      if (target) {
        target.style.filter = '';
        target.style.transition = '';
      }
    };
  }, [targetSelector]);
}
