import type { ReactNode } from 'react';

export interface SegmentedTab<T extends string> {
  key: T;
  label: ReactNode;
}

interface SegmentedTabsProps<T extends string> {
  tabs: SegmentedTab<T>[];
  active: T;
  onChange: (key: T) => void;
  ariaLabel: string;
  /** Softer, rounded-full styling for secondary filter rows. */
  pill?: boolean;
}

/**
 * Shared section switcher for the product zones (Posada, Biblioteca, ...).
 *
 * The historical tab rows were 12px bordered buttons packed at gap-1, which
 * read as a single cluttered strip and often collided with the content below.
 * These chips keep a deliberate 8px rhythm, 44px touch targets and clear
 * selected/hover states, and wrap gracefully on 390px screens.
 */
export function SegmentedTabs<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
  pill = false,
}: SegmentedTabsProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex flex-wrap items-center gap-2">
      {tabs.map(({ key, label }) => {
        const selected = active === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(key)}
            className={[
              'inline-flex items-center justify-center gap-1.5 border font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-deep)]',
              pill ? 'min-h-10 rounded-full px-4 text-sm' : 'min-h-11 rounded-xl px-4 text-sm',
              selected
                ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--text-primary)]'
                : 'border-[var(--border)] bg-[var(--bg-panel)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]',
            ].join(' ')}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
