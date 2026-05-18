import { type ReactNode, useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import * as authService from '../../services/auth.service';
import { LevelUpOverlay } from '../animations/LevelUpOverlay';
import { FloatingXPLayer } from '../animations/FloatingXP';
import { ScreenFlash } from '../animations/ScreenFlash';
import { AchievementUnlockedToast } from '../achievements/AchievementUnlockedToast';
import { ToastContainer } from '../ui/ToastContainer';
import { audio } from '../../lib/audio';
import {
  LayoutDashboard, Swords, Flame, BarChart3, TrendingUp, Dumbbell,
  UtensilsCrossed, Moon, Wallet, BookOpen, Heart, NotebookPen,
  ShoppingBag, Globe, Crosshair, Users, Skull, CalendarDays,
  Target, Sun, Sparkles, Trophy, Settings, User,
  Volume2, VolumeX, UserPlus, Zap, Search, Castle, ChevronRight,
} from 'lucide-react';
import { FocusMode } from '../ui/FocusMode';
import { AnimatePresence as AP } from 'framer-motion';
import { CommandPalette } from '../ui/CommandPalette';
import { NotificationBell } from '../ui/NotificationPanel';
import { ScrollToTop } from '../ui/ScrollToTop';
import { OfflineIndicator } from '../ui/OfflineIndicator';
import { QuickActionsFAB } from '../ui/QuickActionsFAB';

interface NavItem {
  to: string;
  icon: ReactNode;
  label: string;
  hint: string;
  group: 'main' | 'zones' | 'social' | 'me';
  accent?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  // Aventura
  { to: '/',            icon: <Castle size={18} />,            label: 'Castillo',    hint: 'Dashboard',     group: 'main' },
  { to: '/quests',      icon: <Swords size={18} />,            label: 'Misiones',    hint: 'Registro',      group: 'main' },
  { to: '/habits',      icon: <Flame size={18} />,             label: 'Hábitos',     hint: 'Rutina',        group: 'main' },
  { to: '/stats',       icon: <TrendingUp size={18} />,        label: 'Estadísticas',hint: 'Life Score',    group: 'main' },
  { to: '/history',     icon: <BarChart3 size={18} />,         label: 'Historial',   hint: 'Actividad',     group: 'main' },
  // Zonas del reino
  { to: '/gym',         icon: <Dumbbell size={18} />,          label: 'Coliseo',     hint: 'Gym',           group: 'zones' },
  { to: '/finances',    icon: <Wallet size={18} />,            label: 'Bóveda',      hint: 'Finanzas',      group: 'zones' },
  { to: '/food',        icon: <UtensilsCrossed size={18} />,   label: 'Posada',      hint: 'Comida',        group: 'zones' },
  { to: '/sleep',       icon: <Moon size={18} />,              label: 'Torre',       hint: 'Sueño',         group: 'zones' },
  { to: '/learning',    icon: <BookOpen size={18} />,          label: 'Biblioteca',  hint: 'Aprendizaje',   group: 'zones' },
  { to: '/love',        icon: <Heart size={18} />,             label: 'Jardín',      hint: 'Amor',          group: 'zones' },
  { to: '/journal',     icon: <NotebookPen size={18} />,       label: 'Diario',      hint: 'Notas',         group: 'zones' },
  { to: '/shop',        icon: <ShoppingBag size={18} />,       label: 'Mercado',     hint: 'Tienda',        group: 'zones' },
  { to: '/wisdom',      icon: <Sparkles size={18} />,          label: 'El Sabio',    hint: 'Sabiduría',     group: 'zones', accent: true },
  // Social
  { to: '/leaderboard', icon: <Globe size={18} />,             label: 'Mundo',       hint: 'Ranking',       group: 'social' },
  { to: '/challenges',  icon: <Crosshair size={18} />,         label: 'Retos',       hint: 'Jefes',         group: 'social' },
  { to: '/guild',       icon: <Users size={18} />,             label: 'Gremio',      hint: 'Amigos',        group: 'social' },
  { to: '/season',      icon: <Skull size={18} />,             label: 'Campaña',     hint: 'Historia',      group: 'social' },
  // Tú
  { to: '/agenda',      icon: <CalendarDays size={18} />,      label: 'Agenda',      hint: 'Calendario',    group: 'me' },
  { to: '/goals',       icon: <Target size={18} />,            label: 'Metas',       hint: 'Maestras',      group: 'me' },
  { to: '/rituals',     icon: <Sun size={18} />,               label: 'Rituales',    hint: 'Rutinas',       group: 'me' },
  { to: '/glow-up',     icon: <Sparkles size={18} />,          label: 'El Espejo',   hint: 'Transformación',group: 'me' },
];

const NAV_GROUPS: { id: NavItem['group']; label: string }[] = [
  { id: 'main',   label: 'Aventura' },
  { id: 'zones',  label: 'Zonas del reino' },
  { id: 'social', label: 'Mundo' },
  { id: 'me',     label: 'Tú' },
];

function LiveClock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));
    }, 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="hidden lg:block font-pixel text-[var(--text-muted)] select-none" style={{ fontSize: '9px' }}>
      {time}
    </span>
  );
}

