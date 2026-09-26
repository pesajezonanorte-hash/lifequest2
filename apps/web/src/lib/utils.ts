import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Helper estándar de shadcn/ui: combina clases con soporte de conflictos
 * de Tailwind (la última gana). Lo usan los componentes tipo shadcn
 * (flow-button, etc.).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
