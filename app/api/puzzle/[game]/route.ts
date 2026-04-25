// ═══════════════════════════════════════════
// GET /api/puzzle/:game
// Yeh file database se aj ka puzzle padhti hai (Read karti hai) aur user ke screen (frontend) par bhejati hai.
// NEVER runs C++.
// ═══════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { VALID_GAMES, PUZZLES_COLLECTION, RATE_LIMIT } from '@/lib/constants';
import { getTodayDateString } from '@/lib/date-utils';
import { checkRateLimit } from '@/lib/rate-limiter';
import type { GameVariant, DailyPuzzleDoc, PuzzleDoc, SolutionDoc, PuzzleData } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ game: string }> }
) {
  const { game } = await params;

  // 1. Rate limit
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a minute.' },
      { status: 429 }
    );
  }

  // 2. Validate game name
  if (!VALID_GAMES.includes(game as GameVariant)) {
    return NextResponse.json(
      { error: 'Invalid game name' },
      { status: 400 }
    );
  }

  try {
    // 3. Query MongoDB for today's puzzle
    const db = await getDb();
    const collection = db.collection<DailyPuzzleDoc>(PUZZLES_COLLECTION);
    const today = getTodayDateString();

    const docs = await collection.find({ game, date: today }).toArray();

    if (!docs || docs.length === 0) {
      console.warn(`No puzzle docs found for game=${game}, date=${today}.`);
      return NextResponse.json(
        { error: 'Puzzle not yet generated for today. Please try again in a few minutes.' },
        { status: 503 }
      );
    }

    let puzzleDoc: PuzzleDoc | null = null;
    let solutionDoc: SolutionDoc | null = null;

    for (const doc of docs) {
      if (doc.type === 'puzzle') {
        puzzleDoc = doc as PuzzleDoc;
      } else if (doc.type === 'solution') {
        solutionDoc = doc as SolutionDoc;
      }
    }

    if (!puzzleDoc || !solutionDoc) {
      console.error(`Incomplete puzzle data for game=${game}, date=${today}. puzzleDoc=${!!puzzleDoc}, solutionDoc=${!!solutionDoc}`);
      return NextResponse.json(
        { error: 'Incomplete puzzle data found in database.' },
        { status: 500 }
      );
    }

    // Merge solution back into puzzleData for the client
    const mergedPuzzle: PuzzleData & { solution: number[][] } = {
      ...puzzleDoc.puzzleData,
      solution: solutionDoc.solution,
    };

    // 4. Return puzzle data
    return NextResponse.json({
      puzzleData: mergedPuzzle,
      uniqueId: puzzleDoc.uniqueId,
      generationId: puzzleDoc.generationId,
      game: puzzleDoc.game,
      date: puzzleDoc.date,
    });
  } catch (err) {
    console.error(`Error fetching puzzle for ${game}:`, err);
    return NextResponse.json(
      { error: 'Failed to fetch puzzle. Please try again.' },
      { status: 500 }
    );
  }
}
