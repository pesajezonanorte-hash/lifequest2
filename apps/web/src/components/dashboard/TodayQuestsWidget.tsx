import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelPanel } from '../ui/PixelPanel';
import { MiguelSprite } from '../character/MiguelSprite';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { completeQuest } from '../../services/quest.service';
import type { Quest } from '@lifequest/shared';
import { E } from '@/components/ui/glyphs';

const TYPE_ICONS: Record<string, string> = {
  MAIN: '🏆', SIDE: '⚔️', DAILY: '🔄', WEEKLY: '📅',
};
const DIFF_COLORS: Record<string, string> = {
  EASY: 'text-accent-green', NORMAL: 'text-accent-cyan', HARD: 'text-accent-gold', EPIC: 'text-accent-pink',
};

interface Props {
  quests: Quest[];
  onQuestCompleted?: (questId: string) => void;
}

export function TodayQuestsWidget({ quests, onQuestCompleted }: Props) {
  const { updateUser } = useAuthStore();
  const { triggerLevelUp, addFloatingXP, flashScreen } = useUIStore();
  const [completing, setCompleting] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const handleComplete = async (quest: Quest, e: React.MouseEvent) => {
    if (completing || completedIds.has(quest.id)) return;
    setCompleting(quest.id);

    const rect = (e.target as HTMLElement).getBoundingClientRect();

    try {
      const result = await completeQuest(quest.id);
      updateUser(result.user);
      setCompletedIds((prev) => new Set([...prev, quest.id]));

      flashScreen('#a8871e');
      addFloatingXP(result.rewards.xpEarned, rect.x + rect.width / 2, rect.y);

      if (result.rewards.leveledUp && result.rewards.newLevel) {
        setTimeout(() => {
          triggerLevelUp({
            oldLevel: result.rewards.newLevel! - 1,
            newLevel: result.rewards.newLevel!,
            xpEarned: result.rewards.xpEarned,
            goldEarned: result.rewards.goldEarned,
            statIncreases: result.rewards.statIncreases ?? {},
          });
        }, 600);
      }

      onQuestCompleted?.(quest.id);
    } finally {
      setCompleting(null);
    }
  };

  if (quests.length === 0) {
    return (
      <PixelPanel animate title="MISIONES DE HOY" className="p-5 flex flex-col items-center gap-3">
        <MiguelSprite size={64} animate="idle" />
        <p className="font-vt text-text-secondary text-xl text-center">
          No tienes misiones activas, héroe.
        </p>
        <p className="font-vt text-text-secondary text-lg text-center">
          ¡Crea una misión para empezar tu aventura! <E e="⚔" />
        </p>
      </PixelPanel>
    );
  }

  return (
    <PixelPanel animate title="MISIONES DE HOY" className="p-4">
      <div className="space-y-2">
        <AnimatePresence>
          {quests.map((quest, i) => {
            const done = completedIds.has(quest.id);
            return (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: done ? 0.5 : 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`flex items-center gap-3 border-2 p-3 transition-all ${
                  done ? 'border-accent-green bg-bg-deep' : 'border-border-pixel bg-bg-panel hover:border-accent-gold'
                }`}
              >
                {/* Checkbox */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => !done && handleComplete(quest, e)}
                  disabled={done || completing === quest.id}
                  className={`w-7 h-7 border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    done
                      ? 'border-accent-green bg-accent-green'
                      : 'border-text-secondary hover:border-accent-gold bg-bg-deep'
                  }`}
                >
                  {done ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-border-pixel font-pixel"
                      style={{ fontSize: '10px' }}
                    >
                      <E e="✓" />
                    </motion.span>
                  ) : completing === quest.id ? (
                    <motion.div
                      className="w-3 h-3 border-2 border-accent-gold border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    />
                  ) : null}
                </motion.button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span><E e={TYPE_ICONS[quest.type] ?? '📜'} /></span>
                    <p className={`font-pixel truncate ${done ? 'text-text-secondary line-through' : 'text-text-primary'}`} style={{ fontSize: '8px' }}>
                      {quest.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-pixel ${DIFF_COLORS[quest.difficulty]}`} style={{ fontSize: '6px' }}>
                      {quest.difficulty}
                    </span>
                    <span className="font-vt text-accent-gold text-sm">+{quest.xpReward} XP</span>
                    <span className="font-vt text-yellow-600 text-sm">+{quest.goldReward} <E e="💰" /></span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </PixelPanel>
  );
}
