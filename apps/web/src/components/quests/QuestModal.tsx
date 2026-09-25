import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getOpenOrigin } from '@/lib/origin';
import type { Quest } from '@lifequest/shared';
import { CategoryIcon, CATEGORY_LABELS } from './CategoryIcon';
import { DifficultyBadge } from './DifficultyBadge';
import { DeadlineBadge } from './DeadlineBadge';
import { PixelButton } from '../ui/PixelButton';
import { toggleSubObjective } from '../../services/quest.service';

interface Props {
  quest: Quest | null;
  onClose: () => void;
  onComplete: (quest: Quest) => void;
  onEdit: (quest: Quest) => void;
  onArchive: (quest: Quest) => void;
  onFail: (quest: Quest) => void;
  onQuestUpdated: (quest: Quest) => void;
}

export function QuestModal({ quest, onClose, onComplete, onEdit, onArchive, onFail, onQuestUpdated }: Props) {
  // Punto de apertura: de aquí crece la animación (desde donde se hizo click).
  const [origin] = useState(() => getOpenOrigin());
  if (!quest) return null;

  const subObjectives = quest.subObjectives as Array<{ id: string; title: string; completed: boolean }>;
  const isActive = quest.status === 'ACTIVE';

  async function handleToggleSub(subId: string, completed: boolean) {
    try {
      const updated = await toggleSubObjective(quest!.id, subId, completed);
      onQuestUpdated(updated);
    } catch { /* ignore */ }
  }

  // Portal al body: el backdrop fixed debe cubrir el viewport, no el
  // contenedor de la página (que por las transiciones crea containing block).
  return createPortal((
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <motion.div
          className="relative bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10 shadow-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut', delay: 0.05 }}
        >
          {/* Header */}
          <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-panel-light)] rounded-t-2xl">
            <div className="flex items-start gap-3">
              <CategoryIcon category={quest.category} size="lg" />
              <div className="flex-1">
                <h2 className="text-base font-semibold text-[var(--text-primary)] leading-tight">{quest.title}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <DifficultyBadge difficulty={quest.difficulty} />
                  <span className="text-sm text-[var(--text-secondary)]">{CATEGORY_LABELS[quest.category] ?? quest.category}</span>
                  <DeadlineBadge deadline={quest.deadline} />
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xl leading-none flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-panel-light)] transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {/* Rewards */}
            <div className="flex gap-3">
              <div className="bg-[var(--bg-panel-light)] border border-[var(--border)] rounded-lg px-3 py-2 text-center flex-1">
                <p className="text-xs font-semibold text-[var(--accent-gold)] uppercase tracking-wide">XP</p>
                <p className="text-lg font-bold text-[var(--accent-gold)]">+{quest.xpReward}</p>
              </div>
              <div className="bg-[var(--bg-panel-light)] border border-[var(--border)] rounded-lg px-3 py-2 text-center flex-1">
                <p className="text-xs font-semibold text-yellow-500 uppercase tracking-wide">Gold</p>
                <p className="text-lg font-bold text-yellow-500">+{quest.goldReward}</p>
              </div>
              <div className="bg-[var(--bg-panel-light)] border border-[var(--border)] rounded-lg px-3 py-2 text-center flex-1">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Tipo</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{quest.type}</p>
              </div>
            </div>

            {/* Description */}
            {quest.description && (
              <div>
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Descripción</p>
                <p className="text-sm text-[var(--text-primary)]">{quest.description}</p>
              </div>
            )}

            {/* Sub-objectives */}
            {subObjectives.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
                  Objetivos ({subObjectives.filter(s => s.completed).length}/{subObjectives.length})
                </p>
                <div className="space-y-2">
                  {subObjectives.map((sub) => (
                    <label key={sub.id} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={sub.completed}
                        disabled={!isActive}
                        onChange={(e) => handleToggleSub(sub.id, e.target.checked)}
                        className="accent-[var(--accent-gold)] w-4 h-4"
                      />
                      <span className={`text-sm ${sub.completed ? 'text-[var(--text-secondary)] line-through' : 'text-[var(--text-primary)]'}`}>
                        {sub.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="text-xs text-[var(--text-secondary)] space-y-0.5">
              <p>Creada: {new Date(quest.createdAt).toLocaleDateString('es-CO')}</p>
              {quest.deadline && <p>Vence: {new Date(quest.deadline).toLocaleDateString('es-CO')}</p>}
              {quest.completedAt && <p>Completada: {new Date(quest.completedAt).toLocaleDateString('es-CO')}</p>}
            </div>
          </div>

          {/* Actions */}
          {isActive && (
            <div className="p-4 border-t border-[var(--border)] space-y-2">
              <PixelButton
                variant="primary"
                className="w-full"
                onClick={() => { onComplete(quest); onClose(); }}
              >
                ⚔️ Completar misión
              </PixelButton>
              <div className="flex gap-2">
                <PixelButton variant="secondary" className="flex-1" onClick={() => { onEdit(quest); onClose(); }}>
                  ✏️ Editar
                </PixelButton>
                <PixelButton variant="danger" className="flex-1" onClick={() => { onFail(quest); onClose(); }}>
                  💀 Fallar
                </PixelButton>
                <PixelButton variant="ghost" className="flex-1" onClick={() => { onArchive(quest); onClose(); }}>
                  📦 Archivar
                </PixelButton>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  ), document.body);
}
