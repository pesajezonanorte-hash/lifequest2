import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../hooks/useToast';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useDebounce } from '../../hooks/useDebounce';
import { PixelPanel } from '../../components/ui/PixelPanel';
import { PixelButton } from '../../components/ui/PixelButton';
import type { JournalEntry, JournalStreak } from '@lifequest/shared';
import * as journalService from '../../services/journal.service';
import { relativeTime } from '../../lib/time';
import { SageContextButton } from '../../components/sage/SageContextButton';
import { E } from '@/components/ui/glyphs';

const MOOD_EMOJIS = ['', '😢', '😔', '😐', '😊', '😄'];

const DAILY_PROMPTS = [
  '¿Qué fue lo mejor que te pasó hoy?',
  '¿Qué aprendiste hoy que no sabías antes?',
  '¿Por qué tres cosas estás agradecido hoy?',
  '¿Qué harías diferente si pudieras repetir este día?',
  '¿Qué te dio energía hoy y qué te la quitó?',
  '¿Cuál fue el momento más difícil del día? ¿Cómo lo manejaste?',
  '¿Qué te acercó hoy a tu versión ideal de ti mismo?',
  '¿Qué conversación del día te quedó dando vueltas?',
  '¿Qué pequeño progreso celebras hoy?',
  '¿Qué harías si supieras que no puedes fallar?',
  '¿En qué área de tu vida quieres enfocar energía mañana?',
  '¿Qué consejo le darías hoy a una versión anterior de ti?',
];

