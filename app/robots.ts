// ═══════════════════════════════════════════
// SudoX — robots.txt (Generated)
// ═══════════════════════════════════════════

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: 'https://sudox-app.vercel.app/sitemap.xml',
  };
}
