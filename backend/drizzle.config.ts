import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "../.env" });

export default defineConfig({
  dialect: "postgresql",
  // Schema points to shared package source
  schema: "../shared/src/schema.ts",
  // Migrations output directory
  out: "./migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
  verbose: true,
  strict: true,
});
