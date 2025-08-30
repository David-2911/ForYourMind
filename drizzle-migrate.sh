#!/bin/bash

# This script runs Drizzle migrations on PostgreSQL using drizzle.config.ts
# Requires DATABASE_URL to be set in the environment

echo "MindfulMe: PostgreSQL Database Migration using drizzle.config.ts"
echo "-------------------------------------------------------------"

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

# Run Drizzle migration using the drizzle.config.ts file
echo "Running PostgreSQL migrations..."
npx drizzle-kit generate
npx drizzle-kit push

echo "Migration completed successfully!"
