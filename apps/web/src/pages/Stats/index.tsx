import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { BarChart2, TrendingUp, Flame, DollarSign, Zap, Share2, Download } from 'lucide-react';
import {
  getStatsSummary, getXpHistory, getActivityRadar,
  getFinanceTrend, getHabitHeatmap, getSleepScatter,
} from '../../services/stats.service';
import { fetchLifeScore, fetchDynamicLifeScore } from '../../services/lifescore.service';
import type { LifeScore, DynamicLifeScoreData } from '../../services/lifescore.service';
import { getCheckinHistory } from '../../services/checkin.service';
import type { DailyCheckin } from '../../services/checkin.service';
import { useAuthStore } from '../../store/authStore';
import { DynamicLifeScore } from '../../components/ui/DynamicLifeScore';

type Period = 'week' | 'month' | '3months' | 'year';
const PERIODS: { id: Period; label: string }[] = [
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: '3months', label: '3 Meses' },
  { id: 'year', label: 'Año' },
];

// ─── Habit Heatmap ─────────────────────────────────────────────────────────

function HeatmapCell({ count }: { count: number }) {
  const opacity = count === 0 ? 0.07 : count < 3 ? 0.3 : count < 6 ? 0.6 : 1;
  return (
    <div
      className="w-3 h-3 rounded-sm"
      style={{ background: `rgba(251, 191, 36, ${opacity})` }}
      title={`${count} actividades`}
    />
  );
}

function ActivityHeatmap({ data }: { data: { date: string; count: number }[] }) {
  const weeks: { date: string; count: number }[][] = [];
  const map = new Map(data.map((d) => [d.date.split('T')[0], d.count]));
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 363);
  start.setDate(start.getDate() - start.getDay()); // back to Sunday

  const cur = new Date(start);
  while (cur <= today) {
    const week: { date: string; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const iso = cur.toISOString().split('T')[0];
      week.push({ date: iso, count: map.get(iso) ?? 0 });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px] min-w-max">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <HeatmapCell key={day.date} count={day.count} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mood Heatmap ──────────────────────────────────────────────────────────

const MOOD_COLORS = ['', '#ef4444', '#fb923c', '#fbbf24', '#86efac', '#34d399'];

function MoodHeatmap({ checkins }: { checkins: DailyCheckin[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const map = new Map(checkins.map((c) => {
    const d = new Date(c.date);
    return [d.getDate(), c.mood];
  }));

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1 text-[10px] text-[var(--text-muted)] text-center">
        {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => (
          <div
            key={i}
            className="aspect-square rounded-md flex items-center justify-center text-[10px] font-medium"
            style={{
              background: d ? (map.has(d) ? MOOD_COLORS[map.get(d)!] + '88' : 'rgba(255,255,255,0.05)') : 'transparent',
              border: d && new Date().getDate() === d ? '1px solid var(--accent-cyan)' : 'none',
            }}
          >
            {d && <span className="opacity-70">{d}</span>}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <span className="text-[10px] text-[var(--text-muted)]">Estado ánimo:</span>
        {MOOD_COLORS.slice(1).map((c, i) => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c + '88' }} title={`${i + 1}/5`} />
        ))}
      </div>
    </div>
  );
}

// ─── Weekly Rings ──────────────────────────────────────────────────────────

function WeekRing({ pct, day, isToday }: { pct: number; day: string; isToday: boolean }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={44} height={44}>
        <circle cx={22} cy={22} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={5} />
        <motion.circle
          cx={22} cy={22} r={r}
          fill="none"
          stroke={isToday ? 'var(--accent-gold)' : 'var(--accent-cyan)'}
          strokeWidth={5} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, delay: 0.1 }}
          transform="rotate(-90 22 22)"
        />
        <text x={22} y={27} textAnchor="middle" fill="var(--text-primary)" style={{ fontSize: 11, fontWeight: 700 }}>
          {Math.round(pct)}
        </text>
      </svg>
      <span className="text-[10px]" style={{ color: isToday ? 'var(--accent-gold)' : 'var(--text-muted)' }}>{day}</span>
    </div>
  );
}

// ─── Share Mode ────────────────────────────────────────────────────────────

