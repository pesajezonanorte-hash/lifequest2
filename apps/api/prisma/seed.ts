import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando base de datos (nivel 1 desde cero)...');

  const passwordHash = await bcrypt.hash('test1234', 12);

  const miguel = await prisma.user.upsert({
    where: { email: 'miguel@lifequest.com' },
    update: {
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      gold: 0,
      hp: 100,
      maxHp: 100,
      mp: 100,
      maxMp: 100,
      strength: 1,
      intelligence: 1,
      charisma: 1,
      onboardingCompleted: false,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      playerClass: null,
      activeTheme: 'aurora',
    },
    create: {
      email: 'miguel@lifequest.com',
      username: 'miguel_romero',
      passwordHash,
      displayName: 'Miguel Ángel',
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      gold: 0,
      hp: 100,
      maxHp: 100,
      mp: 100,
      maxMp: 100,
      strength: 1,
      intelligence: 1,
      charisma: 1,
      onboardingCompleted: false,
      currentStreak: 0,
      longestStreak: 0,
      avatarConfig: {
        hairColor: '#2c1810',
        skinColor: '#c68642',
        shirtColor: '#4d96ff',
        pants: '#37474f',
        accessory: null,
        pet: null,
      },
      timezone: 'America/Bogota',
      currency: 'COP',
      language: 'es',
      relationshipStatus: 'SINGLE',
    },
  });

  console.log('✅ Usuario miguel creado:', miguel.email);

  // Limpiar todos los datos de usuario
  await prisma.notification.deleteMany({ where: { userId: miguel.id } });
  await prisma.notificationPreferences.deleteMany({ where: { userId: miguel.id } });
  await prisma.pushSubscription.deleteMany({ where: { userId: miguel.id } });
  await prisma.userAchievement.deleteMany({ where: { userId: miguel.id } });
  await prisma.questCompletion.deleteMany({ where: { userId: miguel.id } });
  await prisma.quest.deleteMany({ where: { userId: miguel.id } });
  await prisma.habitLog.deleteMany({ where: { userId: miguel.id } });
  await prisma.habit.deleteMany({ where: { userId: miguel.id } });
  await prisma.xpEvent.deleteMany({ where: { userId: miguel.id } });
  await prisma.workoutExercise.deleteMany({ where: { workout: { userId: miguel.id } } });
  await prisma.workout.deleteMany({ where: { userId: miguel.id } });
  await prisma.bodyWeight.deleteMany({ where: { userId: miguel.id } });
  await prisma.progressPhoto.deleteMany({ where: { userId: miguel.id } });
  await prisma.sleepLog.deleteMany({ where: { userId: miguel.id } });
  await prisma.transaction.deleteMany({ where: { userId: miguel.id } });
  await prisma.recurringTransaction.deleteMany({ where: { userId: miguel.id } });
  await prisma.debtPayment.deleteMany({ where: { debt: { userId: miguel.id } } });
  await prisma.debt.deleteMany({ where: { userId: miguel.id } });
  await prisma.budget.deleteMany({ where: { userId: miguel.id } });
  await prisma.financialGoal.deleteMany({ where: { userId: miguel.id } });
  await prisma.journalEntry.deleteMany({ where: { userId: miguel.id } });
  await prisma.meal.deleteMany({ where: { userId: miguel.id } });
  await prisma.nutritionGoal.deleteMany({ where: { userId: miguel.id } });
  await prisma.savedMeal.deleteMany({ where: { userId: miguel.id } });
  await prisma.learningItem.deleteMany({ where: { userId: miguel.id } });
  await prisma.relationship.deleteMany({ where: { userId: miguel.id } });
  await prisma.giftIdea.deleteMany({ where: { userId: miguel.id } });
  await prisma.inventoryItem.deleteMany({ where: { userId: miguel.id } });
  await prisma.goalMilestone.deleteMany({ where: { goal: { userId: miguel.id } } });
  await prisma.masterGoal.deleteMany({ where: { userId: miguel.id } });
  await prisma.ritualStep.deleteMany({ where: { ritual: { userId: miguel.id } } });
  await prisma.ritual.deleteMany({ where: { userId: miguel.id } });
  await prisma.ritualLog.deleteMany({ where: { userId: miguel.id } });
  await prisma.dailyCheckin.deleteMany({ where: { userId: miguel.id } });
  await prisma.sageMemory.deleteMany({ where: { userId: miguel.id } });
  await prisma.sageInsight.deleteMany({ where: { userId: miguel.id } });
  await prisma.sageScroll.deleteMany({ where: { userId: miguel.id } });
  await prisma.agendaEvent.deleteMany({ where: { userId: miguel.id } });
  await prisma.focusSession.deleteMany({ where: { userId: miguel.id } });
  await prisma.seasonParticipant.deleteMany({ where: { userId: miguel.id } });
  await prisma.challengeParticipant.deleteMany({ where: { userId: miguel.id } });
  await prisma.guildMember.deleteMany({ where: { userId: miguel.id } });
  await prisma.guildMessage.deleteMany({ where: { userId: miguel.id } });
  await prisma.friendship.deleteMany({ where: { OR: [{ requesterId: miguel.id }, { receiverId: miguel.id }] } });

  console.log('✅ Datos de usuario limpiados');

  // ─── 30 Achievements (catálogo solamente, sin desbloquear ninguno) ──────────
  const achievementDefs = [
    { key: 'first_login',         title: '¡El Héroe Despierta!',      description: 'Iniciaste sesión por primera vez',                          icon: '🌅', category: 'special',  xpReward: 50,   progressType: null,                   progressTarget: null },
    { key: 'first_quest',         title: 'Primera Sangre',            description: 'Completaste tu primera misión',                             icon: '🗡️', category: 'quest',    xpReward: 50,   progressType: 'quest_count',          progressTarget: 1 },
    { key: 'quests_10',           title: 'Guerrero Novato',           description: 'Completaste 10 misiones',                                   icon: '⚔️', category: 'quest',    xpReward: 100,  progressType: 'quest_count',          progressTarget: 10 },
    { key: 'quests_50',           title: 'Veterano del Campo',        description: 'Completaste 50 misiones',                                   icon: '🛡️', category: 'quest',    xpReward: 300,  progressType: 'quest_count',          progressTarget: 50 },
    { key: 'quests_100',          title: 'Maestro de Misiones',       description: 'Completaste 100 misiones',                                  icon: '🏆', category: 'quest',    xpReward: 500,  progressType: 'quest_count',          progressTarget: 100 },
    { key: 'quests_500',          title: 'Leyenda',                   description: 'Completaste 500 misiones',                                  icon: '👑', category: 'quest',    xpReward: 2000, progressType: 'quest_count',          progressTarget: 500 },
    { key: 'streak_7',            title: 'Semana de Fuego',           description: '7 días seguidos completando un hábito',                     icon: '🔥', category: 'habit',    xpReward: 100,  progressType: 'habit_streak',         progressTarget: 7 },
    { key: 'streak_30',           title: 'Mes Estelar',               description: '30 días seguidos en un hábito',                             icon: '🌟', category: 'habit',    xpReward: 300,  progressType: 'habit_streak',         progressTarget: 30 },
    { key: 'streak_100',          title: 'Diamante Inquebrantable',   description: '100 días seguidos en un hábito',                            icon: '💎', category: 'habit',    xpReward: 1000, progressType: 'habit_streak',         progressTarget: 100 },
    { key: 'habits_5',            title: 'Hombre de Costumbres',      description: 'Creaste 5 hábitos activos',                                 icon: '📋', category: 'habit',    xpReward: 75,   progressType: 'habit_count',          progressTarget: 5 },
    { key: 'level_5',             title: 'Aventurero',                description: 'Alcanzaste el nivel 5',                                     icon: '⭐', category: 'level',    xpReward: 200,  progressType: 'level',                progressTarget: 5 },
    { key: 'level_10',            title: 'Guerrero Templado',         description: 'Alcanzaste el nivel 10',                                    icon: '🌠', category: 'level',    xpReward: 300,  progressType: 'level',                progressTarget: 10 },
    { key: 'level_25',            title: 'Héroe Legendario',          description: 'Alcanzaste el nivel 25',                                    icon: '💫', category: 'level',    xpReward: 750,  progressType: 'level',                progressTarget: 25 },
    { key: 'level_50',            title: 'Semidiós',                  description: 'Alcanzaste el nivel 50',                                    icon: '⚡', category: 'level',    xpReward: 1500, progressType: 'level',                progressTarget: 50 },
    { key: 'level_100',           title: 'Ascendido',                 description: 'Alcanzaste el nivel 100',                                   icon: '🌌', category: 'level',    xpReward: 5000, progressType: 'level',                progressTarget: 100 },
    { key: 'fitness_25',          title: 'Brazos de Hierro',          description: 'Completa 25 misiones de Fitness',                           icon: '💪', category: 'category', xpReward: 200,  progressType: 'category_quest_count', progressTarget: 25 },
    { key: 'learning_10',         title: 'Erudito',                   description: 'Completa 10 misiones de Aprendizaje',                       icon: '🧠', category: 'category', xpReward: 150,  progressType: 'category_quest_count', progressTarget: 10 },
    { key: 'finance_goal',        title: 'Millonario en Camino',      description: 'Completa tu primera meta financiera',                       icon: '💰', category: 'category', xpReward: 300,  progressType: null,                   progressTarget: null },
    { key: 'love_10',             title: 'Romántico Empedernido',     description: 'Completa 10 misiones de Amor',                              icon: '💖', category: 'category', xpReward: 150,  progressType: 'category_quest_count', progressTarget: 10 },
    { key: 'health_20',           title: 'Cuerpo Templo',             description: 'Completa 20 misiones de Salud',                             icon: '🌿', category: 'category', xpReward: 200,  progressType: 'category_quest_count', progressTarget: 20 },
    { key: 'early_bird',          title: 'Madrugador',                description: 'Completa una misión antes de las 7am',                      icon: '🌅', category: 'special',  xpReward: 75,   progressType: null,                   progressTarget: null },
    { key: 'night_owl',           title: 'Búho Nocturno',             description: 'Completa una misión después de las 11pm',                   icon: '🦉', category: 'special',  xpReward: 75,   progressType: null,                   progressTarget: null },
    { key: 'birthday',            title: 'Cumpleaños en LifeQuest',   description: 'Completaste una misión en tu cumpleaños',                   icon: '🎂', category: 'special',  xpReward: 200,  progressType: null,                   progressTarget: null },
    { key: 'login_30',            title: 'Centinela',                 description: 'Login 30 días seguidos',                                    icon: '📅', category: 'special',  xpReward: 300,  progressType: 'login_streak',         progressTarget: 30 },
    { key: 'first_habit',         title: 'Primer Hábito',             description: 'Creaste tu primer hábito',                                  icon: '✨', category: 'habit',    xpReward: 50,   progressType: null,                   progressTarget: null },
    { key: 'perfect_week',        title: 'Semana Perfecta',           description: 'Completaste todos tus hábitos diarios en una semana',       icon: '🌈', category: 'habit',    xpReward: 250,  progressType: null,                   progressTarget: null },
    { key: 'social_butterfly',    title: 'Mariposa Social',           description: 'Completa 10 misiones de tipo Social',                       icon: '🦋', category: 'category', xpReward: 150,  progressType: 'category_quest_count', progressTarget: 10 },
    { key: 'creative_mind',       title: 'Mente Creativa',            description: 'Completa 10 misiones de tipo Creativo',                     icon: '🎨', category: 'category', xpReward: 150,  progressType: 'category_quest_count', progressTarget: 10 },
    { key: 'epic_quest',          title: 'Épico entre los Épicos',    description: 'Completa tu primera misión ÉPICA',                          icon: '⚡', category: 'quest',    xpReward: 500,  progressType: null,                   progressTarget: null },
    { key: 'speed_run',           title: 'Velocista',                 description: 'Completa 5 misiones en un solo día',                        icon: '💨', category: 'special',  xpReward: 200,  progressType: null,                   progressTarget: null },
  ];

  for (const ach of achievementDefs) {
    await prisma.achievement.upsert({
      where: { key: ach.key },
      update: { title: ach.title, description: ach.description, icon: ach.icon, category: ach.category, xpReward: ach.xpReward, progressType: ach.progressType, progressTarget: ach.progressTarget },
      create: { key: ach.key, title: ach.title, description: ach.description, icon: ach.icon, category: ach.category, xpReward: ach.xpReward, progressType: ach.progressType, progressTarget: ach.progressTarget },
    });
  }

  console.log('✅ 30 Achievements en catálogo (ninguno desbloqueado)');

  // ─── Tienda ─────────────────────────────────────────────────────────────────
  const shopItemDefs = [
    { name: 'Sombrero de Aventurero',  description: 'Un sombrero digno de un héroe',          type: 'COSMETIC', cost: 200,  imageKey: 'hat_adventurer', levelRequired: 1 },
    { name: 'Capa del Guerrero',        description: 'Una capa que ondea épicamente',           type: 'COSMETIC', cost: 500,  imageKey: 'cape_warrior',   levelRequired: 5 },
    { name: 'Multiplicador de XP x2',  description: 'Duplica tu XP por 24 horas',              type: 'POWERUP',  cost: 300,  imageKey: 'xp_booster',     levelRequired: 1 },
    { name: 'Pase de Perdón',           description: 'No pierdes racha si fallas un día',       type: 'PASS',     cost: 150,  imageKey: 'streak_pass',    levelRequired: 1 },
    { name: 'Mascota: Dragón Pixel',   description: 'Un pequeño dragón te acompaña',            type: 'COSMETIC', cost: 1000, imageKey: 'pet_dragon',     levelRequired: 10 },
    { name: 'Escudo Dorado',            description: 'Un escudo épico que brilla',               type: 'COSMETIC', cost: 750,  imageKey: 'shield_gold',    levelRequired: 5 },
    { name: 'Poción de Energía',        description: 'Recupera 50 HP al instante',              type: 'POWERUP',  cost: 100,  imageKey: 'potion_energy',  levelRequired: 1 },
  ];

  for (const item of shopItemDefs) {
    const existing = await prisma.shopItem.findFirst({ where: { name: item.name } });
    if (!existing) await prisma.shopItem.create({ data: item });
  }

  console.log('✅ Tienda lista');

  // ─── Catálogo de ejercicios ──────────────────────────────────────────────────
  const exerciseDefs = [
    { name: 'Press de Banca',                muscleGroup: 'Pecho',    equipment: 'Barra' },
    { name: 'Press Inclinado con Mancuernas',muscleGroup: 'Pecho',    equipment: 'Mancuernas' },
    { name: 'Press Declinado',               muscleGroup: 'Pecho',    equipment: 'Barra' },
    { name: 'Aperturas con Mancuernas',      muscleGroup: 'Pecho',    equipment: 'Mancuernas' },
    { name: 'Fondos en Paralelas',           muscleGroup: 'Pecho',    equipment: 'Peso Corporal' },
    { name: 'Flexiones',                     muscleGroup: 'Pecho',    equipment: 'Peso Corporal' },
    { name: 'Dominadas',                     muscleGroup: 'Espalda',  equipment: 'Peso Corporal' },
    { name: 'Remo con Barra',                muscleGroup: 'Espalda',  equipment: 'Barra' },
    { name: 'Remo con Mancuerna',            muscleGroup: 'Espalda',  equipment: 'Mancuernas' },
    { name: 'Jalón al Pecho',                muscleGroup: 'Espalda',  equipment: 'Máquina' },
    { name: 'Peso Muerto',                   muscleGroup: 'Espalda',  equipment: 'Barra' },
    { name: 'Hiperextensiones',              muscleGroup: 'Espalda',  equipment: 'Banco' },
    { name: 'Press Militar',                 muscleGroup: 'Hombros',  equipment: 'Barra' },
    { name: 'Press Arnold',                  muscleGroup: 'Hombros',  equipment: 'Mancuernas' },
    { name: 'Elevaciones Laterales',         muscleGroup: 'Hombros',  equipment: 'Mancuernas' },
    { name: 'Elevaciones Frontales',         muscleGroup: 'Hombros',  equipment: 'Mancuernas' },
    { name: 'Pájaros',                       muscleGroup: 'Hombros',  equipment: 'Mancuernas' },
    { name: 'Curl con Barra',                muscleGroup: 'Bíceps',   equipment: 'Barra' },
    { name: 'Curl con Mancuernas',           muscleGroup: 'Bíceps',   equipment: 'Mancuernas' },
    { name: 'Curl Martillo',                 muscleGroup: 'Bíceps',   equipment: 'Mancuernas' },
    { name: 'Extensión de Tríceps Polea',    muscleGroup: 'Tríceps',  equipment: 'Polea' },
    { name: 'Press Francés',                 muscleGroup: 'Tríceps',  equipment: 'Barra' },
    { name: 'Fondos en Banco',               muscleGroup: 'Tríceps',  equipment: 'Banco' },
    { name: 'Sentadilla',                    muscleGroup: 'Piernas',  equipment: 'Barra' },
    { name: 'Sentadilla Goblet',             muscleGroup: 'Piernas',  equipment: 'Mancuernas' },
    { name: 'Prensa de Piernas',             muscleGroup: 'Piernas',  equipment: 'Máquina' },
    { name: 'Zancadas',                      muscleGroup: 'Piernas',  equipment: 'Mancuernas' },
    { name: 'Extensión de Cuádriceps',       muscleGroup: 'Piernas',  equipment: 'Máquina' },
    { name: 'Curl de Isquiotibiales',        muscleGroup: 'Piernas',  equipment: 'Máquina' },
    { name: 'Peso Muerto Rumano',            muscleGroup: 'Piernas',  equipment: 'Barra' },
    { name: 'Elevación de Gemelos',          muscleGroup: 'Piernas',  equipment: 'Máquina' },
    { name: 'Plancha',                       muscleGroup: 'Core',     equipment: 'Peso Corporal' },
    { name: 'Crunches',                      muscleGroup: 'Core',     equipment: 'Peso Corporal' },
    { name: 'Elevación de Piernas',          muscleGroup: 'Core',     equipment: 'Peso Corporal' },
    { name: 'Russian Twists',               muscleGroup: 'Core',     equipment: 'Peso Corporal' },
    { name: 'Carrera en Cinta',              muscleGroup: 'Cardio',   equipment: 'Máquina' },
    { name: 'Bicicleta Estática',            muscleGroup: 'Cardio',   equipment: 'Máquina' },
    { name: 'Remo Ergómetro',                muscleGroup: 'Cardio',   equipment: 'Máquina' },
    { name: 'Saltar la Cuerda',              muscleGroup: 'Cardio',   equipment: 'Cuerda' },
    { name: 'Burpees',                       muscleGroup: 'Cardio',   equipment: 'Peso Corporal' },
  ];

  for (const ex of exerciseDefs) {
    await prisma.exercise.upsert({
      where: { name: ex.name },
      update: { muscleGroup: ex.muscleGroup, equipment: ex.equipment },
      create: ex,
    });
  }
  console.log(`✅ ${exerciseDefs.length} ejercicios en catálogo`);

  // ─── Rutinas predefinidas para Miguel ────────────────────────────────────────
  const routineDefs = [
    {
      name: 'Push — Empuje',
      description: 'Pecho, hombros y tríceps',
      exercises: [
        { name: 'Press de Banca',                sets: 4, reps: 8  },
        { name: 'Press Inclinado con Mancuernas', sets: 3, reps: 10 },
        { name: 'Press Militar',                  sets: 3, reps: 10 },
        { name: 'Elevaciones Laterales',          sets: 3, reps: 15 },
        { name: 'Extensión de Tríceps Polea',     sets: 3, reps: 12 },
        { name: 'Press Francés',                  sets: 3, reps: 10 },
      ],
    },
    {
      name: 'Pull — Jalón',
      description: 'Espalda y bíceps',
      exercises: [
        { name: 'Dominadas',           sets: 4, reps: 8  },
        { name: 'Remo con Barra',      sets: 4, reps: 8  },
        { name: 'Jalón al Pecho',      sets: 3, reps: 12 },
        { name: 'Curl con Barra',      sets: 3, reps: 10 },
        { name: 'Curl Martillo',       sets: 3, reps: 12 },
      ],
    },
    {
      name: 'Legs — Piernas',
      description: 'Cuádriceps, isquios y gemelos',
      exercises: [
        { name: 'Sentadilla',               sets: 4, reps: 8  },
        { name: 'Prensa de Piernas',        sets: 3, reps: 12 },
        { name: 'Zancadas',                 sets: 3, reps: 12 },
        { name: 'Curl de Isquiotibiales',   sets: 3, reps: 12 },
        { name: 'Elevación de Gemelos',     sets: 4, reps: 20 },
      ],
    },
    {
      name: 'Full Body',
      description: 'Cuerpo completo en una sesión',
      exercises: [
        { name: 'Sentadilla',      sets: 3, reps: 10 },
        { name: 'Press de Banca',  sets: 3, reps: 10 },
        { name: 'Peso Muerto',     sets: 3, reps: 8  },
        { name: 'Press Militar',   sets: 3, reps: 10 },
        { name: 'Dominadas',       sets: 3, reps: 8  },
        { name: 'Plancha',         sets: 3, reps: 1  },
      ],
    },
  ];

  // Look up exercise IDs for the routines
  const exerciseMap = new Map<string, string>();
  const allExercises = await prisma.exercise.findMany({ select: { id: true, name: true } });
  for (const e of allExercises) exerciseMap.set(e.name, e.id);

  for (const r of routineDefs) {
    const existing = await prisma.routine.findFirst({ where: { userId: miguel.id, name: r.name } });
    if (!existing) {
      await prisma.routine.create({
        data: {
          userId: miguel.id,
          name: r.name,
          description: r.description,
          exercises: r.exercises.map(e => ({
            exerciseId: exerciseMap.get(e.name) ?? '',
            name: e.name,
            sets: e.sets,
            reps: e.reps,
          })) as import('@prisma/client').Prisma.JsonArray,
          targetDays: [] as import('@prisma/client').Prisma.JsonArray,
          estimatedDuration: Math.round(r.exercises.reduce((a, e) => a + e.sets * 2.5, 0)),
        },
      });
    }
  }
  console.log(`✅ ${routineDefs.length} rutinas predefinidas para Miguel`);

  // ─── Temporada inicial ───────────────────────────────────────────────────────
  const existingSeason = await prisma.season.findFirst({ where: { isActive: true } });
  if (!existingSeason) {
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await prisma.season.create({
      data: {
        name:        'La Temporada del Hierro',
        description: 'El Dragón de la Pereza acecha el reino. ¡Únanse héroes para derrotarlo!',
        bossName:    'El Dragón de la Pereza',
        bossHp:      1_000_000,
        currentHp:   1_000_000,
        startDate:   now,
        endDate,
        isActive:    true,
        rewards:     [{ type: 'gold', amount: 500 }, { type: 'xp', amount: 1000 }] as import('@prisma/client').Prisma.JsonArray,
      },
    });
    console.log('✅ Temporada inicial creada: El Dragón de la Pereza (1,000,000 HP)');
  } else {
    console.log('✅ Temporada activa ya existe:', existingSeason.bossName);
  }

  console.log('');
  console.log('🎉 Seed completo — Usuario en nivel 1 desde cero:');
  console.log('   Email: miguel@lifequest.com');
  console.log('   Password: test1234');
  console.log('   Nivel: 1 | XP: 0/100 | Gold: 0 | Racha: 0 días');
  console.log('   onboardingCompleted: false → irá al onboarding');
}

main()
  .catch((e) => { console.error('❌ Error en seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
