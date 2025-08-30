import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from 'postgres';
import * as schema from "@shared/schema";

// db may be undefined when using file-based SQLite or in-memory storage
export let db: any = undefined;

export async function initializeDatabase() {
  // If the app is configured to use SQLite, skip Postgres/Neon initialization.
  if (process.env.USE_SQLITE || process.env.SQLITE_DB_PATH) {
    console.log("USE_SQLITE detected — skipping server DB initialization");
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("DATABASE_URL not set — skipping DB initialization");
    return;
  }

  try {
    // If DATABASE_URL contains 'neon', prefer the neon-driver (keeps previous behavior)
    if (databaseUrl.includes('neon')) {
      const sql = neon(databaseUrl);
      db = drizzleNeon(sql, { schema });
      console.log("Neon database connected successfully");
      return;
    }

    // Otherwise use postgres driver
    const sql = postgres(databaseUrl, { ssl: { rejectUnauthorized: false } });
    db = drizzle(sql, { schema });
    console.log("Postgres database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    // Fall back to in-memory storage
  }
}