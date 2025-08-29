#!/bin/bash
set -e

echo "🚀 Starting Render build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install build tools explicitly
echo "🔧 Installing build tools..."
npm install --save-dev vite esbuild

# Build client
echo "🏗️ Building client..."
npx vite build

# Build server
echo "🏗️ Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✅ Build completed successfully!"
