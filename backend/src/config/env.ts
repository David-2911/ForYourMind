import { z } from "zod";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from root .env file
dotenv.config({ path: resolve(__dirname, "../../../.env") });

/**
 * Environment variable validation schema using Zod
 * This ensures type-safe access to environment variables
 * and fails fast if required variables are missing
 */
const envSchema = z.object({
  // Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Server
  PORT: z.string().default("5000").transform(Number),

  // Database
  DATABASE_URL: z.string().optional(),
  USE_SQLITE: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .default("false"),
  SQLITE_DB_PATH: z.string().default("./data/db.sqlite"),

  // Authentication
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("7d"),
  COOKIE_SECRET: z
    .string()
    .min(32, "COOKIE_SECRET must be at least 32 characters")
    .optional(),

  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:5173"),

  // Request Limits
  MAX_REQUEST_SIZE: z.string().default("10mb"),

  // Logging
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  DEBUG: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .default("false"),
  LOG_SQL_QUERIES: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .default("false"),

  // Email (Optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform(Number),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .default("false"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // External Services (Optional)
  SENTRY_DSN: z.string().optional(),
  REDIS_URL: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_REGION: z.string().optional(),

  // Feature Flags
  DISABLE_AUTH: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .default("false"),
  ENABLE_PERFORMANCE_MONITORING: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .default("false"),
});

/**
 * Validate and parse environment variables
 * Throws an error if validation fails
 */
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => `  - ${err.path.join(".")}: ${err.message}`)
        .join("\n");

      throw new Error(
        `❌ Invalid environment variables:\n${missingVars}\n\n` +
          `Please check your .env file and ensure all required variables are set.\n` +
          `See backend/.env.example for reference.`
      );
    }
    throw error;
  }
}

/**
 * Type-safe environment variables
 * Use this instead of process.env for type safety
 */
export const env = validateEnv();

/**
 * Helper to check if we're in production
 */
export const isProduction = env.NODE_ENV === "production";

/**
 * Helper to check if we're in development
 */
export const isDevelopment = env.NODE_ENV === "development";

/**
 * Helper to check if we're in test mode
 */
export const isTest = env.NODE_ENV === "test";

/**
 * Helper to check if email is configured
 */
export const isEmailConfigured = Boolean(
  env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS
);

/**
 * Helper to check if Sentry is configured
 */
export const isSentryConfigured = Boolean(env.SENTRY_DSN);

/**
 * Helper to check if Redis is configured
 */
export const isRedisConfigured = Boolean(env.REDIS_URL);

/**
 * Helper to check if AWS S3 is configured
 */
export const isS3Configured = Boolean(
  env.AWS_ACCESS_KEY_ID &&
    env.AWS_SECRET_ACCESS_KEY &&
    env.AWS_S3_BUCKET &&
    env.AWS_REGION
);
