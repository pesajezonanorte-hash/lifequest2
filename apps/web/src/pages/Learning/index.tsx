import { FlowButton } from '@/components/ui/flow-button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft, BookOpen, NotebookPen, TrendingUp } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useToast } from '../../hooks/useToast';
import { refreshUser } from '../../hooks/useAuth';
import { PixelPanel } from '../../components/ui/PixelPanel';
import { LifeQuestFlipCard } from '../../components/ui/lifequest-flip-card';
import { PixelButton } from '../../components/ui/PixelButton';
import { ModalFrame } from '../../components/ui/ModalFrame';
import { SegmentedTabs } from '../../components/ui/SegmentedTabs';
import type { LearningItem, LearningStats } from '@lifequest/shared';
import * as learningService from '../../services/learning.service';
import { PomodoroTimer, NotesPanel, VocabPanel } from '../../components/learning/LearningExtras';
import { SageContextButton } from '../../components/sage/SageContextButton';
import { E } from '@/components/ui/glyphs';
import ModernLoader from '@/components/ui/modern-loader';
import { LoadingGate } from '@/components/ui/LoadingGate';
import { LOADING_COPY } from '@/lib/loadingCopy';

const TYPE_ICONS: Record<string, string> = { BOOK: '📖', COURSE: '💻', PODCAST: '🎙️', VIDEO: '🎥', LANGUAGE: '🗣️' };
const TYPE_LABELS: Record<string, string> = { BOOK: 'Libro', COURSE: 'Curso', PODCAST: 'Podcast', VIDEO: 'Video', LANGUAGE: 'Idioma' };
const STATUS_LABELS: Record<string, string> = { NOT_STARTED: 'Por empezar', IN_PROGRESS: 'En progreso', COMPLETED: 'Completado', ABANDONED: 'Abandonado' };
const STATUS_DOTS: Record<string, string> = {
  NOT_STARTED: 'var(--text-muted)',
  IN_PROGRESS: 'var(--accent-gold)',
  COMPLETED: 'var(--accent-green)',
  ABANDONED: 'var(--accent-red)',
};

function StatusChip({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-panel-light)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_DOTS[status] ?? 'var(--text-muted)' }} aria-hidden="true" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function AddItemModal({ onClose, onSave }: { onClose: () => void; onSave: (item: LearningItem) => void }) {
  const [type, setType] = useState('BOOK');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalProgress, setTotalProgress] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const inputClass = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent-gold)_16%,transparent)]';

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const item = await learningService.createLearning({
        type,
        title,
        author: author || undefined,
        totalProgress: totalProgress ? Number(totalProgress) : 0,
      });
      onSave(item);
      toast.success('¡Ítem agregado!');
    } catch {
      toast.error('Error al agregar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalFrame
      title="Agregar a tu biblioteca"
      description="Elige el formato y guarda algo que quieras estudiar, leer o escuchar."
      icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
      onClose={onClose}
      footer={(
        <div className="grid grid-cols-2 gap-2.5">
          <PixelButton variant="ghost" onClick={onClose} className="w-full">Cancelar</PixelButton>
          <PixelButton variant="primary" onClick={save} disabled={!title.trim() || saving} className="w-full">
            {saving ? 'Agregando…' : 'Agregar'}
          </PixelButton>
        </div>
      )}
    >
      <div className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-xs font-medium text-[var(--text-secondary)]">Formato</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(TYPE_ICONS).map(([key, icon]) => {
              const selected = type === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key)}
                  aria-pressed={selected}
                  className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-left text-sm font-medium transition-colors ${
                    selected
                      ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--text-primary)]'
                      : 'border-[var(--border)] bg-[var(--bg-panel-light)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span aria-hidden="true">{icon}</span>
                  <span className="truncate">{TYPE_LABELS[key] ?? key}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Título</span>
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && void save()}
            placeholder="Ej. Hábitos atómicos"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Autor o plataforma <span className="font-normal text-[var(--text-muted)]">(opcional)</span></span>
          <input
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            placeholder="Ej. James Clear o Coursera"
            className={inputClass}
          />
        </label>

        {type === 'BOOK' && (
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Total de páginas <span className="font-normal text-[var(--text-muted)]">(opcional)</span></span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={totalProgress}
              onChange={(event) => setTotalProgress(event.target.value)}
              placeholder="Ej. 320"
              className={inputClass}
            />
          </label>
        )}
      </div>
    </ModalFrame>
  );
}