function EntryEditor({ entry, onClose, onSave }: { entry?: JournalEntry; onClose: () => void; onSave: (e: JournalEntry) => void }) {
  useEscapeKey(onClose);
  const today = new Date().toISOString().split('T')[0];
  const [title, setTitle] = useState(entry?.title ?? '');
  const [content, setContent] = useState(entry?.content ?? '');
  const [mood, setMood] = useState(entry?.mood ?? 3);
  const [date, setDate] = useState(entry?.date?.split('T')[0] ?? today);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(entry?.tags ?? []);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!entry) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(async () => {
      if (!entry?.id || !content) return;
      try {
        await journalService.updateJournalEntry(entry.id, { title: title || undefined, content, mood, tags });
        setLastSaved(new Date());
      } catch { /* silent */ }
    }, 30000);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [title, content, mood, tags]);

  async function save() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      let saved: JournalEntry;
      if (entry?.id) {
        saved = await journalService.updateJournalEntry(entry.id, { title: title || undefined, content, mood, date, tags });
      } else {
        saved = await journalService.createJournalEntry({ title: title || undefined, content, mood, date, tags });
      }
      onSave(saved);
      toast.success('Entrada guardada ');
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  }

  function addTag() {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', stiffness: 350, damping: 28 }} className="bg-bg-panel border-2 border-border-pixel w-full max-w-2xl space-y-4 p-5 my-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="font-pixel text-accent-gold" style={{ fontSize: '10px' }}><E e="📜" /> ENTRADA DEL DIARIO</p>
          {lastSaved && <p className="font-pixel text-text-secondary" style={{ fontSize: '7px' }}>Auto-guardado {lastSaved.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>}
        </div>

        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título (opcional)" className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-xl px-3 py-2 focus:border-accent-gold outline-none" />

        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <p className="font-pixel text-text-secondary" style={{ fontSize: '7px' }}>FECHA:</p>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-base px-2 py-1 focus:border-accent-gold outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <p className="font-pixel text-text-secondary" style={{ fontSize: '7px' }}>HUMOR:</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(q => (
                <motion.button key={q} whileTap={{ scale: 0.85 }} onClick={() => setMood(q)} className={`text-xl transition-all ${mood === q ? 'scale-125' : 'opacity-40'}`}>
                  <E e={MOOD_EMOJIS[q]} />
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Escribe aquí tu entrada..."
          autoFocus={!entry}
          rows={12}
          className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-lg px-3 py-2 focus:border-accent-gold outline-none resize-none"
        />

        <div className="flex items-center gap-1 text-right">
          <p className="font-pixel text-text-secondary ml-auto" style={{ fontSize: '7px' }}>{content.length} CHARS · {content.split(/\s+/).filter(Boolean).length} PALABRAS</p>
        </div>

        {/* Tags */}
        <div>
          <div className="flex gap-2">
            <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => (e.key === 'Enter' || e.key === ',') && (e.preventDefault(), addTag())} placeholder="#etiqueta" className="flex-1 bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-base px-3 py-1.5 focus:border-accent-gold outline-none" />
            <PixelButton variant="secondary" onClick={addTag}>+</PixelButton>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map(t => (
                <span key={t} onClick={() => setTags(prev => prev.filter(x => x !== t))} className="font-pixel text-accent-cyan border border-accent-cyan px-2 py-0.5 cursor-pointer hover:bg-accent-cyan/10 transition-colors" style={{ fontSize: '7px' }}>
                  #{t} ×
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <PixelButton variant="ghost" onClick={onClose} className="flex-1">Cancelar</PixelButton>
          <PixelButton variant="primary" onClick={save} disabled={!content.trim() || saving} className="flex-1">
            {saving ? '...' : <><E e="✍️" s={11} /> GUARDAR</>}
          </PixelButton>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function JournalPage() {
  const toast = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [streak, setStreak] = useState<JournalStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [search, setSearch] = useState('');
  const [moodFilter, setMoodFilter] = useState<number | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const todayPrompt = DAILY_PROMPTS[new Date().getDate() % DAILY_PROMPTS.length];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [e, s] = await Promise.all([journalService.fetchJournal({ search: debouncedSearch || undefined }), journalService.fetchJournalStreak()]);
      setEntries(e);
      setStreak(s);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  function handleSaved(entry: JournalEntry) {
    setEntries(prev => {
      const exists = prev.find(e => e.id === entry.id);
      if (exists) return prev.map(e => e.id === entry.id ? entry : e);
      return [entry, ...prev];
    });
    setShowEditor(false);
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id));
    try { await journalService.deleteJournalEntry(id); }
    catch { toast.error('Error al eliminar'); load(); }
  }

  const todayEntry = entries.find(e => e.date.split('T')[0] === new Date().toISOString().split('T')[0]);
  const filteredEntries = moodFilter ? entries.filter(e => e.mood === moodFilter) : entries;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-pixel text-accent-gold" style={{ fontSize: '14px' }}><E e="📜" /> DIARIO DE AVENTURAS</h1>
          <p className="font-vt text-text-secondary text-base">El registro de tu historia, héroe</p>
        </div>
        <div className="flex items-center gap-2">
          <SageContextButton message="Dame un tema profundo para reflexionar hoy en mi diario." label="Tema de reflexión" />
          <PixelButton variant="primary" onClick={() => { setEditing(null); setShowEditor(true); }}><E e="✍" /> ESCRIBIR</PixelButton>
        </div>
      </div>

      {/* Streak + Today status */}
      <div className="grid grid-cols-2 gap-3">
        {streak && (
          <PixelPanel className="p-3 text-center">
            <p className="text-2xl"><E e="🔥" /></p>
            <p className="font-pixel text-accent-gold mt-1" style={{ fontSize: '14px' }}>{streak.currentStreak}</p>
            <p className="font-pixel text-text-secondary" style={{ fontSize: '6px' }}>DÍAS SEGUIDOS</p>
          </PixelPanel>
        )}
        <PixelPanel className="p-3 text-center cursor-pointer hover:border-accent-gold/50 transition-colors" onClick={() => { setEditing(todayEntry ?? null); setShowEditor(true); }}>
          <p className="text-2xl">{todayEntry ? <E e="✅" s={14} /> : <E e="📝" s={14} />}</p>
          <p className="font-pixel text-accent-gold mt-1" style={{ fontSize: '10px' }}>{todayEntry ? 'HOY ESCRITO' : 'ESCRIBIR HOY'}</p>
          {todayEntry && <p className="font-vt text-text-secondary text-base mt-0.5">{todayEntry.title ?? 'Sin título'}</p>}
        </PixelPanel>
      </div>

      {/* Daily prompt */}
      {!todayEntry && (
        <PixelPanel className="p-4 border-accent-purple/50">
          <p className="font-pixel text-accent-purple mb-2" style={{ fontSize: '8px' }}><E e="💬" /> PROMPT DEL DÍA</p>
          <p className="font-vt text-text-primary text-lg italic">"{todayPrompt}"</p>
          <PixelButton variant="secondary" onClick={() => { setEditing(null); setShowEditor(true); }} className="mt-3 w-full">
            <E e="✍" /> RESPONDER PROMPT
          </PixelButton>
        </PixelPanel>
      )}

      {/* Search + mood filter */}
      <div className="space-y-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar en el diario..." className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-base px-3 py-2 focus:border-accent-gold outline-none" />
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-pixel text-text-secondary" style={{ fontSize: '7px' }}>FILTRAR HUMOR:</span>
          <button onClick={() => setMoodFilter(null)} className={`px-2 py-0.5 border font-pixel transition-all ${moodFilter === null ? 'border-accent-gold text-accent-gold' : 'border-border-pixel text-text-secondary'}`} style={{ fontSize: '7px' }}>
            TODOS
          </button>
          {[1, 2, 3, 4, 5].map(m => (
            <button key={m} onClick={() => setMoodFilter(moodFilter === m ? null : m)} className={`px-2 py-0.5 border transition-all ${moodFilter === m ? 'border-accent-gold' : 'border-border-pixel'}`}>
              <span className={moodFilter === m ? 'opacity-100' : 'opacity-50'}><E e={MOOD_EMOJIS[m]} /></span>
            </button>
          ))}
        </div>
      </div>

      {/* Entries list */}
      {loading ? (
        <div className="text-center py-8"><motion.p className="font-vt text-text-secondary text-xl" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>Leyendo el diario...</motion.p></div>
      ) : filteredEntries.length === 0 ? (
        <PixelPanel className="p-8 text-center">
          <p className="text-4xl mb-2"><E e="📜" /></p>
          <p className="font-pixel text-text-secondary" style={{ fontSize: '9px' }}>{entries.length === 0 ? 'EL DIARIO ESTÁ EN BLANCO' : 'SIN RESULTADOS'}</p>
          <p className="font-vt text-text-secondary text-base mt-1">{entries.length === 0 ? 'El héroe no ha escrito aún...' : 'Prueba otro filtro'}</p>
        </PixelPanel>
      ) : (
        <AnimatePresence>
          <div className="space-y-2">
            {filteredEntries.map((e, i) => (
              <motion.div key={e.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <PixelPanel className="p-3 cursor-pointer hover:border-accent-gold/50 transition-colors" onClick={() => { setEditing(e); setShowEditor(true); }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {e.mood && <span className="text-xl flex-shrink-0"><E e={MOOD_EMOJIS[e.mood]} /></span>}
                        <p className="font-vt text-text-primary text-lg truncate">{e.title ?? `Día ${new Date(e.date).toLocaleDateString('es-CO', { weekday: 'long', month: 'long', day: 'numeric' })}`}</p>
                      </div>
                      <p className="font-pixel text-text-secondary mt-0.5" style={{ fontSize: '7px' }} title={new Date(e.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}>{relativeTime(e.date)}</p>
                      <p className="font-vt text-text-secondary text-base mt-1 line-clamp-2">{e.content.substring(0, 120)}{e.content.length > 120 ? '...' : ''}</p>
                      {e.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {e.tags.map(t => <span key={t} className="font-pixel text-accent-cyan" style={{ fontSize: '7px' }}>#{t}</span>)}
                        </div>
                      )}
                    </div>
                    <button onClick={(ev) => { ev.stopPropagation(); handleDelete(e.id); }} className="font-pixel text-accent-red hover:opacity-70 flex-shrink-0" style={{ fontSize: '8px' }}><E e="✕" /></button>
                  </div>
                </PixelPanel>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      <AnimatePresence>
        {showEditor && <EntryEditor entry={editing ?? undefined} onClose={() => { setShowEditor(false); setEditing(null); }} onSave={handleSaved} />}
      </AnimatePresence>
    </div>
  );
}
