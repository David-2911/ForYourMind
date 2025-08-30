#!/bin/bash
set -e

echo "=== MindfulMe Production Build Script ==="

# Install ALL dependencies including dev dependencies
echo "📦 Installing dependencies..."
npm install --include=dev

# Create server/static-server.ts file to handle production static file serving
echo "🔧 Creating static file server module..."
cat > server/static-server.ts << 'EOF'
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
EOF

# Build frontend
echo "🏗️ Building frontend..."
npx vite build

# Build backend
echo "🏗️ Building backend..."
npx esbuild server/index.ts server/static-server.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Create a startup script for production
echo "🔧 Creating production startup script..."
cat > dist/start.js << 'EOF'
// Simple startup script for production
import './index.js';
EOF

echo "✅ Build completed successfully!"
