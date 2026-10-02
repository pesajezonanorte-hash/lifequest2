import { FlowButton } from '@/components/ui/flow-button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Droplets, Flame, Utensils, X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { PixelPanel } from '../../components/ui/PixelPanel';
import { PixelButton } from '../../components/ui/PixelButton';
import { ModalFrame } from '../../components/ui/ModalFrame';
import { SegmentedTabs } from '../../components/ui/SegmentedTabs';
import type { Meal } from '@lifequest/shared';
import * as mealService from '../../services/meal.service';
import { MacroGoalsWidget, AIQuickLog, SavedMealsPanel } from '../../components/food/NutritionExtras';
import { SageContextButton } from '../../components/sage/SageContextButton';
import { E } from '@/components/ui/glyphs';
import ModernLoader from '@/components/ui/modern-loader';
import { LoadingGate } from '@/components/ui/LoadingGate';
import { LOADING_COPY } from '@/lib/loadingCopy';

const MEAL_TYPES = [
  { key: 'BREAKFAST', label: 'Desayuno', icon: '🌅' },
  { key: 'LUNCH', label: 'Almuerzo', icon: '☀️' },
  { key: 'DINNER', label: 'Cena', icon: '🌙' },
  { key: 'SNACK', label: 'Snack', icon: '🍎' },
  { key: 'WATER', label: 'Agua', icon: '💧' },
];

