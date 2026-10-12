'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_TABS = [
  { href: '/', label: 'Today' },
  { href: '/variants', label: 'Variants' },
  { href: '/season', label: 'Season' },
] as const;

interface PrimaryNavProps {
  variant: 'desktop' | 'mobile';
}

export function PrimaryNav({ variant }: PrimaryNavProps) {
  const pathname = usePathname();

  if (variant === 'desktop') {
    return (
      <nav className="topbar-nav" aria-label="Primary navigation">
        {NAV_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`nav-tab${pathname === tab.href ? ' nav-tab--active' : ''}`}
            aria-current={pathname === tab.href ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    );
  }

  // Mobile variant: renders the full-width tab row (display controlled by CSS)
  return (
    <div className="mobile-nav-row">
      <nav className="mobile-nav-inner" aria-label="Primary navigation">
        {NAV_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`mobile-nav-tab${pathname === tab.href ? ' mobile-nav-tab--active' : ''}`}
            aria-current={pathname === tab.href ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
