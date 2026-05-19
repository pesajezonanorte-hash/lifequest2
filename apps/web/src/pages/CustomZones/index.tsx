import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Loader2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { PixelPanel } from '../../components/ui/PixelPanel';
import { PixelButton } from '../../components/ui/PixelButton';
import { useToastStore } from '../../hooks/useToast';
import api from '../../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomZone {
  id: string;
  name: string;
  description?: string;
  icon: string;
  accentColor: string;
  isMeasurable: boolean;
  measureMetric?: string;
  weeklyXpGoal?: number;
  sections?: { type: string; title: string; description: string }[];
  actions?: { label: string; type: string }[];
  content: unknown[];
  quests: { id: string; title: string; status: string }[];
  habits: { id: string; title: string; currentStreak: number }[];
}

interface AISuggestion {
  name: string;
  description: string;
  icon: string;
  color: string;
  isMeasurable: boolean;
  measureReason: string;
  sections: { type: string; title: string; description: string }[];
  habits: { title: string; frequency: string }[];
  actions: { label: string; type: string }[];
}

const COLOR_PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6',
];

// ─── Wizard ───────────────────────────────────────────────────────────────────

function ZoneWizard({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const toast = useToastStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [editedColor, setEditedColor] = useState('#6366f1');
  const [editedIcon, setEditedIcon] = useState('📍');
  const [isMeasurable, setIsMeasurable] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAsk() {
    if (!description.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/custom-zones/suggest', { description });
      setSuggestion(data);
      setEditedColor(data.color ?? '#6366f1');
      setEditedIcon(data.icon ?? '📍');
      setIsMeasurable(data.isMeasurable ?? false);
      setStep(2);
    } catch {
      toast.error('Error generando sugerencia. Intenta de nuevo.');
    } finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!suggestion) return;
    setSaving(true);
    try {
      await api.post('/custom-zones', {
        name: suggestion.name,
        description: suggestion.description,
        icon: editedIcon,
        accentColor: editedColor,
        isMeasurable,
        sections: suggestion.sections,
        actions: suggestion.actions,
      });
      toast.success(`¡Zona "${suggestion.name}" creada!`);
      onCreated();
    } catch {
      toast.error('Error creando zona');
    } finally { setSaving(false); }
  }

  return (
    <PixelPanel className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles size={18} style={{ color: 'var(--primary)' }} />
        <h2 className="font-semibold text-sm">
          {step === 1 ? 'El Sabio construye tu zona' : 'Revisa y ajusta'}
        </h2>
      </div>

      {step === 1 && (
        <>
          <textarea
            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
            style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', color: 'var(--text)' }}
            rows={4}
            placeholder="Ej: Quiero organizar mis clases de inglés, tener mis notas de vocabulario, repasar el material..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <div className="flex gap-2">
            <PixelButton variant="primary" onClick={handleAsk} disabled={loading || !description.trim()}>
              {loading ? <><Loader2 size={14} className="animate-spin" /> Generando...</> : 'El Sabio construye mi zona →'}
            </PixelButton>
            <PixelButton variant="secondary" onClick={onCancel}>Cancelar</PixelButton>
          </div>
        </>
      )}

      {step === 2 && suggestion && (
        <>
          {/* Preview */}
          <div className="rounded-xl p-4 space-y-3"
            style={{ background: `${editedColor}18`, border: `1px solid ${editedColor}40` }}>
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 28 }}>{editedIcon}</span>
              <div>
                <p className="font-bold">{suggestion.name}</p>
                <p className="text-sm" style={{ color: 'var(--text-2)' }}>{suggestion.description}</p>
              </div>
            </div>
            {suggestion.sections?.map((s, i) => (
              <div key={i} className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--bg-panel)' }}>
                <span className="font-semibold">{s.title}</span>
                <span style={{ color: 'var(--text-2)' }}> — {s.description}</span>
              </div>
            ))}
          </div>

          {/* Icon selector */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-2)' }}>Ícono</p>
            <input
              className="w-24 px-3 py-2 rounded-lg text-center text-xl"
              style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', color: 'var(--text)' }}
              value={editedIcon}
              onChange={e => setEditedIcon(e.target.value)}
            />
          </div>

          {/* Color palette */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-2)' }}>Color de la zona</p>
            <div className="flex gap-2 flex-wrap">
              {COLOR_PALETTE.map(c => (
                <button key={c} onClick={() => setEditedColor(c)}
                  style={{
                    width: 28, height: 28, borderRadius: 8, background: c,
                    border: editedColor === c ? '2px solid white' : '2px solid transparent',
                    boxShadow: editedColor === c ? `0 0 0 2px ${c}` : 'none',
                  }} />
              ))}
            </div>
          </div>

          {/* Measurable toggle */}
          <div className="flex items-center justify-between py-2 rounded-lg px-3"
            style={{ background: 'var(--bg-soft)' }}>
            <div>
              <p className="text-sm font-medium">¿Contar en tu Life Score?</p>
              <p className="text-xs" style={{ color: 'var(--text-2)' }}>{suggestion.measureReason}</p>
            </div>
            <button onClick={() => setIsMeasurable(v => !v)}
              className="relative w-10 h-5 rounded-full transition-colors"
              style={{ background: isMeasurable ? editedColor : 'var(--border)' }}>
              <motion.div
                animate={{ x: isMeasurable ? 20 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
              />
            </button>
          </div>

          <div className="flex gap-2">
            <PixelButton variant="primary" onClick={handleCreate} disabled={saving}>
              {saving ? 'Creando...' : 'Crear mi zona →'}
            </PixelButton>
            <PixelButton variant="secondary" onClick={() => setStep(1)}>Atrás</PixelButton>
          </div>
        </>
      )}
    </PixelPanel>
  );
}