function ProgressModal({ item, onClose, onUpdate }: { item: LearningItem; onClose: () => void; onUpdate: (item: LearningItem) => void }) {
  const [progress, setProgress] = useState(String(item.currentProgress));
  const [status, setStatus] = useState(item.status);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { addFloatingXP } = useUIStore();
  const inputClass = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent-gold)_16%,transparent)]';

  async function save() {
    setSaving(true);
    try {
      const result = await learningService.updateLearning(item.id, { currentProgress: Number(progress), status });
      onUpdate(result.item);
      if (result.rewards && (result.rewards as { xpGained: number }).xpGained) {
        addFloatingXP((result.rewards as { xpGained: number }).xpGained, window.innerWidth / 2, 200);
        toast.success('¡Ítem completado!', `+${(result.rewards as { xpGained: number }).xpGained} XP`);
        void refreshUser();
      }
      onClose();
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setSaving(false);
    }
  }

  const pct = item.totalProgress > 0 ? Math.min((Number(progress) / item.totalProgress) * 100, 100) : 0;

  return (
    <ModalFrame
      title="Actualizar progreso"
      description={item.title}
      icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
      onClose={onClose}
      footer={(
        <div className="grid grid-cols-2 gap-2.5">
          <PixelButton variant="ghost" onClick={onClose} className="w-full">Cancelar</PixelButton>
          <PixelButton variant="primary" onClick={save} disabled={saving} className="w-full">
            {saving ? 'Guardando…' : 'Guardar'}
          </PixelButton>
        </div>
      )}
    >
      <div className="space-y-5">
        {item.totalProgress > 0 && (
          <div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Progreso actual de {item.totalProgress}</span>
              <input
                type="number"
                min="0"
                value={progress}
                onChange={(event) => setProgress(event.target.value)}
                placeholder="Página actual"
                className={inputClass}
              />
            </label>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg-muted)]">
              <motion.div className="h-full rounded-full bg-[var(--accent-gold)]" animate={{ width: `${pct}%` }} transition={{ duration: 0.35 }} />
            </div>
            <p className="mt-1.5 text-right text-xs font-medium tabular-nums text-[var(--accent-gold)]">{Math.round(pct)}%</p>
          </div>
        )}

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Estado</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as LearningItem['status'])} className={inputClass}>
            {Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
      </div>
    </ModalFrame>
  );
}

