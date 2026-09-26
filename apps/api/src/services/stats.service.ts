import { prisma } from '../lib/prisma';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function periodRange(period: string): { start: Date; prevStart: Date; prevEnd: Date } {
  const now = new Date();
  let start: Date;
  let prevStart: Date;
  let prevEnd: Date;

  switch (period) {
    case 'week': {
      start = new Date(now.getTime() - 7 * 86400000);
      prevStart = new Date(now.getTime() - 14 * 86400000);
      prevEnd = start;
      break;
    }
    case '3months': {
      start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      prevStart = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      prevEnd = start;
      break;
    }
    case 'year': {
      start = new Date(now.getFullYear(), 0, 1);
      prevStart = new Date(now.getFullYear() - 1, 0, 1);
      prevEnd = start;
      break;
    }
    case 'all': {
      start = new Date(2000, 0, 1);
      prevStart = new Date(2000, 0, 1);
      prevEnd = new Date(2000, 0, 1);
      break;
    }
    default: {
      // month
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = start;
    }
  }

  return { start, prevStart, prevEnd };
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export async function getStatsSummary(userId: string, period = 'month') {
  const { start, prevStart, prevEnd } = periodRange(period);

  // The overview deliberately combines period comparisons with lifetime totals.
  // That keeps the primary stats truthful as the player continues recording
  // activity instead of showing a fixed demo value.
  const [
    xpCurrent,
    xpPrev,
    questsCurrent,
    questsPrev,
    user,
    streakData,
    transactions,
    totalXp,
    totalQuestCompletions,
    totalHabitCompletions,
    totalWorkouts,
    questsCreatedInPeriod,
  ] = await Promise.all([
    prisma.xpEvent.aggregate({
      where: { userId, createdAt: { gte: start } },
      _sum: { xpAmount: true },
    }),
    prisma.xpEvent.aggregate({
      where: { userId, createdAt: { gte: prevStart, lt: prevEnd } },
      _sum: { xpAmount: true },
    }),
    prisma.questCompletion.count({ where: { userId, completedAt: { gte: start } } }),
    prisma.questCompletion.count({ where: { userId, completedAt: { gte: prevStart, lt: prevEnd } } }),
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { longestStreak: true, currentStreak: true },
    }),
    prisma.habit.findMany({
      where: { userId, isActive: true },
      select: { currentStreak: true, longestStreak: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: start } },
      select: { type: true, amount: true },
    }),
    prisma.xpEvent.aggregate({
      where: { userId },
      _sum: { xpAmount: true },
    }),
    prisma.questCompletion.count({ where: { userId } }),
    prisma.habitLog.count({ where: { userId, completed: true } }),
    prisma.workout.count({ where: { userId } }),
    prisma.quest.count({ where: { userId, createdAt: { gte: start } } }),
  ]);

  let income = 0;
  let expenses = 0;
  for (const transaction of transactions) {
    if (transaction.type === 'INCOME') income += Number(transaction.amount);
    else expenses += Number(transaction.amount);
  }

  const xpNow = xpCurrent._sum.xpAmount ?? 0;
  const xpBefore = xpPrev._sum.xpAmount ?? 0;
  const xpChange = xpBefore > 0 ? Math.round(((xpNow - xpBefore) / xpBefore) * 100) : 0;
  const questChange = questsPrev > 0 ? Math.round(((questsCurrent - questsPrev) / questsPrev) * 100) : 0;
  const bestStreak = Math.max(user.longestStreak, ...streakData.map((habit) => habit.longestStreak));

  return {
    xp: { value: xpNow, change: xpChange },
    quests: {
      completed: questsCurrent,
      change: questChange,
      total: questsCreatedInPeriod,
    },
    currentStreak: user.currentStreak,
    bestStreak,
    finance: { income, expenses, balance: income - expenses },
    totals: {
      xpEarned: totalXp._sum.xpAmount ?? 0,
      questsCompleted: totalQuestCompletions,
      habitCompletions: totalHabitCompletions,
      workouts: totalWorkouts,
    },
  };
}

// ─── XP history ───────────────────────────────────────────────────────────────

