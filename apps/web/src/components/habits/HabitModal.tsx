import { useState } from 'react';
import { motion } from 'framer-motion';
import { PixelButton } from '../ui/PixelButton';
import { PixelInput } from '../ui/PixelInput';
import type { CreateHabitPayload } from '../../services/habit.service';

const CATEGORIES = ['HEALTH', 'FITNESS', 'FINANCE', 'LEARNING', 'LOVE', 'SOCIAL', 'PERSONAL', 'CREATIVE'] as const;
const CATEGORY_ICONS: Record<string, string> = {
  HEALTH: '💚', FITNESS: '⚔️', FINANCE: '💰', LEARNING: '📚',
  LOVE: '💖', SOCIAL: '🤝', PERSONAL: '⭐', CREATIVE: '🎨',
};

const ICON_OPTIONS = ['💧', '🌙', '🧘', '📚', '🏋️', '🍎', '💊', '🚶', '🧹', '✍️',
  '🎵', '🎮', '🌿', '☀️', '🏃', '🚴', '💻', '📝', '🎯', '⭐',
  '💪', '🧠', '💰', '🎨', '🤸', '🥗', '😴', '🧘', '📖', '🌊'];

const COLOR_OPTIONS = ['#ffd23f', '#4d96ff', '#6bcf7f', '#ff6b9d', '#9d4edd', '#ff6b6b', '#4ecdc4', '#ff9f43'];

interface Props {
  onSubmit: (data: CreateHabitPayload) => Promise<void>;
  onClose: () => void;
  initial?: Partial<CreateHabitPayload>;
  title?: string;
}

export function HabitModal({ onSubmit, onClose, initial, title }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateHabitPayload>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    category: initial?.category ?? 'HEALTH',
    icon: initial?.icon ?? '⭐',
    color: initial?.color ?? '#ffd23f',
    xpReward: initial?.xpReward ?? 20,
    goldReward: initial?.goldReward ?? 5,
    reminderTime: initial?.reminderTime ?? '',
    frequency: initial?.frequency ?? { type: 'daily', days: [] },
  });

  async function handleSubmit() {
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ ...form, description: form.description || undefined, reminderTime: form.reminderTime || undefined });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10 shadow-lg"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="p-4 border-b border-[var(--border)] rounded-t-2xl flex items-center justify-between bg-[var(--bg-panel-light)]">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            {title ?? 'Nuevo hábito'}
          </h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-panel)] transition-colors">✕</button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Nombre*</label>
            <PixelInput
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Nombre del hábito..."
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe el hábito..."
              rows={2}
              className="w-full bg-[var(--bg-panel-light)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm px-3 py-2 resize-none focus:border-[var(--accent-blue)] outline-none transition-colors"
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">Icono</label>
            <div className="flex flex-wrap gap-1.5">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setForm((f) => ({ ...f, icon }))}
                  className={`relative w-8 h-8 text-lg flex items-center justify-center border rounded-lg transition-colors ${form.icon === icon ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10' : 'border-[var(--border)] hover:border-[var(--text-secondary)]'}`}
                >
                  {icon}
                  {form.icon === icon && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[var(--accent-gold)] rounded-full flex items-center justify-center text-[8px] font-bold text-black leading-none">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ backgroundColor: color, borderColor: form.color === color ? '#fff' : color }}
                />
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">Categoría</label>
            <div className="grid grid-cols-4 gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setForm((f) => ({ ...f, category: cat }))}
                  className={`p-1.5 border rounded-lg text-center text-xl transition-colors ${form.category === cat ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10' : 'border-[var(--border)] hover:border-[var(--text-secondary)]'}`}
                >
                  {CATEGORY_ICONS[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Reminder */}
          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Recordatorio (opcional)</label>
            <input
              type="time"
              value={form.reminderTime}
              onChange={(e) => setForm((f) => ({ ...f, reminderTime: e.target.value }))}
              className="w-full bg-[var(--bg-panel-light)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm px-3 py-2 focus:border-[var(--accent-blue)] outline-none transition-colors"
            />
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border)] flex gap-3">
          <PixelButton variant="ghost" className="flex-1" onClick={onClose}>Cancelar</PixelButton>
          <PixelButton variant="primary" className="flex-1" onClick={handleSubmit} disabled={loading || !form.title.trim()}>
            {loading ? 'Guardando...' : '✓ Guardar'}
          </PixelButton>
        </div>
      </motion.div>
    </div>
  );
}
