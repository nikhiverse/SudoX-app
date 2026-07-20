// ═══════════════════════════════════════════
// PuzzleHeader — back button, title, ID, timer
// ═══════════════════════════════════════════

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Timer } from './Timer';
import { Modal } from '@/components/ui/Modal';

interface PuzzleHeaderProps {
  title: string;
  puzzleId: string;
  timerDisplay: string;
  timerEmoji: string;
  lives?: number;
  canLeaveDirectly?: boolean;
}

export function PuzzleHeader({ title, puzzleId, timerDisplay, timerEmoji, lives, canLeaveDirectly }: PuzzleHeaderProps) {
  const router = useRouter();
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const confirmLeave = () => {
    setShowLeaveModal(false);
    router.push('/');
  };

  return (
    <div className="puzzle-header">
      <div className="puzzle-nav-row">
        <Link 
          href="/"
          className="nav-back"
          onClick={(e) => {
            if (!canLeaveDirectly) {
              e.preventDefault();
              setShowLeaveModal(true);
            }
          }}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
          All Variants
        </Link>
        <Timer display={timerDisplay} emoji={timerEmoji} />
      </div>
      <div className="puzzle-title-row">
        <div className="puzzle-title-block">
          <h2 className="puzzle-title">{title}</h2>
          {puzzleId && <p className="puzzle-id">#{puzzleId}</p>}
        </div>
        {lives !== undefined && (
          <div className="puzzle-hearts">
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ opacity: i < lives ? 1 : 0.3 }}>❤️</span>
            ))}
          </div>
        )}
      </div>

      <Modal 
        isOpen={showLeaveModal} 
        onClose={() => setShowLeaveModal(false)}
        title="Leave Game?"
        variant="warning"
        footer={
          <>
            <button className="action-btn ghost" onClick={() => setShowLeaveModal(false)}>Cancel</button>
            <button className="action-btn primary" onClick={confirmLeave} style={{ backgroundColor: 'var(--wrong-text)', borderColor: 'var(--wrong-text)' }}>Yes, leave</button>
          </>
        }
      >
        <p>Are you sure you want to leave?<br/>Your current puzzle progress will be lost!</p>
      </Modal>
    </div>
  );
}
