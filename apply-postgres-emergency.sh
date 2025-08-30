#!/bin/bash

# This script can be used to apply the PostgreSQL schema in an emergency situation
# when the regular migrations fail or you need to recreate the schema from scratch.

set -e

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set."
  echo "Usage: DATABASE_URL=postgres://... ./apply-postgres-emergency.sh"
  exit 1
fi

echo "=== Applying emergency PostgreSQL schema ==="

# Apply schema using psql
psql "$DATABASE_URL" << 'EOF'
-- users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL
);

-- journals table
CREATE TABLE IF NOT EXISTS journals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created TEXT NOT NULL,
  mood TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
EOF

echo "✅ PostgreSQL schema applied successfully!"
