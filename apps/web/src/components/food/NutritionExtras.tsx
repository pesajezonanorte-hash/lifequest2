import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings2, X } from 'lucide-react';
import { PixelPanel } from '../ui/PixelPanel';
import { PixelButton } from '../ui/PixelButton';
import { useToast } from '../../hooks/useToast';
import api from '../../lib/api';
import { E } from '@/components/ui/glyphs';
import ModernLoader from '@/components/ui/modern-loader';
import { LoadingGate } from '@/components/ui/LoadingGate';
import { LOADING_COPY } from '@/lib/loadingCopy';

interface NutritionGoal { calories: number; protein: number; carbs: number; fat: number }
interface DailyMacros { calories: number; protein: number; carbs: number; fat: number; goal: NutritionGoal | null }
interface SavedMeal { id: string; name: string; calories?: number; protein?: number; carbs?: number; fat?: number }
interface AIParsed { name: string; estimatedCalories: number; estimatedProtein: number; estimatedCarbs: number; estimatedFat: number; aiAvailable?: boolean; aiSucceeded?: boolean }

const inputClass =
  'min-h-11 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-3 py-2.5 text-base text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--accent-gold)_16%,transparent)]';

function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  const over = goal > 0 && value > goal;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{label}</span>
        <span className="text-xs font-semibold tabular-nums" style={{ color: over ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
          {Math.round(value)}/{goal} g
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--bg-muted)]">
        <motion.div
          className="h-full rounded-full transition-colors"
          style={{ background: over ? 'var(--accent-red)' : color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7 }}
        />
      </div>
    </div>
  );
}

