#!/bin/bash
# This script provides a simplified ESM-compatible server build
set -e

echo "=== MindfulMe Emergency Build Script ==="

# Clear node_modules and other potential cache issues
echo "🧹 Cleaning project..."
rm -rf node_modules
rm -rf dist
rm -rf .vite

# Install ALL dependencies including dev dependencies
echo "📦 Installing dependencies..."
npm install --include=dev

# Build frontend
echo "🏗️ Building frontend..."
npx vite build

# Create a simple ES module server file directly
echo "🔧 Creating ESM-compatible server..."
cat > dist/index.js << 'EOF'
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';
import { initializeDatabase } from './database.js';
import routes from './routes.js';
import { getStorageForEnvironment } from './storage.js';

// ESM compatibility - create __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function log(message) {
  console.log(`[server] ${message}`);
}

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// CORS config
const isDev = process.env.NODE_ENV !== 'production';
const corsOptions = {
  origin: isDev 
    ? 'http://localhost:5173' 
    : [
        process.env.CORS_ORIGIN || 'https://mindfulme-web.onrender.com', 
        'https://mindfulme-api.onrender.com'
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Show environment variables
console.log("Environment: ", {
  NODE_ENV: process.env.NODE_ENV,
  USE_SQLITE: process.env.USE_SQLITE,
  DATABASE_URL: process.env.DATABASE_URL ? "Set" : "Not set"
});

// Initialize the server
async function startServer() {
  // Initialize database connection
  await initializeDatabase();
  
  // Setup storage
  const storage = getStorageForEnvironment();
  console.log("Using storage type:", storage.constructor.name);
  
  // Initialize API routes
  routes(app, storage);
  
  // Create HTTP server
  const server = http.createServer(app);
  
  // Serve static files
  const publicDir = path.join(__dirname, 'public');
  console.log(`Serving static files from: ${publicDir}`);
  
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    
    // Catch-all route for SPA
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      
      const indexPath = path.join(publicDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Frontend not built properly');
      }
    });
  } else {
    console.error(`Static directory not found: ${publicDir}`);
  }
  
  // Start the server
  const port = parseInt(process.env.PORT || '10000', 10);
  server.listen(port, '0.0.0.0', () => {
    log(`Server running on port ${port}`);
  });
}

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
EOF

# Run part 2 of the build script to create all required modules
if [ -f "./render-emergency-build-part2.sh" ]; then
  echo "🔄 Running build part 2..."
  ./render-emergency-build-part2.sh
else
  echo "❌ render-emergency-build-part2.sh not found. Build incomplete!"
  exit 1
fi

# Verify build artifacts
if [ -d "./dist" ] && [ -f "./dist/index.js" ] && [ -f "./dist/database.js" ]; then
  echo "✅ Build completed successfully!"
else
  echo "❌ Build failed! Essential files are missing."
  exit 1
fi
