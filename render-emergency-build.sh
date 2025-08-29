#!/bin/bash
# This script forces a clean rebuild of the project
set -e

# Clear node_modules and other potential cache issues
echo "🧹 Cleaning project..."
rm -rf node_modules
rm -rf dist
rm -rf .vite

# Install dependencies with a clean slate
echo "📦 Installing dependencies..."
npm ci || npm install

# Explicitly install build tools
echo "🔧 Installing build tools..."
npm install --no-save vite@latest esbuild@latest

# Build frontend and backend
echo "🏗️ Building frontend..."
node ./node_modules/vite/bin/vite.js build

echo "🏗️ Building backend..."
node ./node_modules/esbuild/bin/esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Verify build artifacts
if [ -d "./dist" ] && [ -f "./dist/index.js" ]; then
  echo "✅ Build completed successfully!"
else
  echo "❌ Build failed! No dist/index.js found."
  exit 1
fi
