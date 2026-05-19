import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Swords, Wallet, Flame, NotebookPen, Zap } from 'lucide-react';
import { createQuest } from '../../services/quest.service';
import { createTransaction } from '../../services/finance.service';
import { fetchHabits, logHabit } from '../../services/habit.service';
import { createJournalEntry } from '../../services/journal.service';
import { useUIStore } from '../../store/uiStore';
import type { Habit } from '../../services/habit.service';

// Fan positions (angle in degrees, 90° = up, spread over arc)
const FAN_ANGLES = [90, 125, 160, 215, 250];
const FAN_RADIUS = 76;

type ModalType = 'quest' | 'expense' | 'habit' | 'note' | 'checkin' | null;

const ACTIONS: { icon: React.ReactNode; label: string; color: string; modal: ModalType }[] = [
  { icon: <Swords size={15} />,    label: 'Nueva Quest',    color: '#ffd23f', modal: 'quest' },
  { icon: <Wallet size={15} />,    label: 'Gasto rápido',   color: '#4ade80', modal: 'expense' },
  { icon: <Flame size={15} />,     label: 'Marcar hábito',  color: '#f87171', modal: 'habit' },
  { icon: <NotebookPen size={15}/>, label: 'Nota rápida',   color: '#22d3ee', modal: 'note' },
  { icon: <Zap size={15} />,       label: 'Check-in',       color: '#a78bfa', modal: 'checkin' },
];

// ── Quest Modal ──────────────────────────────────────────────────────────────
function QuestModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'DAILY' | 'SIDE' | 'MAIN'>('SIDE');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await createQuest({ title, type, difficulty: 'EASY', category: 'PERSONAL', xpReward: type === 'DAILY' ? 30 : 50, goldReward: 10 });
      onDone();
    } catch { setSaving(false); }
  }

  return (
    <ModalShell title="⚔️ Nueva Quest" onClose={onClose}>
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSave()}
        placeholder="Nombre de la misión..."
        className="w-full px-3 py-2 rounded-xl text-sm border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)]"
      />
      <div className="flex gap-1.5 mt-2">
        {(['DAILY', 'SIDE', 'MAIN'] as const).map(t => (
          <button key={t} onClick={() => setType(t)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all"
            style={{ border: `1px solid ${type === t ? 'var(--accent-gold)' : 'var(--border)'}`, background: type === t ? 'rgba(255,210,63,0.12)' : 'transparent', color: type === t ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
            {t === 'DAILY' ? '📅 Diaria' : t === 'SIDE' ? '📜 Side' : '⚔️ Main'}
          </button>
        ))}
      </div>
      <SaveButton onClick={handleSave} saving={saving} disabled={!title.trim()} />
    </ModalShell>
  );
}

// ── Expense Modal ────────────────────────────────────────────────────────────
function ExpenseModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!amount || isNaN(Number(amount))) return;
    setSaving(true);
    try {
      await createTransaction({ type: 'EXPENSE', amount: Number(amount), category: 'Otros', description: desc || undefined });
      onDone();
    } catch { setSaving(false); }
  }

  return (
    <ModalShell title="💸 Gasto Rápido" onClose={onClose}>
      <input autoFocus type="number" value={amount} onChange={e => setAmount(e.target.value)}
        placeholder="Monto" className="w-full px-3 py-2 rounded-xl text-sm border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]" />
      <input value={desc} onChange={e => setDesc(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()}
        placeholder="Descripción (opcional)" className="w-full px-3 py-2 rounded-xl text-sm border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)] mt-2" />
      <SaveButton onClick={handleSave} saving={saving} disabled={!amount || isNaN(Number(amount))} color="var(--accent-green)" />
    </ModalShell>
  );
}

// ── Habit Modal ──────────────────────────────────────────────────────────────
function HabitModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchHabits().then(h => setHabits(h.filter(h => !h.todayCompleted).slice(0, 5))).catch(() => null);
  }, []);

  async function handleLog(id: string) {
    setSaving(id);
    try {
      await logHabit(id, 'completed');
      setHabits(prev => prev.filter(h => h.id !== id));
      if (habits.length <= 1) onDone();
      else setSaving(null);
    } catch { setSaving(null); }
  }

  return (
    <ModalShell title="🔥 Marcar Hábito" onClose={onClose}>
      {habits.length === 0 ? (
        <p className="text-xs text-center py-3" style={{ color: 'var(--text-muted)' }}>¡Todos tus hábitos del día están completos!</p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {habits.map(h => (
            <motion.button key={h.id} whileTap={{ scale: 0.97 }} onClick={() => handleLog(h.id)}
              disabled={saving === h.id}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] text-left transition-all hover:border-[var(--accent-red)] disabled:opacity-50"
              style={{ background: 'var(--bg-panel-light)' }}>
              <span className="text-base">{h.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{h.title}</p>
                {h.currentStreak > 0 && <p className="text-[10px]" style={{ color: 'var(--accent-gold)' }}>🔥 {h.currentStreak} días</p>}
              </div>
              <span className="text-xs font-bold" style={{ color: 'var(--accent-cyan)' }}>+{h.xpReward} XP</span>
            </motion.button>
          ))}
        </div>
      )}
    </ModalShell>
  );
}

