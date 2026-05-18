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
  Volume2, VolumeX, UserPlus, Zap, Search,
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
}

const NAV_ITEMS: NavItem[] = [
  { to: '/',            icon: <LayoutDashboard size={18} />,   label: 'Inicio',    hint: 'El Castillo' },
  { to: '/quests',      icon: <Swords size={18} />,            label: 'Misiones',  hint: 'Registro' },
  { to: '/habits',      icon: <Flame size={18} />,             label: 'Hábitos',   hint: 'Rutina' },
  { to: '/history',     icon: <BarChart3 size={18} />,         label: 'Historial', hint: 'Actividad' },
  { to: '/stats',       icon: <TrendingUp size={18} />,        label: 'Stats',     hint: 'Personaje' },
  { to: '/gym',         icon: <Dumbbell size={18} />,          label: 'Gym',       hint: 'El Coliseo' },
  { to: '/food',        icon: <UtensilsCrossed size={18} />,   label: 'Comida',    hint: 'La Posada' },
  { to: '/sleep',       icon: <Moon size={18} />,              label: 'Sueño',     hint: 'La Torre' },
  { to: '/finances',    icon: <Wallet size={18} />,            label: 'Finanzas',  hint: 'La Bóveda' },
  { to: '/learning',    icon: <BookOpen size={18} />,          label: 'Aprendiz.', hint: 'Biblioteca' },
  { to: '/love',        icon: <Heart size={18} />,             label: 'Amor',      hint: 'Jardín' },
  { to: '/journal',     icon: <NotebookPen size={18} />,       label: 'Diario',    hint: 'Notas' },
  { to: '/shop',        icon: <ShoppingBag size={18} />,       label: 'Tienda',    hint: 'Inventario' },
  { to: '/leaderboard', icon: <Globe size={18} />,             label: 'Mundo',     hint: 'Ranking' },
  { to: '/challenges',  icon: <Crosshair size={18} />,         label: 'Retos',     hint: 'Jefes' },
  { to: '/guild',       icon: <Users size={18} />,             label: 'Gremio',    hint: 'Club social' },
  { to: '/season',      icon: <Skull size={18} />,             label: 'Campaña',   hint: 'Historia' },
  { to: '/agenda',      icon: <CalendarDays size={18} />,      label: 'Agenda',    hint: 'Calendario' },
  { to: '/goals',       icon: <Target size={18} />,            label: 'Metas',     hint: 'Maestras' },
  { to: '/rituals',     icon: <Sun size={18} />,               label: 'Rituales',  hint: 'Rutinas' },
  { to: '/glow-up',     icon: <Sparkles size={18} />,          label: 'El Espejo', hint: 'Transformación' },
  { to: '/wisdom',      icon: <BookOpen size={18} />,          label: 'Sabiduría', hint: 'Biblioteca' },
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

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-deep)] text-[var(--text-primary)]">
      <aside className="hidden md:flex w-[220px] flex-shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-panel)]">
        <div className="border-b border-[var(--border)] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--bg-panel-light)]">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <p className="text-[15px] font-semibold tracking-[-0.01em]">LifeQuest</p>
              <p className="text-xs text-[var(--text-secondary)]">Modern RPG OS</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {NAV_ITEMS.map(({ to, icon, label, hint }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => audio.play('blip')}
                className={({ isActive }) => [
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all',
                  isActive
                    ? 'bg-[var(--bg-panel-light)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-panel-light)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                {({ isActive }) => (
                  <>
                    <div className={isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'}>
                      {icon}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{label}</p>
                      <p className="truncate text-[11px] text-[var(--text-muted)]">{hint}</p>
                    </div>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="border-t border-[var(--border)] px-3 py-3">
          {[
            { to: '/character', icon: <User size={18} />, label: 'Personaje', hint: 'Hoja viva' },
            { to: '/achievements', icon: <Trophy size={18} />, label: 'Logros', hint: 'Tus victorias' },
            { to: '/settings', icon: <Settings size={18} />, label: 'Ajustes', hint: 'Preferencias' },
            { to: '/about', icon: <span className="text-[14px]">🏆</span>, label: 'Acerca de', hint: 'v10.0.0' },
          ].map(({ to, icon, label, hint }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => audio.play('blip')}
              className={({ isActive }) => [
                'group mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all',
                isActive
                  ? 'bg-[var(--bg-panel-light)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-panel-light)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              <div className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">{icon}</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{label}</p>
                <p className="truncate text-[11px] text-[var(--text-muted)]">{hint}</p>
              </div>
            </NavLink>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-[var(--border)] bg-panel-glass">
          <div className="flex items-center gap-3 px-4 py-3 md:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="md:hidden flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-panel-light)]">
                <LayoutDashboard size={18} />
              </div>

              {user && (
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{user.displayName}</p>
                      <p className="text-xs text-[var(--text-secondary)]">Nivel {user.level} aventurero</p>
                    </div>
                    <div className="hidden lg:flex items-center gap-2 rounded-full bg-[var(--bg-panel-light)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                      <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent-green)]" />
                      Conectado
                    </div>
                  </div>

                  <div className="mt-2 hidden max-w-3xl grid-cols-3 gap-3 lg:grid">
                    <div>
                      <div className="mb-1 flex justify-between text-[11px] text-[var(--text-secondary)]">
                        <span className="font-semibold text-[var(--accent-pink)]">HP</span>
                        <span>{user.hp}/{user.maxHp}</span>
                      </div>
                      <StatBarFill pct={hpPct} color="bg-accent-pink" pulse />
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-[11px] text-[var(--text-secondary)]">
                        <span className="font-semibold text-[var(--accent-cyan)]">MP</span>
                        <span>{user.mp}/{user.maxMp}</span>
                      </div>
                      <StatBarFill pct={mpPct} color="bg-accent-cyan" wave />
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-[11px] text-[var(--text-secondary)]">
                        <span className="font-semibold text-[var(--accent-gold)]">XP</span>
                        <span>{user.xp}/{user.xpToNextLevel}</span>
                      </div>
                      <div className="relative">
                        <StatBarFill pct={xpPct} color="bg-accent-gold" />
                        <XPSparkles trigger={xpSparkTrigger} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {user && (
              <div className="flex items-center gap-2">
                <LiveClock />
                <button
                  className="hidden md:flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--accent-gold)] transition-colors"
                  onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 'k', bubbles: true }))}
                  title="Barra de comandos (Ctrl+K)"
                >
                  <span>⌕ Buscar</span>
                  <kbd className="bg-[var(--bg-deep)] px-1.5 py-0.5 rounded text-[10px] border border-[var(--border)]">⌃K</kbd>
                </button>
                <GoldCounter gold={user.gold} />
                {/* Add Friends Button */}
                <motion.button
                  onClick={() => navigate('/guild')}
                  className="flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-gold)] transition-colors"
                  whileTap={{ scale: 0.96 }}
                  title="Añadir amigos"
                >
                  <UserPlus size={16} />
                </motion.button>

                {/* Search — mobile only */}
                <motion.button
                  className="md:hidden flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 'k', bubbles: true }))}
                  whileTap={{ scale: 0.96 }}
                  title="Buscar (Ctrl+K)"
                >
                  <Search size={15} />
                </motion.button>

                {/* Notification Bell */}
                <NotificationBell />

                {/* Audio Toggle */}
                <motion.button
                  className="flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  onClick={toggleAudio}
                  whileTap={{ scale: 0.96 }}
                  title={audioEnabled ? 'Silenciar audio' : 'Activar audio'}
                >
                  {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-red-400" />}
                </motion.button>

                <motion.button
                  onClick={handleLogout}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  whileTap={{ scale: 0.96 }}
                >
                  Salir
                </motion.button>
              </div>
            )}
          </div>
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
