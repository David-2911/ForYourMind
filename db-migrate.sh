#!/bin/bash

# This script helps migrate data from SQLite to PostgreSQL for Vercel deployment
# Prerequisites: 
# - sqlite3 command-line tool
# - PostgreSQL client (psql)
# - A valid PostgreSQL connection string in DATABASE_URL

echo "MindfulMe: SQLite to PostgreSQL Migration Tool"
echo "----------------------------------------------"

# Check for required tools
if ! command -v sqlite3 &> /dev/null; then
    echo "Error: sqlite3 command-line tool not found. Please install it first."
    exit 1
fi

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

SQLITE_DB="./data/db.sqlite"
if [ ! -f "$SQLITE_DB" ]; then
    echo "Error: SQLite database file not found at $SQLITE_DB"
    exit 1
fi

echo "Step 1: Installing Drizzle Kit if not already installed..."
npm install -g drizzle-kit

echo "Step 2: Generating PostgreSQL migration schema..."
drizzle-kit generate:pg --out=migrations

echo "Step 3: Preparing to migrate data..."
# Extract table names from SQLite
TABLES=$(sqlite3 $SQLITE_DB ".tables")

# Create a temporary directory for SQL dumps
mkdir -p ./temp_migration

for TABLE in $TABLES; do
    echo "Exporting table: $TABLE"
    
    # Export data from SQLite to CSV
    sqlite3 -header -csv $SQLITE_DB "SELECT * FROM $TABLE;" > "./temp_migration/${TABLE}.csv"
    
    # Create table structure in PostgreSQL and import CSV
    # (This is a simplified approach - in a real scenario, you might need more sophisticated handling)
    echo "Importing data into PostgreSQL table: $TABLE"
    
    # Use \COPY command in psql to import data
    psql "$DATABASE_URL" -c "\COPY $TABLE FROM './temp_migration/${TABLE}.csv' CSV HEADER;"
done

echo "Migration completed!"
echo "Cleaning up temporary files..."
rm -rf ./temp_migration

echo "PostgreSQL migration completed successfully."
