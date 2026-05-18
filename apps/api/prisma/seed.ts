import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Inicializando base de datos limpia...');

  // ─── 30 Achievements (catálogo solamente) ────────────────────────────────────
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
    { name: 'Russian Twists',                muscleGroup: 'Core',     equipment: 'Peso Corporal' },
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

  // ─── Temporada inicial ───────────────────────────────────────────────────────
  const now = new Date();
  const seasonEnd = new Date(now);
  seasonEnd.setMonth(seasonEnd.getMonth() + 1);

  await prisma.season.upsert({
    where: { id: 'season_iron' },
    update: { bossHp: 1_000_000, currentHp: 1_000_000 },
    create: {
      id: 'season_iron',
      name: 'La Temporada del Hierro',
      description: 'Primera temporada global. Todos contra un enemigo épico.',
      bossName: 'Rey del Hierro',
      bossHp: 1_000_000,
      currentHp: 1_000_000,
      startDate: now,
      endDate: seasonEnd,
    },
  });

  console.log('✅ Temporada "La Temporada del Hierro" lista (1M HP)');

  console.log('\n🎉 Base de datos limpia e inicializada correctamente!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Error en seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
