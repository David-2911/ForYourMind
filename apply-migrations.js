// apply-migrations.js
// This script applies migrations to the PostgreSQL database
import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('MindfulMe: PostgreSQL Migration Tool');
  console.log('------------------------------------');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable not set');
    process.exit(1);
  }

  console.log('Connecting to PostgreSQL database...');
  
  try {
    // Configure postgres client with SSL
    const client = postgres(databaseUrl, { 
      ssl: { rejectUnauthorized: false },
      max: 1
    });

    const db = drizzle(client);

    console.log('Connected to PostgreSQL database');
    console.log('Applying migrations...');

    const migrationsFolder = path.join(__dirname, 'migrations');

    // Run migrations
    await migrate(db, { migrationsFolder });

    console.log('Migrations applied successfully');
    await client.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
