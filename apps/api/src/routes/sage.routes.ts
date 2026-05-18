import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { sageLimiter } from '../middleware/rate-limit.middleware';
import * as sage from '../controllers/sage.controller';

const router = Router();
router.use(requireAuth);
router.use(sageLimiter);

router.post('/chat',             sage.chat);
router.post('/suggest-quests',   sage.suggestQuests);
router.post('/analyze-habits',   sage.analyzeHabits);
router.post('/analyze-finances', sage.analyzeFinances);
router.post('/plan-workout',     sage.planWorkout);
router.get('/daily-summary',     sage.dailySummary);
router.get('/daily-tip',         sage.dailyTip);
router.get('/rate-info',         sage.rateInfo);

export default router;
