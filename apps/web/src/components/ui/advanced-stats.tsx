import { useMemo } from 'react';
import {
  Activity,
  Dumbbell,
  HeartPulse,
  Swords,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ClippedAreaChart, type XpChartDatum } from './advanced-stats-utils/charts';
import { TimelineAnimation } from './advanced-stats-utils/timeline-animation';

export interface AdvancedStatsZone {
  id: string;
  name: string;
  score: number;
}

export interface AdvancedStatsTotals {
  xpEarned: number;
  questsCompleted: number;
  habitCompletions: number;
  workouts: number;
}

export interface AdvancedStatsData {
  /** Human-friendly label selected by the parent period control. */
  periodLabel: string;
  level?: number;
  currentXp?: number;
  xpToNextLevel?: number;
  xpHistory: XpChartDatum[];
  xpPeriod: number;
  xpAverage?: number;
  xpChange?: number;
  questsInPeriod: number;
  questsChange?: number;
  lifeScore?: number | null;
  lifeScoreTrend?: string;
  zones?: AdvancedStatsZone[];
  currentStreak?: number;
  bestStreak?: number;
  totals?: Partial<AdvancedStatsTotals>;
}

interface AdvancedStatsProps {
  data: AdvancedStatsData;
  loading?: boolean;
  className?: string;
}

const numberFormatter = new Intl.NumberFormat('es-CO');

function formatNumber(value: number) {
  return numberFormatter.format(Math.max(0, Math.round(value)));
}

function signedPercent(value?: number) {
  if (value === undefined || value === null) return null;
  return `${value > 0 ? '+' : ''}${value}%`;
}

function changeVariant(value?: number): 'success' | 'destructive' | 'outline' {
  if (!value) return 'outline';
  return value > 0 ? 'success' : 'destructive';
}

function changeIcon(value?: number) {
  if (!value) return null;
  const Icon = value > 0 ? TrendingUp : TrendingDown;
  return <Icon aria-hidden="true" className="h-3 w-3" />;
}

/**
 * An analytics overview designed around LifeQuest records rather than demo
 * business metrics. The parent owns fetching so period changes update every
 * value together and the component stays reusable in other views.
 */
