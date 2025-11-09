// @ts-nocheck
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { registerRoutes } from './routes';
import { initializeDatabase } from './database';

export async function buildApp(): Promise<Express> {
  const app = express();

  // trust proxy so secure cookies work behind proxies/serverless
  app.set('trust proxy', 1);

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser(process.env.COOKIE_SECRET));

  // CORS
  const isDev = process.env.NODE_ENV !== 'production';
  const corsOptions = {
    origin: isDev ? 'http://localhost:5173' : (process.env.CORS_ORIGIN || undefined),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
  app.use(cors(corsOptions));

  // simple request log for API
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      if (req.path.startsWith('/api')) {
        const ms = Date.now() - start;
        // keep compact logs in serverless
        console.log(`${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
      }
    });
    next();
  });

  // health endpoint
  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // Initialize DB once at cold start
  try { await initializeDatabase(); } catch (e) { console.error('DB init error (non-fatal):', e); }

  // Register routes
  await registerRoutes(app);

  // error handler to always send JSON
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err?.status || err?.statusCode || 500;
    const message = err?.message || 'Internal Server Error';
    res.status(status).json({ message });
    console.error('Server error:', err);
  });

  return app;
}
