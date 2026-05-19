import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { generateText, hasAIProvider } from '../lib/ai';
import { createNotification, isInQuietHours, sendPush } from '../services/notification.service';
import { generateDailyScroll } from '../services/scrolls.service';
import { seedWisdomCards } from '../services/wisdom.service';

export function initScheduler() {
  cron.schedule('*/15 * * * *', async () => {
    try {
      await resetDailyQuestsForUsersInTimezone();
    } catch (err) {
      console.error('[Scheduler] Error resetting daily quests:', err);
    }
  });

  cron.schedule('0 4 * * 0', async () => {
    try {
      await resetWeeklyQuests();
    } catch (err) {
      console.error('[Scheduler] Error resetting weekly quests:', err);
    }
  });

  cron.schedule('0 * * * *', async () => {
    try {
      await failExpiredQuests();
    } catch (err) {
      console.error('[Scheduler] Error failing expired quests:', err);
    }
  });

  cron.schedule('0 0 * * *', async () => {
    try {
      await penalizeInactiveHabitStreaks();
    } catch (err) {
      console.error('[Scheduler] Error updating habit streaks:', err);
    }
  });

  cron.schedule('0 * * * *', async () => {
    try {
      await sendDeadlineAlerts();
    } catch (err) {
      console.error('[Scheduler] Error sending deadline alerts:', err);
    }
  });

  cron.schedule('0 21 * * *', async () => {
    try {
      await sendDailySummaries();
    } catch (err) {
      console.error('[Scheduler] Error sending daily summaries:', err);
    }
  });

  cron.schedule('0 20 * * 0', async () => {
    try {
      await generateWeeklySummaries();
    } catch (err) {
      console.error('[Scheduler] Error generating weekly summaries:', err);
    }
  });

  cron.schedule('0 7 * * *', async () => {
    try {
      const users = await prisma.user.findMany({
        where: { onboardingCompleted: true },
        select: { id: true },
        take: 200,
      });

      for (const user of users) {
        await generateDailyScroll(user.id).catch(() => null);
      }
    } catch (err) {
      console.error('[Scheduler] Error generating daily scrolls:', err);
    }
  });

  seedWisdomCards().catch(() => null);

  console.log('[Scheduler] Inicializado con 8 cron jobs activos (Bloques 13-16)');
}

async function resetDailyQuestsForUsersInTimezone() {
  const todayStart = new Date();
  todayStart.setHours(4, 0, 0, 0);

  const questsToReset = await prisma.quest.findMany({
    where: {
      type: 'DAILY',
      isRecurring: true,
      status: 'COMPLETED',
      completedAt: { lt: todayStart },
    },
  });

  if (questsToReset.length === 0) return;

  await prisma.quest.updateMany({
    where: { id: { in: questsToReset.map((quest) => quest.id) } },
    data: { status: 'ACTIVE', completedAt: null, lastResetAt: new Date() },
  });
}

async function resetWeeklyQuests() {
  const lastMonday = new Date();
  lastMonday.setDate(lastMonday.getDate() - lastMonday.getDay() + 1);
  lastMonday.setHours(4, 0, 0, 0);

  const questsToReset = await prisma.quest.findMany({
    where: {
      type: 'WEEKLY',
      isRecurring: true,
      status: 'COMPLETED',
      completedAt: { lt: lastMonday },
    },
  });

  if (questsToReset.length === 0) return;

  await prisma.quest.updateMany({
    where: { id: { in: questsToReset.map((quest) => quest.id) } },
    data: { status: 'ACTIVE', completedAt: null, lastResetAt: new Date() },
  });
}

async function failExpiredQuests() {
  const now = new Date();

  const expired = await prisma.quest.findMany({
    where: {
      status: 'ACTIVE',
      deadline: { lt: now },
      isRecurring: false,
    },
  });

  if (expired.length === 0) return;

  await prisma.quest.updateMany({
    where: { id: { in: expired.map((quest) => quest.id) } },
    data: { status: 'FAILED' },
  });
}

async function penalizeInactiveHabitStreaks() {
  const yesterday = startOfDay(addDays(new Date(), -1));

  const activeHabits = await prisma.habit.findMany({
    where: { isActive: true, currentStreak: { gt: 0 } },
  });

  for (const habit of activeHabits) {
    const log = await prisma.habitLog.findUnique({
      where: { habitId_date: { habitId: habit.id, date: yesterday } },
    });

    if (!log || log.status === 'failed') {
      await createRecoveryChallengeIfEligible(habit.userId, habit.id, habit.title, habit.currentStreak);
      await prisma.habit.update({
        where: { id: habit.id },
        data: { currentStreak: 0 },
      });
    }
  }
}

