import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { PixelPanel } from '../ui/PixelPanel';
import { PixelButton } from '../ui/PixelButton';
import { useUIStore } from '../../store/uiStore';
import { useToast } from '../../hooks/useToast';
import { refreshUser } from '../../hooks/useAuth';
import api from '../../lib/api';
import { E } from '@/components/ui/glyphs';
import ModernLoader from '@/components/ui/modern-loader';
import { useLoadingVisibility } from '@/components/ui/LoadingGate';
import { LOADING_COPY } from '@/lib/loadingCopy';

const inputClass =
  'min-h-11 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-3 py-2.5 text-base text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent-gold)_16%,transparent)]';

// ─── Pomodoro Timer ────────────────────────────────────────────────────────────

const POMODORO_MINUTES = 25;
const BREAK_MINUTES = 5;

export function PomodoroTimer() {
  const [phase, setPhase] = useState<'idle' | 'work' | 'break'>('idle');
  const [seconds, setSeconds] = useState(POMODORO_MINUTES * 60);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addFloatingXP, flashScreen } = useUIStore();

  const clear = () => { if (intervalRef.current) clearInterval(intervalRef.current); };

  const beep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(); osc.stop(ctx.currentTime + 0.6);
    } catch { /* audio not available */ }
  }, []);

  useEffect(() => {
    if (phase === 'idle') return;
    clear();
    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          beep();
          if (phase === 'work') {
            // Award XP for completed pomodoro
            api.post('/learning/pomodoro').then((r: any) => {
              const xp = r.data?.xp ?? 15;
              addFloatingXP(xp, window.innerWidth / 2, 200);
              flashScreen('#8f8f98');
              void refreshUser();
            }).catch(() => null);
            setSessions(n => n + 1);
            setPhase('break');
            return BREAK_MINUTES * 60;
          } else {
            setPhase('work');
            return POMODORO_MINUTES * 60;
          }
        }
        return s - 1;
      });
    }, 1000);
    return clear;
  }, [phase, beep, addFloatingXP, flashScreen]);

  function start() { setPhase('work'); setSeconds(POMODORO_MINUTES * 60); }
  function stop() { setPhase('idle'); setSeconds(POMODORO_MINUTES * 60); clear(); }

  const total = phase === 'break' ? BREAK_MINUTES * 60 : POMODORO_MINUTES * 60;
  const progress = 1 - seconds / total;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const circumference = 2 * Math.PI * 54;

  return (
    <PixelPanel className="p-6 text-center sm:p-8">
      <p className="flex items-center justify-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
        <E e="🍅" s={16} /> Pomodoro
        <span className="rounded-full border border-[var(--border)] bg-[var(--bg-panel-light)] px-2.5 py-0.5 text-xs font-semibold text-[var(--accent-gold)]">+15 XP</span>
      </p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">25 minutos de foco, 5 de descanso.</p>

      <div className="mt-6 flex justify-center">
        <div className="relative h-40 w-40">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--bg-muted)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke={phase === 'break' ? 'var(--accent-green)' : phase === 'work' ? 'var(--accent-gold)' : 'var(--border-strong)'}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <p className="text-3xl font-semibold tabular-nums text-[var(--text-primary)]">
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              {phase === 'idle' ? 'Listo' : phase === 'work' ? 'Foco' : 'Descanso'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        {phase === 'idle' ? (
          <PixelButton variant="primary" onClick={start} className="min-h-11">▶ Iniciar</PixelButton>
        ) : (
          <PixelButton variant="ghost" onClick={stop} className="min-h-11">■ Detener</PixelButton>
        )}
      </div>

      {sessions > 0 && (
        <p className="mt-4 text-sm font-semibold text-[var(--accent-green)]">
          {sessions} sesión{sessions > 1 ? 'es' : ''} completada{sessions > 1 ? 's' : ''} · +{sessions * 15} XP
        </p>
      )}
    </PixelPanel>
  );
}

// ─── Notes Panel ──────────────────────────────────────────────────────────────

interface Note { id: string; text: string; createdAt: string }

