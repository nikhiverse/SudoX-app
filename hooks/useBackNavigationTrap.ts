// ═══════════════════════════════════════════
// useBackNavigationTrap — Trap back button to prevent exit
// ═══════════════════════════════════════════

import { useEffect, useRef } from 'react';

interface UseBackNavigationTrapProps {
  active: boolean;
  onTrapTriggered: () => void;
}

export function useBackNavigationTrap({ active, onTrapTriggered }: UseBackNavigationTrapProps) {
  const isExitingRef = useRef(false);

  useEffect(() => {
    if (!active) return;

    // Push an initial trapped state onto the history stack to intercept back navigation
    const state = window.history.state;
    if (!state || !state.trapped) {
      window.history.pushState({ trapped: true }, '', window.location.pathname);
    }

    const handlePopState = (event: PopStateEvent) => {
      // If we are intentionally exiting, do not trigger the trap again
      if (isExitingRef.current) return;

      // If the state popped does not contain trapped: true, it means they pressed back
      if (!event.state || !event.state.trapped) {
        // Trigger the custom callback (e.g. open the confirmation modal)
        onTrapTriggered();

        // Immediately re-push the trapped state to re-arm the trap
        window.history.pushState({ trapped: true }, '', window.location.pathname);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [active, onTrapTriggered]);

  const exitApp = () => {
    isExitingRef.current = true;
    
    try {
      window.close(); // Attempt to close PWA/WebAPK natively
    } catch (e) {}

    if (window.history.length > 2) {
      window.history.go(-2); // Go past trap and initial state
    } else {
      window.history.back(); // Clear trap so next hardware back natively closes app
    }
  };

  return { exitApp };
}
