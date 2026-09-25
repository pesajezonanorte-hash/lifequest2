import { prisma } from '../lib/prisma';
import { awardXpAndGold } from './xp.service';

export interface CheckinRewards {
  xpEarned: number;
  goldEarned: number;
  leveledUp: boolean;
  newLevel: number;
}

export async function getTodayCheckin(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return prisma.dailyCheckin.findUnique({
    where: { userId_date: { userId, date: today } },
  });
}

export async function upsertCheckin(
  userId: string,
  mood: number,
  energy: number,
  note?: string
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.dailyCheckin.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  const checkin = await prisma.dailyCheckin.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, mood, energy, note, date: today },
    update: { mood, energy, note },
  });

  // Bonus diario real: +15 XP solo en el PRIMER check-in del día (el upsert
  // del mismo día no vuelve a premiar, así no se puede farmear).
  let rewards: CheckinRewards | null = null;
  if (!existing) {
    try {
      const result = await awardXpAndGold(userId, 15, 0, 'checkin', {
        description: 'Check-in diario (ánimo y energía)',
      });
      rewards = {
        xpEarned: result.xpGained,
        goldEarned: result.goldGained,
        leveledUp: result.leveledUp,
        newLevel: result.newLevel,
      };
    } catch {
      rewards = null;
    }
  }

  return { ...checkin, rewards };
}

export async function getCheckinHistory(userId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  return prisma.dailyCheckin.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: 'asc' },
  });
}

export async function getCheckinStats(userId: string) {
  const last30 = await getCheckinHistory(userId, 30);

  if (last30.length === 0) {
    return { avgMood: 0, avgEnergy: 0, totalCheckins: 0, weeklyPattern: [] };
  }

  const avgMood = last30.reduce((s, c) => s + c.mood, 0) / last30.length;
  const avgEnergy = last30.reduce((s, c) => s + c.energy, 0) / last30.length;

  // Weekday pattern (0=Sun to 6=Sat)
  const byDay: Record<number, { mood: number[]; energy: number[] }> = {};
  for (let i = 0; i < 7; i++) byDay[i] = { mood: [], energy: [] };
  for (const c of last30) {
    const d = new Date(c.date).getDay();
    byDay[d].mood.push(c.mood);
    byDay[d].energy.push(c.energy);
  }
  const weeklyPattern = Object.entries(byDay).map(([day, vals]) => ({
    day: Number(day),
    avgMood: vals.mood.length ? vals.mood.reduce((a, b) => a + b, 0) / vals.mood.length : null,
    avgEnergy: vals.energy.length ? vals.energy.reduce((a, b) => a + b, 0) / vals.energy.length : null,
  }));

  return { avgMood, avgEnergy, totalCheckins: last30.length, weeklyPattern };
}