// ─── Zone Card ────────────────────────────────────────────────────────────────

function ZoneCard({ zone, onDelete }: { zone: CustomZone; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const toast = useToastStore();

  async function handleDelete() {
    try {
      await api.delete(`/custom-zones/${zone.id}`);
      toast.success('Zona eliminada');
      onDelete();
    } catch { toast.error('Error'); }
  }

  return (
    <PixelPanel className="overflow-hidden">
      <div
        className="h-1 w-full"
        style={{ background: zone.accentColor }}
      />
      <div className="p-4">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-3 flex-1 text-left" onClick={() => setExpanded(v => !v)}>
            <span style={{ fontSize: 22 }}>{zone.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm truncate">{zone.name}</p>
              {zone.description && (
                <p className="text-xs truncate" style={{ color: 'var(--text-2)' }}>{zone.description}</p>
              )}
            </div>
            {expanded ? <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
          </button>
          <button onClick={handleDelete} className="ml-2 p-1 rounded hover:bg-red-500/10" style={{ color: 'var(--text-muted)' }}>
            <Trash2 size={14} />
          </button>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-3">
                {/* Quick actions */}
                {zone.actions && zone.actions.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {zone.actions.map((a, i) => (
                      <button key={i}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium"
                        style={{ background: `${zone.accentColor}20`, color: zone.accentColor, border: `1px solid ${zone.accentColor}40` }}>
                        + {a.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Quests */}
                {zone.quests.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Misiones</p>
                    {zone.quests.map(q => (
                      <p key={q.id} className="text-sm py-0.5">○ {q.title}</p>
                    ))}
                  </div>
                )}

                {/* Habits */}
                {zone.habits.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Hábitos</p>
                    {zone.habits.map(h => (
                      <div key={h.id} className="flex items-center justify-between text-sm py-0.5">
                        <span>🔥 {h.title}</span>
                        {h.currentStreak > 0 && <span style={{ color: 'var(--c-gold)' }}>{h.currentStreak}d</span>}
                      </div>
                    ))}
                  </div>
                )}

                {zone.quests.length === 0 && zone.habits.length === 0 && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Esta zona aún no tiene contenido. Crea misiones o hábitos y asígnalos a esta zona.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PixelPanel>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomZonesPage() {
  const toast = useToastStore();
  const [zones, setZones] = useState<CustomZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/custom-zones');
      setZones(data);
    } catch { toast.error('Error cargando zonas'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-pixel text-[var(--accent-gold)]" style={{ fontSize: '14px' }}>
            📍 MIS ZONAS
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            Zonas personalizadas creadas con El Sabio · {zones.length}/10 activas
          </p>
        </div>
        {!showWizard && zones.length < 10 && (
          <PixelButton variant="primary" onClick={() => setShowWizard(true)}>
            <Plus size={14} /> Nueva zona
          </PixelButton>
        )}
      </div>

      <AnimatePresence>
        {showWizard && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <ZoneWizard
              onCreated={() => { setShowWizard(false); load(); }}
              onCancel={() => setShowWizard(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : zones.length === 0 ? (
        <PixelPanel className="p-10 text-center">
          <p className="text-4xl mb-3">🏰</p>
          <p className="font-pixel text-[var(--text-2)]" style={{ fontSize: '10px' }}>SIN ZONAS PERSONALIZADAS</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            El Sabio puede construir una zona personalizada a partir de tu descripción
          </p>
          <div className="mt-4">
            <PixelButton variant="primary" onClick={() => setShowWizard(true)}>
              <Sparkles size={14} /> Crear primera zona
            </PixelButton>
          </div>
        </PixelPanel>
      ) : (
        <div className="space-y-3">
          {zones.map(z => (
            <motion.div key={z.id} layout>
              <ZoneCard zone={z} onDelete={load} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