function XPSparkles({ trigger }: { trigger: number }) {
  const [particles, setParticles] = useState<{ id: number; x: number }[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const newOnes = Array.from({ length: 8 }, (_, i) => ({ id: Date.now() + i, x: Math.random() * 100 }));
    setParticles(newOnes);
    const t = setTimeout(() => setParticles([]), 1500);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute bottom-0 rounded-full bg-[var(--accent-gold)]"
          style={{ left: `${p.x}%`, width: 3, height: 3 }}
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{ y: -20, opacity: 0, scale: 0 }}
          transition={{ duration: 1 + Math.random() * 0.5, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

function GoldCounter({ gold }: { gold: number }) {
  const prev = useRef(gold);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (gold !== prev.current) {
      setFlash(gold > prev.current ? 'up' : 'down');
      prev.current = gold;
      const t = setTimeout(() => setFlash(null), 700);
      return () => clearTimeout(t);
    }
  }, [gold]);

  const color = flash === 'up'
    ? 'text-[var(--accent-green)]'
    : flash === 'down'
      ? 'text-[var(--accent-red)]'
      : 'text-[var(--accent-gold)]';

  return (
    <motion.div
      className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] px-3 py-2"
      animate={flash ? { scale: [1, 1.04, 1] } : {}}
      transition={{ duration: 0.25 }}
    >
      <Wallet size={16} />
      <span className={`text-sm font-semibold ${color}`}>{gold.toLocaleString('es-CO')}</span>
    </motion.div>
  );
}

function StatBarFill({
  pct,
  color,
  pulse,
  wave,
}: {
  pct: number;
  color: string;
  pulse?: boolean;
  wave?: boolean;
}) {
  return (
    <div className="stat-bar relative overflow-hidden">
      <motion.div
        className={`stat-bar-fill ${color} relative`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
            backgroundSize: '60% 100%',
          }}
          animate={{ backgroundPositionX: ['-60%', '160%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
        />
        {wave && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 10px)',
            }}
            animate={{ x: [0, 10] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </motion.div>
      {pulse && pct < 30 && (
        <motion.div
          className="absolute inset-0 pointer-events-none border border-[var(--accent-pink)]"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity }}
        />
      )}
    </div>
  );
}

interface Props {
  children: ReactNode;
}

