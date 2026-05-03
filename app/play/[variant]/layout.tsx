// ═══════════════════════════════════════════
// SudoX — Per-Variant Dynamic Metadata
// Generates unique title/description for each puzzle page.
// ═══════════════════════════════════════════

import type { Metadata } from 'next';
import { GAME_NAMES, VALID_GAMES, getVariantFromUrl } from '@/lib/constants';
import type { GameVariant } from '@/lib/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ variant: string }>;
}): Promise<Metadata> {
  const { variant: rawVariant } = await params;
  const variant = getVariantFromUrl(rawVariant);

  if (!VALID_GAMES.includes(variant as GameVariant)) {
    return {
      title: 'Unknown Variant — SudoX',
      description: 'This puzzle variant does not exist.',
    };
  }

  const name = GAME_NAMES[variant as GameVariant] || variant;

  return {
    title: `${name} — SudoX Daily Puzzle`,
    description: `Play today's ${name} puzzle on SudoX. A free daily ${name} challenge — no login required.`,
    openGraph: {
      title: `${name} — SudoX`,
      description: `Play today's ${name} puzzle. Free daily Sudoku variant.`,
      type: 'website',
    },
  };
}

export default function VariantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
