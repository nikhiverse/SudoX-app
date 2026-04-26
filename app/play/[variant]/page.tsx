// ═══════════════════════════════════════════
// Game Page — /play/[variant]
// Client component that fetches puzzle,
// renders grid, handles input.
// ═══════════════════════════════════════════

'use client';

import { use, useCallback, useEffect, useState, useRef } from 'react';
import { usePuzzle } from '@/hooks/usePuzzle';
import { useGameState } from '@/hooks/useGameState';
import { useTimer } from '@/hooks/useTimer';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useLives } from '@/hooks/useLives';
import { PuzzleHeader } from '@/components/game/PuzzleHeader';
import { PuzzleGrid } from '@/components/game/PuzzleGrid';
import { NumberPanel } from '@/components/game/NumberPanel';
import { Modal } from '@/components/ui/Modal';
import { GAME_NAMES, VALID_GAMES, getVariantFromUrl } from '@/lib/constants';
import { onPdfDownloadRequest, exportPuzzleToPdf } from '@/services/PdfExportService';
import type { GameVariant } from '@/lib/types';

interface GamePageProps {
  params: Promise<{ variant: string }>;
}

export default function GamePage({ params }: GamePageProps) {
  const { variant: rawVariant } = use(params);
  const variant = getVariantFromUrl(rawVariant);

  // Validate variant
  if (!VALID_GAMES.includes(variant as GameVariant)) {
    return (
      <div className="puzzle-view">
        <div className="puzzle-header">
          <h2 className="puzzle-title">Unknown Variant</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            &ldquo;{variant}&rdquo; is not a valid puzzle variant.
          </p>
        </div>
      </div>
    );
  }

  const game = variant as GameVariant;
  const gameName = GAME_NAMES[game] || variant;

  return (
    <div className="puzzle-view">
      <GameLoader game={game} gameName={gameName} />
    </div>
  );
}

// ── Separate component for the loaded state ──

function GameLoader({ game, gameName }: { game: GameVariant; gameName: string }) {
  const { data, loading, error, retry } = usePuzzle(game);

  if (loading) {
    return (
      <>
        <PuzzleHeader
          title={gameName}
          puzzleId=""
          timerDisplay="0:00"
          timerEmoji="🕐"
        />
        <div className="puzzle-output">
          <div className="loading-spinner" />
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PuzzleHeader
          title={gameName}
          puzzleId=""
          timerDisplay="0:00"
          timerEmoji="🕐"
        />
        <div className="puzzle-output">
          <p style={{ color: 'var(--primary)', fontFamily: "'DM Sans', sans-serif" }}>
            {error || 'Failed to load puzzle'}
          </p>
          <button className="action-btn ghost" onClick={retry} style={{ marginTop: 12 }}>
            Try Again
          </button>
        </div>
      </>
    );
  }

  return (
    <GameActive
      game={game}
      gameName={gameName}
      puzzleData={data.puzzleData}
      uniqueId={data.uniqueId}
    />
  );
}

// ── Active game with all hooks ──

