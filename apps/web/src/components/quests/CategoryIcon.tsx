import { E } from '@/components/ui/glyphs';
const CATEGORY_ICONS: Record<string, string> = {
  HEALTH: '💚',
  FITNESS: '⚔️',
  FINANCE: '💰',
  LEARNING: '📚',
  LOVE: '💖',
  SOCIAL: '🤝',
  PERSONAL: '⭐',
  CREATIVE: '🎨',
};

const CATEGORY_LABELS: Record<string, string> = {
  HEALTH: 'Salud',
  FITNESS: 'Fitness',
  FINANCE: 'Finanzas',
  LEARNING: 'Aprendizaje',
  LOVE: 'Amor',
  SOCIAL: 'Social',
  PERSONAL: 'Personal',
  CREATIVE: 'Creativo',
};

interface Props {
  category: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CategoryIcon({ category, showLabel = false, size = 'md' }: Props) {
  const icon = CATEGORY_ICONS[category] ?? '📋';
  const label = CATEGORY_LABELS[category] ?? category;
  const textSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <span className={`inline-flex items-center gap-1 ${textSize}`}>
      <span><E e={icon} /></span>
      {showLabel && <span className="font-vt text-text-secondary text-sm">{label}</span>}
    </span>
  );
}

export { CATEGORY_ICONS, CATEGORY_LABELS };
