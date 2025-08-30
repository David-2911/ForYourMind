import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Create __dirname equivalent for ES modules
export function serveStatic(app: any) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // In production, serve from dist/public
  const distPath = path.join(__dirname, '../public');
  
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
