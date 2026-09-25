import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Zap, CheckCircle2 } from 'lucide-react';
import * as checkinService from '../../services/checkin.service';
import type { DailyCheckin } from '../../services/checkin.service';
import { E } from '@/components/ui/glyphs';

const MOOD_OPTIONS = [
  { value: 1, emoji: '😔', label: 'Mal' },
  { value: 2, emoji: '😕', label: 'Bajo' },
  { value: 3, emoji: '😐', label: 'Normal' },
  { value: 4, emoji: '😊', label: 'Bien' },
  { value: 5, emoji: '🤩', label: '¡Genial!' },
];

export function DailyCheckinWidget() {
  const [checkin, setCheckin] = useState<DailyCheckin | null | undefined>(undefined);
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(5);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    checkinService.getTodayCheckin()
      .then((c) => {
        setCheckin(c);
        if (c) {
          setMood(c.mood);
          setEnergy(c.energy);
          setDone(true);
        }
      })
      .catch(() => setCheckin(null));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const result = await checkinService.upsertCheckin(mood, energy);
      setCheckin(result);
      setDone(true);
      if (navigator.vibrate) navigator.vibrate(50);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  if (checkin === undefined) return null; // loading

  if (done && checkin) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-4"
        style={{ borderColor: 'var(--accent-green)44' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[var(--accent-green)]" />
            <span className="text-xs font-semibold text-[var(--accent-green)]">Check-in de hoy completado</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span>{MOOD_OPTIONS.find((m) => m.value === checkin.mood)?.emoji} {MOOD_OPTIONS.find((m) => m.value === checkin.mood)?.label}</span>
            <span className="text-[var(--text-muted)]"><E e="⚡" />{checkin.energy}/10</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5"
      style={{ borderColor: 'var(--accent-cyan)44' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Heart size={16} className="text-[var(--accent-pink)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">¿Cómo llegas hoy?</h3>
        <span className="text-xs text-[var(--text-muted)] ml-auto">5 segundos</span>
      </div>

      {/* Mood */}
      <div className="flex gap-2 justify-between mb-4">
        {MOOD_OPTIONS.map((m) => (
          <motion.button
            key={m.value}
            onClick={() => setMood(m.value)}
            whileTap={{ scale: 0.9 }}
            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all"
            style={{
              background: mood === m.value ? 'var(--accent-cyan)22' : 'transparent',
              border: `1px solid ${mood === m.value ? 'var(--accent-cyan)' : 'transparent'}`,
            }}
          >
            <span className="text-xl"><E e={m.emoji} /></span>
            <span className="text-[10px] text-[var(--text-muted)]">{m.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Energy */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Zap size={13} className="text-[var(--accent-gold)]" />
            <span className="text-xs text-[var(--text-secondary)]">Energía</span>
          </div>
          <span className="text-sm font-bold text-[var(--accent-gold)]">{energy}/10</span>
        </div>
        <input
          type="range"
          min={1} max={10}
          value={energy}
          onChange={(e) => setEnergy(Number(e.target.value))}
          className="w-full accent-[var(--accent-gold)]"
        />
      </div>

      <motion.button
        onClick={handleSave}
        disabled={saving}
        whileTap={{ scale: 0.97 }}
        className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all"
        style={{ background: 'var(--accent-cyan)', color: 'var(--bg-deep)' }}
      >
        {saving ? 'Guardando...' : 'Registrar'}
      </motion.button>
    </motion.div>
  );
}
