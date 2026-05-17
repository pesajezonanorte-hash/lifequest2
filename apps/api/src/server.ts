import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import router from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { initScheduler } from './jobs/scheduler';

const app = express();
const PORT = process.env.PORT ?? 3001;

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  process.env.CORS_ORIGIN_2,
  'http://localhost:5173',
  'http://localhost:3000',
  'https://tourmaline-sherbet-90125b.netlify.app',
].filter(Boolean) as string[];

// ─── Seguridad ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Root-level health check (for Railway healthcheck probe)
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ─── Parsing ─────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Rutas ───────────────────────────────────────────────────────────────────
app.use('/api/v1', router);

// ─── Error handling ──────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('  ╔════════════════════════════════════╗');
    console.log('  ║  ⚔️  LifeQuest API  •  v2.0.0      ║');
    console.log(`  ║  🏰 http://localhost:${PORT}/api/v1   ║`);
    console.log('  ╚════════════════════════════════════╝');
    console.log('');
    if (process.env.NODE_ENV !== 'test') {
      initScheduler();
    }
  });
}

export default app;