export function MacroGoalsWidget({ date }: { date: string }) {
  const [data, setData] = useState<DailyMacros | null>(null);
  const [editGoal, setEditGoal] = useState(false);
  const [form, setForm] = useState({ calories: '2000', protein: '150', carbs: '200', fat: '70' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/nutrition/daily?date=${date}`).then((r: any) => {
      setData(r.data);
      if (r.data.goal) {
        setForm({
          calories: String(r.data.goal.calories),
          protein: String(r.data.goal.protein),
          carbs: String(r.data.goal.carbs),
          fat: String(r.data.goal.fat),
        });
      }
    }).catch(() => null);
  }, [date]);

  async function saveGoal() {
    setSaving(true);
    try {
      await api.put('/nutrition/goals', {
        calories: Number(form.calories),
        protein: Number(form.protein),
        carbs: Number(form.carbs),
        fat: Number(form.fat),
      });
      const r: any = await api.get(`/nutrition/daily?date=${date}`);
      setData(r.data);
      setEditGoal(false);
    } catch { /* ignore */ } finally { setSaving(false); }
  }

  if (!data) return null;

  const goal = data.goal ?? { calories: 2000, protein: 150, carbs: 200, fat: 70 };

  return (
    <PixelPanel className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--text-primary)]"><E e="📊" s={15} /> Macros de hoy</p>
        <button
          type="button"
          onClick={() => setEditGoal(e => !e)}
          aria-expanded={editGoal}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
        >
          {editGoal ? <><X className="h-3.5 w-3.5" aria-hidden="true" /> Cerrar</> : <><Settings2 className="h-3.5 w-3.5" aria-hidden="true" /> Editar meta</>}
        </button>
      </div>

      {editGoal ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {([['Calorías (kcal)', 'calories'], ['Proteína (g)', 'protein'], ['Carbs (g)', 'carbs'], ['Grasa (g)', 'fat']] as [string, keyof typeof form][]).map(([label, key]) => (
              <label key={key} className="block">
                <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">{label}</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className={inputClass}
                />
              </label>
            ))}
          </div>
          <PixelButton variant="primary" onClick={saveGoal} disabled={saving} className="w-full">
            {saving ? 'Guardando…' : 'Guardar meta'}
          </PixelButton>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Calorías</p>
              <p className="mt-1 text-3xl font-semibold leading-none tabular-nums" style={{ color: data.calories > goal.calories ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                {Math.round(data.calories)}
                <span className="ml-1.5 text-sm font-medium text-[var(--text-secondary)]">/ {goal.calories} kcal</span>
              </p>
            </div>
            <p className="text-sm font-semibold tabular-nums text-[var(--accent-green)]">
              {Math.max(0, goal.calories - data.calories)} kcal restantes
            </p>
          </div>
          <div className="space-y-3.5">
            <MacroBar label="Proteína" value={data.protein} goal={goal.protein} color="var(--accent-red)" />
            <MacroBar label="Carbos" value={data.carbs} goal={goal.carbs} color="var(--accent-gold)" />
            <MacroBar label="Grasa" value={data.fat} goal={goal.fat} color="var(--accent-purple)" />
          </div>
        </div>
      )}
    </PixelPanel>
  );
}

export function AIQuickLog({ onLogged }: { onLogged: (meal: { name: string; calories?: number; protein?: number; carbs?: number; fat?: number }) => void }) {
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<AIParsed | null>(null);
  const [mealType, setMealType] = useState('LUNCH');

  const [aiError, setAiError] = useState<string | null>(null);

  async function parse() {
    if (!text.trim()) return;
    setParsing(true);
    setAiError(null);
    try {
      const r: any = await api.post('/nutrition/ai-parse', { description: text });
      setParsed(r.data);
      if (r.data?.aiAvailable === false) {
        setAiError('IA no configurada. Puedes registrar manualmente.');
      } else if (r.data?.aiSucceeded === false) {
        setAiError('No pude estimar los macros. Puedes editarlos antes de guardar o registrar manualmente.');
      }
    } catch (e: any) {
      setAiError('No se pudo conectar con el Sabio. Registra manualmente.');
      setParsed({ name: text.trim().slice(0, 80), estimatedCalories: 0, estimatedProtein: 0, estimatedCarbs: 0, estimatedFat: 0, aiAvailable: false, aiSucceeded: false });
    } finally { setParsing(false); }
  }

  function updateMacro(key: 'estimatedCalories' | 'estimatedProtein' | 'estimatedCarbs' | 'estimatedFat', val: string) {
    if (!parsed) return;
    const n = Math.max(0, Math.round(Number(val.replace(',', '.')) || 0));
    setParsed({ ...parsed, [key]: n });
  }

  async function confirmLog() {
    if (!parsed) return;
    try {
      const r: any = await api.post('/meals', {
        name: parsed.name,
        mealType,
        calories: parsed.estimatedCalories,
        protein: parsed.estimatedProtein,
        carbs: parsed.estimatedCarbs,
        fat: parsed.estimatedFat,
      });
      onLogged(r.data);
      setText('');
      setParsed(null);
    } catch { /* ignore */ }
  }

  return (
    <PixelPanel className="p-4 sm:p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
        <E e="🤖" s={16} /> Registro rápido con IA
      </p>
      <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
        Escribe lo que comiste y el Sabio estima las calorías y macros por ti.
      </p>
      <div className="mt-3.5 flex flex-col gap-2 sm:flex-row">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && parse()}
          placeholder="Ej: pollo con arroz y ensalada"
          className={`${inputClass} sm:flex-1`}
        />
        <PixelButton
          variant="secondary"
          onClick={parse}
          disabled={parsing || !text.trim()}
          className="w-full shrink-0 sm:w-auto"
        >
          {parsing ? 'Analizando…' : '→ ANALIZAR'}
        </PixelButton>
      </div>

      {aiError && (
        <p className="mt-3 text-sm font-medium text-[var(--accent-gold)]"><E e="⚠" s={13} /> {aiError}</p>
      )}

      {parsed && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-panel-light)] p-4"
        >
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Nombre</span>
            <input
              value={parsed.name}
              onChange={e => setParsed({ ...parsed, name: e.target.value })}
              className={inputClass}
            />
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {([
              ['Kcal',  'estimatedCalories', parsed.estimatedCalories, 'var(--accent-gold)'],
              ['Prot',  'estimatedProtein',  parsed.estimatedProtein,  'var(--accent-red)'],
              ['Carbs', 'estimatedCarbs',    parsed.estimatedCarbs,    'var(--accent-cyan)'],
              ['Grasa', 'estimatedFat',      parsed.estimatedFat,      'var(--accent-purple)'],
            ] as [string, 'estimatedCalories' | 'estimatedProtein' | 'estimatedCarbs' | 'estimatedFat', number, string][]).map(([label, key, val, color]) => (
              <div key={key} className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] px-2 py-2.5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{label}</p>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={val}
                  onChange={e => updateMacro(key, e.target.value)}
                  className="mt-1 w-full min-w-0 bg-transparent text-center text-lg font-semibold tabular-nums outline-none"
                  style={{ color }}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={mealType}
              onChange={e => setMealType(e.target.value)}
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-gold)] sm:max-w-44"
            >
              <option value="BREAKFAST">Desayuno</option>
              <option value="LUNCH">Almuerzo</option>
              <option value="DINNER">Cena</option>
              <option value="SNACK">Snack</option>
            </select>
            <PixelButton variant="primary" onClick={confirmLog}><E e="✓" s={13} /> Agregar</PixelButton>
            <PixelButton variant="ghost" onClick={() => setParsed(null)} aria-label="Descartar análisis"><E e="✕" s={13} /></PixelButton>
          </div>
        </motion.div>
      )}
    </PixelPanel>
  );
}

export function SavedMealsPanel({ onAdd }: { onAdd: (meal: SavedMeal) => void }) {
  const [meals, setMeals] = useState<SavedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [mealType, setMealType] = useState('LUNCH');
  const toast = useToast();

  useEffect(() => {
    api.get('/nutrition/saved-meals').then((r: any) => setMeals(r.data ?? [])).finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!form.name.trim()) return;
    try {
      const r: any = await api.post('/nutrition/saved-meals', {
        name: form.name,
        calories: form.calories ? Number(form.calories) : undefined,
        protein: form.protein ? Number(form.protein) : undefined,
        carbs: form.carbs ? Number(form.carbs) : undefined,
        fat: form.fat ? Number(form.fat) : undefined,
      });
      setMeals(prev => [...prev, r.data]);
      setShowForm(false);
      setForm({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    } catch {
      toast.error('No se pudo guardar la comida');
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/nutrition/saved-meals/${id}`);
      setMeals(prev => prev.filter(m => m.id !== id));
    } catch {
      toast.error('No se pudo eliminar');
    }
  }

  async function handleAdd(meal: SavedMeal) {
    try {
      await api.post('/meals', {
        name: meal.name,
        mealType,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
      });
      toast.success(`"${meal.name}" agregada al registro de hoy`);
      onAdd(meal);
    } catch {
      toast.error('No se pudo agregar al registro de hoy');
    }
  }

  return (
    <PixelPanel className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--text-primary)]"><E e="⭐" s={15} /> Comidas guardadas</p>
        <button
          type="button"
          onClick={() => setShowForm(f => !f)}
          aria-expanded={showForm}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
        >
          {showForm ? <><X className="h-3.5 w-3.5" aria-hidden="true" /> Cancelar</> : '+ Nueva'}
        </button>
      </div>

      {showForm && (
        <div className="mt-4 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-panel-light)] p-4">
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Nombre de la comida"
            className={inputClass}
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(['calories', 'protein', 'carbs', 'fat'] as const).map(k => (
              <label key={k} className="block">
                <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                  {k === 'calories' ? 'Kcal' : k === 'protein' ? 'Proteína (g)' : k === 'carbs' ? 'Carbs (g)' : 'Grasa (g)'}
                </span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={form[k]}
                  onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  placeholder="0"
                  className="min-h-11 w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] px-2 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-gold)]"
                />
              </label>
            ))}
          </div>
          <PixelButton variant="primary" onClick={handleCreate} disabled={!form.name.trim()} className="w-full">
            Guardar comida
          </PixelButton>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Agregar como:</span>
        <select
          value={mealType}
          onChange={e => setMealType(e.target.value)}
          className="min-h-11 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-gold)] sm:w-44"
        >
          <option value="BREAKFAST">Desayuno</option>
          <option value="LUNCH">Almuerzo</option>
          <option value="DINNER">Cena</option>
          <option value="SNACK">Snack</option>
        </select>
      </div>

      <div className="mt-2">
        <LoadingGate loading={loading} fallback={<ModernLoader words={[...LOADING_COPY.nutrition]} />}>
          {loading ? null : meals.length === 0 ? (
            <p className="py-8 text-center text-sm italic text-[var(--text-secondary)]">
              Guarda tus comidas frecuentes para registrarlas con un toque.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border-soft,var(--border))]">
              {meals.map(m => (
                <li key={m.id} className="flex items-start gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)] sm:text-base">{m.name}</p>
                    {typeof m.calories === 'number' && (
                      <p className="mt-0.5 text-xs tabular-nums text-[var(--text-secondary)]">
                        {m.calories} kcal · P {m.protein ?? 0} g · C {m.carbs ?? 0} g · G {m.fat ?? 0} g
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <PixelButton variant="green" size="sm" onClick={() => handleAdd(m)} className="min-h-10">
                      + Agregar
                    </PixelButton>
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id)}
                      aria-label={`Eliminar ${m.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--accent-red)]/10 hover:text-[var(--accent-red)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-red)]"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </LoadingGate>
      </div>
    </PixelPanel>
  );
}
