import { motion } from 'framer-motion';

interface Props {
  deadline?: string | null;
}

export function DeadlineBadge({ deadline }: Props) {
  if (!deadline) return null;

  const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return (
      <span className="font-pixel text-text-secondary border border-text-secondary px-1.5 py-0.5" style={{ fontSize: '7px' }}>
        VENCIDA
      </span>
    );
  }

  if (daysLeft === 0) {
    return (
      <motion.span
        className="font-pixel text-accent-red border-2 border-accent-red px-1.5 py-0.5"
        style={{ fontSize: '7px' }}
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        ¡HOY!
      </motion.span>
    );
  }

  const color = daysLeft <= 3 ? 'var(--accent-red)' : daysLeft <= 7 ? 'var(--accent-gold)' : 'var(--accent-green)';

  return (
    <span
      className="font-pixel px-1.5 py-0.5 border"
      style={{ fontSize: '7px', color, borderColor: color }}
    >
      {daysLeft}d
    </span>
  );
}