export async function getXpHistory(userId: string, period = 'month') {
  const { start } = periodRange(period);

  const events = await prisma.xpEvent.findMany({
    where: { userId, createdAt: { gte: start } },
    orderBy: { createdAt: 'asc' },
    select: { xpAmount: true, createdAt: true },
  });

  // Group by date
  const byDate = new Map<string, number>();
  for (const e of events) {
    const key = e.createdAt.toISOString().split('T')[0];
    byDate.set(key, (byDate.get(key) ?? 0) + e.xpAmount);
  }

  const result = Array.from(byDate.entries()).map(([date, xp]) => ({ date, xp }));
  const avg = result.length > 0 ? Math.round(result.reduce((s, r) => s + r.xp, 0) / result.length) : 0;

  return { data: result, avg };
}

// ─── Activity radar ───────────────────────────────────────────────────────────

export async function getActivityRadar(userId: string) {
  const now = new Date();
  const thisWeek = new Date(now.getTime() - 7 * 86400000);
  const prevWeek = new Date(now.getTime() - 14 * 86400000);

  const score = async (after: Date, before: Date) => {
    const [gym, finance, habits, quests, sleep, learning] = await Promise.all([
      prisma.workout.count({ where: { userId, date: { gte: after, lt: before } } }),
      prisma.transaction.count({ where: { userId, date: { gte: after, lt: before } } }),
      prisma.habitLog.count({ where: { userId, date: { gte: after, lt: before }, completed: true } }),
      prisma.questCompletion.count({ where: { userId, completedAt: { gte: after, lt: before } } }),
      prisma.sleepLog.count({ where: { userId, date: { gte: after, lt: before } } }),
      prisma.learningItem.count({ where: { userId, updatedAt: { gte: after, lt: before } } }),
    ]);
    return { gym, finance, habits, quests, sleep, learning };
  };

  const [current, previous] = await Promise.all([
    score(thisWeek, now),
    score(prevWeek, thisWeek),
  ]);

  return {
    current: [
      { subject: 'Gym', value: Math.min(current.gym * 20, 100) },
      { subject: 'Finanzas', value: Math.min(current.finance * 10, 100) },
      { subject: 'Hábitos', value: Math.min(current.habits * 15, 100) },
      { subject: 'Quests', value: Math.min(current.quests * 15, 100) },
      { subject: 'Sueño', value: Math.min(current.sleep * 15, 100) },
      { subject: 'Aprendizaje', value: Math.min(current.learning * 25, 100) },
    ],
    previous: [
      { subject: 'Gym', value: Math.min(previous.gym * 20, 100) },
      { subject: 'Finanzas', value: Math.min(previous.finance * 10, 100) },
      { subject: 'Hábitos', value: Math.min(previous.habits * 15, 100) },
      { subject: 'Quests', value: Math.min(previous.quests * 15, 100) },
      { subject: 'Sueño', value: Math.min(previous.sleep * 15, 100) },
      { subject: 'Aprendizaje', value: Math.min(previous.learning * 25, 100) },
    ],
  };
}

// ─── Finance trend ────────────────────────────────────────────────────────────

export async function getFinanceTrend(userId: string) {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const txs = await prisma.transaction.findMany({
    where: { userId, date: { gte: sixMonthsAgo } },
    select: { type: true, amount: true, date: true },
    orderBy: { date: 'asc' },
  });

  const byMonth = new Map<string, { income: number; expenses: number }>();
  for (const t of txs) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth.has(key)) byMonth.set(key, { income: 0, expenses: 0 });
    const entry = byMonth.get(key)!;
    if (t.type === 'INCOME') entry.income += Number(t.amount);
    else entry.expenses += Number(t.amount);
  }

  let cumBalance = 0;
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { income, expenses }]) => {
      cumBalance += income - expenses;
      return { month, income, expenses, balance: cumBalance };
    });
}

// ─── Habit heatmap ────────────────────────────────────────────────────────────

export async function getHabitHeatmap(userId: string) {
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  const logs = await prisma.habitLog.findMany({
    where: { userId, date: { gte: yearAgo }, completed: true },
    select: { date: true },
  });

  const byDate = new Map<string, number>();
  for (const l of logs) {
    const key = l.date.toISOString().split('T')[0];
    byDate.set(key, (byDate.get(key) ?? 0) + 1);
  }

  return Array.from(byDate.entries()).map(([date, count]) => ({ date, count }));
}

