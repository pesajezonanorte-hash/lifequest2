import { useId, useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';

export interface XpChartDatum {
  date: string;
  xp: number;
}

interface ClippedAreaChartProps {
  data: XpChartDatum[];
  className?: string;
}

const chartConfig = {
  xp: {
    label: 'XP ganada',
    color: 'var(--accent-gold)',
  },
} satisfies ChartConfig;

function formatDate(value: string) {
  const safeDate = new Date(value.includes('T') ? value : `${value}T12:00:00`);
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(safeDate);
}

function XpTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] px-3 py-2 shadow-pixel">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
        {label ? formatDate(label) : 'Actividad'}
      </p>
      <p className="mt-1 text-sm font-bold tabular-nums text-[var(--text-primary)]">
        {Number(payload[0]?.value ?? 0).toLocaleString('es-CO')} XP
      </p>
    </div>
  );
}

/** Area chart for real XP events. Empty periods intentionally remain empty. */
export function ClippedAreaChart({ data, className }: ClippedAreaChartProps) {
  const gradientId = useId().replace(/:/g, '');
  const chartData = useMemo(
    () => (data.length ? data : [{ date: new Date().toISOString().slice(0, 10), xp: 0 }]),
    [data],
  );

  return (
    <ChartContainer config={chartConfig} className={className}>
      <AreaChart data={chartData} margin={{ top: 10, right: 6, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-gold)" stopOpacity={0.32} />
            <stop offset="100%" stopColor="var(--accent-gold)" stopOpacity={0.015} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          minTickGap={38}
          tickMargin={8}
          tickFormatter={formatDate}
        />
        <YAxis hide domain={[0, 'dataMax + 10']} />
        <Tooltip content={<XpTooltip />} cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '3 4' }} />
        <Area
          type="monotone"
          dataKey="xp"
          name="XP ganada"
          stroke="var(--accent-gold)"
          strokeWidth={2.25}
          fill={`url(#${gradientId})`}
          activeDot={{ r: 4, fill: 'var(--bg-panel)', stroke: 'var(--accent-gold)', strokeWidth: 2 }}
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
