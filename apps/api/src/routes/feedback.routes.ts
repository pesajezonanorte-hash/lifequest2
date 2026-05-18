import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { requireAuth, type AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

const FEEDBACK_DIR = path.join(process.cwd(), '.feedback');
const FEEDBACK_FILE = path.join(FEEDBACK_DIR, 'entries.jsonl');

interface FeedbackEntry {
  userId: string;
  email?: string;
  kind: 'bug' | 'idea' | 'other';
  message: string;
  url?: string;
  createdAt: string;
}

router.post('/', async (req, res) => {
  try {
    const { kind, message, url } = req.body as { kind?: string; message?: string; url?: string };
    if (!message || typeof message !== 'string' || message.trim().length < 3) {
      res.status(400).json({ error: 'Mensaje requerido (mínimo 3 caracteres).' });
      return;
    }
    const sanitized = message.trim().slice(0, 2000);
    const k: FeedbackEntry['kind'] = kind === 'bug' || kind === 'idea' ? kind : 'other';

    const entry: FeedbackEntry = {
      userId: (req as AuthRequest).userId!,
      email: (req as AuthRequest).userEmail,
      kind: k,
      message: sanitized,
      url: typeof url === 'string' ? url.slice(0, 500) : undefined,
      createdAt: new Date().toISOString(),
    };

    await fs.mkdir(FEEDBACK_DIR, { recursive: true });
    await fs.appendFile(FEEDBACK_FILE, JSON.stringify(entry) + '\n', 'utf8');

    res.json({ ok: true });
  } catch (e) {
    console.error('[feedback] save failed:', e);
    res.status(500).json({ error: 'No se pudo guardar el feedback.' });
  }
});

export default router;
