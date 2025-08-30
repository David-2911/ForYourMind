#!/bin/bash

# This script runs Drizzle migrations on PostgreSQL for Render deployment

echo "MindfulMe: PostgreSQL Schema Migration Tool"
echo "------------------------------------------"

# Check for required tools
if ! command -v psql &> /dev/null; then
    echo "Error: PostgreSQL client (psql) not found. Please install it first."
    exit 1
fi

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable not set."
    echo "Please set DATABASE_URL to your PostgreSQL connection string."
    exit 1
fi

# Test PostgreSQL connection
echo "Testing PostgreSQL connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    echo "Error: Could not connect to PostgreSQL database."
    echo "Please check your DATABASE_URL value. It should be in the format:"
    echo "postgresql://username:password@hostname:port/database"
    exit 1
fi
echo "PostgreSQL connection successful!"

# Install Drizzle Kit locally if needed
echo "Step 1: Ensuring Drizzle dependencies are installed..."
npm install --save-dev drizzle-kit

# Generate and run PostgreSQL migrations
echo "Step 2: Generating PostgreSQL migration schema..."
npx drizzle-kit generate --schema=./shared/schema.ts --out=./migrations --dialect=pg

echo "Step 3: Applying migrations to PostgreSQL database..."
npx drizzle-kit push

echo "Schema migration completed successfully!"
