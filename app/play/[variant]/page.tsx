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
import { StorageService } from '@/services/StorageService';
import { getTodayDateString } from '@/lib/date-utils';
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

// ── Helper: format an ISO timestamp to a friendly "HH:MM AM/PM" string ──

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const h = d.getHours();
    const m = d.getMinutes();
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  } catch {
    return '';
  }
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
  const timer = useTimer(initialTimerSeconds);
  const { lives, recordMistake, isLocked, isInitialized } = useLives();
  const gameIsLocked = isLocked(game);
  const isCompleted = manager.isCompleted();

  // No beforeunload dialog needed — all state (grid + timer) is persisted
  // to localStorage so page refresh seamlessly restores everything (Wordle-style).

  const [autoDismissModal, setAutoDismissModal] = useState<{ title: string, message: string, type?: 'default' | 'warning' } | null>(null);

  // Read saved timestamps for display on revisit
  const [finishedAt, setFinishedAt] = useState<string | undefined>();
  const [lockedAt, setLockedAt] = useState<string | undefined>();

  useEffect(() => {
    const today = getTodayDateString();
    const saved = StorageService.getProgress(game, today);
    if (saved?.finishedAt) setFinishedAt(saved.finishedAt);
    if (saved?.lockedAt) setLockedAt(saved.lockedAt);
  }, [game]);

  // Auto-dismiss effect
  useEffect(() => {
    if (autoDismissModal) {
      const t = setTimeout(() => setAutoDismissModal(null), 1000);
      return () => clearTimeout(t);
    }
  }, [autoDismissModal]);

  const initHandledRef = useRef(false);

  // Check state on exact mount (once loaded)
  useEffect(() => {
    if (!isInitialized) return;

    if (!initHandledRef.current) {
      initHandledRef.current = true;
      
      // On revisit of a completed or locked puzzle, do NOT show any dialog.
      // The timer area will show the completion/lock time instead.
      if (isCompleted || gameIsLocked) {
        return;
      }

      // Do not show dialogue boxes on refresh of an in-progress puzzle
      if (initialTimerSeconds > 0) {
        return;
      }

      if (lives === 0) {
        setAutoDismissModal({ title: '⚠️ Warning', message: 'You have 0 lives left!\nOne mistake will lock this puzzle.', type: 'warning' });
      } else if (lives === 1) {
        setAutoDismissModal({ title: '⚠️ Warning', message: 'You have only 1 life left!\nPlay wisely.', type: 'warning' });
      }
    }
  }, [isInitialized, isCompleted, gameIsLocked, lives, initialTimerSeconds]);

  const prevIsCompleted = useRef(isCompleted);
  const prevIsLocked = useRef(gameIsLocked);

  // Active game changes — save timestamp on transition
  useEffect(() => {
    if (!initHandledRef.current) return;

    if (!prevIsCompleted.current && isCompleted) {
      const now = new Date().toISOString();
      setFinishedAt(now);
      // Persist the finishedAt timestamp
      const today = getTodayDateString();
      const serialized = manager.serialize();
      StorageService.saveProgress(game, today, {
        game,
        date: today,
        cellValues: serialized.cellValues,
        cellCorrect: serialized.cellCorrect,
        cellWasWrong: serialized.cellWasWrong,
        timerSeconds: timer.seconds,
        completed: true,
        finishedAt: now,
      });
      setAutoDismissModal({ title: '🎉 Congratulations!', message: 'You done with this puzzle! Keep it up.' });
    }
    prevIsCompleted.current = isCompleted;

    if (!prevIsLocked.current && gameIsLocked && !isCompleted) {
      const now = new Date().toISOString();
      setLockedAt(now);
      // Persist the lockedAt timestamp
      const today = getTodayDateString();
      const existing = StorageService.getProgress(game, today);
      const serialized = manager.serialize();
      StorageService.saveProgress(game, today, {
        game,
        date: today,
        cellValues: serialized.cellValues,
        cellCorrect: serialized.cellCorrect,
        cellWasWrong: serialized.cellWasWrong,
        timerSeconds: timer.seconds,
        completed: false,
        finishedAt: existing?.finishedAt,
        lockedAt: now,
      });
      setAutoDismissModal({ title: 'Game Locked', message: 'Better try tomorrow', type: 'warning' });
    }
    prevIsLocked.current = gameIsLocked;
  }, [isCompleted, gameIsLocked, stateVersion, game, manager, timer.seconds]);

  // Start timer immediately when puzzle loads (only if not already finished/locked)
  useEffect(() => {
    if (!isCompleted && !gameIsLocked) {
      timer.start(initialTimerSeconds);
    }
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

  // Always use the live timer display and the clock emoji
  let timerDisplay = timer.display;
  let timerEmoji = timer.emoji;

  return (
    <>
      <PuzzleHeader
        title={gameName}
        puzzleId={uniqueId}
        timerDisplay={timerDisplay}
        timerEmoji={timerEmoji}
        lives={lives}
        canLeaveDirectly={manager.isCompleted() || gameIsLocked}
      />

      <PuzzleGrid
        manager={manager}
        stateVersion={stateVersion}
        onCellClick={handleCellClick}
        game={game}
      />

      {isCompleted ? (
        <div className="status-panel">
          Solved@{finishedAt ? formatTimestamp(finishedAt) : '00:00'}
        </div>
      ) : gameIsLocked ? (
        <div className="status-panel">
          Locked@{lockedAt ? formatTimestamp(lockedAt) : '00:00'}
        </div>
      ) : (
        <NumberPanel
          manager={manager}
          stateVersion={stateVersion}
          onNumberClick={handleNumberClick}
          onErase={handleErase}
        />
      )}

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