async function createRecoveryChallengeIfEligible(
  userId: string,
  habitId: string,
  habitTitle: string,
  lostStreak: number
) {
  if (lostStreak <= 7) return;

  const now = new Date();
  const existing = await prisma.recoveryChallenge.findFirst({
    where: {
      userId,
      habitId,
      isCompleted: false,
      expiresAt: { gt: now },
    },
    select: { id: true },
  });

  if (existing) return;

  const bonusXp = Math.floor(lostStreak * 1.5);

  await prisma.recoveryChallenge.create({
    data: {
      userId,
      habitId,
      lostStreak,
      requiredDays: 3,
      bonusXp,
      expiresAt: addDays(now, 7),
    },
  });

  createNotification(userId, {
    type: 'streak',
    title: '🔥 Reto de recuperación disponible',
    body: `"${habitTitle}" puede volver a encenderse: 3 días seguidos por +${bonusXp} XP.`,
    icon: '🔥',
    link: '/habits',
  }).catch(() => {});
}

async function sendDeadlineAlerts() {
  if (!process.env.VAPID_PUBLIC_KEY) return;

  const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);

  const urgentQuests = await prisma.quest.findMany({
    where: {
      status: 'ACTIVE',
      deadline: { gte: oneHourFromNow, lte: twoHoursFromNow },
    },
    include: { user: { include: { notificationPreferences: true, pushSubscriptions: true } } },
  });

  for (const quest of urgentQuests) {
    const prefs = quest.user.notificationPreferences;
    if (!prefs?.questDeadlineAlerts) continue;
    if (quest.user.pushSubscriptions.length === 0) continue;
    if (isInQuietHours(prefs.quietHoursStart, prefs.quietHoursEnd)) continue;

    await sendPush(quest.userId, {
      title: '⚠️ Misión por vencer',
      body: `"${quest.title}" vence en 2 horas. Tú puedes.`,
      tag: `deadline-${quest.id}`,
      data: { questId: quest.id },
    });
  }
}

async function sendDailySummaries() {
  if (!process.env.VAPID_PUBLIC_KEY) return;

  const users = await prisma.user.findMany({
    where: { pushSubscriptions: { some: {} } },
    include: { notificationPreferences: true, pushSubscriptions: true },
  });

  const todayStart = startOfDay(new Date());

  for (const user of users) {
    const prefs = user.notificationPreferences;
    if (!prefs?.dailySummary) continue;
    if (isInQuietHours(prefs.quietHoursStart, prefs.quietHoursEnd)) continue;

    const [completions, xpEvents] = await Promise.all([
      prisma.questCompletion.count({ where: { userId: user.id, completedAt: { gte: todayStart } } }),
      prisma.xpEvent.aggregate({
        where: { userId: user.id, createdAt: { gte: todayStart } },
        _sum: { xpAmount: true },
      }),
    ]);

    await sendPush(user.id, {
      title: '📜 Tu día en LifeQuest',
      body: `Completaste ${completions} misiones y ganaste ${xpEvents._sum.xpAmount ?? 0} XP hoy.`,
      tag: 'daily-summary',
    });
  }
}

async function generateWeeklySummaries() {
  const users = await prisma.user.findMany({
    where: { onboardingCompleted: true },
    select: { id: true },
    take: 500,
  });

  for (const user of users) {
    await generateWeeklySummaryForUser(user.id).catch((err) => {
      console.error(`[Scheduler] Weekly summary failed for ${user.id}:`, err);
    });
  }
}

