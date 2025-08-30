#!/bin/bash
set -e

echo "=== MindfulMe Complete Build Script ==="

echo "📦 Installing ALL dependencies (including dev dependencies)..."
npm install --include=dev

echo "🏗️ Building frontend..."
npx vite build

echo "🏗️ Building backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✅ Build completed successfully!"