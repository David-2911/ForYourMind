#!/bin/bash
set -e

echo "=== MindfulMe Render Build Script ==="

# Clean installation
echo "📦 Installing dependencies..."
npm ci || npm install

# Install Vite explicitly using npx
echo "🔧 Installing build tools..."
npm install vite esbuild --no-save

# Export NODE_ENV
export NODE_ENV=production

# Build frontend first
echo "🏗️ Building frontend..."
./node_modules/.bin/vite build

# Build backend
echo "🏗️ Building backend..."
./node_modules/.bin/esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✅ Build completed successfully!"
