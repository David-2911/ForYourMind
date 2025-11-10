/**
 * Frontend-specific type definitions
 * Additional types not defined in the database schema
 */

import type { User } from "../schema.js";

/**
 * Authentication response from login/register endpoints
 */
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

/**
 * Manager dashboard wellness metrics aggregation
 */
export interface WellnessMetrics {
  teamWellness: number;
  engagement: number;
  sessionsThisWeek: number;
  atRiskCount: number;
  departments: Array<{
    name: string;
    average: number;
    status: string;
  }>;
}
