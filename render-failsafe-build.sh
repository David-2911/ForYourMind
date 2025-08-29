#!/bin/bash
set -e

echo "🚀 Running failsafe build script for Render..."

# Install build tools globally (just to be sure)
echo "📦 Installing build tools globally..."
npm install -g vite esbuild

# Install dependencies
echo "📦 Installing project dependencies..."
npm install

# Build client
echo "🏗️ Building frontend..."
npx vite build

# Build server
echo "🏗️ Building backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✅ Build completed successfully!"
