// Vercel Serverless entry that wraps the existing Express app
// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from '../server/app';

let cached: any;

async function getApp() {
  if (!cached) cached = await buildApp();
  return cached;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight at edge of function (helps when framework middlewares are skipped)
  const isProd = process.env.NODE_ENV === 'production';
  const origin = isProd ? (process.env.CORS_ORIGIN || '') : 'http://localhost:5173';
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // Only set credentials when origin is specific (not '*')
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') return res.status(204).end();
  }

  const app = await getApp();
  // Pass through to Express
  return app(req as any, res as any);
}
