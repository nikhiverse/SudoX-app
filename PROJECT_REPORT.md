# SudoX Project Report

**Prepared:** 11 October 2026  
**Project type:** Daily Sudoku web application

## Overview

SudoX is a browser based Sudoku platform with 16 puzzle variants, including classic Sudoku, diagonal and Windoku rules, irregular Jigsaw regions, larger grids, and overlapping Twodoku boards. The project combines a Next.js and React interface with a C++ puzzle generation engine. Daily puzzles are generated ahead of time, stored in MongoDB, and delivered through a Next.js API route.

## Technology and structure

- **Web application:** Next.js 15, React 19, and TypeScript; App Router routes are under `app/`.
- **Styling:** Tailwind CSS 4 is configured alongside the project's global CSS.
- **Puzzle engine:** C++17 sources in `engine/src/`, shared headers in `engine/include/`.
- **Persistence:** MongoDB stores puzzle and solution documents; browser local storage caches puzzles and player progress.
- **Operations:** Upstash Redis rate limiting is optional and Vercel Analytics and Speed Insights are included.
- **Main areas:** `app/` contains pages and the puzzle API, `components/` contains UI, `hooks/` holds gameplay state and browser behavior, `services/` handles storage and game services, and `lib/` contains puzzle, date, and validation utilities.

## Main user and data flows

1. A player opens `/play/[variant]`. The client loads the day's puzzle through `usePuzzle` and `PuzzleService`, using local storage when a cached copy exists.
2. `GET /api/puzzle/[game]` validates the game and optional date, applies rate limiting, reads the puzzle and solution documents from MongoDB, and returns the puzzle with an encoded solution payload.
3. The browser decodes the solution for gameplay and stores puzzle/progress state locally. The game UI provides grid input, keyboard controls, timer and lives tracking, and PDF export.
4. `scripts/generate-daily.ts` is intended for scheduled execution. It runs the matching C++ generator for each supported variant, validates output, and inserts puzzle/solution documents with a unique compound index on game, date, and type.

## Product surface

The route tree includes the home page, puzzle play pages, login/signup pages, informational pages (privacy, terms, copyright), and a puzzle API. The gameplay implementation includes resume persistence, completion/lock state, responsive grid components, keyboard input, a PDF export service, and mobile webview handling. The PWA manifest and sitemap/robots routes are also present.

The current home page contains an explicit code comment describing its featured puzzle and category cards as presentational placeholders; they are not wired to a daily selection algorithm. The README describes daily challenges as dynamically generated, while the implementation generates puzzles through the separate scheduled script and serves stored records.

## Local development and configuration

Available package scripts are `npm run dev`, `npm run build`, `npm run start`, and `npm run lint`. The database client requires `MONGODB_URI`. Optional rate limiting requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`; without these, the implementation allows requests through and logs a production warning. The scheduled generation script also needs a working C++17 compiler and database credentials.

## Findings and follow-up areas

- **Documentation drift:** The README is a feature overview, not an operational guide. It does not document required environment variables, deployment/generation setup, or known UI placeholders.
- **Build script paths:** `engine/build.sh` refers to `engine/game/` and `engine/clues/`, while the checked-in engine sources are under `engine/src/` and headers under `engine/include/`. The TypeScript generation path uses the latter layout. The shell build helper appears out of sync and should be reconciled before relying on it.
- **Rate-limit fallback:** Rate limiting fails open when Redis is absent or unavailable. This preserves availability but means the configured request cap is not enforced in those cases.
- **Solution encoding:** The API encodes the solution to make it opaque in the response; the client decodes it for gameplay. This is obfuscation and should not be treated as a security boundary against a determined client.
- **Date boundary:** `PUZZLE_LAUNCH_DATE` is a hard-coded lower bound. It should stay aligned with the earliest seeded database date, as the source comment specifies.
- **Deployment dependency:** The API depends on daily generation having populated both puzzle and solution records; missing/incomplete records return service errors rather than generating on demand.
- **Repository state:** At report time, several UI and layout files had pre-existing uncommitted changes. This report does not include or modify those changes.

## Assessment

The project has a clear separation between gameplay, puzzle generation, and daily puzzle delivery, with local progress persistence and domain validation around the API. The most useful next maintenance steps are to bring the README up to date, fix or remove the stale engine shell build helper, and document the daily generation and deployment configuration. No build or lint checks were run as part of preparing this report.
