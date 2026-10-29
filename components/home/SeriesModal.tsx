'use client';

import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import type { SeriesVariantOption } from './SeriesCard';

interface SeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  variants: readonly SeriesVariantOption[];
}

export function SeriesModal({
  isOpen,
  onClose,
  title,
  subtitle,
  variants,
}: SeriesModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4 text-left">
        <p className="text-sm text-stone-600 -mt-1">{subtitle}</p>

        <div className="flex flex-col gap-2.5">
          {variants.map((v) => (
            <Link
              key={v.href}
              href={v.href}
              className="group flex items-center justify-between p-4 rounded-xl bg-white hover:bg-stone-50 active:bg-stone-100 border border-black/10 hover:border-black/20 shadow-xs transition-all duration-200 no-underline"
              onClick={onClose}
              aria-label={`Play ${v.name} (${v.size})`}
            >
              <div className="flex flex-col gap-1">
                <span className="font-sans text-base font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                  {v.name}
                </span>
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <span className="bg-stone-100 text-stone-800 font-semibold px-2 py-0.5 rounded text-[11px] border border-stone-200 font-mono">
                    {v.size}
                  </span>
                  {v.tagline && (
                    <>
                      <span className="text-stone-400" aria-hidden="true">·</span>
                      <span className="text-stone-600">{v.tagline}</span>
                    </>
                  )}
                </div>
              </div>

              <span className="text-stone-400 group-hover:text-stone-900 group-hover:translate-x-1 transition-all pl-3 flex-shrink-0" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </Modal>
  );
}