async function generateWeeklySummaryForUser(userId: string) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekEnd = startOfDay(now);
  const weekStart = addDays(weekEnd, -(dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const nextWeekStart = addDays(weekStart, 7);

  const existing = await prisma.weeklySummary.findFirst({
    where: { userId, weekStart },
    select: { id: true },
  });
  if (existing) return;

  const previousSummary = await prisma.weeklySummary.findFirst({
    where: { userId },
    orderBy: { weekStart: 'desc' },
    select: { lifeScore: true },
  });

  const [
    user,
    questsCompleted,
    questsCreated,
    topHabit,
    workoutsCount,
    transactionAgg,
    xpAgg,
    goldAgg,
    moodAgg,
    habitsCompleted,
  ] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { displayName: true, lifeScore: true },
    }),
    prisma.questCompletion.count({
      where: { userId, completedAt: { gte: weekStart, lt: nextWeekStart } },
    }),
    prisma.quest.count({
      where: { userId, createdAt: { gte: weekStart, lt: nextWeekStart } },
    }),
    prisma.habit.findFirst({
      where: { userId, isActive: true },
      orderBy: [{ longestStreak: 'desc' }, { currentStreak: 'desc' }],
      select: { title: true, longestStreak: true, currentStreak: true },
    }),
    prisma.workout.count({
      where: { userId, date: { gte: weekStart, lt: nextWeekStart } },
    }),
    prisma.transaction.aggregate({
      where: { userId },
      _sum: { amount: true },
    }),
    prisma.xpEvent.aggregate({
      where: { userId, createdAt: { gte: weekStart, lt: nextWeekStart } },
      _sum: { xpAmount: true },
    }),
    prisma.xpEvent.aggregate({
      where: { userId, createdAt: { gte: weekStart, lt: nextWeekStart } },
      _sum: { goldAmount: true },
    }),
    prisma.dailyCheckin.aggregate({
      where: { userId, date: { gte: weekStart, lt: nextWeekStart } },
      _avg: { mood: true },
    }),
    prisma.habitLog.count({
      where: { userId, completed: true, date: { gte: weekStart, lt: nextWeekStart } },
    }),
  ]);

  const weekData = {
    displayName: user.displayName,
    lifeScore: user.lifeScore,
    prevScore: previousSummary?.lifeScore ?? user.lifeScore,
    questsCompleted,
    questsCreated,
    bestStreak: Math.max(topHabit?.longestStreak ?? 0, topHabit?.currentStreak ?? 0),
    bestHabitName: topHabit?.title ?? 'tu disciplina',
    gymSessions: workoutsCount,
    balance: Number(transactionAgg._sum.amount ?? 0),
  };

  const summary = await buildWeeklySummary(weekData);

  await prisma.weeklySummary.create({
    data: {
      userId,
      weekStart,
      weekEnd: addDays(nextWeekStart, -1),
      summary,
      lifeScore: weekData.lifeScore,
      xpTotal: xpAgg._sum.xpAmount ?? 0,
      goldTotal: goldAgg._sum.goldAmount ?? 0,
      questsCount: questsCompleted,
      habitsCount: habitsCompleted,
      topHabit: topHabit?.title ?? null,
      mood: moodAgg._avg.mood ?? null,
    },
  });

  createNotification(userId, {
    type: 'sage',
    title: '📊 Tu resumen semanal está listo',
    body: `Life Score ${weekData.lifeScore}/100. El Sabio tiene algo que decirte.`,
    icon: '📊',
    link: '/stats',
  }).catch(() => {});

  await sendPush(userId, {
    title: '📊 Tu resumen semanal está listo',
    body: `Life Score ${weekData.lifeScore}/100. El Sabio tiene algo que decirte.`,
    tag: `weekly-summary-${weekStart.toISOString()}`,
  });
}

async function buildWeeklySummary(weekData: {
  displayName: string;
  lifeScore: number;
  prevScore: number;
  questsCompleted: number;
  questsCreated: number;
  bestStreak: number;
  bestHabitName: string;
  gymSessions: number;
  balance: number;
}) {
  if (!hasAIProvider()) {
    return [
      `${weekData.displayName}, tu semana cerró con Life Score ${weekData.lifeScore}/100 frente a ${weekData.prevScore}/100 la semana pasada. Completaste ${weekData.questsCompleted} de ${weekData.questsCreated} misiones creadas y tu mejor racha fue de ${weekData.bestStreak} días en "${weekData.bestHabitName}".`,
      `${weekData.gymSessions > 0 ? `Entrenaste ${weekData.gymSessions} veces` : 'El Coliseo quedó en pausa'} y tu frente financiero se sostiene en ${formatCOP(weekData.balance)}. Hubo avance, pero todavía puedes volver más consistente lo que ya empezó a funcionar.`,
      `La próxima semana protege una sola ancla: repite "${weekData.bestHabitName}" al inicio del día y deja que ese impulso arrastre el resto.`,
    ].join('\n\n');
  }

  const prompt = `
Eres el Sabio del Castillo. Escribe el resumen semanal de ${weekData.displayName} en español.
Específico con sus datos reales. Épico pero directo. Máximo 3 párrafos.

DATOS: Life Score ${weekData.lifeScore}/100 (vs ${weekData.prevScore} semana pasada).
Quests: ${weekData.questsCompleted}/${weekData.questsCreated}.
Mejor racha: ${weekData.bestStreak} días en "${weekData.bestHabitName}".
Gym: ${weekData.gymSessions} sesiones. Finanzas: ${formatCOP(weekData.balance)}.

Párrafo 1: lo que logró.
Párrafo 2: qué puede mejorar.
Párrafo 3: UNA sugerencia concreta para la próxima semana.
  `.trim();

  return generateText(
    [
      { role: 'system', content: 'Responde solo en español. Sé específico con datos reales, épico pero directo.' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.7, maxTokens: 320 }
  );
}

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function formatCOP(amount: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}
