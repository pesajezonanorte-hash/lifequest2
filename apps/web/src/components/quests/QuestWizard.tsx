import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelButton } from '../ui/PixelButton';
import { PixelInput } from '../ui/PixelInput';
import { CATEGORY_ICONS, CATEGORY_LABELS } from './CategoryIcon';

const QUEST_TYPES = [
  { key: 'MAIN',   icon: '⚔️', label: 'Misión Principal',  desc: 'Tu gran aventura. Metas a largo plazo.', multiplier: 10 },
  { key: 'SIDE',   icon: '🗡️', label: 'Misión Secundaria', desc: 'Aventuras de mediano plazo.',              multiplier: 4 },
  { key: 'DAILY',  icon: '☀️', label: 'Misión Diaria',     desc: 'Se resetea cada día. Construye hábitos.', multiplier: 1 },
  { key: 'WEEKLY', icon: '📅', label: 'Misión Semanal',    desc: 'Se resetea cada lunes.',                  multiplier: 2.5 },
  { key: 'META',   icon: '🎯', label: 'Meta',              desc: 'Objetivo de largo plazo. Sin fecha fija.', multiplier: 8 },
] as const;

const DIFFICULTIES = [
  { key: 'EASY',   label: 'Fácil',  color: '#6bcf7f', baseXp: 25 },
  { key: 'NORMAL', label: 'Normal', color: '#4d96ff', baseXp: 50 },
  { key: 'HARD',   label: 'Difícil', color: '#9d4edd', baseXp: 100 },
  { key: 'EPIC',   label: 'ÉPICA',  color: '#ffd23f', baseXp: 250 },
] as const;

const CATEGORIES = ['HEALTH', 'FITNESS', 'FINANCE', 'LEARNING', 'LOVE', 'SOCIAL', 'PERSONAL', 'CREATIVE'] as const;

interface FormData {
  type: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  deadline: string;
  subObjectives: string[];
}

interface Props {
  onSubmit: (data: FormData) => Promise<void>;
  onClose: () => void;
  initialData?: Partial<FormData>;
}