export function GameLayout({ children }: Props) {
  const { user, logout: storeLogout } = useAuthStore();
  const { toggleAudio, audioEnabled, xpSparkTrigger } = useUIStore();
  const navigate = useNavigate();
  const [showFocus, setShowFocus] = useState(false);
  async function handleLogout() {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    storeLogout();
    navigate('/login');
  }

  const hpPct = user ? (user.hp / user.maxHp) * 100 : 0;
  const mpPct = user ? (user.mp / user.maxMp) * 100 : 0;
  const xpPct = user ? (user.xp / user.xpToNextLevel) * 100 : 0;

  const xpPctSide = user ? Math.round((user.xp / user.xpToNextLevel) * 100) : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-deep)] text-[var(--text-primary)]">
      <aside
        className="hidden md:flex w-[264px] flex-shrink-0 flex-col relative overflow-hidden"
        style={{
          background: 'color-mix(in oklab, var(--surface) 60%, var(--bg))',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* bg glow */}
        <div
          className="pointer-events-none"
          style={{
            position: 'absolute', top: -80, left: -60, width: 240, height: 240,
            borderRadius: '50%', filter: 'blur(60px)', opacity: 0.55,
            background: 'radial-gradient(circle, color-mix(in oklab, var(--primary) 30%, transparent), transparent 70%)',
          }}
        />

        {/* brand */}
        <div className="relative flex items-center gap-2.5 px-[22px] pt-[22px] pb-4">
          <div
            className="flex h-[34px] w-[34px] items-center justify-center text-white"
            style={{
              borderRadius: 10,
              background: 'linear-gradient(160deg, #8b5cf6, #ec4899)',
              boxShadow: '0 6px 18px rgba(139,92,246,.45)',
            }}
          >
            <Castle size={18} />
          </div>
          <div>
            <div className="text-[17px] font-extrabold tracking-[-0.02em] leading-none">
              Life<span style={{ color: 'var(--primary)' }}>Quest</span>
            </div>
            <div className="mt-[2px] text-[10.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--text-3)' }}>
              v0.3 · alpha
            </div>
          </div>
        </div>

        {/* nav (grouped) */}
        <nav className="flex-1 overflow-y-auto px-3 pt-1 pb-5 flex flex-col gap-3.5">
          {NAV_GROUPS.map((g) => {
            const items = NAV_ITEMS.filter((n) => n.group === g.id);
            if (!items.length) return null;
            return (
              <div key={g.id}>
                <div className="px-[10px] pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--text-3)' }}>
                  {g.label}
                </div>
                <div className="flex flex-col gap-0.5">
                  {items.map((it) => (
                    <NavLink
                      key={it.to}
                      to={it.to}
                      end={it.to === '/'}
                      onClick={() => audio.play('blip')}
                    >
                      {({ isActive }) => (
                        <div
                          className="relative flex items-center gap-[11px] px-3 py-[9px] transition-colors"
                          style={{
                            borderRadius: 10,
                            fontSize: 13.5,
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? 'var(--text)' : 'var(--text-2)',
                            background: isActive
                              ? 'color-mix(in oklab, var(--primary) 14%, transparent)'
                              : 'transparent',
                            boxShadow: isActive
                              ? 'inset 0 0 0 1px color-mix(in oklab, var(--primary) 30%, transparent)'
                              : 'none',
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive)
                              (e.currentTarget as HTMLDivElement).style.background =
                                'color-mix(in oklab, var(--text) 5%, transparent)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive)
                              (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                          }}
                        >
                          {isActive && (
                            <div
                              style={{
                                position: 'absolute', left: -12, top: 8, bottom: 8, width: 3,
                                borderRadius: 999, background: 'var(--primary)',
                              }}
                            />
                          )}
                          <span
                            style={{
                              display: 'flex',
                              color: isActive ? 'var(--primary)' : it.accent ? 'var(--c-xp)' : 'var(--text-3)',
                            }}
                          >
                            {it.icon}
                          </span>
                          <span className="flex-1 truncate">{it.label}</span>
                          {it.accent && !isActive && (
                            <span
                              style={{
                                width: 6, height: 6, borderRadius: 999,
                                background: 'var(--c-xp)',
                                boxShadow: '0 0 8px var(--c-xp)',
                              }}
                            />
                          )}
                        </div>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}

          {/* secondary */}
          <div>
            <div className="px-[10px] pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--text-3)' }}>
              Más
            </div>
            <div className="flex flex-col gap-0.5">
              {[
                { to: '/character', icon: <User size={18} />, label: 'Personaje' },
                { to: '/achievements', icon: <Trophy size={18} />, label: 'Logros' },
                { to: '/settings', icon: <Settings size={18} />, label: 'Ajustes' },
              ].map(({ to, icon, label }) => (
                <NavLink key={to} to={to} onClick={() => audio.play('blip')}>
                  {({ isActive }) => (
                    <div
                      className="relative flex items-center gap-[11px] px-3 py-[9px] transition-colors"
                      style={{
                        borderRadius: 10,
                        fontSize: 13.5,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'var(--text)' : 'var(--text-2)',
                        background: isActive
                          ? 'color-mix(in oklab, var(--primary) 14%, transparent)'
                          : 'transparent',
                      }}
                    >
                      <span style={{ display: 'flex', color: isActive ? 'var(--primary)' : 'var(--text-3)' }}>{icon}</span>
                      <span className="flex-1 truncate">{label}</span>
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        {/* hero card */}
        {user && (
          <div className="relative px-3 pt-2 pb-4">
            <button
              onClick={() => navigate('/character')}
              className="block w-full text-left"
              style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }}
            >
              <div
                style={{
                  padding: 12,
                  borderRadius: 14,
                  background:
                    'linear-gradient(160deg, color-mix(in oklab, var(--primary) 18%, var(--surface)), var(--surface))',
                  border: '1px solid color-mix(in oklab, var(--primary) 22%, var(--border))',
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    style={{
                      width: 42, height: 42, borderRadius: 12,
                      background: 'linear-gradient(160deg, var(--surface-2), var(--bg-soft))',
                      border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22,
                    }}
                  >
                    🧙
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[14px] font-extrabold tracking-[-0.01em]">{user.displayName}</span>
                      <span
                        style={{
                          fontSize: 9.5,
                          padding: '1px 5px',
                          borderRadius: 5,
                          background: 'color-mix(in oklab, var(--c-xp) 18%, transparent)',
                          color: 'var(--c-xp)',
                          fontWeight: 800,
                          letterSpacing: '.06em',
                        }}
                      >
                        NV {user.level}
                      </span>
                    </div>
                    <div className="mt-px text-[11px]" style={{ color: 'var(--text-2)' }}>
                      Aventurero
                    </div>
                  </div>
                </div>
                <div>
                  <div
                    className="mb-1 flex justify-between text-[10px] tabular-nums"
                    style={{ color: 'var(--text-3)' }}
                  >
                    <span>XP</span>
                    <span>{user.xp.toLocaleString()}/{user.xpToNextLevel.toLocaleString()}</span>
                  </div>
                  <div
                    style={{
                      height: 5,
                      background: 'var(--ring-track)',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${xpPctSide}%`,
                        height: '100%',
                        background:
                          'linear-gradient(90deg, var(--c-xp), color-mix(in oklab, var(--c-xp) 60%, white))',
                        boxShadow: '0 0 8px color-mix(in oklab, var(--c-xp) 60%, transparent)',
                        transition: 'width 1s cubic-bezier(.22,1,.36,1)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header
          className="sticky top-0 z-10"
          style={{
            borderBottom: '1px solid var(--border-soft)',
            background: 'color-mix(in oklab, var(--bg) 80%, transparent)',
            backdropFilter: 'blur(18px) saturate(180%)',
            WebkitBackdropFilter: 'blur(18px) saturate(180%)',
          }}
        >
          <div className="flex items-center gap-3 px-4 py-3.5 md:gap-4 md:px-8 md:py-[14px]">
            <div className="md:hidden flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: 'var(--bg-panel-light)' }}>
              <LayoutDashboard size={18} />
            </div>

            <div className="min-w-0 flex-1">
              {user && (
                <>
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: 'var(--text-3)' }}>
                    <span>El Castillo</span>
                    <ChevronRight size={11} />
                    <span style={{ color: 'var(--text-2)' }}>Día a día</span>
                  </div>
                  <h1 className="m-0 text-[22px] font-extrabold tracking-[-0.025em] leading-tight" style={{ color: 'var(--text)' }}>
                    Bienvenido, {user.displayName.split(' ')[0]}
                  </h1>
                  <div className="mt-[2px] text-[13px]" style={{ color: 'var(--text-2)' }}>
                    Nivel {user.level} aventurero · {user.currentStreak} días de racha
                  </div>
                </>
              )}
            </div>

            {/* search */}
            <button
              className="hidden md:flex items-center gap-2"
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 'k', bubbles: true }))}
              title="Barra de comandos (Ctrl+K)"
              style={{
                height: 38, padding: '0 14px', minWidth: 280, maxWidth: 380,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, color: 'var(--text-3)',
              }}
            >
              <Search size={16} />
              <span className="flex-1 text-left text-[13px]" style={{ color: 'var(--text-3)' }}>Buscar misión, hábito, gasto…</span>
              <kbd
                style={{
                  fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                  fontSize: 10, padding: '2px 6px', borderRadius: 4,
                  background: 'var(--bg-soft)', border: '1px solid var(--border)', color: 'var(--text-3)',
                }}
              >
                ⌘K
              </kbd>
            </button>

            {user && (
              <>
                {/* gold pill */}
                <div
                  className="hidden md:flex items-center gap-1.5 tabular-nums"
                  style={{
                    height: 38, padding: '0 14px',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 10, color: 'var(--c-gold)', fontWeight: 700, fontSize: 13,
                  }}
                >
                  <Wallet size={15} />
                  {user.gold.toLocaleString('es-CO')}
                </div>

                <LiveClock />

                {/* mobile gold + search */}
                <div className="md:hidden flex items-center gap-2">
                  <GoldCounter gold={user.gold} />
                  <motion.button
                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                    onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 'k', bubbles: true }))}
                    whileTap={{ scale: 0.96 }}
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)' }}
                    title="Buscar"
                  >
                    <Search size={15} />
                  </motion.button>
                </div>

                {/* friends */}
                <motion.button
                  onClick={() => navigate('/guild')}
                  whileTap={{ scale: 0.96 }}
                  title="Añadir amigos"
                  className="hidden md:flex items-center justify-center"
                  style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    color: 'var(--text-2)',
                  }}
                >
                  <UserPlus size={16} />
                </motion.button>

                <NotificationBell />

                <motion.button
                  className="flex items-center justify-center"
                  onClick={toggleAudio}
                  whileTap={{ scale: 0.96 }}
                  title={audioEnabled ? 'Silenciar audio' : 'Activar audio'}
                  style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    color: 'var(--text-2)',
                  }}
                >
                  {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-red-400" />}
                </motion.button>

                {/* sabio CTA */}
                <motion.button
                  onClick={() => navigate('/wisdom')}
                  whileTap={{ scale: 0.97 }}
                  className="hidden lg:flex items-center gap-2"
                  style={{
                    height: 38, padding: '0 14px',
                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 700,
                    boxShadow: '0 6px 18px rgba(139,92,246,.35)',
                  }}
                >
                  <Sparkles size={15} />
                  El Sabio
                </motion.button>

                <motion.button
                  onClick={handleLogout}
                  whileTap={{ scale: 0.96 }}
                  className="hidden md:block text-[12px] font-semibold"
                  style={{
                    padding: '0 14px', height: 38, borderRadius: 10,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    color: 'var(--text-2)',
                  }}
                >
                  Salir
                </motion.button>

                {/* invisible xp sparkles trigger */}
                <span className="hidden"><XPSparkles trigger={xpSparkTrigger} /></span>
              </>
            )}
          </div>

          {/* mobile compact stat strip */}
          {user && (
            <div className="md:hidden grid grid-cols-3 gap-2 px-4 pb-3">
              <div>
                <div className="mb-1 flex justify-between text-[10px] tabular-nums" style={{ color: 'var(--text-2)' }}>
                  <span style={{ color: 'var(--c-hp)', fontWeight: 700 }}>HP</span>
                  <span>{user.hp}/{user.maxHp}</span>
                </div>
                <StatBarFill pct={hpPct} color="bg-accent-pink" pulse />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[10px] tabular-nums" style={{ color: 'var(--text-2)' }}>
                  <span style={{ color: 'var(--c-mp)', fontWeight: 700 }}>MP</span>
                  <span>{user.mp}/{user.maxMp}</span>
                </div>
                <StatBarFill pct={mpPct} color="bg-accent-cyan" wave />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[10px] tabular-nums" style={{ color: 'var(--text-2)' }}>
                  <span style={{ color: 'var(--c-xp)', fontWeight: 700 }}>XP</span>
                  <span>{user.xp}/{user.xpToNextLevel}</span>
                </div>
                <StatBarFill pct={xpPct} color="bg-accent-gold" />
              </div>
            </div>
          )}
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-6">
            {children}
          </div>
        </main>

        <nav className="md:hidden border-t border-[var(--border)] bg-panel-glass">
          <div className="flex items-center justify-around px-2 py-2">
            {NAV_ITEMS.slice(0, 5).map(({ to, icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => audio.play('blip')}
                className={({ isActive }) => [
                  'flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-2 py-2 transition-colors',
                  isActive
                    ? 'bg-[var(--bg-panel-light)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)]',
                ].join(' ')}
              >
                <div>{icon}</div>
                <span className="text-[11px] font-medium">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      <LevelUpOverlay />
      <FloatingXPLayer />
      <ScreenFlash />
      <AchievementUnlockedToast />
      <ToastContainer />
      <CommandPalette />
      <OfflineIndicator />
      <ScrollToTop />

      {/* FAB de acciones rápidas */}
      <QuickActionsFAB />

      {/* Focus Mode Fab */}
      <motion.button
        onClick={() => setShowFocus(true)}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-[4.5rem] md:bottom-8 md:right-24 z-40 w-10 h-10 rounded-full flex items-center justify-center shadow-md border border-[var(--border)] bg-[var(--bg-panel)]"
        style={{ color: 'var(--accent-cyan)' }}
        title="Modo Enfoque"
      >
        <Zap size={16} />
      </motion.button>

      <AP>
        {showFocus && <FocusMode onClose={() => setShowFocus(false)} />}
      </AP>
    </div>
  );
}
