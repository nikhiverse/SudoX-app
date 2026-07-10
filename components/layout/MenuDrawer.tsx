'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { requestPdfDownload } from '@/services/PdfExportService';
import { Modal } from '@/components/ui/Modal';
import { getVariantFromUrl } from '@/lib/constants';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// SVG icon helpers
const icons = {
  about: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
  theme: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  login: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
    </svg>
  ),
  guide: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12M6 11l6 6 6-6" />
      <path d="M3 18h18" />
    </svg>
  ),
  reachout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  follow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  ),
};

export function MenuDrawer({ isOpen, onClose }: MenuDrawerProps) {
  const pathname = usePathname();
  const isGameActive = pathname?.startsWith('/play/');
  const rawVariant = isGameActive ? pathname.split('/')[2] : '';
  const variant = rawVariant ? getVariantFromUrl(rawVariant) : null;

  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isFollowOpen, setIsFollowOpen] = useState(false);

  const handleAction = (action: string) => {
    onClose();
    switch (action) {
      case 'about':
        setIsAboutOpen(true);
        break;
      case 'theme':
        setIsThemeOpen(true);
        break;
      case 'guide':
        setIsGuideOpen(true);
        break;
      case 'download':
        requestPdfDownload();
        break;
      case 'login':
        setIsLoginOpen(true);
        break;
      case 'follow':
        setIsFollowOpen(true);
        break;
    }
  };

  const gameItems = [
    { label: 'Guide to Play', icon: icons.guide, action: 'guide' },
    { label: 'Theme', icon: icons.theme, action: 'theme' },
    { label: 'Download PDF', icon: icons.download, action: 'download' },
    { divider: true },
    { label: 'Mail Me', icon: icons.reachout, href: 'mailto:nikhil.sudox@gmail.com' },
    { label: 'Follow Us', icon: icons.follow, action: 'follow' },
    { label: 'Login', icon: icons.login, action: 'login' },
  ];

  const homeItems = [
    { label: 'About', icon: icons.about, action: 'about' },
    { label: 'Theme', icon: icons.theme, action: 'theme' },
    { divider: true },
    { label: 'Mail Me', icon: icons.reachout, href: 'mailto:nikhil.sudox@gmail.com' },
    { label: 'Follow Us', icon: icons.follow, action: 'follow' },
    { label: 'Login', icon: icons.login, action: 'login' },
  ];

  const items = isGameActive ? gameItems : homeItems;

  return (
    <>
      {/* Overlay */}
      <div
        className={`menu-overlay ${isOpen ? 'visible' : ''}`}
        style={{ display: isOpen ? undefined : 'none' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <nav
        className={`menu-drawer ${isOpen ? 'visible' : ''}`}
        style={{ display: isOpen ? undefined : 'none' }}
      >
        <div className="drawer-header">
          <span className="drawer-title">Menu</span>
          <button className="drawer-close" aria-label="Close menu" onClick={onClose}>
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ul className="drawer-list">
          {items.map((item, i) => {
            if ('divider' in item && item.divider) {
              return <li key={`div-${i}`} className="drawer-divider" />;
            }
            if ('href' in item) {
              const href = item.href as string;
              return (
                <li key={`href-${i}`}>
                  <a
                    href={href}
                    className="drawer-item"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                    onClick={() => {
                      setTimeout(onClose, 300);
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </a>
                </li>
              );
            }
            if ('action' in item) {
              const action = item.action as string;
              return (
                <li key={action}>
                  <button
                    className="drawer-item"
                    onClick={() => handleAction(action)}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                </li>
              );
            }
            return null;
          })}
        </ul>
      </nav>

      {/* Modals */}
      <Modal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} title="About SudoX">
        <p>SudoX is a daily brain workout that takes classic Sudoku to the next level</p>
        <p>Every day brings a fresh puzzle in sizes ranging from a quick 6x6 to a massive 12x12 grid.</p>
        <p>With 16 unique Sudoku variants daily; standard, jigsaw, windoku, twodoku, and more.</p>
        <p>You&apos;ll always have a fun, new way to test your logic!</p>
        <p>No login required to play for now. Just click and start solving.</p>
        <p style={{ marginTop: '0.5rem' }}>Created and Built by <a href="https://www.linkedin.com/in/rathodnk" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'none' }}>Nikhil Rathod</a>.</p>
      </Modal>

      <Modal isOpen={isFollowOpen} onClose={() => setIsFollowOpen(false)} title="Follow Us">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
          <a href="https://x.com/SudoXDaily" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'var(--text-primary)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
            </svg>
            <span style={{ fontSize: '16px', fontWeight: 500 }}>SudoXDaily</span>
          </a>
          <a href="https://www.facebook.com/SudoXDaily/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'var(--text-primary)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
            </svg>
            <span style={{ fontSize: '16px', fontWeight: 500 }}>SudoXDaily</span>
          </a>
          <a href="https://www.instagram.com/sudox.ig/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'var(--text-primary)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            <span style={{ fontSize: '16px', fontWeight: 500 }}>sudox.ig</span>
          </a>
        </div>
      </Modal>

      <Modal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} title="How to Play">
        {variant === 'sudoku_mini' ? (
          <ol style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Fill the empty cells in the 6x6 grid using only the numbers 1 to 6.</li>
            <li>Ensure that every horizontal row and vertical column contains each number exactly once without any repeats.</li>
            <li>Make sure every 2x3 rectangular <b>i.e, subgrid</b> also contains the numbers exactly once.</li>
            <li><strong>Green</strong> = correct, <strong>Red</strong> = wrong.</li>
            <li>Use the eraser (or Backspace) to clear a cell.</li>
            <li>Complete all cells correctly to solve the puzzle!</li>
          </ol>
        ) : ['sudoku_easy', 'sudoku9', 'sudoku_a'].includes(variant || '') ? (
          <ol style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Fill the empty cells in the 9x9 grid using only the numbers 1 to 9.</li>
            <li>Each Row must contain every number from 1 to 9 exactly once.</li>
            <li>Each Column must contain every number from 1 to 9 exactly once.</li>
            <li>Make sure every 3x3 square <b>i.e, subgrid</b> contains the numbers exactly once.</li>
            <li><strong>Green</strong> = correct, <strong>Red</strong> = wrong.</li>
            <li>Use the eraser (or Backspace) to clear a cell.</li>
            <li>Complete all cells correctly to solve the puzzle!</li>
          </ol>
        ) : variant === 'sudokuX' ? (
          <ol style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Fill the empty cells in the 9x9 grid using only the numbers 1 to 9.</li>
            <li>Ensure that every horizontal row and vertical column contains each number exactly once without any repeats.</li>
            <li>Make sure every 3x3 square subgrid and <b>two diagonals</b> contains the numbers exactly once.</li>
            <li><strong>Green</strong> = correct, <strong>Red</strong> = wrong.</li>
            <li>Use the eraser (or Backspace) to clear a cell.</li>
            <li>Complete all cells correctly to solve the puzzle!</li>
          </ol>
        ) : variant === 'windoku' ? (
          <ol style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Fill the empty cells in the 9x9 grid using only the numbers 1 to 9.</li>
            <li>Ensure that every horizontal row and vertical column contains each number exactly once without any repeats.</li>
            <li>Make sure every 3x3 square subgrid and <b>four windows i.e., four colored subgrid of 3x3</b> contains the numbers exactly once.</li>
            <li><strong>Green</strong> = correct, <strong>Red</strong> = wrong.</li>
            <li>Use the eraser (or Backspace) to clear a cell.</li>
            <li>Complete all cells correctly to solve the puzzle!</li>
          </ol>
        ) : variant === 'windokuX' ? (
          <ol style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Fill the empty cells in the 9x9 grid using only the numbers 1 to 9.</li>
            <li>Ensure that every horizontal row and vertical column contains each number exactly once without any repeats.</li>
            <li>Make sure every 3x3 square subgrid contains the numbers exactly once.</li>
            <li>It is a mixture of SudokuX and Windoku. Make sure <b>two diagonals and four windows</b> contains each number without repeating.</li>
            <li><strong>Green</strong> = correct, <strong>Red</strong> = wrong.</li>
            <li>Use the eraser (or Backspace) to clear a cell.</li>
            <li>Complete all cells correctly to solve the puzzle!</li>
          </ol>
        ) : variant === 'jigsaw8' ? (
          <ol style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Fill the empty cells in the 8x8 grid using only the numbers 1 to 8.</li>
            <li>Ensure that every horizontal row and vertical column contains each number exactly once without any repeats.</li>
            <li>Grid is made up from two different shape of subgrids <b>i.e., 2x4, 4x2 and two wrapped 2x2</b> placed randomly. Make sure they also contain each number exactly once without any repeats.</li>
            <li><strong>Green</strong> = correct, <strong>Red</strong> = wrong.</li>
            <li>Use the eraser (or Backspace) to clear a cell.</li>
            <li>Complete all cells correctly to solve the puzzle!</li>
          </ol>
        ) : variant === 'jigsaw9' ? (
          <ol style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Fill the empty cells in the 9x9 grid using only the numbers 1 to 9.</li>
            <li>Ensure that every horizontal row and vertical column contains each number exactly once without any repeats.</li>
            <li>Instead of traditional squares, the grid is divided into irregular, interlocking puzzle-piece shapes.</li>
            <li>Make sure that each of these uniquely shaped subgrids also contains every number exactly once.</li>
            <li><strong>Green</strong> = correct, <strong>Red</strong> = wrong.</li>
            <li>Use the eraser (or Backspace) to clear a cell.</li>
            <li>Complete all cells correctly to solve the puzzle!</li>
          </ol>
        ) : variant === 'jigsawX' ? (
          <ol style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Fill the empty cells in the 9x9 grid using only the numbers 1 to 9.</li>
            <li>Ensure that every horizontal row and vertical column contains each number exactly once without any repeats.</li>
            <li>Instead of traditional squares, the grid is divided into irregular, interlocking puzzle-piece shapes.</li>
            <li>Make sure that each of these uniquely shaped subgrids and <b>two diagonals of grid</b> contains every number exactly once.</li>
            <li><strong>Green</strong> = correct, <strong>Red</strong> = wrong.</li>
            <li>Use the eraser (or Backspace) to clear a cell.</li>
            <li>Complete all cells correctly to solve the puzzle!</li>
          </ol>
        ) : variant === 'windoku_jigsaw' ? (
          <ol style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Fill the empty cells in the 9x9 grid using only the numbers 1 to 9.</li>
            <li>Ensure that every horizontal row and vertical column contains each number exactly once without any repeats.</li>
            <li>Instead of traditional squares, the grid is divided into irregular, interlocking puzzle-piece shapes.</li>
            <li>Make sure that each of these uniquely shaped subgrids and <b>four 3x3 squared subgrids</b> contains every number exactly once.</li>
            <li><strong>Green</strong> = correct, <strong>Red</strong> = wrong.</li>
            <li>Use the eraser (or Backspace) to clear a cell.</li>
            <li>Complete all cells correctly to solve the puzzle!</li>
          </ol>
        ) : variant === 'sudoku12' ? (
          <ol style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Fill the empty cells in the 12x12 grid using only the numbers 1 to 9 and A-C.</li>
            <li>Ensure that every horizontal row and vertical column contains each character exactly once without any repeats.</li>
            <li>Make sure every 3x4 rectangular subgrid also contains the characters exactly once.</li>
            <li><strong>Green</strong> = correct, <strong>Red</strong> = wrong.</li>
            <li>Use the eraser (or Backspace) to clear a cell.</li>
            <li>Complete all cells correctly to solve the puzzle!</li>
          </ol>
        ) : variant === 'dozaku' ? (
          <ol style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Fill the empty cells in the 12x12 grid using only the numbers 1 to 9 and A-C.</li>
            <li>Ensure that every horizontal row and vertical column contains each character exactly once without any repeats.</li>
            <li>Make sure every <b>3x4 rectangular subgrid</b> along with <b>4x3 another rectangular subgrid</b> contains the characters exactly once.</li>
            <li><strong>Green</strong> = correct, <strong>Red</strong> = wrong.</li>
            <li>Use the eraser (or Backspace) to clear a cell.</li>
            <li>Complete all cells correctly to solve the puzzle!</li>
          </ol>
        ) : variant === 'twodoku_mini' ? (
          <ol style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Fill both 6x6 grids ensuring that every horizontal row and vertical column contains the numbers 1 to 6 exactly once.</li>
            <li>The puzzle consists of two separate grids that overlap on exactly 4 shared cells, which must correctly solve both intersecting boards.</li>
            <li>Make sure every <b>2x3 subgrid</b> in the first grid, and every <b>3x2 subgrid</b> in the second grid, also contains each number without repeats.</li>
            <li><strong>Green</strong> = correct, <strong>Red</strong> = wrong.</li>
            <li>Use the eraser (or Backspace) to clear a cell.</li>
            <li>Complete all cells correctly to solve the puzzle!</li>
          </ol>
        ) : variant === 'twodoku8' ? (
          <ol style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Fill both 8x8 grids ensuring that every horizontal row and vertical column contains the numbers 1 to 8 exactly once.</li>
            <li>The puzzle consists of two separate grids that overlap on a shared 4x4 square region (16 cells), which must correctly solve both intersecting boards.</li>
            <li>Make sure every <b>rectangular subgrid</b> in both grids, featuring a mixture of <b>2x4</b> and <b>4x2</b> layouts, also contains each number without any repeats.</li>
            <li><strong>Green</strong> = correct, <strong>Red</strong> = wrong.</li>
            <li>Use the eraser (or Backspace) to clear a cell.</li>
            <li>Complete all cells correctly to solve the puzzle!</li>
          </ol>
        ) : variant === 'twodoku9' ? (
          <ol style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Fill both 9x9 grids ensuring that every horizontal row and vertical column contains the numbers 1 to 9 exactly once.</li>
            <li>The puzzle consists of two separate grids that overlap on a shared 3x3 square region (9 cells), which must correctly solve both intersecting boards.</li>
            <li>Make sure every <b>squared 3x3 subgrid</b> in both grids, also contains each number without any repeats.</li>
            <li><strong>Green</strong> = correct, <strong>Red</strong> = wrong.</li>
            <li>Use the eraser (or Backspace) to clear a cell.</li>
            <li>Complete all cells correctly to solve the puzzle!</li>
          </ol>
        ) : (<ol style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>Click a cell to select it.</li>
          <li>Use the number buttons or keyboard to fill in values.</li>
          <li><strong>Green</strong> = correct, <strong>Red</strong> = wrong.</li>
          <li>Use the eraser (or Backspace) to clear a cell.</li>
          <li>Arrow keys navigate between cells.</li>
          <li>Complete all cells correctly to solve the puzzle!</li>
        </ol>)}
      </Modal>

      <Modal isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} title="Choose Theme">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            className="action-btn ghost"
            onClick={() => {
              document.documentElement.classList.add('force-light');
              document.documentElement.classList.remove('force-dark');
              localStorage.setItem('sudox:theme', 'light');
              setIsThemeOpen(false);
            }}
          >
            Light Mode
          </button>
          <button
            className="action-btn ghost"
            onClick={() => {
              document.documentElement.classList.add('force-dark');
              document.documentElement.classList.remove('force-light');
              localStorage.setItem('sudox:theme', 'dark');
              setIsThemeOpen(false);
            }}
          >
            Dark Mode
          </button>
        </div>
      </Modal>

      <Modal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} title="Login">
        <p>Login feature coming soon! Stay tuned.</p>
      </Modal>
    </>
  );
}