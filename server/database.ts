import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

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

  try {
    const sql = neon(databaseUrl);
    db = drizzle(sql, { schema });
    console.log("Neon database connected successfully");
    // In production we'd run migrations and seed data here if needed.
  } catch (error) {
    console.error("Neon database connection failed:", error);
    // Fall back to in-memory storage
  }
}