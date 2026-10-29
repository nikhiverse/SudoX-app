'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_TABS = [
  {
    href: '/',
    label: 'Home',
    icon: (
      <svg
        className="nav-tab-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/variants',
    label: 'Explore',
    icon: (
      <svg
        className="nav-tab-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    href: '/season',
    label: 'Season',
    icon: (
      <svg
        className="nav-tab-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34" />
        <path d="M6 4h12v5a6 6 0 0 1-12 0V4z" />
      </svg>
    ),
  },
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
            {tab.icon}
            <span>{tab.label}</span>
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
            {tab.icon}
            <span>{tab.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