function GameActive({
  game,
  gameName,
  puzzleData,
  uniqueId,
}: {
  game: GameVariant;
  gameName: string;
  puzzleData: import('@/lib/types').PuzzleData;
  uniqueId: string;
}) {
  const { manager, stateVersion, moveCursor, writeValue, eraseValue, syncTimer, initialTimerSeconds } = useGameState(puzzleData, game);
  const timer = useTimer();
  const { lives, recordMistake, isLocked, isInitialized } = useLives();
  const gameIsLocked = isLocked(game);
  const isCompleted = manager.isCompleted();

  // No beforeunload dialog needed — all state (grid + timer) is persisted
  // to localStorage so page refresh seamlessly restores everything (Wordle-style).

  const [autoDismissModal, setAutoDismissModal] = useState<{ title: string, message: string, type?: 'default' | 'warning' } | null>(null);

  // Auto-dismiss effect
  useEffect(() => {
    if (autoDismissModal) {
      const timer = setTimeout(() => setAutoDismissModal(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [autoDismissModal]);

  const initHandledRef = useRef(false);

  // Check state on exact mount (once loaded)
  useEffect(() => {
    if (!isInitialized) return;

    if (!initHandledRef.current) {
      initHandledRef.current = true;
      if (isCompleted) {
        setAutoDismissModal({ title: 'Finished', message: 'You have already finished this puzzle!' });
      } else if (gameIsLocked) {
        setAutoDismissModal({ title: 'Locked', message: 'Better luck tomorrow!', type: 'warning' });
      } else if (lives === 0) {
        setAutoDismissModal({ title: '⚠️ Warning', message: 'You have 0 lives left!\nOne mistake will lock this puzzle.', type: 'warning' });
      } else if (lives === 1) {
        setAutoDismissModal({ title: '⚠️ Warning', message: 'You have only 1 life left!\nPlay wisely.', type: 'warning' });
      }
    }
  }, [isInitialized, isCompleted, gameIsLocked, lives]);

  const prevIsCompleted = useRef(isCompleted);
  const prevIsLocked = useRef(gameIsLocked);

  // Active game changes
  useEffect(() => {
    if (!initHandledRef.current) return;

    if (!prevIsCompleted.current && isCompleted) {
      setAutoDismissModal({ title: '🎉 Congratulations!', message: 'You done with this puzzle! Keep it up.' });
    }
    prevIsCompleted.current = isCompleted;

    if (!prevIsLocked.current && gameIsLocked && !isCompleted) {
      setAutoDismissModal({ title: 'Game Locked', message: 'Better try tomorrow', type: 'warning' });
    }
    prevIsLocked.current = gameIsLocked;
  }, [isCompleted, gameIsLocked, stateVersion]);

  // Start timer immediately when puzzle loads
  useEffect(() => {
    timer.start(initialTimerSeconds);
    return () => timer.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync the current timer to the state manager for persistence
  useEffect(() => {
    syncTimer(timer.seconds);
  }, [timer.seconds, syncTimer]);

  // Stop timer if the game is successfully fully solved or locked
  useEffect(() => {
    if (manager.isCompleted() || gameIsLocked) {
      timer.stop();
    }
  }, [stateVersion, manager, timer, gameIsLocked]);

  // Listen for PDF download requests from MenuDrawer
  useEffect(() => {
    return onPdfDownloadRequest(() => {
      exportPuzzleToPdf(gameName, uniqueId);
    });
  }, [gameName, uniqueId]);

  const wrappedWriteValue = useCallback((r: number, c: number, val: number) => {
    if (gameIsLocked) {
      setAutoDismissModal({ title: 'Game Locked', message: 'Better try tomorrow', type: 'warning' });
      return;
    }

    // Check if it's a mistake before writing
    if (val !== 0 && !manager.isCorrect(r, c) && !manager.isClue(r, c)) {
      if (manager.getState().solutionGrid) {
        const expected = manager.getState().solutionGrid![r][c];
        if (expected !== undefined && val !== expected) {
          recordMistake(game);
        }
      }
    }

    writeValue(r, c, val);
  }, [gameIsLocked, manager, recordMistake, game, writeValue]);

  const wrappedEraseValue = useCallback((r: number, c: number) => {
    if (gameIsLocked) {
      setAutoDismissModal({ title: 'Game Locked', message: 'Better try tomorrow', type: 'warning' });
      return;
    }
    eraseValue(r, c);
  }, [gameIsLocked, eraseValue]);

  // Keyboard handler
  useKeyboard({
    manager,
    moveCursor,
    writeValue: wrappedWriteValue,
    eraseValue: wrappedEraseValue,
    enabled: !gameIsLocked,
  });

  const handleCellClick = useCallback((r: number, c: number) => {
    moveCursor(r, c);
  }, [moveCursor]);

  const handleNumberClick = useCallback((val: number) => {
    const cursor = manager.getCursor();
    if (cursor.r >= 0 && cursor.c >= 0) {
      wrappedWriteValue(cursor.r, cursor.c, val);
    }
  }, [manager, wrappedWriteValue]);

  const handleErase = useCallback(() => {
    const cursor = manager.getCursor();
    if (cursor.r >= 0 && cursor.c >= 0) {
      wrappedEraseValue(cursor.r, cursor.c);
    }
  }, [manager, wrappedEraseValue]);

  return (
    <>
      <PuzzleHeader
        title={gameName}
        puzzleId={uniqueId}
        timerDisplay={timer.display}
        timerEmoji={timer.emoji}
        lives={lives}
        canLeaveDirectly={manager.isCompleted() || gameIsLocked}
      />

      <PuzzleGrid
        manager={manager}
        stateVersion={stateVersion}
        onCellClick={handleCellClick}
        game={game}
      />

      <NumberPanel
        manager={manager}
        stateVersion={stateVersion}
        onNumberClick={handleNumberClick}
        onErase={handleErase}
      />

      <Modal
        isOpen={autoDismissModal !== null}
        onClose={() => setAutoDismissModal(null)}
        title={autoDismissModal?.title || ''}
        footer={null}
        variant={autoDismissModal?.type || 'default'}
      >
        <p>{autoDismissModal?.message}</p>
      </Modal>
    </>
  );
}
