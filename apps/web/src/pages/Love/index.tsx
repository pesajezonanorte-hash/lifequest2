import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../hooks/useToast';
import { PixelPanel } from '../../components/ui/PixelPanel';
import { PixelButton } from '../../components/ui/PixelButton';
import type { Relationship, LoveDashboard, ImportantDate } from '@lifequest/shared';
import * as loveService from '../../services/love.service';
import api from '../../lib/api';
import { SageContextButton } from '../../components/sage/SageContextButton';

interface GiftIdea { id: string; title: string; description?: string; estimatedPrice?: number; isPurchased: boolean; forPerson?: string }

function GiftWishlist({ relationshipId }: { relationshipId?: string }) {
  const [gifts, setGifts] = useState<GiftIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', estimatedPrice: '', forPerson: '' });

  useEffect(() => {
    const q = relationshipId ? `?relationshipId=${relationshipId}` : '';
    api.get(`/love/gift-ideas${q}`).then((r: any) => setGifts(r.data ?? [])).finally(() => setLoading(false));
  }, [relationshipId]);

  async function handleCreate() {
    if (!form.title.trim()) return;
    const r: any = await api.post('/love/gift-ideas', {
      title: form.title,
      description: form.description || undefined,
      estimatedPrice: form.estimatedPrice ? Number(form.estimatedPrice) : undefined,
      forPerson: form.forPerson || undefined,
      relationshipId: relationshipId || undefined,
    });
    setGifts(prev => [...prev, r.data]);
    setShowForm(false);
    setForm({ title: '', description: '', estimatedPrice: '', forPerson: '' });
  }

  async function togglePurchased(gift: GiftIdea) {
    await api.patch(`/love/gift-ideas/${gift.id}`, { isPurchased: !gift.isPurchased });
    setGifts(prev => prev.map(g => g.id === gift.id ? { ...g, isPurchased: !g.isPurchased } : g));
  }

  async function handleDelete(id: string) {
    await api.delete(`/love/gift-ideas/${id}`);
    setGifts(prev => prev.filter(g => g.id !== id));
  }

  if (loading) return <p className="font-vt text-text-secondary text-center py-8 text-xl">Cargando...</p>;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <PixelButton variant="secondary" onClick={() => setShowForm(f => !f)}>{showForm ? '✕ CERRAR' : '+ IDEA'}</PixelButton>
      </div>

      {showForm && (
        <PixelPanel className="p-4 space-y-2">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nombre del regalo" className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-lg px-3 py-2 focus:border-accent-gold outline-none" />
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción (opcional)" className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-base px-3 py-2 focus:border-accent-gold outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="font-pixel text-text-secondary mb-1" style={{ fontSize: '7px' }}>PRECIO ESTIMADO (COP)</p>
              <input type="number" value={form.estimatedPrice} onChange={e => setForm(f => ({ ...f, estimatedPrice: e.target.value }))} placeholder="0" className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-base px-2 py-1 focus:border-accent-gold outline-none" />
            </div>
            <div>
              <p className="font-pixel text-text-secondary mb-1" style={{ fontSize: '7px' }}>PARA QUIÉN</p>
              <input value={form.forPerson} onChange={e => setForm(f => ({ ...f, forPerson: e.target.value }))} placeholder="Nombre" className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-base px-2 py-1 focus:border-accent-gold outline-none" />
            </div>
          </div>
          <PixelButton variant="primary" onClick={handleCreate} className="w-full">GUARDAR IDEA</PixelButton>
        </PixelPanel>
      )}

      {gifts.length === 0 ? (
        <PixelPanel className="p-8 text-center">
          <p className="text-4xl mb-2">🎁</p>
          <p className="font-pixel text-text-secondary" style={{ fontSize: '9px' }}>SIN IDEAS DE REGALOS</p>
        </PixelPanel>
      ) : (
        <div className="space-y-2">
          {gifts.map(g => (
            <PixelPanel key={g.id} className={`p-3 ${g.isPurchased ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  <button onClick={() => togglePurchased(g)} className="mt-1 font-pixel text-lg" style={{ color: g.isPurchased ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                    {g.isPurchased ? '✓' : '○'}
                  </button>
                  <div>
                    <p className={`font-vt text-text-primary text-lg ${g.isPurchased ? 'line-through' : ''}`}>{g.title}</p>
                    {g.description && <p className="font-vt text-text-secondary text-base">{g.description}</p>}
                    <div className="flex gap-3 mt-0.5">
                      {g.estimatedPrice && <p className="font-pixel text-accent-gold" style={{ fontSize: '7px' }}>${g.estimatedPrice.toLocaleString('es-CO')}</p>}
                      {g.forPerson && <p className="font-pixel text-text-secondary" style={{ fontSize: '7px' }}>para {g.forPerson}</p>}
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDelete(g.id)} className="font-pixel text-accent-red hover:opacity-70" style={{ fontSize: '8px' }}>✕</button>
              </div>
            </PixelPanel>
          ))}
        </div>
      )}
    </div>
  );
}

function timeTogetherText(createdAt: string) {
  const diff = Date.now() - new Date(createdAt).getTime();
  const days = Math.floor(diff / 86400000);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);
  if (years > 0) return `${years} año${years > 1 ? 's' : ''}, ${months % 12} mes${months % 12 !== 1 ? 'es' : ''} y ${days % 30} días juntos`;
  if (months > 0) return `${months} mes${months > 1 ? 'es' : ''} y ${days % 30} días juntos`;
  return `${days} días juntos`;
}

function AddDateModal({ relationshipId, onClose, onSave }: { relationshipId: string; onClose: () => void; onSave: (r: Relationship) => void }) {
  const [label, setLabel] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(true);
  const [emoji, setEmoji] = useState('💝');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function save() {
    if (!label.trim()) return;
    setSaving(true);
    try {
      const r = await loveService.addImportantDate(relationshipId, { label, date, isRecurring, emoji });
      onSave(r);
      toast.success('Fecha agregada 💝');
    } catch { toast.error('Error al agregar'); }
    finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-bg-panel border-2 border-border-pixel w-full max-w-sm space-y-4 p-5" onClick={e => e.stopPropagation()}>
        <p className="font-pixel text-accent-gold" style={{ fontSize: '10px' }}>AGREGAR FECHA ESPECIAL</p>
        <div className="flex gap-2">
          <input value={emoji} onChange={e => setEmoji(e.target.value)} className="w-16 bg-bg-deep border-2 border-border-pixel text-text-primary text-center font-vt text-2xl py-2 focus:border-accent-gold outline-none" />
          <input autoFocus value={label} onChange={e => setLabel(e.target.value)} placeholder="Nombre de la fecha" className="flex-1 bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-base px-3 py-2 focus:border-accent-gold outline-none" />
        </div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-base px-3 py-2 focus:border-accent-gold outline-none" />
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="w-4 h-4" />
          <span className="font-vt text-text-primary text-lg">Recurrente anual</span>
        </label>
        <div className="flex gap-2">
          <PixelButton variant="ghost" onClick={onClose} className="flex-1">Cancelar</PixelButton>
          <PixelButton variant="primary" onClick={save} disabled={!label.trim() || saving} className="flex-1">Agregar</PixelButton>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SetupModal({ onClose, onSave }: { onClose: () => void; onSave: (r: Relationship) => void }) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const r = await loveService.createRelationship({ name, type: 'romantic', isPartner: true, notes: startDate ? `startDate:${startDate}` : undefined });
      onSave(r);
      toast.success('¡Relación configurada! 💝');
    } catch { toast.error('Error al configurar'); }
    finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-bg-panel border-2 border-border-pixel w-full max-w-sm space-y-4 p-5" onClick={e => e.stopPropagation()}>
        <p className="font-pixel text-accent-gold" style={{ fontSize: '10px' }}>CONFIGURAR JARDÍN</p>
        <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de tu pareja" className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-xl px-3 py-2 focus:border-accent-gold outline-none" />
        <div>
          <p className="font-pixel text-text-secondary mb-1" style={{ fontSize: '7px' }}>FECHA DE INICIO</p>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-base px-3 py-2 focus:border-accent-gold outline-none" />
        </div>
        <div className="flex gap-2">
          <PixelButton variant="ghost" onClick={onClose} className="flex-1">Cancelar</PixelButton>
          <PixelButton variant="primary" onClick={save} disabled={!name.trim() || saving} className="flex-1">Guardar</PixelButton>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function LovePage() {
  const toast = useToast();
  const [dashboard, setDashboard] = useState<LoveDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showAddDate, setShowAddDate] = useState(false);
  const [tab, setTab] = useState<'jardín' | 'regalos'>('jardín');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loveService.fetchLoveDashboard();
      setDashboard(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleRelationshipSaved(r: Relationship) {
    setDashboard(prev => ({ ...prev, relationship: r, nextImportantDate: prev?.nextImportantDate ?? null }));
    setShowSetup(false);
    load();
  }

  async function handleDeleteDate(dateId: string) {
    if (!dashboard?.relationship) return;
    try {
      await loveService.deleteImportantDate(dashboard.relationship.id, dateId);
      toast.success('Fecha eliminada');
      load();
    } catch { toast.error('Error al eliminar'); }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <motion.p className="font-vt text-text-secondary text-xl" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>Entrando al jardín...</motion.p>
      </div>
    );
  }

  const rel = dashboard?.relationship;
  const startDate = rel?.notes?.match(/startDate:(\S+)/)?.[1];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-pixel text-accent-gold" style={{ fontSize: '14px' }}>💖 JARDÍN DEL CORAZÓN</h1>
          <p className="font-vt text-text-secondary text-base">Lo que importa en tu vida</p>
        </div>
        <div className="flex items-center gap-2">
          <SageContextButton message="¿Cómo puedo cuidar mejor las relaciones que importan?" label="Pídele consejo al Sabio" />
          {!rel && <PixelButton variant="primary" onClick={() => setShowSetup(true)}>CONFIGURAR</PixelButton>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {([['jardín', '💖 Jardín'], ['regalos', '🎁 Regalos']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-shrink-0 px-3 py-1.5 border-2 font-pixel transition-all ${tab === key ? 'border-accent-gold bg-accent-gold text-bg-deep' : 'border-border-pixel text-text-secondary hover:border-text-secondary'}`}
            style={{ fontSize: '8px' }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'regalos' && <GiftWishlist relationshipId={dashboard?.relationship?.id} />}

      {tab === 'jardín' && !rel && (
        <PixelPanel className="p-8 text-center space-y-3">
          <p className="text-5xl">💖</p>
          <p className="font-pixel text-text-secondary" style={{ fontSize: '9px' }}>EL JARDÍN ESPERA</p>
          <p className="font-vt text-text-secondary text-base">Configura esta zona para comenzar a cultivar tus relaciones</p>
          <PixelButton variant="primary" onClick={() => setShowSetup(true)}>CONFIGURAR JARDÍN</PixelButton>
        </PixelPanel>
      )}

      {tab === 'jardín' && rel && (
        <>
          {/* Partner card */}
          <PixelPanel className="p-5 text-center space-y-3">
            <p className="text-5xl">💑</p>
            <p className="font-pixel text-accent-gold" style={{ fontSize: '12px' }}>{rel.name}</p>
            {startDate && <p className="font-vt text-text-secondary text-lg">{timeTogetherText(startDate + 'T00:00:00')}</p>}
          </PixelPanel>

          {/* Next important date */}
          {dashboard?.nextImportantDate && (
            <PixelPanel className="p-4">
              <p className="font-pixel text-text-secondary mb-2" style={{ fontSize: '8px' }}>PRÓXIMA FECHA ESPECIAL</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{dashboard.nextImportantDate.emoji ?? '💝'}</span>
                  <div>
                    <p className="font-vt text-text-primary text-xl">{dashboard.nextImportantDate.label}</p>
                    <p className="font-pixel text-text-secondary" style={{ fontSize: '7px' }}>
                      {new Date(dashboard.nextImportantDate.date).toLocaleDateString('es-CO', { month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-pixel text-accent-gold" style={{ fontSize: '14px' }}>{dashboard.nextImportantDate.daysUntil}</p>
                  <p className="font-pixel text-text-secondary" style={{ fontSize: '7px' }}>DÍAS</p>
                </div>
              </div>
            </PixelPanel>
          )}

          {/* Important dates */}
          <PixelPanel className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-pixel text-text-secondary" style={{ fontSize: '8px' }}>FECHAS ESPECIALES</p>
              <PixelButton variant="secondary" onClick={() => setShowAddDate(true)}>+ AGREGAR</PixelButton>
            </div>
            {(rel.importantDates as ImportantDate[]).length === 0 ? (
              <p className="font-vt text-text-secondary text-base">Sin fechas especiales aún</p>
            ) : (
              <div className="space-y-2">
                {(rel.importantDates as ImportantDate[]).map(d => {
                  const target = new Date(d.date);
                  if (d.isRecurring) { target.setFullYear(new Date().getFullYear()); if (target < new Date()) target.setFullYear(target.getFullYear() + 1); }
                  const days = Math.ceil((target.getTime() - Date.now()) / 86400000);
                  return (
                    <div key={d.id} className="flex items-center justify-between py-1 border-b border-border-pixel/30 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{d.emoji ?? '💝'}</span>
                        <div>
                          <p className="font-vt text-text-primary text-lg">{d.label}</p>
                          <p className="font-pixel text-text-secondary" style={{ fontSize: '7px' }}>
                            {new Date(d.date).toLocaleDateString('es-CO', { month: 'long', day: 'numeric' })}
                            {d.isRecurring ? ' · Anual' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-vt text-accent-gold text-base">{days >= 0 ? `en ${days}d` : `hace ${-days}d`}</p>
                        <button onClick={() => handleDeleteDate(d.id)} className="font-pixel text-accent-red hover:opacity-70" style={{ fontSize: '8px' }}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </PixelPanel>

          {rel.notes && !rel.notes.startsWith('startDate:') && (
            <PixelPanel className="p-4">
              <p className="font-pixel text-text-secondary mb-2" style={{ fontSize: '8px' }}>NOTAS PRIVADAS</p>
              <p className="font-vt text-text-primary text-base">{rel.notes}</p>
            </PixelPanel>
          )}
        </>
      )}

      <AnimatePresence>
        {showSetup && <SetupModal onClose={() => setShowSetup(false)} onSave={handleRelationshipSaved} />}
        {showAddDate && rel && <AddDateModal relationshipId={rel.id} onClose={() => setShowAddDate(false)} onSave={r => { setDashboard(prev => ({ ...prev!, relationship: r })); setShowAddDate(false); load(); }} />}
      </AnimatePresence>
    </div>
  );
}
