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

# Test PostgreSQL connection
echo "Testing PostgreSQL connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    echo "Error: Could not connect to PostgreSQL database."
    echo "Please check your DATABASE_URL value. It should be in the format:"
    echo "postgresql://username:password@hostname:port/database"
    exit 1
fi
echo "PostgreSQL connection successful!"

SQLITE_DB="./data/db.sqlite"
if [ ! -f "$SQLITE_DB" ]; then
    echo "Error: SQLite database file not found at $SQLITE_DB"
    exit 1
fi

echo "Step 1: Using project's Drizzle Kit..."
# Use npx to run the locally installed drizzle-kit
npx drizzle-kit generate --schema=./shared/schema.ts --out=./migrations --dialect=pg

echo "Step 2: Preparing to migrate data..."
# Extract table names from SQLite
TABLES=$(sqlite3 $SQLITE_DB ".tables")

# Create a temporary directory for SQL dumps
mkdir -p ./temp_migration

for TABLE in $TABLES; do
    echo "Exporting table: $TABLE"
    
    # Export data from SQLite to CSV
    sqlite3 -header -csv $SQLITE_DB "SELECT * FROM $TABLE;" > "./temp_migration/${TABLE}.csv"
    
    # Create table structure in PostgreSQL and import CSV
    echo "Importing data into PostgreSQL table: $TABLE"
    
    # Use \COPY command in psql to import data
    if ! psql "$DATABASE_URL" -c "\COPY $TABLE FROM './temp_migration/${TABLE}.csv' CSV HEADER;" ; then
        echo "Error importing table $TABLE. Check connection string and permissions."
        echo "You can retry importing this table manually with:"
        echo "psql \"$DATABASE_URL\" -c \"\COPY $TABLE FROM './temp_migration/${TABLE}.csv' CSV HEADER;\""
    fi
done

echo "Migration completed!"
echo "Cleaning up temporary files..."
rm -rf ./temp_migration

echo "PostgreSQL migration completed successfully."
