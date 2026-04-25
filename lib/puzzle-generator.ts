// ═══════════════════════════════════════════
// SudoX — Puzzle Generator Strategy
// Auto-generates a puzzle if missing.
// ═══════════════════════════════════════════

import { GAME_ALIASES, PUZZLES_COLLECTION } from '@/lib/constants';
import { getDb } from '@/lib/mongodb';
import { buildUniqueId, buildGenerationId } from '@/lib/date-utils';
import { validatePuzzleData } from '@/lib/puzzle-validator';
import type { DailyPuzzleDoc, GameVariant } from '@/lib/types';
import { execSync, execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function generateAndStorePuzzle(game: string, date: string): Promise<boolean> {
  const ENGINE_DIR = path.resolve(process.cwd(), 'engine');
  const SRC_DIR = path.join(ENGINE_DIR, 'src');
  const INCLUDE_DIR = path.join(ENGINE_DIR, 'include');
  const BIN_DIR = path.join(ENGINE_DIR, 'bin');

  if (!fs.existsSync(BIN_DIR)) {
    fs.mkdirSync(BIN_DIR, { recursive: true });
  }

  const actualGame = GAME_ALIASES[game as keyof typeof GAME_ALIASES] || game;
  const srcPath = path.join(SRC_DIR, `${actualGame}.cpp`);
  const binPath = path.join(BIN_DIR, actualGame);

  if (!fs.existsSync(srcPath)) {
    throw new Error(`Source file not found: ${actualGame}.cpp`);
  }

  let needsCompile = !fs.existsSync(binPath);
  if (!needsCompile) {
    const srcTime = fs.statSync(srcPath).mtimeMs;
    const binTime = fs.statSync(binPath).mtimeMs;
    needsCompile = srcTime > binTime;
  }

  if (needsCompile) {
    execSync(
      `g++ -O2 -std=c++17 -I"${INCLUDE_DIR}" -o "${binPath}" "${srcPath}"`,
      { timeout: 15000 }
    );
  }

  const output = execFileSync(binPath, [], {
    timeout: 30000,
    encoding: 'utf-8',
    env: { ...process.env, TERM: 'dumb' },
  });

  const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, '');
  const jsonStart = cleanOutput.indexOf('{');
  if (jsonStart === -1) {
    throw new Error('No JSON output from generator');
  }

  const jsonStr = cleanOutput.substring(jsonStart);
  const puzzleData = JSON.parse(jsonStr);

  const validation = validatePuzzleData(puzzleData);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.error}`);
  }

  const uniqueId = buildUniqueId(game as GameVariant);
  const generationId = buildGenerationId(game as GameVariant);

  const { solution, ...puzzleOnlyData } = puzzleData as Record<string, unknown>;
  if (!solution) {
    throw new Error("Missing solution array from C++ output");
  }

  const solvedDoc = {
    _id: `${uniqueId}_solved`,
    game,
    date,
    type: 'solution',
    solution,
    uniqueId,
    generationId,
    generatedAt: new Date(),
  };

  const puzzDoc = {
    _id: `${uniqueId}_puzz`,
    game,
    date,
    type: 'puzzle',
    puzzleData: puzzleOnlyData,
    uniqueId,
    generationId,
    generatedAt: new Date(),
  };

  const db = await getDb();
  const collection = db.collection<DailyPuzzleDoc>(PUZZLES_COLLECTION);

  // Ensure index
  await collection.createIndex(
    { game: 1, date: 1, type: 1 },
    { unique: true, background: true }
  );

  // @ts-expect-error - allow custom string _id
  await collection.insertMany([puzzDoc, solvedDoc]);

  return true;
}
