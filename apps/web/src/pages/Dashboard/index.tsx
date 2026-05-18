import { useState, useEffect } from 'react';
import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { PixelPanel } from '../../components/ui/PixelPanel';
import { MiguelSprite } from '../../components/character/MiguelSprite';
import { GreetingHeader } from '../../components/dashboard/GreetingHeader';
import { TodayQuestsWidget } from '../../components/dashboard/TodayQuestsWidget';
import { QuickStatsWidget } from '../../components/dashboard/QuickStatsWidget';
import { ZoneCard } from '../../components/dashboard/ZoneCard';
import { StreakFlame } from '../../components/habits/StreakFlame';
import { MorningBriefing } from '../../components/dashboard/MorningBriefing';
import { fetchDashboard } from '../../services/user.service';
import { logHabit } from '../../services/habit.service';
import { fetchLifeScore } from '../../services/lifescore.service';
import type { LifeScore } from '../../services/lifescore.service';
import { xpProgressPercent } from '../../lib/xp';
import type { Quest } from '@lifequest/shared';
import { BossWidget } from '../../components/dashboard/BossWidget';
import { fetchUpcoming } from '../../services/agenda.service';
import type { AgendaEvent } from '../../services/agenda.service';
import { ClassSelectionModal } from '../../components/character/ClassSelectionModal';
import { DailyCheckinWidget } from '../../components/dashboard/DailyCheckinWidget';
import { SageScrollsWidget } from '../../components/dashboard/SageScrollsWidget';
import { SageDailyTip } from '../../components/dashboard/SageDailyTip';
import { FirstStepsWidget } from '../../components/dashboard/FirstStepsWidget';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { ProgressRings } from '../../components/ui/ProgressRings';

interface HabitSummary {
  id: string;
  title: string;
  icon: string;
  color: string;
  currentStreak: number;
  xpReward: number;
  todayStatus: string | null;
  todayCompleted: boolean | null;
}

interface RecentAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt: string;
}

interface DashboardData {
  todayQuests: Quest[];
  todayHabits: HabitSummary[];
  sleepAvg7d: number;
  monthBalance: number;
  recentWorkout: { date: string } | null;
  daysSinceJoin: number;
  recentAchievements: RecentAchievement[];
}

const ZONES: { icon: ReactNode; label: string; sublabel: string; to: string; color: string; badge: undefined }[] = [
  { icon: <span className="text-4xl leading-none block">🏋️‍♂️</span>, label: 'Gym',     sublabel: 'Coliseo',    to: '/gym',       color: 'border-[var(--accent-red)]',   badge: undefined },
  { icon: <span className="text-4xl leading-none block">💰</span>, label: 'Finanzas', sublabel: 'La Bóveda', to: '/finances',  color: 'border-[var(--accent-gold)]',  badge: undefined },
  { icon: <span className="text-4xl leading-none block">📚</span>, label: 'Aprend.', sublabel: 'Biblioteca', to: '/learning',  color: 'border-[var(--accent-blue)]',  badge: undefined },
  { icon: <span className="text-4xl leading-none block">🍲</span>, label: 'Comida',  sublabel: 'La Posada',  to: '/food',      color: 'border-[var(--accent-green)]', badge: undefined },
  { icon: <span className="text-4xl leading-none block">🌙</span>, label: 'Sueño',   sublabel: 'La Torre',   to: '/sleep',     color: 'border-[var(--accent-cyan)]',  badge: undefined },
  { icon: <span className="text-4xl leading-none block">💖</span>, label: 'Amor',    sublabel: 'El Jardín',  to: '/love',      color: 'border-[var(--accent-pink)]',  badge: undefined },
];

const CLASS_TITLES: Record<string, string> = {
  warrior: '⚔️ Guerrero',
  mage: '🧙 Mago',
  merchant: '💰 Mercader',
  paladin: '❤️ Paladín',
};

