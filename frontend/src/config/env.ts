import { z } from "zod";

/**
 * Frontend environment variable validation schema
 * Only VITE_* prefixed variables are available in the browser
 *
 * ⚠️ IMPORTANT: These variables are embedded in the client-side bundle
 * and are publicly visible. NEVER store secrets here!
 */
const envSchema = z.object({
  // API Configuration
  VITE_API_URL: z
    .string()
    .url("VITE_API_URL must be a valid URL")
    .default("http://localhost:5000"),

  VITE_API_TIMEOUT: z
    .string()
    .default("30000")
    .transform((val) => Number(val)),

  // Environment
  VITE_NODE_ENV: z
    .enum(["development", "production"])
    .default("development"),

  VITE_APP_VERSION: z.string().default("1.0.0"),

  // Analytics & Monitoring (Optional)
  VITE_ENABLE_ANALYTICS: z
    .string()
    .default("false")
    .transform((val) => val === "true"),

  VITE_GA_TRACKING_ID: z.string().optional(),
  VITE_SENTRY_DSN: z.string().optional(),

  // Feature Flags
  VITE_DEBUG: z
    .string()
    .default("false")
    .transform((val) => val === "true"),

  VITE_ENABLE_MOCK_API: z
    .string()
    .default("false")
    .transform((val) => val === "true"),

  // Third-party Services (Optional)
  VITE_STRIPE_PUBLIC_KEY: z.string().optional(),
  VITE_GOOGLE_MAPS_API_KEY: z.string().optional(),
});

/**
 * Validate and parse environment variables
 * Throws an error if validation fails
 */
function validateEnv() {
  try {
    // Vite exposes env variables on import.meta.env
    return envSchema.parse(import.meta.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map((err) => `  - ${err.path.join(".")}: ${err.message}`)
        .join("\n");

      throw new Error(
        `❌ Invalid environment variables:\n${missingVars}\n\n` +
          `Please check your .env file and ensure all required variables are set.\n` +
          `See frontend/.env.example for reference.\n\n` +
          `Remember: Only VITE_* prefixed variables are available!`
      );
    }
    throw error;
  }
}

/**
 * Type-safe environment variables
 * Use this instead of import.meta.env for type safety
 */
export const env = validateEnv();

/**
 * Helper to check if we're in production
 */
export const isProduction = env.VITE_NODE_ENV === "production";

/**
 * Helper to check if we're in development
 */
export const isDevelopment = env.VITE_NODE_ENV === "development";

/**
 * Helper to check if debug mode is enabled
 */
export const isDebugMode = env.VITE_DEBUG;

/**
 * Helper to check if analytics is enabled
 */
export const isAnalyticsEnabled =
  env.VITE_ENABLE_ANALYTICS && env.VITE_GA_TRACKING_ID;

/**
 * Helper to check if Sentry is configured
 */
export const isSentryConfigured = Boolean(env.VITE_SENTRY_DSN);

/**
 * Helper to check if mock API is enabled
 */
export const isMockApiEnabled = env.VITE_ENABLE_MOCK_API;

/**
 * Helper to get the full API URL with path
 */
export function getApiUrl(path: string): string {
  const baseUrl = env.VITE_API_URL.replace(/\/$/, ""); // Remove trailing slash
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