export default function LearningPage() {
  const reduceMotion = useReducedMotion();
  const [items, setItems] = useState<LearningItem[]>([]);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [updating, setUpdating] = useState<LearningItem | null>(null);
  const [filter, setFilter] = useState<string>('IN_PROGRESS');
  const [tab, setTab] = useState<'biblioteca' | 'pomodoro' | 'detalle'>('biblioteca');
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const refreshStats = useCallback(async () => {
    try { setStats(await learningService.fetchLearningStats()); } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter ? items.filter(i => i.status === filter) : items;
  // Only the current featured entry gets a 3D compositor; the remaining list stays lightweight.
  const featuredItem = filtered[0];
  const remainingItems = featuredItem ? filtered.filter(item => item.id !== featuredItem.id) : [];
  // Derive the detail entry from the live list so progress saved from the
  // modal is reflected in the detail header without a stale snapshot.
  const selectedItem = selectedId ? (items.find(i => i.id === selectedId) ?? null) : null;

  function openDetail(item: LearningItem) {
    setSelectedId(item.id);
    setDetailTab('notas');
    setTab('detalle');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]"><BookOpen className="h-5 w-5 text-[var(--accent-gold)]" aria-hidden="true" /> La Biblioteca</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Reúne lo que quieres aprender y vuelve a ello con claridad.</p>
        </div>
        <div className="flex items-center gap-2">
          <SageContextButton message="¿Qué debería estudiar o leer ahora dado lo que llevo en la Biblioteca?" label="Pídele recomendación al Sabio" />
          <FlowButton tone="primary" size="lg" withArrows={false} onClick={() => setShowAdd(true)}>Agregar</FlowButton>
        </div>
      </div>

      {/* Main tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedTabs
          ariaLabel="Secciones de La Biblioteca"
          active={tab === 'detalle' ? 'detalle' : tab}
          onChange={(key) => { setTab(key); if (key !== 'detalle') setSelectedId(null); }}
          tabs={[
            { key: 'biblioteca', label: <><E e="📚" s={15} /> Biblioteca</> },
            { key: 'pomodoro', label: <><E e="🍅" s={15} /> Pomodoro</> },
            ...(selectedItem
              ? [{
                  key: 'detalle' as const,
                  label: (
                    <span className="inline-flex max-w-40 items-center gap-1.5">
                      <E e="📖" s={15} />
                      <span className="truncate">{selectedItem.title}</span>
                    </span>
                  ),
                }]
              : []),
          ]}
        />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
          transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {tab === 'pomodoro' && <PomodoroTimer />}

          {tab === 'detalle' && selectedItem && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <FlowButton tone="ghost" size="sm" withArrows={false} onClick={() => { setTab('biblioteca'); setSelectedId(null); }} className="min-h-11 gap-1.5">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver
                </FlowButton>
                <p className="min-w-0 flex-1 text-base font-semibold text-[var(--text-primary)] sm:text-lg">{selectedItem.title}</p>
                <StatusChip status={selectedItem.status} />
              </div>
              <SegmentedTabs
                ariaLabel="Detalle del material"
                pill
                active={detailTab}
                onChange={setDetailTab}
                tabs={[
                  { key: 'notas', label: <><E e="📝" s={14} /> Notas</> },
                  { key: 'vocab', label: <><E e="🃏" s={14} /> Vocabulario</> },
                ]}
              />
              {detailTab === 'notas' ? <NotesPanel itemId={selectedItem.id} /> : <VocabPanel itemId={selectedItem.id} />}
            </div>
          )}

          {tab === 'detalle' && !selectedItem && (
            <EmptyState
              icon={BookOpen}
              title="Elige un material"
              description="Abre un libro, curso o idioma de tu biblioteca para ver sus notas y tarjetas."
              actionLabel="Volver a la biblioteca"
              onAction={() => setTab('biblioteca')}
            />
          )}

          {tab === 'biblioteca' && (
            <div className="space-y-6">
              {stats && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  {[
                    { label: 'En progreso', value: stats.inProgress, icon: '📖' },
                    { label: 'Completados', value: stats.totalCompleted, icon: '✅' },
                    { label: 'Este año', value: stats.completedThisYear, icon: '🏆' },
                    { label: 'Páginas', value: stats.totalPages, icon: '📄' },
                  ].map(s => (
                    <PixelPanel key={s.label} className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-2xl font-semibold tabular-nums text-[var(--text-primary)]">{s.value}</p>
                          <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">{s.label}</p>
                        </div>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-panel-light)]">
                          <E e={s.icon} s={18} />
                        </span>
                      </div>
                    </PixelPanel>
                  ))}
                </div>
              )}

              <SegmentedTabs
                ariaLabel="Filtrar materiales por estado"
                pill
                active={filter}
                onChange={setFilter}
                tabs={[
                  { key: '', label: ' Todos' },
                  { key: 'IN_PROGRESS', label: ' En progreso' },
                  { key: 'NOT_STARTED', label: '⏳ Por empezar' },
                  { key: 'COMPLETED', label: ' Completados' },
                ]}
              />

              <LoadingGate loading={loading} fallback={<ModernLoader words={[...LOADING_COPY.learning]} />}>
                {loading ? null : filtered.length === 0 ? (
                  <EmptyState
                    icon={BookOpen}
                    title="Tu biblioteca está lista"
                    description="Agrega un libro, curso o idioma para convertir lo que quieres aprender en progreso visible."
                    actionLabel="Agregar a mi biblioteca"
                    onAction={() => setShowAdd(true)}
                  />
                ) : (
                  <div className="space-y-4">
                    {featuredItem && (() => {
                      const pct = featuredItem.totalProgress > 0
                        ? Math.min((featuredItem.currentProgress / featuredItem.totalProgress) * 100, 100)
                        : 0;
                      return (
                        <LifeQuestFlipCard
                          eyebrow="Entrada destacada"
                          title={featuredItem.title}
                          description={featuredItem.author ? `Por ${featuredItem.author}` : STATUS_LABELS[featuredItem.status]}
                          visual={(
                            <div className="flex items-center gap-4" aria-hidden="true">
                              <span className="text-6xl"><E e={TYPE_ICONS[featuredItem.type]} s={64} /></span>
                              {featuredItem.totalProgress > 0 && <div className="text-left"><p className="text-4xl font-medium leading-none text-foreground">{Math.round(pct)}%</p><p className="mt-1 text-sm font-medium text-muted-foreground">avanzado</p></div>}
                            </div>
                          )}
                          visualLabel={`${featuredItem.title}, ${Math.round(pct)} por ciento de progreso`}
                          badge={STATUS_LABELS[featuredItem.status]}
                          frontFooter={featuredItem.totalProgress > 0 ? (
                            <div>
                              <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                              <p className="mt-1 text-right text-xs font-medium text-muted-foreground">{featuredItem.currentProgress}/{featuredItem.totalProgress} unidades</p>
                            </div>
                          ) : <p className="text-xs text-muted-foreground">Define una meta de progreso cuando quieras.</p>}
                          backDescription={<p>{featuredItem.author ? `Continúa con ${featuredItem.author}, guarda tus notas y actualiza el avance cuando termines una sesión.` : 'Guarda notas, actualiza el avance y mantén esta meta a la vista.'}</p>}
                          metrics={[
                            { label: 'Formato', value: TYPE_LABELS[featuredItem.type] ?? featuredItem.type },
                            { label: 'Progreso', value: featuredItem.totalProgress > 0 ? `${featuredItem.currentProgress}/${featuredItem.totalProgress}` : 'Sin meta' },
                            { label: 'Estado', value: STATUS_LABELS[featuredItem.status] },
                          ]}
                          backActions={(
                            <FlowButton
                              tone="ghost"
                              size="sm"
                              withArrows={false}
                              onClick={(event) => {
                                event.stopPropagation();
                                openDetail(featuredItem);
                              }}
                              className="min-h-11 rounded-xl border border-border bg-muted px-3 text-sm font-semibold text-foreground transition-transform hover:scale-[1.015] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                              Abrir notas
                            </FlowButton>
                          )}
                          actionLabel="Actualizar progreso"
                          onAction={() => setUpdating(featuredItem)}
                          accent="var(--accent-gold)"
                        />
                      );
                    })()}

                    {remainingItems.length > 0 && (
                      <div className="space-y-3">
                        {remainingItems.map((item, i) => {
                          const pct = item.totalProgress > 0 ? Math.min((item.currentProgress / item.totalProgress) * 100, 100) : 0;
                          return (
                            <motion.div key={item.id} initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : i * 0.04 }}>
                              <PixelPanel
                                role="button"
                                tabIndex={0}
                                aria-label={`Abrir ${item.title}`}
                                className="cursor-pointer p-4 transition-colors hover:border-[var(--accent-gold)]/60 sm:p-5"
                                onClick={() => setUpdating(item)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    setUpdating(item);
                                  }
                                }}
                              >
                                <div className="flex items-start gap-3.5 sm:gap-4">
                                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-panel-light)]" aria-hidden="true">
                                    <E e={TYPE_ICONS[item.type]} s={24} />
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                      <p className="break-words text-base font-semibold text-[var(--text-primary)]">{item.title}</p>
                                      <StatusChip status={item.status} />
                                    </div>
                                    {item.author && (
                                      <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">{item.author}</p>
                                    )}
                                  </div>
                                  {item.rating ? (
                                    <p className="flex shrink-0 gap-0.5 pt-1" aria-label={`Valoración ${item.rating} de 5`}>
                                      {Array.from({ length: item.rating }).map((_, starIndex) => <E key={starIndex} e="⭐" s={14} />)}
                                    </p>
                                  ) : null}
                                </div>

                                {item.totalProgress > 0 && (
                                  <div className="mt-4">
                                    <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs font-medium">
                                      <span className="text-[var(--text-secondary)]">Progreso</span>
                                      <span className="tabular-nums text-[var(--text-secondary)]">
                                        {item.currentProgress}/{item.totalProgress} pág · <span className="text-[var(--accent-gold)]">{Math.round(pct)}%</span>
                                      </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                                      <div className="h-full rounded-full bg-[var(--accent-gold)]" style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                )}

                                <div className="mt-4 flex justify-end border-t border-[var(--border)] pt-3">
                                  <FlowButton
                                    tone="ghost"
                                    size="sm"
                                    withArrows={false}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openDetail(item);
                                    }}
                                    className="min-h-10 gap-1.5"
                                  >
                                    <NotebookPen className="h-4 w-4" aria-hidden="true" /> Notas y vocabulario
                                  </FlowButton>
                                </div>
                              </PixelPanel>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </LoadingGate>

              {!loading && filtered.length > 0 && remainingItems.length === 0 && (
                <p className="text-center text-xs text-[var(--text-muted)]">
                  Toca la entrada destacada para actualizar su progreso o girarla para más detalles.
                </p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showAdd && (
          <AddItemModal
            onClose={() => setShowAdd(false)}
            onSave={(item) => {
              setItems(prev => [item, ...prev]);
              setShowAdd(false);
              void refreshStats();
            }}
          />
        )}
        {updating && (
          <ProgressModal
            item={updating}
            onClose={() => setUpdating(null)}
            onUpdate={(updated) => {
              setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
              setUpdating(null);
              void refreshStats();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