// ── Note Modal ───────────────────────────────────────────────────────────────
function NoteModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await createJournalEntry({ content, title: content.slice(0, 40) });
      onDone();
    } catch { setSaving(false); }
  }

  return (
    <ModalShell title="✍️ Nota Rápida" onClose={onClose}>
      <textarea autoFocus value={content} onChange={e => setContent(e.target.value)} rows={3}
        placeholder="Escribe tu nota aquí..."
        className="w-full px-3 py-2 rounded-xl text-sm border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)] outline-none focus:border-[var(--accent-cyan)] resize-none" />
      <SaveButton onClick={handleSave} saving={saving} disabled={!content.trim()} color="var(--accent-cyan)" />
    </ModalShell>
  );
}

// ── Checkin Modal ────────────────────────────────────────────────────────────
function CheckinModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(5);
  const [saving, setSaving] = useState(false);
  const { addFloatingXP } = useUIStore();

  async function handleSave() {
    setSaving(true);
    try {
      const api = (await import('../../lib/api')).default;
      await api.post('/checkin', { mood, energy });
      addFloatingXP(15, window.innerWidth / 2, 200);
      onDone();
    } catch { setSaving(false); }
  }

  const MOODS = ['😢', '😕', '😐', '🙂', '😄'];

  return (
    <ModalShell title="⚡ Check-in" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Estado de ánimo</p>
          <div className="flex justify-between gap-1">
            {MOODS.map((m, i) => (
              <button key={i} onClick={() => setMood(i + 1)} className="text-xl transition-all"
                style={{ opacity: mood === i + 1 ? 1 : 0.35, transform: mood === i + 1 ? 'scale(1.25)' : 'scale(1)' }}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Energía: {energy}/10</p>
          <input type="range" min={1} max={10} value={energy} onChange={e => setEnergy(Number(e.target.value))}
            className="w-full accent-[var(--accent-cyan)]" />
        </div>
        <SaveButton onClick={handleSave} saving={saving} color="var(--accent-purple)" label="Registrar check-in" />
      </div>
    </ModalShell>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────
function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 8 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className="w-72 rounded-2xl shadow-2xl p-4"
      style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{title}</span>
        <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-full" style={{ color: 'var(--text-muted)', background: 'var(--bg-panel-light)' }}>
          <X size={12} />
        </button>
      </div>
      {children}
    </motion.div>
  );
}

function SaveButton({ onClick, saving, disabled, color = 'var(--accent-gold)', label = 'Guardar' }: {
  onClick: () => void; saving: boolean; disabled?: boolean; color?: string; label?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      disabled={disabled || saving}
      className="w-full mt-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
      style={{ background: `${color}22`, border: `1px solid ${color}66`, color }}
    >
      {saving ? '...' : label}
    </motion.button>
  );
}

// ── Main FAB ─────────────────────────────────────────────────────────────────
export function QuickActionsFAB() {
  const [open, setOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const { addFloatingXP } = useUIStore();

  function openModal(modal: ModalType) {
    setOpen(false);
    setActiveModal(modal);
  }

  function onDone() {
    setActiveModal(null);
    addFloatingXP(10, window.innerWidth - 80, window.innerHeight - 100);
  }

  const cx = 0; // center x offset (relative to button center)
  const cy = 0; // center y offset

  return (
    <>
      {/* Modal overlay */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pb-24"
            onClick={() => setActiveModal(null)}>
            {activeModal === 'quest'   && <QuestModal   onClose={() => setActiveModal(null)} onDone={onDone} />}
            {activeModal === 'expense' && <ExpenseModal onClose={() => setActiveModal(null)} onDone={onDone} />}
            {activeModal === 'habit'   && <HabitModal   onClose={() => setActiveModal(null)} onDone={onDone} />}
            {activeModal === 'note'    && <NoteModal    onClose={() => setActiveModal(null)} onDone={onDone} />}
            {activeModal === 'checkin' && <CheckinModal onClose={() => setActiveModal(null)} onDone={onDone} />}
          </div>
        )}
      </AnimatePresence>

      {/* FAB + Fan */}
      <div className="fixed top-[10rem] bottom-auto sm:top-auto sm:bottom-6 right-4 md:bottom-8 md:right-8 z-40">
        {/* Fan buttons */}
        <AnimatePresence>
          {open && ACTIONS.map((action, i) => {
            const rad = (FAN_ANGLES[i] * Math.PI) / 180;
            const x = -Math.cos(rad) * FAN_RADIUS;
            const y = -Math.sin(rad) * FAN_RADIUS;
            return (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, x: cx, y: cy, scale: 0.4 }}
                animate={{ opacity: 1, x, y, scale: 1 }}
                exit={{ opacity: 0, x: cx, y: cy, scale: 0.4 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22, delay: i * 0.04 }}
                className="absolute bottom-0 right-0"
                style={{ transformOrigin: 'bottom right' }}
              >
                <div className="relative flex items-center group">
                  {/* Tooltip */}
                  <motion.span
                    initial={{ opacity: 0, x: 4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute right-12 whitespace-nowrap text-[10px] font-semibold px-2 py-1 rounded-lg pointer-events-none"
                    style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  >
                    {action.label}
                  </motion.span>
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => openModal(action.modal)}
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg border"
                    style={{ background: `${action.color}18`, border: `1.5px solid ${action.color}66`, color: action.color }}
                  >
                    {action.icon}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Main FAB button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setOpen(o => !o)}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl relative z-10"
          style={{
            background: open
              ? 'linear-gradient(135deg, var(--accent-pink), var(--accent-gold))'
              : 'linear-gradient(135deg, var(--accent-gold), var(--accent-cyan))',
            border: 'none',
            color: '#fff',
            boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
          }}
        >
          <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.22, type: 'spring', stiffness: 400 }}>
            <Plus size={22} />
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}
