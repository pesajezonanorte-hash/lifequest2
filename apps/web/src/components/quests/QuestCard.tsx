import { memo } from 'react';
import { motion } from 'framer-motion';
import type { Quest } from '@lifequest/shared';
import { CategoryIcon } from './CategoryIcon';
import { DifficultyBadge, DIFFICULTY_CONFIG } from './DifficultyBadge';
import { DeadlineBadge } from './DeadlineBadge';
import { audio } from '../../lib/audio';

interface Props {
  quest: Quest;
  onComplete: (quest: Quest, e: React.MouseEvent) => void;
  onClick: (quest: Quest) => void;
}

// Shimmer badge effect for XP/Gold
function ShimmerBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative overflow-hidden inline-block text-xs font-medium">
      {children}
      <motion.span
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
          backgroundSize: '120% 100%',
        }}
        animate={{ backgroundPositionX: ['-60%', '160%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
      />
    </span>
  );
}

export const QuestCard = memo(function QuestCard({ quest, onComplete, onClick }: Props) {
  const subObjectives = quest.subObjectives as Array<{ id: string; title: string; completed: boolean }>;
  const completedSubs = subObjectives.filter((s) => s.completed).length;
  const progressPct = subObjectives.length > 0 ? (completedSubs / subObjectives.length) * 100 : null;

  const isCompleted = quest.status === 'COMPLETED';
  const isFailed   = quest.status === 'FAILED';
  const isArchived = quest.status === 'ARCHIVED';
  const isInactive = isCompleted || isFailed || isArchived;

  const cfg = DIFFICULTY_CONFIG[quest.difficulty] ?? { color: '#888', glow: false };

  // Deadline urgency — pulse red if < 2 days away
  const daysLeft = quest.deadline
    ? Math.ceil((new Date(quest.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isUrgent = daysLeft !== null && daysLeft <= 2 && !isInactive;

  return (
    <motion.div
      onClick={() => { audio.play('blip'); onClick(quest); }}
      className={`rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4 cursor-pointer select-none relative overflow-hidden
        ${isInactive ? 'opacity-60' : 'hover:shadow-md transition-shadow'}`}
      style={{ borderColor: isInactive ? undefined : `${cfg.color}60` }}
      whileHover={isInactive ? {} : {
        y: -3,
      }}
      whileTap={isInactive ? {} : { y: -1 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      layout
    >
      {/* Hover shimmer background */}
      {!isInactive && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${cfg.color}08 0%, transparent 60%)`,
            opacity: 0,
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Header */}
      <div className="flex items-start gap-2 mb-2 relative z-10">
        {/* Icon with wiggle on hover */}
        <motion.div
          whileHover={{ rotate: [-5, 5, -3, 0], transition: { duration: 0.4 } }}
        >
          <CategoryIcon category={quest.category} size="md" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-tight ${isInactive ? 'text-[var(--text-secondary)] line-through' : 'text-[var(--text-primary)]'}`}>
            {quest.title}
          </p>
          {quest.description && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">
              {quest.description}
            </p>
          )}
        </div>

        {/* Complete checkbox */}
        {!isInactive && (
          <motion.button
            className="w-8 h-8 rounded-lg border border-[var(--accent-gold)] flex items-center justify-center flex-shrink-0 bg-[var(--bg-deep)] hover:bg-[var(--accent-gold)] hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              audio.play('questComplete');
              onComplete(quest, e);
            }}
            whileHover={{ scale: 1.18 }}
            whileTap={{ scale: 0.85 }}
            title="Completar misión"
          >
            <span className="text-sm">✓</span>
          </motion.button>
        )}

        {isCompleted && <span className="text-xl flex-shrink-0">✅</span>}
        {isFailed    && <span className="text-xl flex-shrink-0">💀</span>}
      </div>

      {/* Progress bar */}
      {progressPct !== null && !isInactive && (
        <div className="mb-2 relative z-10">
          <div className="flex justify-between text-xs mb-0.5">
            <span className="text-[var(--text-secondary)]">Progreso</span>
            <span className="text-[var(--accent-gold)]">{completedSubs}/{subObjectives.length}</span>
          </div>
          <div className="h-1.5 bg-[var(--bg-panel-light)] border border-[var(--border)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--accent-gold)] rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Footer badges */}
      <div className="flex items-center gap-1.5 flex-wrap mt-1 relative z-10">
        <DifficultyBadge difficulty={quest.difficulty} />
        <ShimmerBadge><span className="text-[var(--accent-gold)]">+{quest.xpReward}XP</span></ShimmerBadge>
        <ShimmerBadge><span className="text-yellow-400">💰{quest.goldReward}</span></ShimmerBadge>
        <DeadlineBadge deadline={quest.deadline} />
        <span className="text-xs text-[var(--text-secondary)]">
          {quest.type === 'DAILY' ? '☀️' : quest.type === 'WEEKLY' ? '📅' : quest.type === 'MAIN' ? '⚔️' : quest.type === 'META' ? '🎯' : '🗡️'}
        </span>
      </div>

      {/* Epic glow border */}
      {quest.difficulty === 'EPIC' && !isInactive && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-xl border-2"
          style={{ borderColor: '#ffd23f' }}
          animate={{ opacity: [0.35, 0.85, 0.35] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Urgent deadline pulse */}
      {isUrgent && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-xl border-2 border-[var(--accent-red)]"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
});
