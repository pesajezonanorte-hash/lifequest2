import api from '../lib/api';

export interface LifeScore { total: number; breakdown: Record<string, number>; }
export interface MorningBriefing { briefing: string; cached: boolean; }
export interface YearInReview { year: number; totalXp: number; totalGold: number; totalWorkouts: number; totalQuestsCompleted: number; totalJournalEntries: number; totalBooksCompleted: number; avgSleepHours: number; avgMood: number; bestMonth: { month: string; xp: number } | null; xpByMonth: Record<string, number>; }

export interface DynamicZoneScore { id: string; name: string; icon: string; color: string; score: number; }
export interface DynamicLifeScoreData { totalScore: number; zones: DynamicZoneScore[]; trend: number; }

export const fetchLifeScore = () => api.get<LifeScore>('/life/score').then(r => r.data);
export const fetchDynamicLifeScore = () => api.get<DynamicLifeScoreData>('/life/dynamic').then(r => r.data);
export const fetchCorrelations = () => api.get<string[]>('/life/correlations').then(r => r.data);
export const fetchMorningBriefing = () => api.get<MorningBriefing>('/life/morning-briefing').then(r => r.data);
export const fetchYearInReview = (year?: number) => api.get<YearInReview>(`/life/year-review${year ? `?year=${year}` : ''}`).then(r => r.data);
