import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { MiguelSprite } from '../../components/character/MiguelSprite';
import { StatBlock } from '../../components/character/StatBlock';
import { AvatarCustomizer } from '../../components/character/AvatarCustomizer';
import { PixelPanel } from '../../components/ui/PixelPanel';
import { PixelButton } from '../../components/ui/PixelButton';
import { xpProgressPercent } from '../../lib/xp';

const EQUIPMENT_SLOTS = [
  { key: 'head', icon: '🎩', label: 'Cabeza' },
  { key: 'body', icon: '👕', label: 'Cuerpo' },
  { key: 'accessory', icon: '🛡️', label: 'Accesorio' },
  { key: 'pet', icon: '🐾', label: 'Mascota' },
  { key: 'aura', icon: '⭐', label: 'Aura' },
];

export default function CharacterPage() {
  const user = useAuthStore((s) => s.user);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  if (!user) return null;

  const avatarCfg = user.avatarConfig;
  const xpPct = xpProgressPercent(user.xp, user.xpToNextLevel);

  const daysSinceJoin = Math.floor(
    (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">
          🧙 Ficha del héroe
        </h1>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ── Columna izquierda: Visual ── */}
        <PixelPanel animate className="p-5 flex flex-col items-center gap-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <div className="w-32 h-32 rounded-full bg-[var(--bg-panel-light)] flex items-center justify-center">
              <MiguelSprite
                size={120}
                bodyType={avatarCfg.bodyType}
                hairStyle={avatarCfg.hairStyle}
                hairColor={avatarCfg.hairColor}
                skinColor={avatarCfg.skinColor}
                shirtColor={avatarCfg.shirtColor}
                pantsColor={avatarCfg.pants}
                accessory={avatarCfg.accessory}
                expression={avatarCfg.expression}
                animate="idle"
              />
            </div>
          </motion.div>

          <div className="text-center">
            <p className="font-semibold text-sm text-[var(--text-primary)]">
              {user.displayName}
            </p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="bg-[var(--accent-gold)] text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                LV {user.level}
              </div>
              <span className="text-sm text-[var(--text-secondary)]">
                Día {daysSinceJoin} en LifeQuest
              </span>
            </div>
          </div>

          {/* Barra XP grande */}
          <div className="w-full">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[var(--text-secondary)]">XP</span>
              <span className="text-[var(--accent-gold)]">{user.xp.toLocaleString()} / {user.xpToNextLevel.toLocaleString()}</span>
            </div>
            <div className="stat-bar h-4">
              <motion.div
                className="stat-bar-fill bg-[var(--accent-gold)]"
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 text-right">{xpPct}%</p>
          </div>

          {/* Racha */}
          <div className="flex items-center gap-2 bg-[var(--bg-panel-light)] border border-[var(--border)] rounded-lg px-3 py-2 w-full justify-center">
            <span className="text-xl">🔥</span>
            <span className="text-sm font-medium text-[var(--text-primary)]">{user.currentStreak} días de racha</span>
          </div>

          <PixelButton variant="secondary" onClick={() => setCustomizerOpen(true)} className="w-full text-xs">
            ✏️ Cambiar apariencia
          </PixelButton>
        </PixelPanel>

        {/* ── Columna central: Stats ── */}
        <PixelPanel animate className="p-5 space-y-3">
          <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide text-center mb-3">
            Atributos
          </h2>

          <StatBlock
            icon="❤️" label="HP" value={user.hp} max={user.maxHp}
            color="text-[var(--accent-pink)]" barColor="bg-accent-pink"
            tooltip="Puntos de vida. Sube con cada nivel y buenos hábitos de salud."
          />
          <StatBlock
            icon="🔵" label="MP" value={user.mp} max={user.maxMp}
            color="text-[var(--accent-cyan)]" barColor="bg-accent-cyan"
            tooltip="Puntos de maná. Representa tu energía mental y foco."
          />

          <div className="border-t border-[var(--border)] pt-3 space-y-2">
            <StatBlock
              icon="⚔️" label="FUERZA (STR)" value={user.strength}
              color="text-[var(--accent-red)]"
              tooltip="Sube al completar misiones de FITNESS y GYM. Aumenta daño físico."
            />
            <StatBlock
              icon="🧠" label="INTELIGENCIA (INT)" value={user.intelligence}
              color="text-[var(--accent-blue)]"
              tooltip="Sube al completar misiones de LEARNING y FINANCE. Amplifica XP ganado."
            />
            <StatBlock
              icon="✨" label="CARISMA (CHA)" value={user.charisma}
              color="text-[var(--accent-pink)]"
              tooltip="Sube al completar misiones de LOVE y SOCIAL. Mejora recompensas de gold."
            />
          </div>

          <div className="border-t border-[var(--border)] pt-3">
            <div className="flex items-center justify-center gap-2 bg-[var(--bg-panel-light)] border border-[var(--border)] rounded-lg px-4 py-2">
              <span className="text-[var(--accent-gold)] text-2xl">💰</span>
              <span className="text-xl font-bold text-[var(--accent-gold)]">{user.gold.toLocaleString()}</span>
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">GOLD</span>
            </div>
          </div>
        </PixelPanel>

        {/* ── Columna derecha: Equipamiento ── */}
        <PixelPanel animate className="p-5">
          <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide text-center mb-4">
            Equipamiento
          </h2>

          <div className="space-y-2">
            {EQUIPMENT_SLOTS.map((slot) => (
              <motion.div
                key={slot.key}
                whileHover={{ x: 3 }}
                className="flex items-center gap-3 border border-[var(--border)] rounded-lg bg-[var(--bg-panel-light)] p-2 cursor-pointer hover:border-[var(--accent-gold)] transition-colors group"
              >
                <span className="text-xl w-8 text-center">{slot.icon}</span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                    {slot.label}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    — vacío —
                  </p>
                </div>
                <span className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--accent-gold)] transition-colors">
                  +
                </span>
              </motion.div>
            ))}
          </div>

          <p className="text-xs text-[var(--text-secondary)] text-center mt-4">
            Compra items en el mercado para equiparlos 🛒
          </p>

          {/* Logros recientes */}
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">Logros desbloqueados</h3>
            <div className="space-y-1.5">
              {[
                { icon: '🌟', title: '¡El Héroe Despierta!', desc: 'Primera sesión' },
                { icon: '🔥', title: 'Semana de Fuego', desc: '7 días seguidos' },
                { icon: '⚔️', title: 'Primera Misión', desc: 'Completaste tu primera misión' },
              ].map((ach) => (
                <div key={ach.title} className="flex items-center gap-2 bg-[var(--bg-panel-light)] border border-[var(--border)] rounded-lg px-2 py-1.5">
                  <span>{ach.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-[var(--accent-gold)]">{ach.title}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{ach.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PixelPanel>
      </div>

      <AvatarCustomizer isOpen={customizerOpen} onClose={() => setCustomizerOpen(false)} />
    </div>
  );
}
