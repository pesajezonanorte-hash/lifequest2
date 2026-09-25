import { motion } from 'framer-motion';
import { E } from '@/components/ui/glyphs';

interface Props {
  sleepAvg7d: number;
  monthBalance: number;
  lastWorkoutDaysAgo: number | null;
}

export function QuickStatsWidget({ sleepAvg7d, monthBalance, lastWorkoutDaysAgo }: Props) {
  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  const stats = [
    {
      icon: '🏋️',
      label: 'Último entrenamiento',
      value: lastWorkoutDaysAgo === null
        ? 'Sin entrenar'
        : lastWorkoutDaysAgo === 0 ? '¡Hoy! '
        : lastWorkoutDaysAgo === 1 ? 'Ayer'
        : `hace ${lastWorkoutDaysAgo} días`,
      color: lastWorkoutDaysAgo !== null && lastWorkoutDaysAgo <= 2 ? 'text-accent-green' : 'text-accent-red',
    },
    {
      icon: '🌙',
      label: 'Sueño promedio (7d)',
      value: sleepAvg7d > 0 ? `${sleepAvg7d}h` : 'Sin datos',
      color: sleepAvg7d >= 7 ? 'text-accent-green' : sleepAvg7d >= 6 ? 'text-accent-gold' : 'text-accent-red',
    },
    {
      icon: '💰',
      label: 'Balance del mes',
      value: monthBalance !== 0 ? formatCOP(monthBalance) : '$0',
      color: monthBalance >= 0 ? 'text-accent-green' : 'text-accent-red',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          className="bg-bg-panel border-2 border-border-pixel p-3 relative"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ y: -2, borderColor: '#a8871e' }}
        >
          <span className="absolute top-0 left-0 w-1.5 h-1.5 bg-border-pixel" />
          <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-border-pixel" />
          <span className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-border-pixel" />
          <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-border-pixel" />

          <div className="text-2xl mb-1"><E e={stat.icon} /></div>
          <p className={`font-vt ${stat.color} text-xl leading-tight`}>{stat.value}</p>
          <p className="font-pixel text-text-secondary mt-1" style={{ fontSize: '6px', lineHeight: 1.5 }}>
            {stat.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