export function NotesPanel({ itemId }: { itemId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const showLoading = useLoadingVisibility(loading);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    api.get(`/learning/${itemId}/notes`)
      .then((r: any) => setNotes(r.data?.notes ?? []))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, [itemId]);

  async function addNote() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const r: any = await api.post(`/learning/${itemId}/notes`, { text });
      setNotes(prev => [...prev, r.data.note]);
      setText('');
    } catch {
      toast.error('No se pudo guardar la nota');
    } finally { setSaving(false); }
  }

  async function deleteNote(noteId: string) {
    const snapshot = notes;
    setNotes(prev => prev.filter(n => n.id !== noteId));
    try {
      await api.delete(`/learning/${itemId}/notes/${noteId}`);
    } catch {
      setNotes(snapshot);
      toast.error('No se pudo eliminar la nota');
    }
  }

  if (showLoading) return <ModernLoader words={[...LOADING_COPY.learningNotes]} />;
  if (loading) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Añadir nota..."
          rows={2}
          className={`${inputClass} sm:flex-1 resize-none`}
        />
        <PixelButton variant="secondary" onClick={addNote} disabled={saving || !text.trim()} className="shrink-0 sm:self-end">
          {saving ? 'Guardando…' : '+ Nota'}
        </PixelButton>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-10 text-center">
          <p className="text-3xl" aria-hidden="true"><E e="📝" s={32} /></p>
          <p className="mt-2 text-sm italic text-[var(--text-secondary)]">Sin notas aún. Apunta ideas, citas o resúmenes aquí.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(n => (
            <div key={n.id} className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4">
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[var(--text-primary)]">{n.text}</p>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  {new Date(n.createdAt).toLocaleDateString('es-CO')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => deleteNote(n.id)}
                aria-label="Eliminar nota"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--accent-red)]/10 hover:text-[var(--accent-red)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-red)]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Vocabulary Flashcards (SRS SM-2) ─────────────────────────────────────────

interface VocabCard {
  id: string; front: string; back: string; example?: string;
  nextReview: string; interval: number; easiness: number; repetitions: number;
}