// ─── Sleep scatter ────────────────────────────────────────────────────────────

export async function getSleepScatter(userId: string, period = 'month') {
  const { start } = periodRange(period);

  const logs = await prisma.sleepLog.findMany({
    where: { userId, date: { gte: start } },
    select: { duration: true, quality: true, date: true },
    orderBy: { date: 'asc' },
  });

  return logs.map((l) => ({
    date: l.date.toISOString().split('T')[0],
    duration: l.duration,
    quality: l.quality,
  }));
}

// ─── Gym progression ─────────────────────────────────────────────────────────

export async function getGymProgression(userId: string, period = 'month') {
  const { start } = periodRange(period);

  const exercises = await prisma.workoutExercise.findMany({
    where: { workout: { userId, date: { gte: start } } },
    include: {
      exercise: { select: { name: true } },
      workout: { select: { date: true } },
    },
    orderBy: { workout: { date: 'asc' } },
  });

  // Group max weight by exercise + date
  const byExercise = new Map<string, Map<string, number>>();
  for (const we of exercises) {
    const name = we.exercise.name;
    const date = we.workout.date.toISOString().split('T')[0];
    const sets = we.sets as Array<{ weight?: number; reps?: number }>;
    const maxWeight = sets.reduce((max, s) => Math.max(max, s.weight ?? 0), 0);

    if (!byExercise.has(name)) byExercise.set(name, new Map());
    const dateMap = byExercise.get(name)!;
    dateMap.set(date, Math.max(dateMap.get(date) ?? 0, maxWeight));
  }

  // Return top 5 exercises by number of data points
  const result: Array<{ name: string; data: Array<{ date: string; weight: number }> }> = [];
  for (const [name, dateMap] of byExercise.entries()) {
    result.push({
      name,
      data: Array.from(dateMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, weight]) => ({ date, weight })),
    });
  }

  return result
    .filter((r) => r.data.length > 1)
    .sort((a, b) => b.data.length - a.data.length)
    .slice(0, 5);
}

// ─── Predictions ─────────────────────────────────────────────────────────────

export async function getPredictions(userId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const [user, recentXp, recentSavings, goals, habits] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { level: true, xp: true, xpToNextLevel: true },
    }),
    prisma.xpEvent.aggregate({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      _sum: { xpAmount: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
      select: { type: true, amount: true },
    }),
    prisma.financialGoal.findMany({
      where: { userId, isCompleted: false },
      select: { title: true, targetAmount: true, currentAmount: true },
      take: 3,
    }),
    prisma.habit.findMany({
      where: { userId, isActive: true },
      include: {
        logs: {
          where: { date: { gte: thirtyDaysAgo } },
          orderBy: { date: 'asc' },
        },
      },
      take: 5,
    }),
  ]);

  const avgDailyXp = (recentXp._sum.xpAmount ?? 0) / 30;
  const xpNeeded = user.xpToNextLevel - user.xp;
  const daysToNextLevel = avgDailyXp > 0 ? Math.ceil(xpNeeded / avgDailyXp) : null;

  let income = 0, expenses = 0;
  for (const t of recentSavings) {
    if (t.type === 'INCOME') income += Number(t.amount);
    else expenses += Number(t.amount);
  }
  const monthlyAvgSaving = income - expenses;

  const goalPredictions = goals.map((g) => {
    const remaining = Number(g.targetAmount) - Number(g.currentAmount);
    const months = monthlyAvgSaving > 0 ? Math.ceil(remaining / monthlyAvgSaving) : null;
    return { title: g.title, remaining, months };
  });

  // Streak risk: check how many days in last 7 each habit was missed
  const habitRisks = habits.map((h) => {
    const last7 = h.logs.filter((l) => {
      const daysAgo = (now.getTime() - new Date(l.date).getTime()) / 86400000;
      return daysAgo <= 7;
    });
    const completed = last7.filter((l) => l.completed).length;
    const risk: 'low' | 'medium' | 'high' =
      completed >= 6 ? 'low' : completed >= 4 ? 'medium' : 'high';
    return { title: h.title, currentStreak: h.currentStreak, completionRate: completed, risk };
  });

  return {
    daysToNextLevel,
    avgDailyXp: Math.round(avgDailyXp),
    goalPredictions,
    habitRisks,
  };
}
