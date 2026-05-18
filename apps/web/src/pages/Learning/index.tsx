import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { PixelPanel } from '../../components/ui/PixelPanel';
import { PixelButton } from '../../components/ui/PixelButton';
import type { LearningItem, LearningStats } from '@lifequest/shared';
import * as learningService from '../../services/learning.service';
import { PomodoroTimer, NotesPanel, VocabPanel } from '../../components/learning/LearningExtras';
import { SageContextButton } from '../../components/sage/SageContextButton';

const TYPE_ICONS: Record<string, string> = { BOOK: '📖', COURSE: '💻', PODCAST: '🎙️', VIDEO: '🎥', LANGUAGE: '🗣️' };
const STATUS_LABELS: Record<string, string> = { NOT_STARTED: 'Por empezar', IN_PROGRESS: 'En progreso', COMPLETED: 'Completado', ABANDONED: 'Abandonado' };
const STATUS_COLORS: Record<string, string> = { NOT_STARTED: 'text-text-secondary', IN_PROGRESS: 'text-accent-gold', COMPLETED: 'text-accent-green', ABANDONED: 'text-accent-red' };

function AddItemModal({ onClose, onSave }: { onClose: () => void; onSave: (item: LearningItem) => void }) {
  const [type, setType] = useState('BOOK');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalProgress, setTotalProgress] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const item = await learningService.createLearning({ type, title, author: author || undefined, totalProgress: totalProgress ? Number(totalProgress) : 0 });
      onSave(item);
      toast.success('¡Ítem agregado!');
    } catch { toast.error('Error al agregar'); }
    finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} transition={{ type: 'spring', stiffness: 350, damping: 28 }} className="bg-bg-panel border-2 border-border-pixel w-full max-w-md space-y-4 p-5" onClick={e => e.stopPropagation()}>
        <p className="font-pixel text-accent-gold" style={{ fontSize: '10px' }}>AGREGAR ÍTEM</p>
        <div className="flex gap-1 flex-wrap">
          {Object.entries(TYPE_ICONS).map(([key, icon]) => (
            <button key={key} onClick={() => setType(key)} className={`flex items-center gap-1 px-3 py-1.5 border-2 font-pixel transition-all ${type === key ? 'border-accent-gold bg-accent-gold/10 text-accent-gold' : 'border-border-pixel text-text-secondary'}`} style={{ fontSize: '8px' }}>
              {icon} {key}
            </button>
          ))}
        </div>
        <input autoFocus value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} placeholder="Título..." className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-lg px-3 py-2 focus:border-accent-gold outline-none" />
        <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Autor / Plataforma (opcional)" className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-base px-3 py-2 focus:border-accent-gold outline-none" />
        {type === 'BOOK' && (
          <input type="number" value={totalProgress} onChange={e => setTotalProgress(e.target.value)} placeholder="Total de páginas" className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-base px-3 py-2 focus:border-accent-gold outline-none" />
        )}
        <div className="flex gap-2">
          <PixelButton variant="ghost" onClick={onClose} className="flex-1">Cancelar</PixelButton>
          <PixelButton variant="primary" onClick={save} disabled={!title.trim() || saving} className="flex-1">Agregar</PixelButton>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ProgressModal({ item, onClose, onUpdate }: { item: LearningItem; onClose: () => void; onUpdate: (item: LearningItem) => void }) {
  const [progress, setProgress] = useState(String(item.currentProgress));
  const [status, setStatus] = useState(item.status);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { addFloatingXP } = useUIStore();
  const { updateUser } = useAuthStore();

  async function save() {
    setSaving(true);
    try {
      const result = await learningService.updateLearning(item.id, { currentProgress: Number(progress), status });
      onUpdate(result.item);
      if (result.rewards && (result.rewards as { xpGained: number }).xpGained) {
        addFloatingXP((result.rewards as { xpGained: number }).xpGained, window.innerWidth / 2, 200);
        toast.success('¡Ítem completado!', `+${(result.rewards as { xpGained: number }).xpGained} XP`);
      }
      onClose();
    } catch { toast.error('Error al actualizar'); }
    finally { setSaving(false); }
  }

  const pct = item.totalProgress > 0 ? Math.min((Number(progress) / item.totalProgress) * 100, 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-bg-panel border-2 border-border-pixel w-full max-w-md space-y-4 p-5" onClick={e => e.stopPropagation()}>
        <p className="font-pixel text-accent-gold" style={{ fontSize: '10px' }}>ACTUALIZAR PROGRESO</p>
        <p className="font-vt text-text-primary text-xl">{item.title}</p>

        {item.totalProgress > 0 && (
          <>
            <input type="number" value={progress} onChange={e => setProgress(e.target.value)} placeholder={`Página actual (de ${item.totalProgress})`} className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-xl px-3 py-2 focus:border-accent-gold outline-none" />
            <div className="stat-bar h-4">
              <motion.div className="h-full bg-accent-gold" animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
            </div>
            <p className="font-pixel text-accent-gold text-center" style={{ fontSize: '8px' }}>{Math.round(pct)}%</p>
          </>
        )}

        <select value={status} onChange={e => setStatus(e.target.value as LearningItem['status'])} className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-base px-3 py-2 focus:border-accent-gold outline-none">
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>

        <div className="flex gap-2">
          <PixelButton variant="ghost" onClick={onClose} className="flex-1">Cancelar</PixelButton>
          <PixelButton variant="primary" onClick={save} disabled={saving} className="flex-1">Guardar</PixelButton>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function LearningPage() {
  const toast = useToast();
  const [items, setItems] = useState<LearningItem[]>([]);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [updating, setUpdating] = useState<LearningItem | null>(null);
  const [filter, setFilter] = useState<string>('IN_PROGRESS');
  const [tab, setTab] = useState<'biblioteca' | 'pomodoro' | 'detalle'>('biblioteca');
  const [selectedItem, setSelectedItem] = useState<LearningItem | null>(null);
  const [detailTab, setDetailTab] = useState<'notas' | 'vocab'>('notas');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [it, st] = await Promise.all([learningService.fetchLearning(), learningService.fetchLearningStats()]);
      setItems(it);
      setStats(st);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter ? items.filter(i => i.status === filter) : items;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-pixel text-accent-gold" style={{ fontSize: '14px' }}>📚 LA BIBLIOTECA</h1>
          <p className="font-vt text-text-secondary text-base">Conocimiento es poder</p>
        </div>
        <div className="flex items-center gap-2">
          <SageContextButton message="¿Qué debería estudiar o leer ahora dado lo que llevo en la Biblioteca?" label="Pídele recomendación al Sabio" />
          <PixelButton variant="primary" onClick={() => setShowAdd(true)}>+ AGREGAR</PixelButton>
        </div>
      </div>

      {/* Main tabs */}
      <div className="flex gap-1">
        {([['biblioteca', '📚 Biblioteca'], ['pomodoro', '🍅 Pomodoro']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setTab(key); setSelectedItem(null); }}
            className={`flex-shrink-0 px-3 py-1.5 border-2 font-pixel transition-all ${tab === key ? 'border-accent-gold bg-accent-gold text-bg-deep' : 'border-border-pixel text-text-secondary hover:border-text-secondary'}`}
            style={{ fontSize: '8px' }}
          >
            {label}
          </button>
        ))}
        {selectedItem && (
          <button
            onClick={() => setTab('detalle')}
            className={`flex-shrink-0 px-3 py-1.5 border-2 font-pixel transition-all ${tab === 'detalle' ? 'border-accent-gold bg-accent-gold text-bg-deep' : 'border-border-pixel text-text-secondary'}`}
            style={{ fontSize: '8px' }}
          >
            📖 {selectedItem.title.slice(0, 15)}...
          </button>
        )}
      </div>

      {tab === 'pomodoro' && <PomodoroTimer />}

      {tab === 'detalle' && selectedItem && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setTab('biblioteca')} className="font-pixel text-text-secondary hover:text-accent-gold transition-colors" style={{ fontSize: '8px' }}>← VOLVER</button>
            <p className="font-vt text-text-primary text-lg">{selectedItem.title}</p>
          </div>
          <div className="flex gap-1">
            {(['notas', 'vocab'] as const).map(dt => (
              <button
                key={dt}
                onClick={() => setDetailTab(dt)}
                className={`px-3 py-1.5 border-2 font-pixel transition-all ${detailTab === dt ? 'border-accent-gold bg-accent-gold text-bg-deep' : 'border-border-pixel text-text-secondary'}`}
                style={{ fontSize: '8px' }}
              >
                {dt === 'notas' ? '📝 Notas' : '🃏 Vocabulario'}
              </button>
            ))}
          </div>
          {detailTab === 'notas' ? <NotesPanel itemId={selectedItem.id} /> : <VocabPanel itemId={selectedItem.id} />}
        </div>
      )}

      {tab !== 'biblioteca' ? null : <>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'EN PROGRESO', value: stats.inProgress, icon: '📖' },
            { label: 'COMPLETADOS', value: stats.totalCompleted, icon: '✅' },
            { label: 'ESTE AÑO', value: stats.completedThisYear, icon: '🏆' },
            { label: 'PÁGINAS', value: stats.totalPages, icon: '📄' },
          ].map(s => (
            <PixelPanel key={s.label} className="p-3 text-center">
              <p className="text-2xl">{s.icon}</p>
              <p className="font-pixel text-accent-gold mt-1" style={{ fontSize: '14px' }}>{s.value}</p>
              <p className="font-pixel text-text-secondary" style={{ fontSize: '6px' }}>{s.label}</p>
            </PixelPanel>
          ))}
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto pb-1">
        {[['', '📚 Todos'], ['IN_PROGRESS', '📖 En progreso'], ['NOT_STARTED', '⏳ Por empezar'], ['COMPLETED', '✅ Completados']].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={`flex-shrink-0 px-3 py-1.5 border-2 font-pixel transition-all ${filter === key ? 'border-accent-gold bg-accent-gold text-bg-deep' : 'border-border-pixel text-text-secondary'}`} style={{ fontSize: '8px' }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8"><motion.p className="font-vt text-text-secondary text-xl" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>Cargando...</motion.p></div>
      ) : filtered.length === 0 ? (
        <PixelPanel className="p-8 text-center">
          <p className="text-4xl mb-2">📚</p>
          <p className="font-pixel text-text-secondary" style={{ fontSize: '9px' }}>LA BIBLIOTECA ESTÁ VACÍA</p>
        </PixelPanel>
      ) : (
        <AnimatePresence>
          <div className="space-y-2">
            {filtered.map((item, i) => {
              const pct = item.totalProgress > 0 ? Math.min((item.currentProgress / item.totalProgress) * 100, 100) : 0;
              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <PixelPanel className="p-3 cursor-pointer hover:border-accent-gold/50 transition-colors" onClick={() => setUpdating(item)}>
                    <div className="flex justify-end mb-1">
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedItem(item); setTab('detalle'); setDetailTab('notas'); }}
                        className="font-pixel text-text-secondary hover:text-accent-gold transition-colors"
                        style={{ fontSize: '7px' }}
                      >
                        📝 NOTAS/VOCAB
                      </button>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{TYPE_ICONS[item.type]}</span>
                          <p className="font-vt text-text-primary text-lg">{item.title}</p>
                        </div>
                        {item.author && <p className="font-pixel text-text-secondary ml-8" style={{ fontSize: '7px' }}>{item.author}</p>}
                        <p className={`font-pixel ml-8 mt-1 ${STATUS_COLORS[item.status]}`} style={{ fontSize: '7px' }}>{STATUS_LABELS[item.status]}</p>
                      </div>
                      {item.rating && (
                        <p className="font-vt text-accent-gold text-base">{'⭐'.repeat(item.rating)}</p>
                      )}
                    </div>
                    {item.totalProgress > 0 && (
                      <div className="mt-2">
                        <div className="stat-bar h-2">
                          <div className="h-full bg-accent-gold" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="font-pixel text-text-secondary mt-0.5 text-right" style={{ fontSize: '7px' }}>{item.currentProgress}/{item.totalProgress} pág · {Math.round(pct)}%</p>
                      </div>
                    )}
                  </PixelPanel>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      <AnimatePresence>
        {showAdd && <AddItemModal onClose={() => setShowAdd(false)} onSave={item => { setItems(prev => [item, ...prev]); setShowAdd(false); }} />}
        {updating && <ProgressModal item={updating} onClose={() => setUpdating(null)} onUpdate={updated => { setItems(prev => prev.map(i => i.id === updated.id ? updated : i)); setUpdating(null); }} />}
      </AnimatePresence>
      </>}
    </div>
  );
}
