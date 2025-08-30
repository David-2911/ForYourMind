#!/bin/bash

# Script to apply SQL migrations to Postgres DB
echo "Applying PostgreSQL migrations..."

# Check if DATABASE_URL environment variable is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set"
  echo "Please set the DATABASE_URL environment variable to your PostgreSQL database URL"
  exit 1
fi

# Apply all migration files in sequence
echo "Applying migration 0000_overjoyed_human_torch.sql..."
psql "$DATABASE_URL" -f ./migrations/0000_overjoyed_human_torch.sql

echo "Applying migration 0001_refresh_tokens.sql..."
psql "$DATABASE_URL" -f ./migrations/0001_refresh_tokens.sql

echo "Migrations applied successfully!"
