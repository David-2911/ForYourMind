/**
 * Application-wide constants
 */

// Mood score ranges
export const MOOD_SCORES = {
  MIN: 1,
  MAX: 10,
  THRESHOLD_LOW: 4,
  THRESHOLD_HIGH: 7,
} as const;

// User roles
export const USER_ROLES = {
  INDIVIDUAL: "individual",
  MANAGER: "manager",
  ADMIN: "admin",
} as const;

// Appointment statuses
export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

// Buddy match statuses
export const BUDDY_MATCH_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
} as const;

// Assessment types
export const ASSESSMENT_TYPES = {
  COMPREHENSIVE: "comprehensive",
  QUICK_CHECK: "quick-check",
  MONTHLY_REVIEW: "monthly-review",
} as const;

// Question types
export const QUESTION_TYPES = {
  SCALE: "scale",
  MULTIPLE_CHOICE: "multiple-choice",
  TEXT: "text",
} as const;

// API endpoints (relative to base URL)
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REFRESH: "/api/auth/refresh",
    ME: "/api/auth/me",
  },
  JOURNALS: {
    LIST: "/api/journals",
    CREATE: "/api/journals",
    DELETE: (id: string) => `/api/journals/${id}`,
  },
  MOOD: {
    LIST: "/api/mood-entries",
    CREATE: "/api/mood-entries",
    STATS: "/api/mood-entries/stats",
  },
  RANTS: {
    LIST: "/api/anonymous-rants",
    CREATE: "/api/anonymous-rants",
    SUPPORT: (id: string) => `/api/anonymous-rants/${id}/support`,
  },
  THERAPISTS: {
    LIST: "/api/therapists",
    GET: (id: string) => `/api/therapists/${id}`,
  },
  APPOINTMENTS: {
    LIST: "/api/appointments",
    CREATE: "/api/appointments",
    UPDATE: (id: string) => `/api/appointments/${id}`,
  },
  COURSES: {
    LIST: "/api/courses",
    GET: (id: string) => `/api/courses/${id}`,
  },
  ASSESSMENTS: {
    LIST: "/api/assessments",
    CREATE: "/api/assessments",
    RESPOND: (id: string) => `/api/assessments/${id}/respond`,
    RESPONSES: (id: string) => `/api/assessments/${id}/responses`,
  },
  MANAGER: {
    METRICS: "/api/manager/metrics",
    EMPLOYEES: "/api/manager/employees",
    SURVEYS: "/api/manager/surveys",
  },
} as const;

// Time constants
export const TIME_CONSTANTS = {
  MINUTE_MS: 60 * 1000,
  HOUR_MS: 60 * 60 * 1000,
  DAY_MS: 24 * 60 * 60 * 1000,
  WEEK_MS: 7 * 24 * 60 * 60 * 1000,
  TOKEN_EXPIRY: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

// Validation constants
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  DISPLAY_NAME_MIN: 2,
  DISPLAY_NAME_MAX: 50,
  JOURNAL_MAX_LENGTH: 5000,
  RANT_MAX_LENGTH: 1000,
} as const;

// Chart colors for data visualization
export const CHART_COLORS = {
  PRIMARY: "#8b5cf6",
  SUCCESS: "#10b981",
  WARNING: "#f59e0b",
  DANGER: "#ef4444",
  INFO: "#3b82f6",
  NEUTRAL: "#6b7280",
} as const;
