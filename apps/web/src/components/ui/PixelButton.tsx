import { type ReactNode, type ButtonHTMLAttributes } from 'react';
import { audio } from '../../lib/audio';
import { LiquidButton } from './liquid-glass-button';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'cyan' | 'green';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

/**
 * PixelButton mantiene su API (variant, size, fullWidth, loading, blips de
 * audio) pero ahora se renderiza con el LiquidButton (liquid glass) por dentro,
 * para que todos los botones de las páginas tengan el look glass sin tocar
 * ninguna llamada.
 *
 * Cada variante es el glass con su tinte de color (texto de color + velo
 * translúcido), respetando la paleta del juego.
 */
const variantClasses: Record<Variant, string> = {
  primary:   'font-semibold text-primary bg-primary/15',
  secondary: 'font-semibold text-accent-blue bg-accent-blue/15',
  danger:    'font-semibold text-accent-red bg-accent-red/15',
  ghost:     'text-text-secondary bg-transparent',
  cyan:      'font-semibold text-accent-cyan bg-accent-cyan/15',
  green:     'font-semibold text-accent-green bg-accent-green/15',
};

const sizeMap = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
} as const;

export function PixelButton({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth,
  loading,
  disabled,
  className = '',
  onClick,
  onMouseEnter,
  ...props
}: Props) {
  const isDisabled = disabled || loading;

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (isDisabled) return;
    audio.play('blip');
    onClick?.(e);
  }

  return (
    <LiquidButton
      variant="default"
      size={sizeMap[size]}
      className={cn(
        'font-sans select-none transition-colors duration-75',
        variantClasses[variant],
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-50 cursor-not-allowed' : '',
        className,
      )}
      disabled={isDisabled}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (!isDisabled) audio.play('hover');
        onMouseEnter?.(e);
      }}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-current animate-bounce" />
          <span className="inline-block w-2 h-2 bg-current animate-bounce [animation-delay:0.1s]" />
          <span className="inline-block w-2 h-2 bg-current animate-bounce [animation-delay:0.2s]" />
        </span>
      ) : (
        children
      )}
    </LiquidButton>
  );
}
