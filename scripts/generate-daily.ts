// ═══════════════════════════════════════════
// SudoX — Daily Generator Script
// Intended to be run via GitHub Actions cron.
// Executes C++ binaries and pushes puzzles to MongoDB.
//
// Usage:
//   npx tsx scripts/generate-daily.ts            # generate today's puzzles
//   npx tsx scripts/generate-daily.ts --tomorrow  # generate tomorrow's puzzles
// ═══════════════════════════════════════════

import { getDb } from '../lib/mongodb';
import { VALID_GAMES, PUZZLES_COLLECTION } from '../lib/constants';
import { getTodayDateString, getTomorrowDateString } from '../lib/date-utils';
import { generatePuzzleDocs } from '../lib/puzzle-generator';
import type { DailyPuzzleDoc } from '../lib/types';

/**
 * Get the target date string in YYYY-MM-DD format.
 * If --tomorrow is passed, returns tomorrow's IST date.
 */
function getTargetDate(): string {
  const isTomorrow = process.argv.includes('--tomorrow');

  if (isTomorrow) {
    return getTomorrowDateString();
  }

  return getTodayDateString();
}

async function main() {
  const targetDate = getTargetDate();
  const label = process.argv.includes('--tomorrow') ? 'TOMORROW' : 'TODAY';

  console.log(`🚀 Starting puzzle generation for ${label}...`);
  console.log(`📅 Target Date (IST): ${targetDate}`);

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is required.');
    process.exit(1);
  }

  const db = await getDb();
  const collection = db.collection<DailyPuzzleDoc>(PUZZLES_COLLECTION);

  // Ensure compound unique index exists (game + date + type must be unique)
  await collection.createIndex(
    { game: 1, date: 1, type: 1 },
    { unique: true, background: true }
  );

  const results = {
    generated: [] as string[],
    skipped: [] as string[],
    failed: [] as { game: string; error: string }[],
  };

  // 1. Fetch existing games for the target date to avoid N findOne queries
  const existingDocs = await collection.find({ date: targetDate, type: 'puzzle' }, { projection: { game: 1 } }).toArray();
  const existingGames = new Set(existingDocs.map(d => d.game));

  const docsToInsert: any[] = [];

  for (const game of VALID_GAMES) {
    try {
      // Skip if already generated for this date
      if (existingGames.has(game)) {
        console.log(`⏭️  Skipped ${game} (Already exists for ${targetDate})`);
        results.skipped.push(game);
        continue;
      }

      // Generate
      process.stdout.write(`⚙️  Generating ${game}... `);
      const docs = await generatePuzzleDocs(game, targetDate);
      docsToInsert.push(...docs);
      console.log('✅ Done');
      results.generated.push(game);

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`❌ Failed: ${message}`);
      results.failed.push({ game, error: message });
    }
  }

  // 2. Bulk Insert with Chunking to prevent oversized statements / long locks
  if (docsToInsert.length > 0) {
    console.log(`\n📦 Batch inserting ${docsToInsert.length} documents...`);
    const CHUNK_SIZE = 20; // 10 puzzles (puzzle + solution docs) at a time
    for (let i = 0; i < docsToInsert.length; i += CHUNK_SIZE) {
      const chunk = docsToInsert.slice(i, i + CHUNK_SIZE);
      await collection.insertMany(chunk, { ordered: false });
    }
    console.log(`✅ Batch insert complete.`);
  }

  console.log(`\n📊 Generation Summary (${label} — ${targetDate}):`);
  console.log(`   Generated: ${results.generated.length}`);
  console.log(`   Skipped:   ${results.skipped.length}`);
  console.log(`   Failed:    ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.error('⚠️ Some generators failed!');
    process.exit(1);
  } else {
    console.log(`🎉 All puzzles ready for ${targetDate}!`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error during execution:', err);
  process.exit(1);
});
