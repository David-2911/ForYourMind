import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@mindfulme/shared/schema";

// We defer creating a Neon DB connection until runtime so that running with
// USE_SQLITE or SQLITE_DB_PATH does not attempt to connect to Neon when not
// configured. `db` will be undefined when not connected to Neon.
export let db: any = undefined;

export async function initializeDatabase() {
  // If the app is configured to use SQLite, skip Neon initialization.
  if (process.env.USE_SQLITE || process.env.SQLITE_DB_PATH) {
    console.log("USE_SQLITE detected — skipping Neon initialization");
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("DATABASE_URL not set — skipping Neon initialization");
    return;
  }

  // Only initialize Neon HTTP driver when the URL clearly targets Neon, or explicitly requested.
  const useNeon = process.env.USE_NEON === 'true' || /neon/i.test(databaseUrl);
  if (!useNeon) {
    console.log("Non-Neon DATABASE_URL detected — skipping Neon HTTP initialization");
    return;
  }

  try {
    const sql = neon(databaseUrl);
    db = drizzle(sql, { schema });
    console.log("Neon database connected successfully");

    // Check if all required tables exist
    try {
      const tableResult = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
      const tables = tableResult.map(r => r.table_name);
      
      // Log detected tables
      console.log("Detected database tables:", tables);
      
      // Check for specific tables we need
      const requiredTables = ['users', 'journals', 'refresh_tokens'];
      const missingTables = requiredTables.filter(table => !tables.includes(table));
      
      if (missingTables.length > 0) {
        console.warn(`Missing required tables: ${missingTables.join(', ')}`);
        console.warn("Schema may not be fully applied. Make sure migrations have been run.");
      } else {
        console.log("All required tables found in the database");
      }
    } catch (error) {
      console.error("Error checking database tables:", error);
    }
  } catch (error) {
    console.error("Neon database connection failed:", error);
    // Fall back to in-memory storage
  }
}