export function VocabPanel({ itemId }: { itemId: string }) {
  const [cards, setCards] = useState<VocabCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<VocabCard | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ front: '', back: '', example: '' });
  const showLoading = useLoadingVisibility(loading);
  const toast = useToast();

  const today = new Date().toISOString().slice(0, 10);
  const dueCards = cards.filter(c => c.nextReview <= today);

  useEffect(() => {
    setLoading(true);
    api.get(`/learning/${itemId}/vocab`)
      .then((r: any) => setCards(r.data?.cards ?? []))
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, [itemId]);

  async function addCard() {
    if (!form.front.trim() || !form.back.trim()) return;
    try {
      const r: any = await api.post(`/learning/${itemId}/vocab`, { front: form.front, back: form.back, example: form.example || undefined });
      setCards(prev => [...prev, r.data.card]);
      setForm({ front: '', back: '', example: '' });
      setShowForm(false);
    } catch {
      toast.error('No se pudo guardar la tarjeta');
    }
  }

  async function review(quality: 0 | 1 | 2 | 3 | 4 | 5) {
    if (!reviewing) return;
    try {
      const r: any = await api.post(`/learning/${itemId}/vocab/${reviewing.id}/review`, { quality });
      setCards(prev => prev.map(c => c.id === reviewing.id ? r.data.card : c));
      const next = dueCards.find(c => c.id !== reviewing.id) ?? null;
      setReviewing(next);
      setShowBack(false);
    } catch {
      toast.error('No se pudo guardar el repaso');
    }
  }

  function startReview() {
    setReviewing(dueCards[0] ?? null);
    setShowBack(false);
  }

  if (showLoading) return <ModernLoader words={[...LOADING_COPY.learningCards]} />;
  if (loading) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-panel-light)] px-3 py-1 text-xs font-semibold tabular-nums text-[var(--text-secondary)]">
            {cards.length} tarjetas
          </span>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold tabular-nums ${dueCards.length > 0 ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]' : 'border-[var(--border)] bg-[var(--bg-panel-light)] text-[var(--text-secondary)]'}`}>
            {dueCards.length} para repasar
          </span>
        </div>
        <div className="flex gap-2">
          {dueCards.length > 0 && !reviewing && (
            <PixelButton variant="primary" size="sm" onClick={startReview} className="min-h-10">▶ Repasar ({dueCards.length})</PixelButton>
          )}
          <PixelButton variant="secondary" size="sm" onClick={() => setShowForm(f => !f)} className="min-h-10">
            {showForm ? <><X className="h-3.5 w-3.5" aria-hidden="true" /> Cerrar</> : '+ Tarjeta'}
          </PixelButton>
        </div>
      </div>

      {showForm && (
        <PixelPanel className="space-y-3 p-4 sm:p-5">
          <input value={form.front} onChange={e => setForm(f => ({ ...f, front: e.target.value }))} placeholder="Frente (palabra/concepto)" className={inputClass} />
          <input value={form.back} onChange={e => setForm(f => ({ ...f, back: e.target.value }))} placeholder="Dorso (definición/traducción)" className={inputClass} />
          <input value={form.example} onChange={e => setForm(f => ({ ...f, example: e.target.value }))} placeholder="Ejemplo (opcional)" className={inputClass} />
          <PixelButton variant="primary" onClick={addCard} disabled={!form.front.trim() || !form.back.trim()} className="w-full">Guardar tarjeta</PixelButton>
        </PixelPanel>
      )}

      {/* Active review session */}
      <AnimatePresence>
        {reviewing && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <PixelPanel className="space-y-5 p-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Revisando {dueCards.indexOf(reviewing) + 1} / {dueCards.length}
              </p>
              <p className="break-words text-2xl font-semibold text-[var(--text-primary)]">{reviewing.front}</p>

              {!showBack ? (
                <PixelButton variant="secondary" onClick={() => setShowBack(true)} className="min-h-11 w-full">Mostrar respuesta</PixelButton>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="space-y-1.5 border-t border-[var(--border)] pt-4">
                    <p className="break-words text-xl font-semibold text-[var(--accent-gold)]">{reviewing.back}</p>
                    {reviewing.example && <p className="text-sm italic text-[var(--text-secondary)]">{reviewing.example}</p>}
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">¿Qué tan bien lo recordaste?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      [0, ' Nada', 'var(--accent-red)'],
                      [2, ' Difícil', 'var(--accent-gold)'],
                      [4, ' Fácil', 'var(--accent-green)'],
                    ] as [0 | 2 | 4, string, string][]).map(([q, label, color]) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => review(q)}
                        className="min-h-11 rounded-xl border-2 bg-[var(--bg-panel)] text-sm font-semibold transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent-gold)]"
                        style={{ borderColor: color, color }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <button onClick={() => setReviewing(null)} className="text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-red)]">
                <E e="✕" s={11} /> Salir de revisión
              </button>
            </PixelPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card list */}
      {!reviewing && cards.length > 0 && (
        <div className="space-y-2">
          {cards.map(c => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] px-4 py-3">
              <p className="min-w-0 break-words text-sm text-[var(--text-primary)]">
                <span className="font-semibold">{c.front}</span>
                <span className="mx-1.5 text-[var(--text-muted)]">→</span>
                <span className="text-[var(--text-secondary)]">{c.back}</span>
              </p>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.nextReview <= today ? 'bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]' : 'bg-[var(--bg-muted)] text-[var(--text-secondary)]'}`}>
                {c.nextReview <= today ? ' Hoy' : `en ${Math.ceil((new Date(c.nextReview).getTime() - Date.now()) / 86400000)} d`}
              </span>
            </div>
          ))}
        </div>
      )}

      {cards.length === 0 && !showForm && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-10 text-center">
          <p className="text-3xl" aria-hidden="true"><E e="🃏" s={32} /></p>
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">Sin tarjetas aún</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Crea tarjetas de vocabulario y repásalas con repetición espaciada.</p>
        </div>
      )}
    </div>
  );
}
