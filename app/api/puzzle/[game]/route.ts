// ═══════════════════════════════════════════
// GET /api/puzzle/:game
// Yeh file database se aj ka puzzle padhti hai (Read karti hai) aur user ke screen (frontend) par bhejati hai.
// NEVER runs C++.
// ═══════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getDb } from '@/lib/mongodb';
import { VALID_GAMES, PUZZLES_COLLECTION, PUZZLE_LAUNCH_DATE } from '@/lib/constants';
import { getTodayDateString } from '@/lib/date-utils';
import { checkRateLimit } from '@/lib/rate-limiter';
import { encodeSolution } from '@/lib/solution-codec';
import type { GameVariant, DailyPuzzleDoc, PuzzleDoc, SolutionDoc } from '@/lib/types';


// Route must be dynamic because we read request headers for IP-based rate
// limiting. Cost protection is handled via CDN cache headers on the response
// (s-maxage=86400) so Vercel's edge serves cached responses to most users.
export const dynamic = 'force-dynamic';

// Strict YYYY-MM-DD guard — rejects any date value that isn't exactly this
// format. This is the primary defence against cache-busting Layer-7 DDoS:
//   ?date=2026-08-08-bust1  → 400, zero DB connections spawned
//   ?date=whatever          → 400, zero DB connections spawned
//   ?date=2026-08-08        → allowed, served from CDN / Next.js cache
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ game: string }> }
) {
  const { game } = await params;

  // 1. Rate limit
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
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

  // 3. Domain-bound the date parameter — BEFORE opening any DB connection.
  //
  //    Attack surface eliminated here (in order of cheapness):
  //
  //    a) FORMAT CHECK — rejects arbitrary strings (?date=bust1) via regex.
  //       Cost: one regex eval. DB connections spawned: 0.
  //
  //    b) LOWER BOUND — rejects pre-launch dates (1980-01-01 … 2026-08-14).
  //       These are guaranteed non-existent in MongoDB. Without this check the
  //       attacker can loop 40 years of valid YYYY-MM-DD strings, each one a
  //       cache miss → serverless spin-up → index lookup → null → 404.
  //       Cost: one string comparison. DB connections spawned: 0.
  //
  //    c) UPPER BOUND — rejects future dates (?date=2099-12-31).
  //       Without this, each future date is a cache miss. The CDN caches a
  //       duplicate payload under a phantom key (?date=2099-12-31) that will
  //       never naturally expire and pollutes edge node storage.
  //       Cost: one string comparison. DB connections spawned: 0.
  //
  //    Only a date that passes all three guards reaches MongoDB.
  const dateQuery = request.nextUrl.searchParams.get('date');
  const today = getTodayDateString();

  if (dateQuery !== null) {
    // a) Format
    if (!DATE_REGEX.test(dateQuery)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD.' },
        { status: 400 }
      );
    }
    // b) Lower bound — must be on or after the launch date
    if (dateQuery < PUZZLE_LAUNCH_DATE) {
      return NextResponse.json(
        { error: 'No puzzles exist before the launch date.' },
        { status: 404 }
      );
    }
    // c) Upper bound — must not be in the future
    if (dateQuery > today) {
      return NextResponse.json(
        { error: 'Puzzle not yet available for that date.' },
        { status: 404 }
      );
    }
  }

  // Canonical target: either the validated query date or today
  const targetDate = dateQuery ?? today;

  try {
    // 4. Query MongoDB — only reachable with a verified, canonical date string
    // Wrap the DB call in Next.js unstable_cache
    const getCachedDocs = unstable_cache(
      async (g: string, d: string) => {
        const db = await getDb();
        const collection = db.collection<DailyPuzzleDoc>(PUZZLES_COLLECTION);
        // Force conversion to plain objects to ensure serializability out of cache
        const rawDocs = await collection.find({ game: g, date: d }).toArray();
        return JSON.parse(JSON.stringify(rawDocs)); 
      },
      [`puzzle-${game}-${targetDate}`],
      { revalidate: 3600, tags: ['puzzles'] }
    );

    const docs = await getCachedDocs(game, targetDate);

    if (!docs || docs.length === 0) {
      console.warn(`No puzzle docs found for game=${game}, date=${targetDate}.`);
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
      console.error(`Incomplete puzzle data for game=${game}, date=${targetDate}. puzzleDoc=${!!puzzleDoc}, solutionDoc=${!!solutionDoc}`);
      return NextResponse.json(
        { error: 'Incomplete puzzle data found in database.' },
        { status: 500 }
      );
    }

    // Encode solution so it's not visible as plain JSON in DevTools
    const encodedSolution = encodeSolution(
      solutionDoc.solution,
      puzzleDoc.uniqueId
    );

    // 4. Return puzzle data with encoded (opaque) solution
    //    CDN caching: Vercel edge caches for 1 hour, serves stale while revalidating.
    //    This prevents cost explosions — most requests never reach the serverless function.
    return NextResponse.json({
      puzzleData: puzzleDoc.puzzleData,
      encodedSolution,
      uniqueId: puzzleDoc.uniqueId,
      generationId: puzzleDoc.generationId,
      game: puzzleDoc.game,
      date: puzzleDoc.date,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    });
  } catch (err) {
    console.error(`Error fetching puzzle for ${game}:`, err);
    return NextResponse.json(
      { error: 'Failed to fetch puzzle. Please try again.' },
      { status: 500 }
    );
  }
}
