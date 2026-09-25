import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { E } from '@/components/ui/glyphs';

const CLASSES = [
  {
    id: 'warrior',
    emoji: '⚔️',
    name: 'Guerrero',
    color: '#2a2a2e',
    description: 'Maestro del fitness y la disciplina',
    bonus: '+20% XP en quests de Gym',
    statBonus: 'STR +2 por nivel',
  },
  {
    id: 'mage',
    emoji: '🧙',
    name: 'Mago',
    color: '#5c5c64',
    description: 'Sabio del conocimiento y la inteligencia',
    bonus: '+20% XP en quests de Aprendizaje',
    statBonus: 'INT +2 por nivel',
  },
  {
    id: 'merchant',
    emoji: '💰',
    name: 'Mercader',
    color: '#a8871e',
    description: 'Maestro de las finanzas y el ahorro',
    bonus: '+20% GOLD en todas las quests',
    statBonus: 'Acumula riqueza más rápido',
  },
  {
    id: 'paladin',
    emoji: '❤️',
    name: 'Paladín',
    color: '#c0c0c8',
    description: 'Guardián de las relaciones y el bienestar',
    bonus: '+20% XP en quests de Love & Health',
    statBonus: 'CHA +2 por nivel',
  },
];

interface Props {
  onClose: () => void;
}

export function ClassSelectionModal({ onClose }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const { updateUser, user } = useAuthStore();

  async function handleChoose() {
    if (!selected) return;
    setLoading(true);
    try {
      const r: any = await api.post('/users/me/class', { playerClass: selected });
      setConfirmed(true);
      if (r.data?.user) updateUser(r.data.user);
      else updateUser({ ...user, playerClass: selected } as any);
      setTimeout(onClose, 2500);
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al elegir clase');
    } finally {
      setLoading(false);
    }
  }

  const cls = CLASSES.find((c) => c.id === selected);

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-2xl"
        initial={{ scale: 0.8, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9 }}
        transition={{ type: 'spring', damping: 18 }}
      >
        <div className="pixel-panel p-6" style={{ background: 'linear-gradient(135deg, var(--bg-panel-light) 0%, var(--bg-panel) 100%)' }}>
          {confirmed ? (
            <motion.div className="text-center py-8" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
              <p className="text-6xl mb-4">{cls?.emoji}</p>
              <h2 className="pixel-text text-2xl text-accent-gold mb-2">¡Clase Elegida!</h2>
              <p className="text-[var(--text-primary)] font-mono">Ahora eres un {cls?.name}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-2">{cls?.bonus}</p>
            </motion.div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="pixel-text text-xl text-yellow-300"><E e="⚡" /> Elige tu Clase</h2>
                <p className="text-purple-300 font-mono text-sm mt-1">Has alcanzado el Nivel 10 — ¡es hora de especializarte!</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {CLASSES.map((c) => (
                  <motion.button
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selected === c.id ? 'border-yellow-400 bg-yellow-400/10' : 'border-purple-800/50 bg-purple-900/30 hover:border-purple-500'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl"><E e={c.emoji} /></span>
                      <span className="font-bold text-white pixel-text text-sm">{c.name}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">{c.description}</p>
                    <p className="text-xs font-bold" style={{ color: c.color }}>{c.bonus}</p>
                    <p className="text-xs text-gray-500">{c.statBonus}</p>
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-3 justify-center">
                <button onClick={onClose} className="pixel-button px-4 py-2 text-sm bg-gray-700">
                  Decidir después
                </button>
                <motion.button
                  onClick={handleChoose}
                  disabled={!selected || loading}
                  className="pixel-button px-6 py-2 text-sm disabled:opacity-50"
                  style={{ background: selected ? `linear-gradient(135deg, ${cls?.color}, ${cls?.color}88)` : undefined }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {loading ? '...' : <><E e="⚡" s={11} /> Confirmar Clase</>}
                </motion.button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