const inputClass =
  'min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-3 py-2.5 text-base text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent-gold)_16%,transparent)]';

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMealTime(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function MealModal({ onClose, onSave, date }: { onClose: () => void; onSave: (m: Meal) => void; date: string }) {
  const [mealType, setMealType] = useState('LUNCH');
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [showMacros, setShowMacros] = useState(false);
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [waterMl, setWaterMl] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const isWater = mealType === 'WATER';

  async function save() {
    if (!isWater && !name.trim()) return;
    setSaving(true);
    try {
      const m = await mealService.createMeal({
        name: isWater ? 'Agua' : name,
        mealType,
        // The page lists "today" in the visitor's timezone; without an
        // explicit date the server stamped its own day and a late-night entry
        // could silently land on a different date than the visible list.
        date,
        calories: calories ? Number(calories) : undefined,
        protein: protein ? Number(protein) : undefined,
        carbs: carbs ? Number(carbs) : undefined,
        fat: fat ? Number(fat) : undefined,
        waterMl: waterMl ? Number(waterMl) : isWater ? 250 : undefined,
      });
      onSave(m);
      toast.success(isWater ? '¡Hidratación registrada!' : '¡Comida registrada!');
    } catch {
      toast.error('Error al registrar');
    } finally { setSaving(false); }
  }

  return (
    <ModalFrame
      title={isWater ? 'Registrar agua' : 'Registrar comida'}
      description={isWater ? 'Suma un vaso y sigue tu hidratación del día.' : 'Anota lo que comiste para entender lo que sostiene tu energía.'}
      icon={<Utensils className="h-4 w-4" aria-hidden="true" />}
      onClose={onClose}
      contentClassName="space-y-5"
      footer={(
        <div className="grid grid-cols-2 gap-2.5">
          <PixelButton variant="ghost" onClick={onClose} className="w-full">Cancelar</PixelButton>
          <PixelButton variant="primary" onClick={save} disabled={saving || (!isWater && !name.trim())} className="w-full">
            {saving ? 'Guardando…' : 'Guardar'}
          </PixelButton>
        </div>
      )}
    >
      <fieldset>
        <legend className="mb-2 text-xs font-medium text-[var(--text-secondary)]">Tipo de registro</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {MEAL_TYPES.map(t => {
            const selected = mealType === t.key;
            return (
              <button
                key={t.key}
                type="button"
                aria-pressed={selected}
                onClick={() => setMealType(t.key)}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 transition-colors ${
                  selected
                    ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10'
                    : 'border-[var(--border)] bg-[var(--bg-panel-light)] hover:border-[var(--border-strong)]'
                }`}
              >
                <span className="text-xl" aria-hidden="true"><E e={t.icon} /></span>
                <span className="text-xs font-medium text-[var(--text-secondary)]">{t.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {!isWater && (
        <>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">¿Qué comiste?</span>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="Ej. Bandeja paisa"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Calorías <span className="font-normal text-[var(--text-muted)]">(opcional)</span></span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={calories}
              onChange={e => setCalories(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
          </label>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel-light)] p-3.5">
            <button
              type="button"
              onClick={() => setShowMacros(m => !m)}
              aria-expanded={showMacros}
              className="flex w-full items-center justify-between text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              Macros detallados
              <span className="text-xs font-medium text-[var(--text-muted)]">{showMacros ? 'Ocultar' : 'Agregar'}</span>
            </button>
            {showMacros && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {([['Proteína (g)', protein, setProtein], ['Carbs (g)', carbs, setCarbs], ['Grasa (g)', fat, setFat]] as [string, string, (v: string) => void][]).map(([label, val, setter]) => (
                  <label key={label} className="block">
                    <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">{label}</span>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={val}
                      onChange={e => setter(e.target.value)}
                      placeholder="0"
                      className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] px-2 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-gold)]"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {isWater && (
        <fieldset>
          <legend className="mb-2 text-xs font-medium text-[var(--text-secondary)]">Cantidad (ml)</legend>
          <div className="grid grid-cols-3 gap-2">
            {[250, 500, 750].map(ml => {
              const selected = waterMl === String(ml);
              return (
                <button
                  key={ml}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setWaterMl(String(ml))}
                  className={`min-h-11 rounded-xl border text-sm font-semibold transition-colors ${
                    selected
                      ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10 text-[var(--text-primary)]'
                      : 'border-[var(--border)] bg-[var(--bg-panel-light)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  {ml} ml
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
    </ModalFrame>
  );
}

export default function FoodPage() {
  const reduceMotion = useReducedMotion();
  const toast = useToast();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<'log' | 'macros' | 'saved'>('log');
  const today = getTodayString();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mealService.fetchMeals(today);
      setMeals(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [today]);

  useEffect(() => { load(); }, [load]);

  function handleSaved(m: Meal) {
    setMeals(prev => [...prev, m]);
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    setMeals(prev => prev.filter(m => m.id !== id));
    try { await mealService.deleteMeal(id); }
    catch { toast.error('Error al eliminar'); load(); }
  }

  async function handleQuickWater(ml: number) {
    try {
      const m = await mealService.createMeal({ name: 'Agua', mealType: 'WATER', waterMl: ml, date: today });
      setMeals(prev => [...prev, m]);
      toast.success(`+${ml} ml de agua`);
    } catch {
      toast.error('No se pudo registrar el agua');
    }
  }

  const waterLogs = meals.filter(m => m.mealType === 'WATER');
  const totalWater = waterLogs.reduce((a, m) => a + (m.waterMl ?? 0), 0);
  const waterGoal = 2000;
  const waterPct = Math.min((totalWater / waterGoal) * 100, 100);
  const totalCalories = meals.filter(m => m.calories).reduce((a, m) => a + (m.calories ?? 0), 0);

  const mealsByType = MEAL_TYPES.filter(t => t.key !== 'WATER')
    .map(t => ({ ...t, items: meals.filter(m => m.mealType === t.key) }))
    .filter(group => group.items.length > 0);
  const hasMealRecords = meals.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]"><Utensils className="h-5 w-5 text-[var(--accent-gold)]" aria-hidden="true" /> La Posada</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Registra tus comidas y observa lo que sostiene tu energía.</p>
        </div>
        <div className="flex items-center gap-2">
          <SageContextButton message="¿Cómo está mi alimentación esta semana? ¿Qué puedo mejorar?" label="Pídele consejo al Sabio" />
          <FlowButton tone="primary" size="lg" withArrows={false} onClick={() => setShowModal(true)}>Registrar comida</FlowButton>
        </div>
      </div>

      <SegmentedTabs
        ariaLabel="Secciones de La Posada"
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'log', label: <><E e="🍽️" s={15} /> Registro</> },
          { key: 'macros', label: <><E e="📊" s={15} /> Macros</> },
          { key: 'saved', label: <><E e="⭐" s={15} /> Guardadas</> },
        ]}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
          transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {tab === 'macros' && <MacroGoalsWidget date={today} />}

          {tab === 'saved' && <SavedMealsPanel onAdd={() => load()} />}

          {tab === 'log' && (
            <div className="space-y-5">
              <AIQuickLog onLogged={() => load()} />

              <div className="grid gap-5 md:grid-cols-2">
                {/* Water tracker */}
                <PixelPanel className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                      <Droplets className="h-4 w-4 text-[var(--accent-cyan)]" aria-hidden="true" /> Hidratación de hoy
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-[var(--accent-cyan)]">
                      {(totalWater / 1000).toFixed(1)} / {waterGoal / 1000} L
                    </p>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                    <motion.div
                      className="h-full rounded-full bg-[var(--accent-cyan)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${waterPct}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[250, 500].map(ml => (
                      <PixelButton key={ml} variant="secondary" size="sm" onClick={() => handleQuickWater(ml)} className="min-h-11">
                        +{ml} ml
                      </PixelButton>
                    ))}
                  </div>
                </PixelPanel>

                {/* Calories snapshot */}
                <PixelPanel className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                      <Flame className="h-4 w-4 text-[var(--accent-gold)]" aria-hidden="true" /> Calorías de hoy
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-[var(--accent-gold)]">
                      {totalCalories} kcal
                    </p>
                  </div>
                  <div className="mt-3 flex items-end gap-2">
                    <p className="text-3xl font-semibold leading-none tabular-nums text-[var(--text-primary)]">{totalCalories}</p>
                    <p className="pb-0.5 text-xs font-medium text-[var(--text-secondary)]">
                      {mealsByType.reduce((n, g) => n + g.items.length, 0)} registro(s) de comida
                    </p>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">
                    Mira el detalle de proteína, carbos y grasa en la pestaña <span className="font-semibold text-[var(--text-primary)]">Macros</span>.
                  </p>
                </PixelPanel>
              </div>

              {/* Meals by type */}
              <LoadingGate loading={loading} fallback={<ModernLoader words={[...LOADING_COPY.food]} />}>
                {loading ? null : !hasMealRecords ? (
                  <EmptyState
                    icon={Utensils}
                    title="Tu mesa está lista"
                    description="Registra tu primera comida para comenzar a entender tus hábitos de alimentación."
                    actionLabel="Registrar mi primera comida"
                    onAction={() => setShowModal(true)}
                  />
                ) : mealsByType.length === 0 ? (
                  <EmptyState
                    icon={Droplets}
                    title="Solo llevas agua hoy"
                    description="Buen comienzo de hidratación. Cuando comas algo, regístralo para completar el día."
                    actionLabel="Registrar comida"
                    onAction={() => setShowModal(true)}
                  />
                ) : (
                  <div className="space-y-4">
                    {mealsByType.map(group => (
                      <PixelPanel key={group.key}>
                        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3.5 sm:px-5">
                          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                            <E e={group.icon} s={16} /> {group.label}
                          </p>
                          <span className="rounded-full bg-[var(--bg-muted)] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[var(--text-secondary)]">
                            {group.items.length}
                          </span>
                        </div>
                        <ul className="divide-y divide-[var(--border-soft,var(--border))]">
                          <AnimatePresence initial={false}>
                            {group.items.map(m => (
                              <motion.li
                                key={m.id}
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center gap-3 px-4 py-3.5 sm:px-5"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-[var(--text-primary)] sm:text-base">{m.name}</p>
                                  {m.createdAt && (
                                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">{formatMealTime(m.createdAt)}</p>
                                  )}
                                </div>
                                {typeof m.calories === 'number' && m.calories > 0 && (
                                  <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg-panel-light)] px-2.5 py-1 text-xs font-semibold tabular-nums text-[var(--accent-gold)]">
                                    {m.calories} kcal
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDelete(m.id)}
                                  aria-label={`Eliminar ${m.name}`}
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--accent-red)]/10 hover:text-[var(--accent-red)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-red)]"
                                >
                                  <X className="h-4 w-4" aria-hidden="true" />
                                </button>
                              </motion.li>
                            ))}
                          </AnimatePresence>
                        </ul>
                      </PixelPanel>
                    ))}
                  </div>
                )}
              </LoadingGate>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showModal && <MealModal onClose={() => setShowModal(false)} onSave={handleSaved} date={today} />}
      </AnimatePresence>
    </div>
  );
}
