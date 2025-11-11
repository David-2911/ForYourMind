#!/bin/bash

# ============================================================
# Production Startup Script for Backend
# ============================================================
# This script:
# 1. Runs database migrations
# 2. Starts the backend server
# ============================================================

set -e

echo "🚀 Starting MindfulMe Backend in Production Mode"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  WARNING: DATABASE_URL is not set. Using fallback storage."
else
    echo "✅ DATABASE_URL is set"
    
    # Run database migrations
    echo ""
    echo "📊 Running database migrations..."
    echo "============================================================"
    
    # Check if drizzle-kit is available
    if command -v drizzle-kit &> /dev/null; then
        cd /opt/render/project/src/backend
        npx drizzle-kit migrate || echo "⚠️  Migration failed or no migrations to run"
    else
        echo "⚠️  drizzle-kit not found, skipping migrations"
    fi
    
    echo "============================================================"
    echo ""
fi

# Start the server
echo "🚀 Starting backend server..."
echo "============================================================"
NODE_ENV=production node dist/index.js
