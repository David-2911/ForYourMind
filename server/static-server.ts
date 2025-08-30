import express from 'express';
import path from 'path';

// Serve static assets without relying on __dirname in ESM
export function serveStatic(app: any) {
  // Resolve from project root so bundling doesn't break pathing
  const distPath = path.resolve(process.cwd(), 'dist', 'public');

  console.log(`Serving static files from: ${distPath}`);

  // Serve static files
  app.use(express.static(distPath));

  // Serve index.html for all non-API routes (for client-side routing)
  app.get('*', (req: any, res: any, next: any) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }

    res.sendFile(path.join(distPath, 'index.html'));
  });
}