function LifeScoreWidget({ score }: { score: LifeScore }) {
  const quests   = Math.round(score.breakdown.quests   ?? 0);
  const habits   = Math.round(score.breakdown.habits   ?? 0);
  const finances = Math.round(score.breakdown.finances ?? 0);
  const rows = [
    { label: 'Misiones', value: quests,   color: '#ec4899' },
    { label: 'Hábitos',  value: habits,   color: '#3b82f6' },
    { label: 'Finanzas', value: finances, color: '#f59e0b' },
  ];
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        padding: 22,
        boxShadow: 'var(--shadow-rest)',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'color-mix(in oklab, var(--primary) 14%, transparent)',
            color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ⭐
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--primary)' }}>
            Life Score
          </div>
          <div className="text-[13px] mt-0.5 font-medium" style={{ color: 'var(--text)' }}>
            tu balance entre misiones, hábitos y finanzas
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <ProgressRings
          size={210}
          stroke={14}
          gap={4}
          centerLabel={score.total}
          centerSubLabel="/ 100"
          rings={[
            { progress: rows[0].value, color: rows[0].color },
            { progress: rows[1].value, color: rows[1].color },
            { progress: rows[2].value, color: rows[2].color },
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-center gap-2"
              style={{
                padding: '8px 10px',
                borderRadius: 10,
                background: 'var(--bg-soft)',
                border: '1px solid var(--border-soft)',
              }}
            >
              <span
                style={{
                  width: 8, height: 8, borderRadius: 999,
                  background: r.color, boxShadow: `0 0 6px ${r.color}80`,
                }}
              />
              <span className="flex-1 text-[12px] font-medium" style={{ color: 'var(--text-2)' }}>
                {r.label}
              </span>
              <span className="text-[13px] font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { addFloatingXP, flashScreen, showAchievementToast } = useUIStore();
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<HabitSummary[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<AgendaEvent[]>([]);
  const [showBriefing, setShowBriefing] = useState(false);
  const [lifeScore, setLifeScore] = useState<LifeScore | null>(null);
  const [showClassModal, setShowClassModal] = useState(false);
  useEffect(() => {
    fetchDashboard()
      .then((data) => {
        setDashData(data as DashboardData);
        setHabits((data as DashboardData).todayHabits ?? []);
      })
      .catch(() => setDashData(null))
      .finally(() => setLoading(false));
    fetchUpcoming().then(setUpcomingEvents).catch(() => null);
    fetchLifeScore().then(setLifeScore).catch(() => null);

    // Show briefing once per day
    const lastSeen = localStorage.getItem('briefing_seen_date');
    const today = new Date().toDateString();
    if (lastSeen !== today) {
      setTimeout(() => {
        setShowBriefing(true);
        localStorage.setItem('briefing_seen_date', today);
      }, 1200);
    }
  }, []);

  if (!user) return null;

  const avatarCfg = user.avatarConfig;
  const statBars = [
    { label: 'HP', value: user.hp,  max: user.maxHp,         color: 'bg-accent-pink' },
    { label: 'MP', value: user.mp,  max: user.maxMp,         color: 'bg-accent-cyan' },
    { label: 'XP', value: user.xp,  max: user.xpToNextLevel, color: 'bg-accent-gold' },
  ];
  const stats = [
    { key: 'STR', value: user.strength,     color: 'text-[var(--accent-red)]'  },
    { key: 'INT', value: user.intelligence, color: 'text-[var(--accent-blue)]' },
    { key: 'CHA', value: user.charisma,     color: 'text-[var(--accent-pink)]' },
  ];

  const lastWorkoutDaysAgo = dashData?.recentWorkout
    ? Math.floor((Date.now() - new Date(dashData.recentWorkout.date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const maxHabitStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0);
  const topHabit = habits.find((h) => h.currentStreak === maxHabitStreak && maxHabitStreak > 0);

  async function handleHabitLog(habitId: string) {
    try {
      const result = await logHabit(habitId, 'completed');
      addFloatingXP(result.rewards?.xpEarned ?? 0, window.innerWidth / 2, 200);
      flashScreen('#6bcf7f');
      for (const ach of result.achievementsUnlocked) showAchievementToast(ach);
      setHabits((prev) => prev.map((h) => h.id === habitId ? { ...h, todayStatus: 'completed', todayCompleted: true, currentStreak: result.currentStreak } : h));
    } catch { /* ignore */ }
  }

  const playerClass = (user as unknown as { playerClass?: string }).playerClass;
  const activeTheme = (user as unknown as { activeTheme?: string }).activeTheme ?? 'aurora';

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {showBriefing && <MorningBriefing onClose={() => setShowBriefing(false)} />}
        {showClassModal && <ClassSelectionModal onClose={() => setShowClassModal(false)} />}
      </AnimatePresence>

      <GreetingHeader displayName={user.displayName} currentStreak={user.currentStreak} createdAt={user.createdAt} gender={user.avatarConfig?.bodyType ?? 'male'} />

      {/* Primeros pasos — solo para usuarios nuevos */}
      <FirstStepsWidget
        questCount={dashData?.todayQuests?.length ?? 0}
        habitCount={habits.length}
        hasJournalEntry={false}
      />

      {/* Quick action shortcuts */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Nueva Quest', emoji: '📜', to: '/quests' },
          { label: 'Gasto', emoji: '💸', to: '/finances' },
          { label: 'Hábitos', emoji: '🔥', to: '/habits' },
          { label: 'Diario', emoji: '✍️', to: '/journal' },
        ].map(({ label, emoji, to }) => (
          <motion.button
            key={to}
            whileTap={{ scale: 0.93 }}
            onClick={() => navigate(to)}
            className="flex flex-col items-center gap-1 py-2 border border-[var(--border)] rounded-xl bg-[var(--bg-panel)] hover:border-[var(--accent-gold)] hover:bg-[var(--bg-panel-light)] transition-all"
          >
            <span className="text-xl">{emoji}</span>
            <span className="text-[10px] text-[var(--text-secondary)] font-medium leading-tight text-center px-1">{label}</span>
          </motion.button>
        ))}
      </div>

      {/* Class & briefing shortcuts */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {playerClass ? (
            <span className="text-xs font-semibold text-[var(--accent-gold)] bg-[var(--bg-panel-light)] border border-[var(--border)] px-2 py-1 rounded">
              {CLASS_TITLES[playerClass] ?? playerClass}
            </span>
          ) : user.level >= 10 ? (
            <button onClick={() => setShowClassModal(true)} className="text-xs font-semibold text-[var(--accent-gold)] animate-pulse">
              ✨ ¡Elige tu Clase! (Nivel 10)
            </button>
          ) : null}
        </div>
        <button
          onClick={() => setShowBriefing(true)}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-colors"
        >
          🧙‍♂️ Briefing del día
        </button>
      </div>

      <BossWidget />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ficha del héroe */}
        <PixelPanel animate className="p-4 md:col-span-1">
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-[var(--bg-panel-light)] flex items-center justify-center">
              <MiguelSprite size={80} bodyType={avatarCfg.bodyType} hairStyle={avatarCfg.hairStyle} hairColor={avatarCfg.hairColor} skinColor={avatarCfg.skinColor} shirtColor={avatarCfg.shirtColor} pantsColor={avatarCfg.pants} accessory={avatarCfg.accessory} expression={avatarCfg.expression} animate="idle" />
            </div>

            <div className="text-center">
              <p className="font-semibold text-sm text-[var(--text-primary)]">{user.displayName}</p>
              <div className="bg-[var(--accent-gold)] text-white text-xs font-bold px-3 py-1 rounded-full mt-1 inline-block">
                NIVEL {user.level}
              </div>
            </div>

            <div className="w-full space-y-2">
              {statBars.map(({ label, value, max, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-0.5">
                    <span className="text-[var(--text-secondary)]">{label}</span>
                    <span className="text-[var(--text-primary)]">{value}/{max}</span>
                  </div>
                  <div className="stat-bar">
                    <motion.div className={`stat-bar-fill ${color}`} initial={{ width: 0 }} animate={{ width: `${xpProgressPercent(value, max)}%` }} transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-1">
              {stats.map(({ key, value, color }) => (
                <div key={key} className="text-center">
                  <p className={`text-xs font-bold text-[var(--text-secondary)]`}>{key}</p>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-[var(--bg-panel-light)] border border-[var(--border)] rounded-lg px-3 py-1.5">
              <span className="text-base font-semibold text-[var(--accent-gold)]">💰 {user.gold.toLocaleString()}</span>
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide ml-1">GOLD</span>
            </div>

            {user.currentStreak > 0 && (
              <motion.div className="flex items-center gap-1 text-[var(--accent-red)]" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <span>🔥</span>
                <span className="text-sm">{user.currentStreak} días de racha</span>
              </motion.div>
            )}
          </div>
        </PixelPanel>

        {/* Columna derecha */}
        <div className="md:col-span-2 space-y-4">
          {/* Sugerencia del Sabio */}
          <SageDailyTip />

          {/* Sage Scrolls */}
          <SageScrollsWidget />

          {/* Daily Check-in */}
          <DailyCheckinWidget />

          {/* Misiones del día */}
          {loading ? (
            <SkeletonCard lines={4} />
          ) : (
            <TodayQuestsWidget quests={dashData?.todayQuests ?? []} />
          )}

          {/* Hábitos del día */}
          {habits.length > 0 && (
            <PixelPanel className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">🔥 HÁBITOS DE HOY</h3>
                <button onClick={() => navigate('/habits')} className="text-xs font-medium text-[var(--accent-gold)] hover:text-[var(--text-primary)]">
                  VER TODOS →
                </button>
              </div>
              <div className="space-y-2">
                {habits.slice(0, 5).map((habit) => (
                  <div key={habit.id} className="flex items-center gap-2 py-1">
                    <span className="text-lg">{habit.icon}</span>
                    <span className="text-sm text-[var(--text-primary)] flex-1 truncate">{habit.title}</span>
                    <StreakFlame streak={habit.currentStreak} size="sm" />
                    <motion.button
                      className={`w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-sm font-medium transition-colors ${
                        habit.todayStatus === 'completed'
                          ? 'bg-[var(--accent-green)] border-[var(--accent-green)] text-white'
                          : 'bg-[var(--bg-deep)] hover:border-[var(--accent-green)]'
                      }`}
                      onClick={() => { if (!habit.todayCompleted) handleHabitLog(habit.id); }}
                      whileTap={{ scale: 0.9 }}
                      disabled={habit.todayStatus === 'completed'}
                    >
                      {habit.todayStatus === 'completed' ? '✓' : '?'}
                    </motion.button>
                  </div>
                ))}
              </div>
            </PixelPanel>
          )}

          {/* Logro más largo / reciente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topHabit && (
              <PixelPanel className="p-3 cursor-pointer hover:border-[var(--accent-gold)] transition-colors" onClick={() => navigate('/habits')}>
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">🔥 MEJOR RACHA ACTUAL</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{topHabit.icon}</span>
                  <div>
                    <p className="text-sm text-[var(--text-primary)]">{topHabit.title}</p>
                    <p className="text-sm text-[var(--accent-gold)]">{topHabit.currentStreak} días seguidos</p>
                  </div>
                </div>
              </PixelPanel>
            )}

            {dashData?.recentAchievements?.[0] && (
              <PixelPanel className="p-3 cursor-pointer hover:border-[var(--accent-gold)] transition-colors" onClick={() => navigate('/achievements')}>
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">🏆 LOGRO RECIENTE</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{dashData.recentAchievements[0].icon}</span>
                  <div>
                    <p className="text-base font-semibold text-[var(--accent-gold)]">{dashData.recentAchievements[0].title}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{dashData.recentAchievements[0].description}</p>
                  </div>
                </div>
              </PixelPanel>
            )}
          </div>

          {/* Life Score */}
          {lifeScore && <LifeScoreWidget score={lifeScore} />}

          {/* Resumen rápido */}
          <QuickStatsWidget sleepAvg7d={dashData?.sleepAvg7d ?? 0} monthBalance={dashData?.monthBalance ?? 0} lastWorkoutDaysAgo={lastWorkoutDaysAgo} />

          {/* Próximos eventos */}
          {upcomingEvents.length > 0 && (
            <PixelPanel className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">📅 PRÓXIMOS EVENTOS</h3>
                <button onClick={() => navigate('/agenda')} className="text-xs font-medium text-[var(--accent-gold)] hover:text-[var(--text-primary)]">
                  VER AGENDA →
                </button>
              </div>
              <div className="space-y-2">
                {upcomingEvents.slice(0, 3).map((ev) => {
                  const when = new Date(ev.startDate);
                  const isToday = when.toDateString() === new Date().toDateString();
                  return (
                    <div key={ev.id} className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)] truncate">{ev.title}</p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {isToday ? 'Hoy' : when.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
                          {!ev.isAllDay ? ` · ${when.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}` : ''}
                        </p>
                      </div>
                      {isToday && (
                        <span className="text-xs font-semibold text-[var(--accent-red)] flex-shrink-0">HOY</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </PixelPanel>
          )}

          {/* Grid de zonas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ZONES.map((zone) => (
              <ZoneCard key={zone.label} {...zone} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
