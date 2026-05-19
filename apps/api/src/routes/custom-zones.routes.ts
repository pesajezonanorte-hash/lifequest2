import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { generateText, hasAIProvider } from '../lib/ai';

const router = Router();
router.use(requireAuth);

// List all custom zones for user
router.get('/', async (req, res, next) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const zones = await prisma.customZone.findMany({
      where: { userId, isActive: true },
      include: {
        quests: { where: { status: 'ACTIVE' }, select: { id: true, title: true, status: true } },
        habits: { where: { isActive: true }, select: { id: true, title: true, currentStreak: true } },
      },
      orderBy: { order: 'asc' },
    });
    res.json(zones);
  } catch (err) { next(err); }
});

// Get single zone content
router.get('/:id', async (req, res, next) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const zone = await prisma.customZone.findFirst({
      where: { id: req.params.id, userId },
      include: {
        quests: { where: { status: 'ACTIVE' } },
        habits: { where: { isActive: true } },
      },
    });
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    res.json(zone);
  } catch (err) { next(err); }
});

// Create zone
router.post('/', async (req, res, next) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const { name, description, icon, accentColor, isMeasurable, measureMetric, weeklyXpGoal, sections, actions } = req.body;

    // Check limit: max 10 active zones
    const count = await prisma.customZone.count({ where: { userId, isActive: true } });
    if (count >= 10) return res.status(400).json({ error: 'Máximo 10 zonas activas' });

    const maxOrder = await prisma.customZone.aggregate({ where: { userId }, _max: { order: true } });
    const zone = await prisma.customZone.create({
      data: {
        userId, name, description: description ?? null,
        icon: icon ?? '📍', accentColor: accentColor ?? '#ec4899',
        isMeasurable: isMeasurable ?? false,
        measureMetric: measureMetric ?? null,
        weeklyXpGoal: weeklyXpGoal ?? null,
        sections: sections ?? null,
        actions: actions ?? null,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    });
    res.status(201).json(zone);
  } catch (err) { next(err); }
});

// Update zone
router.patch('/:id', async (req, res, next) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const { name, description, icon, accentColor, isMeasurable, measureMetric, weeklyXpGoal, sections, actions, content } = req.body;
    const zone = await prisma.customZone.update({
      where: { id: req.params.id, userId },
      data: { name, description, icon, accentColor, isMeasurable, measureMetric, weeklyXpGoal, sections, actions, content },
    });
    res.json(zone);
  } catch (err) { next(err); }
});

// Soft delete zone
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = (req as AuthRequest).userId!;
    await prisma.customZone.update({ where: { id: req.params.id, userId }, data: { isActive: false } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Reorder zones
router.post('/reorder', async (req, res, next) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const { orderedIds } = req.body as { orderedIds: string[] };
    await Promise.all(orderedIds.map((id, idx) =>
      prisma.customZone.updateMany({ where: { id, userId }, data: { order: idx } })
    ));
    res.json({ success: true });
  } catch (err) { next(err); }
});

// AI zone suggestion wizard (step 1)
router.post('/suggest', async (req, res, next) => {
  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: 'description required' });

    const prompt = `El usuario quiere crear una zona personalizada en LifeQuest.
Descripción: "${description}"

Responde SOLO con JSON válido, sin markdown, sin explicaciones:
{
  "name": "nombre corto (max 20 chars)",
  "description": "una línea descriptiva",
  "icon": "un emoji",
  "color": "#6366f1",
  "isMeasurable": true,
  "measureReason": "explicación breve",
  "sections": [
    {"type": "quests", "title": "Misiones", "description": "Objetivos de la zona"},
    {"type": "habits", "title": "Hábitos", "description": "Rutinas relacionadas"}
  ],
  "habits": [{"title": "nombre del hábito", "frequency": "daily"}],
  "actions": [{"label": "texto del botón", "type": "new_quest"}]
}`;

    if (!hasAIProvider()) return res.status(503).json({ error: 'IA no configurada' });
    const raw = await generateText([{ role: 'user', content: prompt }], { temperature: 0.7, maxTokens: 800 });
    let suggestion: unknown;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      suggestion = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      suggestion = { name: 'Mi Zona', description: description, icon: '📍', color: '#6366f1', isMeasurable: false };
    }

    res.json(suggestion);
  } catch (err) { next(err); }
});

export default router;