export default function AdvancedStats({ data, loading = false, className }: AdvancedStatsProps) {
  const zones = useMemo(
    () => [...(data.zones ?? [])].sort((a, b) => b.score - a.score).slice(0, 3),
    [data.zones],
  );
  const score = data.lifeScore ?? null;
  const scoreValue = Math.max(0, Math.min(100, score ?? 0));
  const topZone = zones[0];
  const hasPeriodActivity = data.xpHistory.length > 0 || data.xpPeriod > 0 || data.questsInPeriod > 0;
  const historical = {
    xpEarned: data.totals?.xpEarned ?? data.xpPeriod,
    questsCompleted: data.totals?.questsCompleted ?? data.questsInPeriod,
    habitCompletions: data.totals?.habitCompletions ?? 0,
    workouts: data.totals?.workouts ?? 0,
  };

  const statCards = [
    {
      label: 'XP ganada total',
      value: `${formatNumber(historical.xpEarned)} XP`,
      detail: `${formatNumber(data.xpPeriod)} XP · ${data.periodLabel}`,
      change: signedPercent(data.xpChange),
      changeValue: data.xpChange,
      icon: Zap,
      accent: 'var(--accent-gold)',
    },
    {
      label: 'Misiones completadas',
      value: formatNumber(historical.questsCompleted),
      detail: `${formatNumber(data.questsInPeriod)} completadas · ${data.periodLabel}`,
      change: signedPercent(data.questsChange),
      changeValue: data.questsChange,
      icon: Swords,
      accent: 'var(--text-secondary)',
    },
    {
      label: 'Hábitos completados',
      value: formatNumber(historical.habitCompletions),
      detail: `Racha actual: ${formatNumber(data.currentStreak ?? 0)} días`,
      icon: HeartPulse,
      accent: 'var(--accent-green)',
    },
    {
      label: 'Entrenamientos',
      value: formatNumber(historical.workouts),
      detail: `Mejor racha: ${formatNumber(data.bestStreak ?? 0)} días`,
      icon: Dumbbell,
      accent: 'var(--text-secondary)',
    },
  ];

  const lifeTrendIsPositive = data.lifeScoreTrend?.trim().startsWith('+');
  const lifeTrendIsNegative = data.lifeScoreTrend?.trim().startsWith('-');

  return (
    <section aria-label="Resumen avanzado de estadísticas" className={cn('space-y-4', className)}>
      <div className="grid gap-4 lg:grid-cols-3">
        <TimelineAnimation animationNum={0} className="lg:col-span-2">
          <article className="relative h-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5 shadow-pixel sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  <Zap className="h-3.5 w-3.5 text-[var(--accent-gold)]" aria-hidden="true" />
                  Progreso registrado
                </div>
                <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
                  <h2 className="text-3xl font-bold tracking-tight tabular-nums text-[var(--text-primary)] sm:text-4xl">
                    {formatNumber(data.xpPeriod)} <span className="text-base font-semibold text-[var(--text-secondary)]">XP</span>
                  </h2>
                  <p className="pb-1 text-xs text-[var(--text-muted)]">{data.periodLabel}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {data.level !== undefined ? (
                  <Badge variant="outline" className="gap-1.5 px-2.5 py-1 text-[11px]">
                    <Trophy className="h-3 w-3 text-[var(--accent-gold)]" aria-hidden="true" />
                    Nivel {data.level}
                  </Badge>
                ) : null}
                {signedPercent(data.xpChange) !== null ? (
                  <Badge variant={changeVariant(data.xpChange)} className="px-2.5 py-1 text-[11px]">
                    {changeIcon(data.xpChange)}
                    {signedPercent(data.xpChange)} vs. periodo anterior
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="relative mt-5">
              <ClippedAreaChart data={data.xpHistory} className="min-h-[220px] sm:min-h-[245px]" />
              {!loading && !hasPeriodActivity ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center">
                  <p className="max-w-xs rounded-lg bg-[color-mix(in_oklab,var(--bg-panel)_90%,transparent)] px-3 py-2 text-xs text-[var(--text-muted)]">
                    Aún no hay actividad registrada en este periodo.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-[var(--border-soft)] pt-3 text-xs text-[var(--text-muted)]">
              <span>Promedio activo: <strong className="font-semibold tabular-nums text-[var(--text-secondary)]">{formatNumber(data.xpAverage ?? 0)} XP/día</strong></span>
              <span>{formatNumber(data.xpHistory.length)} {data.xpHistory.length === 1 ? 'día con actividad' : 'días con actividad'}</span>
              {data.currentXp !== undefined && data.xpToNextLevel !== undefined ? (
                <span>{formatNumber(data.currentXp)} / {formatNumber(data.xpToNextLevel)} XP para subir</span>
              ) : null}
            </div>
          </article>
        </TimelineAnimation>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <TimelineAnimation animationNum={1}>
            <article className="h-full rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5 shadow-pixel">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Life Score</p>
                  <h3 className="mt-1 text-sm font-semibold text-[var(--text-primary)]">Equilibrio actual</h3>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--accent-gold)]">
                  <Target className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>

              <div className="mt-5 flex items-end justify-between gap-4">
                <p className="text-3xl font-bold tracking-tight tabular-nums text-[var(--text-primary)]">
                  {score === null ? '—' : formatNumber(score)}<span className="text-base font-semibold text-[var(--text-muted)]">/100</span>
                </p>
                {data.lifeScoreTrend ? (
                  <Badge
                    variant={lifeTrendIsPositive ? 'success' : lifeTrendIsNegative ? 'destructive' : 'outline'}
                    className="max-w-[11rem] whitespace-normal px-2 py-1 text-right leading-4"
                  >
                    {lifeTrendIsPositive ? <TrendingUp className="h-3 w-3 shrink-0" aria-hidden="true" /> : null}
                    {lifeTrendIsNegative ? <TrendingDown className="h-3 w-3 shrink-0" aria-hidden="true" /> : null}
                    {data.lifeScoreTrend}
                  </Badge>
                ) : null}
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span>Objetivo</span>
                  <span className="font-medium tabular-nums text-[var(--text-secondary)]">100</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-muted)]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={scoreValue} aria-label="Life Score">
                  <div className="h-full rounded-full bg-[var(--accent-gold)] transition-[width] duration-500" style={{ width: `${scoreValue}%` }} />
                </div>
              </div>
            </article>
          </TimelineAnimation>

          <TimelineAnimation animationNum={2}>
            <article className="h-full rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-5 shadow-pixel">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Zonas de vida</p>
                  <h3 className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                    {topZone ? `${topZone.name} lidera tu avance` : 'Actividad por zona'}
                  </h3>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-secondary)]">
                  <Activity className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>

              {zones.length ? (
                <div className="mt-4 space-y-3">
                  {zones.map((zone, index) => {
                    const zoneScore = Math.max(0, Math.min(100, zone.score));
                    return (
                      <div key={zone.id}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                          <span className="min-w-0 truncate font-medium text-[var(--text-secondary)]">{zone.name}</span>
                          <span className="shrink-0 tabular-nums text-[var(--text-muted)]">{formatNumber(zoneScore)}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                          <div
                            className={index === 0 ? 'h-full rounded-full bg-[var(--accent-gold)]' : 'h-full rounded-full bg-[var(--text-secondary)]'}
                            style={{ width: `${zoneScore}%`, opacity: index === 0 ? 1 : 0.65 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-5 text-xs leading-5 text-[var(--text-muted)]">Completa actividades en tus zonas para ver cómo se equilibra tu progreso.</p>
              )}
            </article>
          </TimelineAnimation>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, detail, change, changeValue, icon: Icon, accent }, index) => (
          <TimelineAnimation key={label} animationNum={index + 3}>
            <article className="h-full rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] p-4 shadow-pixel">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]" style={{ color: accent }}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                {change ? (
                  <Badge variant={changeVariant(changeValue)} className="shrink-0">
                    {changeIcon(changeValue)}
                    {change}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-4 text-2xl font-bold tracking-tight tabular-nums text-[var(--text-primary)]">{value}</p>
              <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">{label}</p>
              <p className="mt-1.5 text-[11px] leading-4 text-[var(--text-muted)]">{detail}</p>
            </article>
          </TimelineAnimation>
        ))}
      </div>
    </section>
  );
}

export { AdvancedStats };