function ShareButton({ user, score }: { user: any; score: LifeScore | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function generate() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 600;
    canvas.height = 380;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 600, 380);
    grad.addColorStop(0, '#0d0a1a');
    grad.addColorStop(1, '#110e2b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 380);

    // Border
    ctx.strokeStyle = '#ffd23f44';
    ctx.lineWidth = 2;
    ctx.roundRect(4, 4, 592, 372, 16);
    ctx.stroke();

    // Title
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 28px system-ui';
    ctx.fillText('LifeQuest', 32, 56);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '16px system-ui';
    ctx.fillText(user?.displayName ?? 'Héroe', 32, 84);

    // Level badge
    ctx.fillStyle = '#ffd23f22';
    ctx.roundRect(32, 104, 110, 36, 8);
    ctx.fill();
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 18px system-ui';
    ctx.fillText(`Nivel ${user?.level ?? 1}`, 50, 128);

    // Life Score
    if (score) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 72px system-ui';
      ctx.fillText(score.total.toString(), 400, 160);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '18px system-ui';
      ctx.fillText('Life Score', 400, 188);
    }

    // Stats
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '15px system-ui';
    ctx.fillText(`Racha: ${user?.currentStreak ?? 0} días`, 32, 200);
    ctx.fillText(`XP: ${(user?.xp ?? 0).toLocaleString()}`, 32, 228);
    ctx.fillText(`STR ${user?.strength ?? 1} | INT ${user?.intelligence ?? 1} | CHA ${user?.charisma ?? 1}`, 32, 256);

    // Date
    ctx.fillStyle = '#6b7280';
    ctx.font = '13px system-ui';
    ctx.fillText(new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }), 32, 340);
    ctx.fillText('lifequest.app', 450, 340);

    // Download
    const link = document.createElement('a');
    link.download = `lifequest-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <motion.button
        onClick={generate}
        whileTap={{ scale: 0.96 }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-gold)] transition-all"
      >
        <Download size={14} /> Compartir Progreso
      </motion.button>
    </>
  );
}

// ─── Main Stats Page ───────────────────────────────────────────────────────

const tooltipStyle = {
  contentStyle: { background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 },
  labelStyle: { color: 'var(--text-secondary)' },
};

export default function StatsPage() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<Period>('month');
  const [lifeScore, setLifeScore] = useState<LifeScore | null>(null);
  const [dynamicScore, setDynamicScore] = useState<DynamicLifeScoreData | null>(null);
  const [xpHistory, setXpHistory] = useState<{ date: string; xp: number }[]>([]);
  const [radarData, setRadarData] = useState<{ subject: string; current: number }[]>([]);
  const [heatmap, setHeatmap] = useState<{ date: string; count: number }[]>([]);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const [score, dynScore, xp, radar, hm, chk, sum] = await Promise.allSettled([
        fetchLifeScore(),
        fetchDynamicLifeScore(),
        getXpHistory(p),
        getActivityRadar(),
        getHabitHeatmap(),
        getCheckinHistory(30),
        getStatsSummary(p),
      ]);
      if (score.status === 'fulfilled') setLifeScore(score.value);
      if (dynScore.status === 'fulfilled') setDynamicScore(dynScore.value);
      if (xp.status === 'fulfilled') setXpHistory((xp.value as any).data ?? xp.value ?? []);
      if (radar.status === 'fulfilled') {
        const raw = (radar.value as any);
        setRadarData(Array.isArray(raw) ? raw : raw.data ?? []);
      }
      if (hm.status === 'fulfilled') setHeatmap((hm.value as any).data ?? hm.value ?? []);
      if (chk.status === 'fulfilled') setCheckins(chk.value);
      if (sum.status === 'fulfilled') setSummary(sum.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(period); }, [period, load]);

  // Weekly rings from XP history
  const weeklyRings = (() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const today = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const entry = xpHistory.find((e) => e.date.startsWith(iso));
      const maxXp = 200;
      result.push({
        day: days[d.getDay()],
        pct: Math.min(((entry?.xp ?? 0) / maxXp) * 100, 100),
        isToday: i === 0,
      });
    }
    return result;
  })();

  const displayScore = dynamicScore?.totalScore ?? lifeScore?.total ?? null;
  const insightCards = [
    displayScore !== null && {
      label: 'Life Score',
      value: `${displayScore}/100`,
      color: displayScore >= 70 ? 'var(--accent-green)' : 'var(--accent-gold)',
      icon: '⭐',
    },
    user && user.longestStreak > 0 && {
      label: 'Racha récord',
      value: `${user.longestStreak} días`,
      color: 'var(--accent-pink)',
      icon: '🔥',
    },
    summary?.quests && {
      label: 'Misiones completadas',
      value: summary.quests.completed,
      color: 'var(--accent-cyan)',
      icon: '⚔️',
    },
    checkins.length > 0 && {
      label: 'Energía promedio',
      value: `${(checkins.reduce((s, c) => s + c.energy, 0) / checkins.length).toFixed(1)}/10`,
      color: 'var(--accent-gold)',
      icon: '⚡',
    },
  ].filter(Boolean) as { label: string; value: string | number; color: string; icon: string }[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BarChart2 className="text-[var(--accent-gold)]" size={24} />
            Estadísticas
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Tu progreso, hermoso y en detalle</p>
        </div>
        <div className="flex items-center gap-3">
          <ShareButton user={user} score={lifeScore} />
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${period === p.id ? 'bg-[var(--accent-gold)] text-[var(--bg-deep)]' : 'border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Life Score Rings Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-6"
        style={{ borderColor: 'var(--accent-gold)44' }}
      >
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
          <span>⭐</span> Life Score Dinámico
          {dynamicScore && dynamicScore.trend !== 0 && (
            <span className={`text-xs ml-auto font-medium ${dynamicScore.trend > 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-pink)]'}`}>
              {dynamicScore.trend > 0 ? '▲' : '▼'} {Math.abs(dynamicScore.trend)} pts vs semana pasada
            </span>
          )}
        </h2>
        {dynamicScore ? (
          <DynamicLifeScore
            totalScore={dynamicScore.totalScore}
            zones={dynamicScore.zones}
            size={220}
            stroke={13}
            gap={3}
          />
        ) : lifeScore ? (
          <div className="flex flex-col items-center py-4">
            <span className="text-5xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{lifeScore.total}</span>
            <span className="text-xs uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>Life Score</span>
          </div>
        ) : (
          <p className="text-center text-sm py-4" style={{ color: 'var(--text-muted)' }}>Cargando...</p>
        )}
      </motion.div>

      {/* Insight Cards */}
      {insightCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {insightCards.map((card) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-4"
              style={{ borderColor: card.color + '44' }}
            >
              <div className="text-2xl mb-2">{card.icon}</div>
              <p className="text-xl font-bold" style={{ color: card.color }}>{card.value}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{card.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Weekly Rings */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
          <Zap size={14} className="text-[var(--accent-gold)]" />
          Actividad de la semana
        </h3>
        <div className="flex justify-between px-4">
          {weeklyRings.map((r) => (
            <WeekRing key={r.day} pct={r.pct} day={r.day} isToday={r.isToday} />
          ))}
        </div>
      </div>

      {/* XP Trend */}
      {xpHistory.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-[var(--accent-cyan)]" />
            Tendencia de XP
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={xpHistory.slice(-30)}>
              <defs>
                <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [`${v} XP`, 'XP']} />
              <Area type="monotone" dataKey="xp" stroke="var(--accent-cyan)" fill="url(#xpGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Radar de vida */}
      {radarData.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
            <BarChart2 size={14} className="text-[var(--accent-pink)]" />
            Radar de Vida
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={90}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Actual" dataKey="current" stroke="var(--accent-gold)" fill="var(--accent-gold)" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Activity Heatmap */}
      {heatmap.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
            <Flame size={14} className="text-[var(--accent-gold)]" />
            Actividad del año
          </h3>
          <ActivityHeatmap data={heatmap} />
        </div>
      )}

      {/* Mood Heatmap */}
      {checkins.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
            <span className="text-sm">😊</span>
            Estado emocional del mes
          </h3>
          <MoodHeatmap checkins={checkins} />
        </div>
      )}
    </div>
  );
}
