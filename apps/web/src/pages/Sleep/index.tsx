import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useToast } from '../../hooks/useToast';
import { PixelPanel } from '../../components/ui/PixelPanel';
import { PixelButton } from '../../components/ui/PixelButton';
import type { SleepLog, SleepStats } from '@lifequest/shared';
import * as sleepService from '../../services/sleep.service';
import { SageContextButton } from '../../components/sage/SageContextButton';

const QUALITY_LABELS = ['', '😢 Terrible', '😔 Malo', '😐 Regular', '😊 Bueno', '😄 Excelente'];
const QUALITY_COLORS = ['', '#ff6b6b', '#ff9f43', '#ffd23f', '#6bcf7f', '#4d96ff'];

function SleepModal({ onClose, onSave }: { onClose: () => void; onSave: (log: SleepLog) => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [bedtime, setBedtime] = useState(`${today}T23:00`);
  const [wakeTime, setWakeTime] = useState(() => {
    const tom = new Date(); tom.setDate(tom.getDate() + 1);
    return `${tom.toISOString().split('T')[0]}T07:00`;
  });
  const [quality, setQuality] = useState(4);
  const [notes, setNotes] = useState('');
  const [caffeineLate, setCaffeineLate] = useState(false);
  const [screensBeforeBed, setScreensBeforeBed] = useState(false);
  const [exercisedToday, setExercisedToday] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const duration = (() => {
    try {
      let d = (new Date(wakeTime).getTime() - new Date(bedtime).getTime()) / 3600000;
      if (d < 0) d += 24;
      return d.toFixed(1);
    } catch { return '?'; }
  })();

  async function save() {
    setSaving(true);
    try {
      const log = await sleepService.createSleep({ bedtime, wakeTime, quality, notes: notes || undefined, date: today, caffeineLate, screensBeforeBed, exercisedToday });
      onSave(log);
      toast.success('¡Sueño registrado!', `${duration}h de descanso`);
    } catch {
      toast.error('Error al registrar sueño');
    } finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', stiffness: 350, damping: 28 }} className="bg-bg-panel border-2 border-border-pixel w-full max-w-md space-y-4 p-5" onClick={e => e.stopPropagation()}>
        <p className="font-pixel text-accent-gold" style={{ fontSize: '10px' }}>REGISTRAR SUEÑO</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="font-pixel text-text-secondary mb-1" style={{ fontSize: '7px' }}>ME ACOSTÉ</p>
            <input type="datetime-local" value={bedtime} onChange={e => setBedtime(e.target.value)} style={{ colorScheme: 'dark' }} className="w-full bg-bg-deep border-2 border-border-pixel text-white font-vt text-base px-2 py-1.5 focus:border-accent-gold outline-none" />
          </div>
          <div>
            <p className="font-pixel text-text-secondary mb-1" style={{ fontSize: '7px' }}>ME LEVANTÉ</p>
            <input type="datetime-local" value={wakeTime} onChange={e => setWakeTime(e.target.value)} style={{ colorScheme: 'dark' }} className="w-full bg-bg-deep border-2 border-border-pixel text-white font-vt text-base px-2 py-1.5 focus:border-accent-gold outline-none" />
          </div>
        </div>

        <PixelPanel className="p-3 text-center">
          <p className="font-pixel text-text-secondary" style={{ fontSize: '7px' }}>DURACIÓN CALCULADA</p>
          <p className="font-pixel text-accent-gold text-2xl">{duration}h</p>
        </PixelPanel>

        <div>
          <p className="font-pixel text-text-secondary mb-2" style={{ fontSize: '7px' }}>CALIDAD</p>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map(q => (
              <motion.button
                key={q}
                whileTap={{ scale: 0.85 }}
                onClick={() => setQuality(q)}
                className={`text-2xl transition-all ${quality >= q ? 'opacity-100 scale-110' : 'opacity-40'}`}
              >
                ⭐
              </motion.button>
            ))}
          </div>
          <p className="font-vt text-center mt-1" style={{ color: QUALITY_COLORS[quality] }}>{QUALITY_LABELS[quality]}</p>
        </div>

        {/* Sleep factors */}
        <div>
          <p className="font-pixel text-text-secondary mb-2" style={{ fontSize: '7px' }}>FACTORES</p>
          <div className="space-y-2">
            {([
              ['caffeineLate', '☕ Cafeína tarde (después de 4pm)', caffeineLate, setCaffeineLate],
              ['screens', '📱 Pantallas antes de dormir', screensBeforeBed, setScreensBeforeBed],
              ['exercise', '🏋️ Ejercicié hoy', exercisedToday, setExercisedToday],
            ] as [string, string, boolean, (v: boolean) => void][]).map(([key, label, val, setter]) => (
              <button key={key} onClick={() => setter(!val)} className={`w-full flex items-center gap-3 px-3 py-2 border-2 transition-all text-left ${val ? 'border-accent-gold bg-accent-gold/10' : 'border-border-pixel'}`}>
                <span className="font-pixel text-accent-gold" style={{ fontSize: '10px' }}>{val ? '☑' : '☐'}</span>
                <span className="font-vt text-text-primary text-base">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas (opcional)" className="w-full bg-bg-deep border-2 border-border-pixel text-white font-vt text-base px-3 py-2 focus:border-accent-gold outline-none" />

        <div className="flex gap-2">
          <PixelButton variant="ghost" onClick={onClose} className="flex-1">Cancelar</PixelButton>
          <PixelButton variant="primary" onClick={save} disabled={saving} className="flex-1">
            {saving ? 'Guardando...' : '🌙 REGISTRAR'}
          </PixelButton>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SleepPage() {
  const toast = useToast();
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [stats, setStats] = useState<SleepStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [l, s] = await Promise.all([sleepService.fetchSleep(), sleepService.fetchSleepStats()]);
      setLogs(l);
      setStats(s);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleSaved(log: SleepLog) {
    setLogs(prev => [log, ...prev]);
    setShowModal(false);
    load();
  }

  async function handleDelete(id: string) {
    setLogs(prev => prev.filter(l => l.id !== id));
    try { await sleepService.deleteSleep(id); load(); }
    catch { toast.error('Error al eliminar'); load(); }
  }

  const chartData = logs.slice(0, 14).reverse().map(l => ({
    date: new Date(l.date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }),
    horas: Number(l.duration.toFixed(1)),
    quality: l.quality,
  }));

  const lastLog = logs[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-pixel text-accent-gold" style={{ fontSize: '14px' }}>🌙 TORRE DEL SUEÑO</h1>
          <p className="font-vt text-text-secondary text-base">Tu descanso es tu HP, héroe</p>
        </div>
        <div className="flex items-center gap-2">
          <SageContextButton message="¿Cómo está mi sueño últimamente? ¿Qué patrones detectas?" label="Pídele consejo al Sabio" />
          <PixelButton variant="primary" onClick={() => setShowModal(true)}>+ REGISTRAR SUEÑO</PixelButton>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'PROMEDIO SEMANAL', value: `${stats.weeklyAvg.toFixed(1)}h`, icon: '🌙' },
            { label: 'PROMEDIO TOTAL', value: `${stats.avgDuration.toFixed(1)}h`, icon: '📊' },
            { label: 'CALIDAD MEDIA', value: `${stats.avgQuality.toFixed(1)}/5`, icon: '⭐' },
            { label: 'TENDENCIA', value: stats.trend === 'improving' ? '↑ Mejorando' : stats.trend === 'declining' ? '↓ Bajando' : '→ Estable', icon: '📈' },
          ].map(s => (
            <PixelPanel key={s.label} className="p-3 text-center">
              <p className="text-2xl">{s.icon}</p>
              <p className="font-pixel text-accent-gold mt-1" style={{ fontSize: '11px' }}>{s.value}</p>
              <p className="font-pixel text-text-secondary" style={{ fontSize: '6px' }}>{s.label}</p>
            </PixelPanel>
          ))}
        </div>
      )}

      {/* Last night */}
      {lastLog && (
        <PixelPanel className="p-4">
          <p className="font-pixel text-text-secondary mb-2" style={{ fontSize: '8px' }}>ANOCHE</p>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-vt text-text-primary text-xl">
                {new Date(lastLog.bedtime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} →{' '}
                {new Date(lastLog.wakeTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="font-pixel text-accent-gold mt-1" style={{ fontSize: '12px' }}>{lastLog.duration.toFixed(1)}h</p>
            </div>
            <div className="text-right">
              <p className="font-vt text-text-primary text-2xl">{'⭐'.repeat(lastLog.quality)}</p>
              <p className="font-vt text-text-secondary text-base">{QUALITY_LABELS[lastLog.quality]}</p>
              {(lastLog as any).sleepScore != null && (
                <div className="mt-1 inline-block px-2 py-0.5 border-2 font-pixel" style={{
                  fontSize: '9px',
                  borderColor: (lastLog as any).sleepScore >= 80 ? 'var(--accent-green)' : (lastLog as any).sleepScore >= 60 ? 'var(--accent-gold)' : 'var(--accent-red)',
                  color: (lastLog as any).sleepScore >= 80 ? 'var(--accent-green)' : (lastLog as any).sleepScore >= 60 ? 'var(--accent-gold)' : 'var(--accent-red)',
                }}>
                  SCORE: {(lastLog as any).sleepScore}/100
                </div>
              )}
            </div>
          </div>
          {lastLog.duration < 7 && (
            <p className="font-vt text-accent-red text-base mt-2">⚠️ Tu HP está bajo, héroe. Descansa más esta noche.</p>
          )}
        </PixelPanel>
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <PixelPanel className="p-4">
          <p className="font-pixel text-text-secondary mb-3" style={{ fontSize: '8px' }}>ÚLTIMAS 2 SEMANAS</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontFamily: 'VT323', fontSize: 12, fill: '#8a7aaa' }} />
              <YAxis domain={[0, 10]} tick={{ fontFamily: 'VT323', fontSize: 12, fill: '#8a7aaa' }} />
              <Tooltip contentStyle={{ background: '#1a0d2e', border: '2px solid #3d2d5c', fontFamily: 'VT323', fontSize: '16px' }} formatter={(v: number) => `${v}h`} />
              <Bar dataKey="horas">
                {chartData.map((d, i) => (
                  <Cell key={i} fill={QUALITY_COLORS[d.quality] ?? '#4d96ff'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </PixelPanel>
      )}

      {/* Log list */}
      {!loading && logs.length > 0 && (
        <div className="space-y-2">
          <p className="font-pixel text-text-secondary" style={{ fontSize: '8px' }}>HISTORIAL</p>
          <AnimatePresence>
            {logs.map((l, i) => (
              <motion.div key={l.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}>
                <PixelPanel className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-vt text-text-primary text-lg">{new Date(l.date).toLocaleDateString('es-CO', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    <p className="font-pixel text-text-secondary" style={{ fontSize: '7px' }}>
                      {new Date(l.bedtime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} → {new Date(l.wakeTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-pixel text-accent-gold" style={{ fontSize: '11px' }}>{l.duration.toFixed(1)}h</p>
                    <p className="font-vt text-base" style={{ color: QUALITY_COLORS[l.quality] }}>{'⭐'.repeat(l.quality)}</p>
                    <button onClick={() => handleDelete(l.id)} className="font-pixel text-accent-red hover:opacity-70" style={{ fontSize: '8px' }}>✕</button>
                  </div>
                </PixelPanel>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showModal && <SleepModal onClose={() => setShowModal(false)} onSave={handleSaved} />}
      </AnimatePresence>
    </div>
  );
}
