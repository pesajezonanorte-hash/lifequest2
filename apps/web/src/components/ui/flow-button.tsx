'use client';

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FlowButtonTone = 'primary' | 'secondary' | 'danger' | 'ghost' | 'cyan' | 'green';
export type FlowButtonSize = 'sm' | 'md' | 'lg';

type FlowStyle = CSSProperties & Record<`--${string}`, string>;

interface FlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Convenience label for standalone usage; children take precedence. */
  text?: string;
  children?: ReactNode;
  tone?: FlowButtonTone;
  size?: FlowButtonSize;
  fullWidth?: boolean;
  /** Keep arrows for labelled actions, disable them for compact/icon controls. */
  withArrows?: boolean;
}

const toneStyles: Record<FlowButtonTone, FlowStyle> = {
  primary: {
    '--flow-fill': 'var(--accent-gold)',
    '--flow-border': 'color-mix(in oklab, var(--accent-gold) 62%, var(--border))',
    '--flow-text': 'var(--text-primary)',
    '--flow-hover-text': '#111111',
    '--flow-surface': 'var(--bg-panel)',
  },
  secondary: {
    '--flow-fill': 'var(--text-primary)',
    '--flow-border': 'var(--border-strong)',
    '--flow-text': 'var(--text-primary)',
    '--flow-hover-text': 'var(--bg-deep)',
    '--flow-surface': 'var(--bg-panel)',
  },
  danger: {
    '--flow-fill': 'var(--accent-red)',
    '--flow-border': 'color-mix(in oklab, var(--accent-red) 62%, var(--border))',
    '--flow-text': 'var(--accent-red)',
    '--flow-hover-text': '#ffffff',
    '--flow-surface': 'var(--bg-panel)',
  },
  ghost: {
    '--flow-fill': 'var(--text-primary)',
    '--flow-border': 'var(--border)',
    '--flow-text': 'var(--text-secondary)',
    '--flow-hover-text': 'var(--bg-deep)',
    '--flow-surface': 'transparent',
  },
  cyan: {
    '--flow-fill': 'var(--accent-cyan)',
    '--flow-border': 'color-mix(in oklab, var(--accent-cyan) 62%, var(--border))',
    '--flow-text': 'var(--accent-cyan)',
    '--flow-hover-text': '#ffffff',
    '--flow-surface': 'var(--bg-panel)',
  },
  green: {
    '--flow-fill': 'var(--accent-green)',
    '--flow-border': 'color-mix(in oklab, var(--accent-green) 62%, var(--border))',
    '--flow-text': 'var(--accent-green)',
    '--flow-hover-text': '#ffffff',
    '--flow-surface': 'var(--bg-panel)',
  },
};

const sizeClasses: Record<FlowButtonSize, string> = {
  sm: 'min-h-8 gap-1.5 px-3 py-1.5 text-xs',
  md: 'min-h-10 gap-2 px-4 py-2 text-sm',
  lg: 'min-h-11 gap-2 px-6 py-2.5 text-sm',
};

/**
 * FlowButton preserves a fixed button box while the animated circle remains
 * clipped inside it. This gives the flow effect without scale-on-hover or
 * overlap with neighbouring controls and menus.
 */
export const FlowButton = forwardRef<HTMLButtonElement, FlowButtonProps>(
  (
    {
      text = 'Modern Button',
      children,
      tone = 'primary',
      size = 'md',
      fullWidth = false,
      withArrows = true,
      className,
      disabled,
      type,
      style,
      ...props
    },
    ref,
  ) => {
    const label = children ?? text;
    const interactiveGroup = disabled ? '' : 'group/flow';

    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        disabled={disabled}
        data-tone={tone}
        className={cn(
          interactiveGroup,
          'relative isolate inline-flex max-w-full shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border font-semibold leading-none outline-none transition-[border-color,color,background-color] duration-300 ease-out',
          'focus-visible:ring-2 focus-visible:ring-[var(--flow-fill)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-deep)]',
          'active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45',
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        style={{
          ...toneStyles[tone],
          borderColor: 'var(--flow-border)',
          color: 'var(--flow-text)',
          backgroundColor: 'var(--flow-surface)',
          ...style,
        }}
        {...props}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-[width,height,opacity] duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover/flow:h-44 group-hover/flow:w-44 group-hover/flow:opacity-100"
          style={{ backgroundColor: 'var(--flow-fill)' }}
        />

        {withArrows && (
          <ArrowRight
            aria-hidden="true"
            className="pointer-events-none absolute -left-6 z-10 h-4 w-4 transition-[left,color] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/flow:left-3"
            style={{ color: 'var(--flow-hover-text)' }}
          />
        )}

        <span
          className={cn(
            'relative z-10 inline-flex min-w-0 items-center justify-center transition-[transform,color] duration-500 ease-out',
            withArrows && '-translate-x-1.5 group-hover/flow:translate-x-1.5',
          )}
          style={{ color: 'inherit' }}
        >
          <span className="transition-colors duration-300 group-hover/flow:text-[var(--flow-hover-text)]">
            {label}
          </span>
        </span>

        {withArrows && (
          <ArrowRight
            aria-hidden="true"
            className="pointer-events-none absolute right-3 z-10 h-4 w-4 transition-[right,color] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/flow:-right-6"
            style={{ color: 'var(--flow-text)' }}
          />
        )}
      </button>
    );
  },
);

FlowButton.displayName = 'FlowButton';
