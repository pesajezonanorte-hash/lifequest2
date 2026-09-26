import api from '../lib/api';

const p = (period: string) => ({ params: { period } });

export interface StatsSummary {
  xp: { value: number; change: number };
  quests: { completed: number; change: number; total: number };
  currentStreak: number;
  bestStreak: number;
  finance: { income: number; expenses: number; balance: number };
  totals: {
    xpEarned: number;
    questsCompleted: number;
    habitCompletions: number;
    workouts: number;
  };
}

export interface XpHistoryPoint {
  date: string;
  xp: number;
}

export interface XpHistoryResponse {
  data: XpHistoryPoint[];
  avg: number;
}

export interface ActivityRadarPoint {
  subject: string;
  value: number;
}

export interface ActivityRadarResponse {
  current: ActivityRadarPoint[];
  previous: ActivityRadarPoint[];
}

export interface HeatmapPoint {
  date: string;
  count: number;
}

export const getStatsSummary = (period = 'month') =>
  api.get<StatsSummary>('/stats/summary', p(period)).then(({ data }) => data);

export const getXpHistory = (period = 'month') =>
  api.get<XpHistoryResponse>('/stats/xp-history', p(period)).then(({ data }) => data);

export const getActivityRadar = () =>
  api.get<ActivityRadarResponse>('/stats/radar').then(({ data }) => data);

export const getFinanceTrend = (): Promise<unknown[]> =>
  api.get('/stats/finance-trend').then(({ data }) => data);

export const getHabitHeatmap = () =>
  api.get<HeatmapPoint[]>('/stats/heatmap').then(({ data }) => data);

export const getSleepScatter = (period = 'month'): Promise<unknown[]> =>
  api.get('/stats/sleep', p(period)).then(({ data }) => data);

export const getGymProgression = (period = 'month'): Promise<unknown[]> =>
  api.get('/stats/gym', p(period)).then(({ data }) => data);

export const getPredictions = (): Promise<unknown> =>
  api.get('/stats/predictions').then(({ data }) => data);
