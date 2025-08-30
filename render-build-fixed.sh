#!/bin/bash
set -e

echo "=== MindfulMe Render Build Script ==="

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

# Create patched server/index.ts with explicit ESM handling
echo "🔧 Creating patched server/index.ts..."
cat > server/index.patched.ts << 'EOF'
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { registerRoutes } from "./routes";
import { initializeDatabase } from "./database";
import path from "path";
import { fileURLToPath } from 'url';

// ESM compatibility - create __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple log function to replace vite.log dependency
function log(message: string) {
  console.log(`[server] ${message}`);
}

export const app = express();
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

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database connection
  await initializeDatabase();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Ensure we always respond with JSON, never HTML
    res.status(status).json({ 
      message,
      error: app.get("env") === "development" ? err.stack : undefined
    });
    
    // Log the error but don't throw it (which would crash the server)
    console.error("Server error:", err);
  });

  // In development, use Vite; in production, use static server
  if (app.get("env") === "development") {
    try {
      const { setupVite } = await import("./vite");
      await setupVite(app, server);
    } catch (error) {
      console.error("Failed to setup Vite:", error);
    }
  } else {
    try {
      // Import static-server using path.join for ESM compatibility
      const { serveStatic } = await import("./static-server.js");
      serveStatic(app);
      console.log("Static server initialized successfully");
    } catch (error) {
      console.error("Error setting up static server:", error);
      
      // Fallback static serving if module import fails
      console.log("Using fallback static file serving");
      const distPath = path.join(__dirname, '../public');
      app.use(express.static(distPath));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/')) return next();
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  // Start the server
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
EOF

# Build backend using the patched file
echo "🏗️ Building backend..."
npx esbuild server/index.patched.ts server/static-server.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Rename the patched file to index.js
mv dist/index.patched.js dist/index.js

# Output environment info for debugging
echo "🔧 Environment settings:"
echo "NODE_ENV: $NODE_ENV"
echo "USE_SQLITE: $USE_SQLITE"
echo "DATABASE_URL exists: $(if [ -n "$DATABASE_URL" ]; then echo "yes"; else echo "no"; fi)"

echo "✅ Build completed successfully!"

# Build backend
echo "🏗️ Building backend..."
./node_modules/.bin/esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✅ Build completed successfully!"
