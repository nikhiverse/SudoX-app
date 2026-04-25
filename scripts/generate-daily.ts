// ═══════════════════════════════════════════
// SudoX — Daily Generator Script
// Intended to be run via GitHub Actions cron.
// Executes C++ binaries and pushes puzzles to MongoDB.
// ═══════════════════════════════════════════

import { getDb } from '../lib/mongodb';
import { VALID_GAMES, PUZZLES_COLLECTION } from '../lib/constants';
import { getTodayDateString } from '../lib/date-utils';
import { generateAndStorePuzzle } from '../lib/puzzle-generator';
import type { DailyPuzzleDoc } from '../lib/types';

async function main() {
  console.log('🚀 Starting daily puzzle generation...');
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is required.');
    process.exit(1);
  }

  const db = await getDb();
  const collection = db.collection<DailyPuzzleDoc>(PUZZLES_COLLECTION);
  const today = getTodayDateString();

  console.log(`📅 Target Date (IST): ${today}`);

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

  for (const game of VALID_GAMES) {
    try {
      // Skip if already generated today
      const existing = await collection.findOne({ game, date: today });
      if (existing) {
        console.log(`⏭️  Skipped ${game} (Already exists)`);
        results.skipped.push(game);
        continue;
      }

      // Generate and store
      process.stdout.write(`⚙️  Generating ${game}... `);
      await generateAndStorePuzzle(game, today);
      console.log('✅ Done');
      results.generated.push(game);

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`❌ Failed: ${message}`);
      results.failed.push({ game, error: message });
    }
  }

  console.log('\n📊 Generation Summary:');
  console.log(`   Generated: ${results.generated.length}`);
  console.log(`   Skipped:   ${results.skipped.length}`);
  console.log(`   Failed:    ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.error('⚠️ Some generators failed!');
    process.exit(1);
  } else {
    console.log('🎉 All puzzles ready for today!');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error during execution:', err);
  process.exit(1);
});
