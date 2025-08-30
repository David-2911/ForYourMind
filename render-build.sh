#!/bin/bash
set -e

echo "🚀 Starting Render build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install build tools explicitly
echo "🔧 Installing build tools..."
npm install --save-dev vite esbuild

# Apply database migrations if DATABASE_URL is set
if [ ! -z "$DATABASE_URL" ]; then
  echo "🗄️ Applying database migrations..."
  # Check if psql is available
  if command -v psql &> /dev/null; then
    # Apply migrations using our script
    ./apply-postgres-migrations.sh
  else
    echo "⚠️ psql command not found - migrations will be skipped"
    echo "Please ensure PostgreSQL client tools are installed in your build environment"
  fi
else
  echo "⚠️ DATABASE_URL not set - migrations will be skipped"
fi

# Build client
echo "🏗️ Building client..."
npx vite build

# Build server
echo "🏗️ Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✅ Build completed successfully!"
