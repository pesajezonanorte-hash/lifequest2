import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Swords, Flame, NotebookPen, Check } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface Step {
  icon: React.ReactNode;
  label: string;
  hint: string;
  to: string;
  done: boolean;
}

interface Props {
  questCount: number;
  habitCount: number;
  hasJournalEntry: boolean;
}

export function FirstStepsWidget({ questCount, habitCount, hasJournalEntry }: Props) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const steps: Step[] = [
    { icon: <Swords size={16} />, label: 'Crea tu primera quest', hint: 'Misiones', to: '/quests', done: questCount > 0 },
    { icon: <Flame size={16} />, label: 'Configura un hábito', hint: 'Hábitos', to: '/habits', done: habitCount > 0 },
    { icon: <NotebookPen size={16} />, label: 'Escribe en el diario', hint: 'Diario', to: '/journal', done: hasJournalEntry },
  ];

  const doneCount = steps.filter((s) => s.done).length;

  // Hide when all steps are done or user is more experienced (day 7+)
  const daysSinceJoin = user?.createdAt
    ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000)
    : 0;
  if (doneCount === steps.length || daysSinceJoin > 7) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Primeros pasos</h3>
          <p className="text-xs text-[var(--text-secondary)]">{doneCount} de {steps.length} completados</p>
        </div>
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full transition-colors ${i < doneCount ? 'bg-[var(--accent-gold)]' : 'bg-[var(--bg-deep)]'}`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((step) => (
          <motion.button
            key={step.label}
            whileTap={{ scale: 0.98 }}
            onClick={() => !step.done && navigate(step.to)}
            disabled={step.done}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
              step.done
                ? 'opacity-50 cursor-default'
                : 'hover:bg-[var(--bg-panel-light)] cursor-pointer'
            }`}
          >
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
              step.done ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]' : 'bg-[var(--bg-panel-light)] text-[var(--text-secondary)]'
            }`}>
              {step.done ? <Check size={14} /> : step.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${step.done ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                {step.label}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{step.hint}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
