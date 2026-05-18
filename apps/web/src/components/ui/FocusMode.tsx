import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, RotateCcw, Zap } from 'lucide-react';
import { logFocusSession } from '../../services/focus.service';
import { useUIStore } from '../../store/uiStore';
import { useToastStore } from '../../hooks/useToast';

const PRESETS = [
  { label: '25 min', minutes: 25, color: 'var(--accent-cyan)' },
  { label: '45 min', minutes: 45, color: 'var(--accent-gold)' },
  { label: '60 min', minutes: 60, color: 'var(--accent-pink)' },
  { label: '90 min', minutes: 90, color: 'var(--accent-green)' },
];


interface Props {
  onClose: () => void;
  taskLabel?: string;
  questId?: string;
}

export function FocusMode({ onClose, taskLabel, questId }: Props) {
  const [preset, setPreset] = useState(PRESETS[0]);
  const [customMin, setCustomMin] = useState('');
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(PRESETS[0].minutes * 60);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [task, setTask] = useState(taskLabel ?? '');
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addFloatingXP } = useUIStore();
  const toast = useToastStore();

  const totalSecs = preset.minutes * 60;
  const progress = ((totalSecs - remaining) / totalSecs) * 100;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !started) onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      clearInterval(intervalRef.current!);
    };
  }, [started, onClose]);

  function handlePresetChange(p: typeof PRESETS[0]) {
    setPreset(p);
    setRemaining(p.minutes * 60);
    setStarted(false);
    setRunning(false);
    clearInterval(intervalRef.current!);
  }

  function handleStart() {
    setStarted(true);
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          setDone(true);
          if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  }

  function handlePause() {
    setRunning(false);
    clearInterval(intervalRef.current!);
  }

  function handleResume() {
    setRunning(true);
    clearInterval(intervalRef.current!);
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(intervalRef.current!); setRunning(false); setDone(true); return 0; }
        return r - 1;
      });
    }, 1000);
  }

  function handleReset() {
    clearInterval(intervalRef.current!);
    setRemaining(preset.minutes * 60);
    setRunning(false);
    setStarted(false);
    setDone(false);
  }


  async function handleComplete() {
    const elapsed = totalSecs - remaining;
    const durationMin = Math.max(1, Math.floor(elapsed / 60));
    setSaving(true);
    try {
      const result = await logFocusSession(durationMin, questId, task || undefined);
      addFloatingXP(result.xpEarned, window.innerWidth / 2, window.innerHeight / 2);
      toast.success(result.message);
    } catch {
      toast.error('Error registrando sesión');
    } finally {
      setSaving(false);
      onClose();
    }
  }

  const circumference = 2 * Math.PI * 110;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget && !started) onClose(); }}
    >
      <motion.div
        className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-deep)', border: `2px solid ${preset.color}44` }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Zap size={18} style={{ color: preset.color }} />
            <span className="font-bold text-[var(--text-primary)]">Modo Enfoque</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pb-8 space-y-6">
          {/* Presets */}
          {!started && (
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.minutes}
                  onClick={() => handlePresetChange(p)}
                  className="py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: preset.minutes === p.minutes ? p.color + '33' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${preset.minutes === p.minutes ? p.color : 'transparent'}`,
                    color: preset.minutes === p.minutes ? p.color : 'var(--text-muted)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Task input */}
          {!started && (
            <input
              className="w-full rounded-xl bg-white/5 border border-[var(--border)] px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent-gold)] transition-colors"
              placeholder="¿En qué te vas a enfocar? (opcional)"
              value={task}
              onChange={(e) => setTask(e.target.value)}
            />
          )}

          {/* Timer ring */}
          <div className="flex justify-center">
            <div className="relative" style={{ width: 240, height: 240 }}>
              <svg width={240} height={240}>
                <circle cx={120} cy={120} r={110} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={10} />
                <motion.circle
                  cx={120} cy={120} r={110}
                  fill="none" stroke={preset.color} strokeWidth={10}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (progress / 100) * circumference}
                  transform="rotate(-90 120 120)"
                  transition={{ duration: 0.5 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {done ? (
                  <div className="text-center">
                    <div className="text-5xl mb-2">🎉</div>
                    <p className="text-lg font-bold" style={{ color: preset.color }}>¡Completado!</p>
                  </div>
                ) : (
                  <>
                    <div className="tabular-nums text-5xl font-bold text-[var(--text-primary)]">
                      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </div>
                    {task && <p className="text-xs text-[var(--text-muted)] mt-2 max-w-[160px] text-center truncate">{task}</p>}
                  </>
                )}
              </div>
            </div>
          </div>


          {/* Controls */}
          <div className="flex gap-3">
            {done ? (
              <motion.button
                onClick={handleComplete}
                disabled={saving}
                whileTap={{ scale: 0.96 }}
                className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: preset.color, color: 'var(--bg-deep)' }}
              >
                {saving ? 'Guardando...' : <><Zap size={16} /> +XP — Guardar sesión</>}
              </motion.button>
            ) : !started ? (
              <motion.button
                onClick={handleStart}
                whileTap={{ scale: 0.96 }}
                className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: preset.color, color: 'var(--bg-deep)' }}
              >
                <Play size={16} /> Comenzar
              </motion.button>
            ) : (
              <>
                <motion.button
                  onClick={running ? handlePause : handleResume}
                  whileTap={{ scale: 0.96 }}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: preset.color, color: 'var(--bg-deep)' }}
                >
                  {running ? <><Pause size={16} /> Pausar</> : <><Play size={16} /> Continuar</>}
                </motion.button>
                <motion.button
                  onClick={handleReset}
                  whileTap={{ scale: 0.96 }}
                  className="py-3 px-4 rounded-2xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <RotateCcw size={16} />
                </motion.button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
