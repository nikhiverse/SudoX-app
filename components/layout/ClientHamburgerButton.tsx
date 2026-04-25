'use client';

import { useState } from 'react';
import { MenuDrawer } from './MenuDrawer';

export function ClientHamburgerButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className={`hamburger-btn ${isOpen ? 'open' : ''}`}
        aria-label="Menu"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>

      <MenuDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
