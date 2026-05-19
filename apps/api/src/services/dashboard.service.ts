import { prisma } from '../lib/prisma';

export async function getDashboard(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const todayStart = startOfDay(now);

  const [
    user,
    activeQuests,
    recentWorkout,
    sleepLogs,
    monthTransactions,
    recentAchievements,
    todayHabits,
    todayCheckin,
    latestWeeklySummary,
    recoveryChallenge,
    journalEntryCount,
    totalQuestCount,
    totalHabitCount,
  ] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        level: true,
        xp: true,
        xpToNextLevel: true,
        gold: true,
        hp: true,
        maxHp: true,
        mp: true,
        maxMp: true,
        strength: true,
        intelligence: true,
        charisma: true,
        avatarConfig: true,
        currentStreak: true,
        longestStreak: true,
        createdAt: true,
        onboardingCompleted: true,
        onboardingCompletedAt: true,
        lastActivityDate: true,
        sevenDayGuideCompletedDays: true,
        sevenDayGuideCompletedAt: true,
        sevenDayGuideDismissedAt: true,
      },
    }),
    prisma.quest.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: [{ type: 'asc' }, { deadline: 'asc' }],
      take: 5,
    }),
    prisma.workout.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    }),
    prisma.sleepLog.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
      orderBy: { date: 'desc' },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: startOfMonth } },
      select: { type: true, amount: true },
    }),
    prisma.userAchievement.findMany({
      where: { userId, unlockedAt: { gte: sevenDaysAgo } },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' },
      take: 3,
    }),
    prisma.habit.findMany({
      where: { userId, isActive: true },
      include: {
        logs: {
          where: { date: todayStart },
          take: 1,
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 6,
    }),
    prisma.dailyCheckin.findUnique({
      where: { userId_date: { userId, date: todayStart } },
    }),
    prisma.weeklySummary.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.recoveryChallenge.findFirst({
      where: {
        userId,
        isCompleted: false,
        expiresAt: { gt: now },
      },
      include: {
        habit: {
          select: { title: true, icon: true, currentStreak: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.journalEntry.count({
      where: { userId },
    }),
    prisma.quest.count({
      where: { userId },
    }),
    prisma.habit.count({
      where: { userId },
    }),
  ]);

  const sleepAvg7d = sleepLogs.length > 0
    ? sleepLogs.reduce((sum, sleepLog) => sum + sleepLog.duration, 0) / sleepLogs.length
    : 0;

  let monthIncome = 0;
  let monthExpenses = 0;
  for (const transaction of monthTransactions) {
    const amount = Number(transaction.amount);
    if (transaction.type === 'INCOME') monthIncome += amount;
    else monthExpenses += amount;
  }

  const daysSinceJoin = Math.floor(
    (now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysAway = user.lastActivityDate
    ? Math.max(0, Math.floor((todayStart.getTime() - startOfDay(user.lastActivityDate).getTime()) / 86400000))
    : daysSinceJoin;

  const visualHpPercent = getVisualHpPercent(daysAway);

  return {
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
      onboardingCompletedAt: user.onboardingCompletedAt?.toISOString() ?? null,
      lastActivityDate: user.lastActivityDate?.toISOString() ?? null,
    },
    todayQuests: activeQuests,
    recentWorkout: recentWorkout ? { ...recentWorkout, date: recentWorkout.date.toISOString() } : null,
    sleepAvg7d: Math.round(sleepAvg7d * 10) / 10,
    monthIncome,
    monthExpenses,
    monthBalance: monthIncome - monthExpenses,
    daysSinceJoin,
    recentAchievements: recentAchievements.map((userAchievement) => ({
      ...userAchievement.achievement,
      unlockedAt: userAchievement.unlockedAt.toISOString(),
    })),
    todayHabits: todayHabits.map((habit) => ({
      id: habit.id,
      title: habit.title,
      icon: habit.icon,
      color: habit.color,
      currentStreak: habit.currentStreak,
      xpReward: habit.xpReward,
      todayStatus: habit.logs[0]?.status ?? null,
      todayCompleted: habit.logs[0]?.completed ?? null,
    })),
    visualState: {
      mood: todayCheckin?.mood ?? 3,
      daysAway,
      hpPercent: visualHpPercent,
      hpLabel: `${Math.round(visualHpPercent)}%`,
      hpLow: visualHpPercent <= 25,
      hpRecovery: daysAway === 0 && Boolean(user.lastActivityDate),
    },
    latestWeeklySummary: latestWeeklySummary
      ? {
          id: latestWeeklySummary.id,
          summary: latestWeeklySummary.summary,
          lifeScore: latestWeeklySummary.lifeScore,
          weekStart: latestWeeklySummary.weekStart.toISOString(),
          weekEnd: latestWeeklySummary.weekEnd.toISOString(),
        }
      : null,
    recoveryChallenge: recoveryChallenge
      ? {
          id: recoveryChallenge.id,
          habitId: recoveryChallenge.habitId,
          habitTitle: recoveryChallenge.habit.title,
          habitIcon: recoveryChallenge.habit.icon,
          lostStreak: recoveryChallenge.lostStreak,
          requiredDays: recoveryChallenge.requiredDays,
          currentDays: recoveryChallenge.currentDays,
          bonusXp: recoveryChallenge.bonusXp,
          expiresAt: recoveryChallenge.expiresAt.toISOString(),
        }
      : null,
    firstSteps: {
      questCount: totalQuestCount,
      habitCount: totalHabitCount,
      hasJournalEntry: journalEntryCount > 0,
    },
  };
}

function getVisualHpPercent(daysAway: number) {
  if (daysAway >= 5) return 25;
  if (daysAway >= 3) return 50;
  if (daysAway >= 1) return 75;
  return 100;
}

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export async function getTodayQuests(userId: string) {
  const now = new Date();

  const quests = await prisma.quest.findMany({
    where: { userId, status: 'ACTIVE' },
    orderBy: [{ type: 'asc' }, { deadline: 'asc' }],
    take: 10,
  });

  const sorted = quests.sort((a, b) => {
    if (a.type === 'DAILY' && b.type !== 'DAILY') return -1;
    if (b.type === 'DAILY' && a.type !== 'DAILY') return 1;
    if (a.deadline && b.deadline) {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });

  return sorted.slice(0, 5).map((quest) => ({
    ...quest,
    deadline: quest.deadline?.toISOString() ?? null,
    completedAt: quest.completedAt?.toISOString() ?? null,
    lastResetAt: quest.lastResetAt?.toISOString() ?? null,
    createdAt: quest.createdAt.toISOString(),
    updatedAt: quest.updatedAt.toISOString(),
    daysUntilDeadline: quest.deadline
      ? Math.ceil((new Date(quest.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null,
  }));
}

export interface Priority {
  id: string;
  type: 'habit' | 'quest' | 'event';
  title: string;
  icon: string;
  xp: number;
  urgent: boolean;
  detail?: string;
}

export async function getTodayPriorities(userId: string): Promise<Priority[]> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);

  const [habits, quests, events] = await Promise.all([
    prisma.habit.findMany({
      where: {
        userId,
        isActive: true,
        NOT: {
          logs: { some: { date: { gte: todayStart, lt: todayEnd }, completed: true } },
        },
      },
      orderBy: { currentStreak: 'desc' },
      take: 3,
    }),
    prisma.quest.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: [{ type: 'asc' }, { deadline: 'asc' }],
      take: 4,
    }),
    prisma.agendaEvent.findMany({
      where: { userId, startDate: { gte: todayStart, lt: tomorrowEnd } },
      orderBy: { startDate: 'asc' },
      take: 2,
    }),
  ]);

  const priorities: Priority[] = [];

  for (const habit of habits) {
    priorities.push({
      id: habit.id,
      type: 'habit',
      title: habit.title,
      icon: habit.icon ?? 'âœ…',
      xp: habit.xpReward,
      urgent: habit.currentStreak > 0,
      detail: habit.currentStreak > 0 ? `Racha: ${habit.currentStreak} dÃ­as` : undefined,
    });
    if (priorities.length >= 4) break;
  }

  const sortedQuests = quests.sort((a, b) => {
    if (a.type === 'DAILY' && b.type !== 'DAILY') return -1;
    if (b.type === 'DAILY' && a.type !== 'DAILY') return 1;
    if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });

  for (const quest of sortedQuests) {
    if (priorities.length >= 4) break;
    const daysLeft = quest.deadline
      ? Math.ceil((new Date(quest.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    priorities.push({
      id: quest.id,
      type: 'quest',
      title: quest.title,
      icon: quest.type === 'DAILY' ? 'ðŸ—“ï¸' : quest.type === 'MAIN' ? 'âš”ï¸' : 'ðŸ“œ',
      xp: quest.xpReward,
      urgent: daysLeft !== null && daysLeft <= 1,
      detail: daysLeft !== null ? `${daysLeft}d` : quest.type,
    });
  }

  for (const event of events) {
    if (priorities.length >= 4) break;
    priorities.push({
      id: event.id,
      type: 'event',
      title: event.title,
      icon: 'ðŸ“†',
      xp: 0,
      urgent: event.startDate < todayEnd,
      detail: event.startDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    });
  }

  return priorities.slice(0, 4);
}
