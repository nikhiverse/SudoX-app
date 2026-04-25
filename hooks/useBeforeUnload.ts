// ═══════════════════════════════════════════
// useBeforeUnload — Prevent accidental reload
//
// Jab user game ke beech mein galti se page
// reload karta hai ya tab band karta hai, tab
// browser ek warning dialog dikhata hai.
// ═══════════════════════════════════════════

import { useEffect } from 'react';

/**
 * Attaches a `beforeunload` browser warning when `active` is true.
 *
 * @param active  true  → warn on reload/tab-close (game in progress)
 *               false → no warning (game completed or locked)
 */
export function useBeforeUnload(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Standard way to trigger the browser's built-in "Leave site?" dialog.
      e.preventDefault();
      // Some older browsers need returnValue to be set.
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup: remove listener when component unmounts or active becomes false
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [active]);
}
