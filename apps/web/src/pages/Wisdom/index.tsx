import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Lock, Sparkles } from 'lucide-react';
import * as wisdomService from '../../services/wisdom.service';
import type { WisdomCard } from '../../services/wisdom.service';
import { E } from '@/components/ui/glyphs';

const CATEGORY_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  discipline:    { label: 'Disciplina',  color: 'var(--accent-red)',   emoji: '⚔️' },
  mindset:       { label: 'Mentalidad',  color: 'var(--accent-cyan)',  emoji: '🧠' },
  finance:       { label: 'Finanzas',    color: 'var(--accent-gold)',  emoji: '💰' },
  health:        { label: 'Salud',       color: 'var(--accent-green)', emoji: '💪' },
  relationships: { label: 'Relaciones',  color: 'var(--accent-pink)',  emoji: '❤️' },
  growth:        { label: 'Crecimiento', color: 'var(--accent-cyan)',  emoji: '🌱' },
};

function WisdomCardUI({ card, delay = 0 }: { card: WisdomCard; delay?: number }) {
  const cfg = CATEGORY_CONFIG[card.category] ?? { label: card.category, color: 'var(--text-muted)', emoji: '📖' };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ delay: delay * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5 flex flex-col gap-3"
      style={{ borderColor: cfg.color + '33' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg"><E e={cfg.emoji} /></span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cfg.color + '22', color: cfg.color }}>
          {cfg.label}
        </span>
        {card.levelRequired > 1 && (
          <span className="text-[10px] text-[var(--text-muted)] ml-auto">Nv. {card.levelRequired}</span>
        )}
      </div>

      <blockquote className="text-sm text-[var(--text-primary)] leading-relaxed font-medium italic">
        "{card.quote}"
      </blockquote>

      {card.author && (
        <p className="text-xs text-[var(--text-muted)] text-right">— {card.author}</p>
      )}
    </motion.div>
  );
}

export default function WisdomPage() {
  const [data, setData] = useState<{
    available: WisdomCard[];
    locked: { id: string; category: string; levelRequired: number }[];
    userLevel: number;
  } | null>(null);
  const [dailyCard, setDailyCard] = useState<WisdomCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    Promise.allSettled([
      wisdomService.getDailyCard(),
      wisdomService.getAllCards(),
    ]).then(([daily, all]) => {
      if (daily.status === 'fulfilled') setDailyCard(daily.value);
      if (all.status === 'fulfilled') setData(all.value);
    }).finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...Object.keys(CATEGORY_CONFIG)];
  const filtered = data?.available.filter((c) =>
    filter === 'all' || c.category === filter
  ) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <BookOpen className="text-[var(--accent-gold)]" size={24} />
          Biblioteca de Sabiduría
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Principios que desbloqueas con el nivel — {data?.available.length ?? 0} disponibles
        </p>
      </div>

      {/* Daily Card */}
      {dailyCard && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--accent-gold)15, var(--accent-cyan)08)',
            border: '1px solid var(--accent-gold)55',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-[var(--accent-gold)]" />
            <span className="text-xs font-semibold text-[var(--accent-gold)]">Sabiduría del Día</span>
          </div>
          <blockquote className="text-base font-semibold text-[var(--text-primary)] leading-relaxed italic">
            "{dailyCard.quote}"
          </blockquote>
          {dailyCard.author && (
            <p className="text-sm text-[var(--text-muted)] mt-2 text-right">— {dailyCard.author}</p>
          )}
        </motion.div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: filter === cat ? (cfg?.color ?? 'var(--accent-gold)') + '33' : 'transparent',
                border: `1px solid ${filter === cat ? (cfg?.color ?? 'var(--accent-gold)') : 'var(--border)'}`,
                color: filter === cat ? (cfg?.color ?? 'var(--accent-gold)') : 'var(--text-muted)',
              }}
            >
              {cfg ? `${cfg.emoji} ${cfg.label}` : 'Todas'}
            </button>
          );
        })}
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((card, i) => (
            <WisdomCardUI key={card.id} card={card} delay={i} />
          ))}
        </div>
      )}

      {/* Locked section */}
      {data && data.locked.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-muted)] flex items-center gap-2">
            <Lock size={14} />
            {data.locked.length} cartas bloqueadas — sigue subiendo de nivel
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.locked.slice(0, 6).map((card) => {
              const cfg = CATEGORY_CONFIG[card.category];
              return (
                <div key={card.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4 flex flex-col items-center gap-2 opacity-40">
                  <Lock size={20} className="text-[var(--text-muted)]" />
                  <span className="text-xs text-[var(--text-muted)]"><E e={cfg?.emoji ?? '📖'} /> {cfg?.label ?? card.category}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Nivel {card.levelRequired}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
