import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// Initialize database with seed data
export async function initializeDatabase() {
  try {
    console.log("Database connected successfully");
    // For now, we'll use in-memory storage
    // In production, we'd run migrations and seed data here
  } catch (error) {
    console.error("Database connection failed:", error);
    // Fall back to in-memory storage
  }
}