export function QuestWizard({ onSubmit, onClose, initialData }: Props) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    type: initialData?.type ?? 'SIDE',
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    category: initialData?.category ?? 'PERSONAL',
    difficulty: initialData?.difficulty ?? 'NORMAL',
    deadline: initialData?.deadline ?? '',
    subObjectives: initialData?.subObjectives ?? [''],
  });

  function calcXp() {
    const typeInfo = QUEST_TYPES.find((t) => t.key === form.type);
    const diffInfo = DIFFICULTIES.find((d) => d.key === form.difficulty);
    if (!typeInfo || !diffInfo) return 0;
    return Math.floor(diffInfo.baseXp * typeInfo.multiplier);
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      await onSubmit({ ...form, subObjectives: form.subObjectives.filter((s) => s.trim()) });
    } finally {
      setLoading(false);
    }
  }

  const xp = calcXp();
  const gold = Math.floor(xp * 0.2);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10 shadow-lg"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-panel-light)] rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              {initialData?.title ? 'Editar misión' : 'Nueva misión'}
            </h2>
            <div className="flex gap-2 mt-1">
              {['Tipo', 'Detalles', 'Objetivos'].map((s, i) => (
                <span
                  key={s}
                  className={`text-xs font-medium ${i === step ? 'text-[var(--accent-gold)]' : i < step ? 'text-[var(--accent-green)]' : 'text-[var(--text-secondary)]'}`}
                >
                  {i < step ? '✓ ' : `${i + 1}. `}{s}
                </span>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-panel)] transition-colors">✕</button>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Main content */}
          <div className="flex-1 p-4">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-2 gap-3"
                >
                  {QUEST_TYPES.map((qt) => (
                    <button
                      key={qt.key}
                      onClick={() => setForm((f) => ({ ...f, type: qt.key }))}
                      className={`p-3 border rounded-xl text-left transition-all ${
                        form.type === qt.key
                          ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10'
                          : 'border-[var(--border)] hover:border-[var(--text-secondary)]'
                      }`}
                    >
                      <div className="text-2xl mb-1">{qt.icon}</div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{qt.label}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{qt.desc}</p>
                    </button>
                  ))}
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Título*</label>
                    <PixelInput
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="El nombre de tu misión..."
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Descripción</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Describe tu misión..."
                      rows={2}
                      className="w-full bg-[var(--bg-panel-light)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm px-3 py-2 resize-none focus:border-[var(--accent-blue)] outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">Categoría</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setForm((f) => ({ ...f, category: cat }))}
                          className={`p-2 border rounded-lg text-center transition-all ${
                            form.category === cat ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10' : 'border-[var(--border)] hover:border-[var(--text-secondary)]'
                          }`}
                        >
                          <div>{CATEGORY_ICONS[cat]}</div>
                          <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {CATEGORY_LABELS[cat]}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">Dificultad</label>
                    <div className="flex gap-2">
                      {DIFFICULTIES.map((d) => (
                        <button
                          key={d.key}
                          onClick={() => setForm((f) => ({ ...f, difficulty: d.key }))}
                          className="flex-1 px-2 py-1.5 border rounded-lg text-xs font-medium transition-all"
                          style={{
                            borderColor: form.difficulty === d.key ? d.color : 'var(--border)',
                            color: d.color,
                            backgroundColor: form.difficulty === d.key ? d.color + '22' : undefined,
                          }}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Deadline (opcional)</label>
                    <input
                      type="date"
                      value={form.deadline}
                      onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                      className="w-full bg-[var(--bg-panel-light)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm px-3 py-2 focus:border-[var(--accent-blue)] outline-none transition-colors"
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  {(form.type === 'MAIN' || form.type === 'SIDE') ? (
                    <>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Divide tu misión en pasos pequeños. Cada objetivo que tildes actualiza el progreso.
                      </p>
                      {form.subObjectives.map((obj, i) => (
                        <div key={i} className="flex gap-2">
                          <PixelInput
                            value={obj}
                            onChange={(e) => {
                              const newSubs = [...form.subObjectives];
                              newSubs[i] = e.target.value;
                              setForm((f) => ({ ...f, subObjectives: newSubs }));
                            }}
                            placeholder={`Objetivo ${i + 1}...`}
                          />
                          <button
                            onClick={() => setForm((f) => ({ ...f, subObjectives: f.subObjectives.filter((_, j) => j !== i) }))}
                            className="px-2 text-[var(--accent-red)] border border-[var(--accent-red)] rounded-lg hover:bg-[var(--accent-red)] hover:text-white transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {form.subObjectives.length < 10 && (
                        <button
                          onClick={() => setForm((f) => ({ ...f, subObjectives: [...f.subObjectives, ''] }))}
                          className="text-sm font-medium text-[var(--accent-gold)] border border-dashed border-[var(--accent-gold)] rounded-lg px-3 py-2 w-full hover:bg-[var(--accent-gold)]/10 transition-colors"
                        >
                          + Agregar objetivo
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-3xl mb-3">☀️</p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Las misiones {form.type === 'DAILY' ? 'diarias' : 'semanales'} no necesitan sub-objetivos.
                        <br />¡Simplemente complétala cuando la logres!
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Preview */}
          <div className="md:w-52 border-t md:border-t-0 md:border-l border-[var(--border)] p-4 bg-[var(--bg-panel-light)]">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">Vista previa</p>
            <div className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-xl p-3 space-y-2">
              <div className="text-xl">{CATEGORY_ICONS[form.category]}</div>
              <p className="text-sm text-[var(--text-primary)]">{form.title || 'Tu misión...'}</p>
              <div className="flex gap-1 flex-wrap">
                <span className="text-xs font-medium text-[var(--accent-gold)]">+{xp}XP</span>
                <span className="text-xs font-medium text-yellow-400">💰{gold}</span>
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                {QUEST_TYPES.find(t => t.key === form.type)?.icon} {QUEST_TYPES.find(t => t.key === form.type)?.label}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] flex justify-between gap-3">
          <PixelButton variant="secondary" onClick={step === 0 ? onClose : () => setStep(s => s - 1)}>
            {step === 0 ? 'Cancelar' : '← Atrás'}
          </PixelButton>

          {step < 2 ? (
            <PixelButton
              variant="primary"
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && !form.title.trim()}
            >
              Siguiente →
            </PixelButton>
          ) : (
            <PixelButton variant="primary" onClick={handleSubmit} disabled={loading || !form.title.trim()}>
              {loading ? 'Creando...' : '⚔️ Crear misión'}
            </PixelButton>
          )}
        </div>
      </motion.div>
    </div>
  );
}
