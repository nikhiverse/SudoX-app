// ═══════════════════════════════════════════
// SudoX — Dynamic Sitemap
// Lists home page + all 16 puzzle variant pages.
// ═══════════════════════════════════════════

import type { MetadataRoute } from 'next';
import { HOME_VARIANTS, getVariantUrl } from '@/lib/constants';

const BASE_URL = 'https://sudox-app.vercel.app/';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Home page
  const pages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  // All puzzle variant pages
  for (const variant of HOME_VARIANTS) {
    pages.push({
      url: `${BASE_URL}/play/${getVariantUrl(variant)}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    });
  }

  // Legal pages
  pages.push(
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    }
  );

  return pages;
}
