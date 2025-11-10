# Environment-Specific Configuration Guide

Complete guide for managing development, production, and test environment configurations in the MindfulMe monorepo.

---

## Table of Contents

1. [Overview](#overview)
2. [Environment Types](#environment-types)
3. [Configuration Files](#configuration-files)
4. [Backend Configuration](#backend-configuration)
5. [Frontend Configuration](#frontend-configuration)
6. [Switching Environments](#switching-environments)
7. [Environment Validation](#environment-validation)
8. [Testing Configuration](#testing-configuration)
9. [Best Practices](#best-practices)

---

## Overview

### Why Environment-Specific Configs?

Different environments have different requirements:

| Aspect | Development | Production | Test |
|--------|-------------|------------|------|
| **Database** | SQLite/Local PostgreSQL | Production PostgreSQL | In-memory/Test DB |
| **Logging** | Verbose, debug info | Errors only | Minimal |
| **Auth** | Relaxed, test tokens | Strict, secure | Disabled/mocked |
| **CORS** | localhost:5173 | Actual domain | * (all) |
| **SSL** | Not required | Required | Not required |
| **Error Details** | Full stack traces | Generic messages | Full details |
| **Performance** | Source maps, HMR | Optimized, minified | Fast execution |

### Configuration Strategy

MindfulMe uses **environment variables** for configuration:

1. **`.env` files** for local development
2. **Platform environment variables** for production (Render, Vercel, etc.)
3. **Environment-specific validation** with type safety (Zod)
4. **Runtime environment detection** (`NODE_ENV`)

---

## Environment Types

### Development

**Purpose**: Local development on your machine

**Characteristics**:
- Fast iteration (hot reload, source maps)
- Verbose logging for debugging
- SQLite database (zero setup)
- Mock/test API keys
- CORS allows localhost

**When**: `NODE_ENV=development` (default)

### Production

**Purpose**: Live application serving real users

**Characteristics**:
- Optimized performance (minified, cached)
- Minimal logging (errors only)
- Production PostgreSQL database
- Real API keys and credentials
- CORS restricted to actual domain
- SSL/HTTPS required

**When**: `NODE_ENV=production`

### Test

**Purpose**: Automated testing (unit tests, integration tests)

**Characteristics**:
- Fast execution (in-memory database)
- Predictable behavior (no external services)
- Mocked APIs and services
- No side effects (email, payments)
- Isolated from development/production

**When**: `NODE_ENV=test`

---

## Configuration Files

### File Structure

```
/home/dave/Downloads/MindfulMe/
  .env                     ← Development (your local settings)
  .env.example             ← Template (safe to commit)
  .env.test                ← Test environment (optional)
  
  backend/
    .env.example           ← Backend template
    src/
      config/
        env.ts             ← Environment validation
  
  frontend/
    .env.example           ← Frontend template
    src/
      config/
        env.ts             ← Frontend env validation
```

### Development (.env)

**Location**: Root `.env` file

**Purpose**: Your personal local development settings

**Example**:
```bash
# .env (root)
NODE_ENV=development

# Database
USE_SQLITE=true
SQLITE_DB_PATH=./backend/data/db.sqlite

# Server
PORT=5000
CORS_ORIGIN=http://localhost:5173

# Auth (weak secrets OK for development)
JWT_SECRET=dev-secret-not-for-production-32chars
COOKIE_SECRET=dev-cookie-secret-32characters

# Logging
LOG_LEVEL=debug
LOG_SQL_QUERIES=true

# Email (optional - leave empty to skip emails)
# SMTP_HOST=
# SMTP_USER=

# Frontend
VITE_API_URL=http://localhost:5000
VITE_NODE_ENV=development
VITE_DEBUG=true
```

**⚠️ Never commit this file!** (it's in `.gitignore`)

### Production (Platform Environment Variables)

**Location**: Hosting platform dashboard (Render, Vercel, Fly.io)

**Purpose**: Production configuration

**How to set**:

#### Render (Backend)
1. Dashboard → Your service → Environment
2. Add variables:
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://...
   JWT_SECRET=<strong-secret>
   PORT=5000
   CORS_ORIGIN=https://mindfulme.com
   LOG_LEVEL=error
   ```

#### Vercel (Frontend)
1. Project Settings → Environment Variables
2. Add VITE_* variables:
   ```
   VITE_API_URL=https://api.mindfulme.com
   VITE_NODE_ENV=production
   ```

### Test (.env.test)

**Location**: Root `.env.test` (optional)

**Purpose**: Configuration for automated tests

**Example**:
```bash
# .env.test
NODE_ENV=test

# In-memory database
USE_SQLITE=true
SQLITE_DB_PATH=:memory:

# Disable external services
DISABLE_AUTH=true
SMTP_HOST=

# Fast, minimal logging
LOG_LEVEL=error
```

**Load in tests**:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default defineConfig({
  // ...
});
```

---

## Backend Configuration

### Environment Validation

**File**: `backend/src/config/env.ts`

**Purpose**: Type-safe environment access with validation

**Usage**:
```typescript
import { env, isDevelopment, isProduction } from './config/env';

// Type-safe access
console.log(env.PORT);              // number
console.log(env.DATABASE_URL);       // string | undefined
console.log(env.LOG_SQL_QUERIES);    // boolean

// Environment checks
if (isDevelopment) {
  console.log('Running in development mode');
}

if (env.isEmailConfigured) {
  // Send email
}
```

**Validation**:
- Ensures required variables are set
- Converts types (string → number/boolean)
- Provides defaults
- Fails fast on startup if invalid

### Database Configuration

**Development**:
```typescript
import { env } from './config/env';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

if (env.USE_SQLITE) {
  const sqlite = new Database(env.SQLITE_DB_PATH);
  const db = drizzle(sqlite);
}
```

**Production**:
```typescript
import { env } from './config/env';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

if (!env.USE_SQLITE && env.DATABASE_URL) {
  const sql = neon(env.DATABASE_URL);
  const db = drizzle(sql);
}
```

### Logging Configuration

**Development** (verbose):
```typescript
if (isDevelopment) {
  app.use(morgan('dev'));  // Log all requests
  console.log('SQL:', query);  // Log SQL queries
}
```

**Production** (minimal):
```typescript
if (isProduction) {
  app.use(morgan('combined'));  // Standard format only
  // No SQL logging (security risk)
}
```

### Error Handling

**Development** (detailed):
```typescript
app.use((err, req, res, next) => {
  if (isDevelopment) {
    res.status(500).json({
      error: err.message,
      stack: err.stack,  // Include stack trace
      details: err,      // Full error object
    });
  }
});
```

**Production** (generic):
```typescript
app.use((err, req, res, next) => {
  if (isProduction) {
    console.error(err);  // Log to Sentry/monitoring
    res.status(500).json({
      error: 'Internal server error',  // Generic message
    });
  }
});
```

### CORS Configuration

**Development** (localhost):
```typescript
import cors from 'cors';
import { env } from './config/env';

app.use(cors({
  origin: env.CORS_ORIGIN,  // http://localhost:5173
  credentials: true,
}));
```

**Production** (actual domain):
```typescript
app.use(cors({
  origin: env.CORS_ORIGIN,  // https://mindfulme.com
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
```

---

## Frontend Configuration

### Environment Validation

**File**: `frontend/src/config/env.ts`

**Purpose**: Type-safe VITE_* variable access

**Usage**:
```typescript
import { env, isDevelopment, getApiUrl } from './config/env';

// Type-safe access
console.log(env.VITE_API_URL);           // string (URL)
console.log(env.VITE_DEBUG);             // boolean

// Helper functions
const url = getApiUrl('/users');          // http://localhost:5000/users

if (isDevelopment) {
  console.log('Running in dev mode');
}
```

### API Configuration

**Development** (proxy via Vite):
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

**API calls**:
```typescript
import { env } from './config/env';

// Development: goes through Vite proxy (avoids CORS)
// Production: direct to API URL
const response = await fetch(`${env.VITE_API_URL}/api/users`);
```

**Production** (direct):
```typescript
// VITE_API_URL=https://api.mindfulme.com
const response = await fetch(`${env.VITE_API_URL}/api/users`);
```

### Conditional Features

**Development only**:
```typescript
import { isDevelopment, env } from './config/env';

function App() {
  return (
    <>
      {isDevelopment && <DevTools />}
      {env.VITE_DEBUG && <DebugPanel />}
      <MainApp />
    </>
  );
}
```

**Production only**:
```typescript
import { isProduction, env } from './config/env';

if (isProduction && env.isSentryConfigured) {
  Sentry.init({ dsn: env.VITE_SENTRY_DSN });
}
```

### Build Configuration

**Development** (fast rebuilds):
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: true,        // Enable source maps
    minify: false,          // Skip minification
  },
});
```

**Production** (optimized):
```typescript
export default defineConfig({
  build: {
    sourcemap: false,       // No source maps (security)
    minify: 'esbuild',      // Minify code
    rollupOptions: {
      output: {
        manualChunks: {     // Code splitting
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
});
```

---

## Switching Environments

### Local Development

**Default** (already set):
```bash
# No action needed - .env has NODE_ENV=development
npm run dev
```

### Testing Locally

**Set test environment**:
```bash
# Option 1: Temporary
NODE_ENV=test npm run dev

# Option 2: Create .env.test and load it
npm run test
```

### Production Locally

**Build and run production**:
```bash
# Build optimized bundles
npm run build

# Set production mode
NODE_ENV=production npm start
```

### Deployed Production

**Automatic** (set by platform):

Render:
```bash
# Automatically sets NODE_ENV=production
# Just deploy
```

Vercel:
```bash
# Automatically sets NODE_ENV=production
git push origin main
```

---

## Environment Validation

### Backend Validation

**File**: `backend/src/config/env.ts`

**How it works**:

1. **Loads environment variables** from `.env`
2. **Validates against schema** (Zod)
3. **Converts types** (string → number/boolean)
4. **Provides defaults** for optional vars
5. **Fails fast** on startup if invalid

**Example validation**:
```typescript
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('5000').transform(Number),
  JWT_SECRET: z.string().min(32),  // Required, min 32 chars
  DATABASE_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

**Benefits**:
- Type safety (TypeScript knows types)
- Early error detection (on startup, not during request)
- Clear error messages
- Autocomplete in IDE

**Example error**:
```
❌ Invalid environment variables:
  - JWT_SECRET: String must contain at least 32 character(s)
  - DATABASE_URL: Required

Please check your .env file and ensure all required variables are set.
See backend/.env.example for reference.
```

### Frontend Validation

**File**: `frontend/src/config/env.ts`

**Similar to backend**, but for VITE_* variables:

```typescript
const envSchema = z.object({
  VITE_API_URL: z.string().url(),  // Must be valid URL
  VITE_DEBUG: z.string().optional()
    .transform(val => val === 'true')
    .default('false'),
});

export const env = envSchema.parse(import.meta.env);
```

**⚠️ Important**: Only VITE_* variables are available in frontend!

---

## Testing Configuration

### Unit Tests

**Environment**: `NODE_ENV=test`

**Configuration**:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',  // or 'jsdom' for frontend
    setupFiles: ['./tests/setup.ts'],
  },
});
```

**Setup file**:
```typescript
// tests/setup.ts
import dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: '.env.test' });

// Mock external services
process.env.SMTP_HOST = '';
process.env.DISABLE_AUTH = 'true';
```

### Integration Tests

**Use in-memory database**:
```typescript
// tests/integration/setup.ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

const sqlite = new Database(':memory:');
export const testDb = drizzle(sqlite);

// Run migrations
await migrate(testDb, { migrationsFolder: './migrations' });
```

**Seed test data**:
```typescript
await testDb.insert(users).values({
  email: 'test@example.com',
  username: 'testuser',
  passwordHash: 'hashed',
});
```

### E2E Tests

**Use separate test database**:
```bash
# .env.test
DATABASE_URL=postgresql://test:test@localhost:5432/mindfulme_test
```

**Reset database between tests**:
```typescript
beforeEach(async () => {
  await testDb.delete(users);
  await testDb.delete(journals);
  // Seed fresh data
});
```

---

## Best Practices

### ✅ DO

- **Use `.env` for local development** (never commit)
- **Use platform environment variables** for production
- **Validate all environment variables** on startup
- **Provide sensible defaults** for optional variables
- **Use different secrets** for each environment
- **Test production build** locally before deploying
- **Document all environment variables** in `.env.example`
- **Use type-safe access** via validated config

### ❌ DON'T

- **Don't hardcode environment-specific values** in code
- **Don't commit `.env` files** (use `.env.example`)
- **Don't use development secrets** in production
- **Don't skip environment validation**
- **Don't expose secrets** in frontend (only VITE_* public vars)
- **Don't assume variables exist** (validate first)
- **Don't mix environment configs** (keep dev/prod separate)

### Configuration Checklist

**Before deploying**:

- [ ] All required environment variables set in platform
- [ ] Different secrets used for production
- [ ] `NODE_ENV=production` set
- [ ] Database URL points to production database
- [ ] CORS origin set to actual domain
- [ ] Log level set to `error` or `warn`
- [ ] SSL/HTTPS enabled
- [ ] Frontend `VITE_API_URL` points to production backend
- [ ] All environment variables validated (no startup errors)

---

## Examples

### Example: Development Setup

**1. Copy .env template**:
```bash
cp .env.example .env
```

**2. Fill in development values**:
```bash
# .env
NODE_ENV=development
USE_SQLITE=true
PORT=5000
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=debug
VITE_API_URL=http://localhost:5000
```

**3. Start development**:
```bash
npm run dev
```

### Example: Production Deployment

**1. Set environment variables in Render**:
```
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
JWT_SECRET=<strong-secret-32chars>
PORT=5000
CORS_ORIGIN=https://mindfulme.com
LOG_LEVEL=error
```

**2. Deploy**:
```bash
git push origin main
# Render auto-deploys
```

**3. Set frontend env in Vercel**:
```
VITE_API_URL=https://api-mindfulme.onrender.com
VITE_NODE_ENV=production
```

**4. Deploy frontend**:
```bash
git push origin main
# Vercel auto-deploys
```

### Example: Environment-Specific Code

```typescript
import { env, isDevelopment, isProduction } from './config/env';

export function setupLogging() {
  if (isDevelopment) {
    // Verbose logging
    app.use(morgan('dev'));
    console.log('Database:', env.USE_SQLITE ? 'SQLite' : 'PostgreSQL');
  }

  if (isProduction) {
    // Minimal logging
    app.use(morgan('combined'));
    
    // Error tracking
    if (env.isSentryConfigured) {
      Sentry.init({ dsn: env.SENTRY_DSN });
    }
  }
}

export function setupDatabase() {
  if (env.USE_SQLITE) {
    // Development
    return createSQLiteDatabase(env.SQLITE_DB_PATH);
  } else if (env.DATABASE_URL) {
    // Production
    return createPostgreSQLDatabase(env.DATABASE_URL);
  } else {
    throw new Error('No database configured');
  }
}
```

---

## Quick Reference

### Environment Variables

| Variable | Development | Production | Test |
|----------|-------------|------------|------|
| `NODE_ENV` | `development` | `production` | `test` |
| `DATABASE_URL` | Optional (SQLite) | Required | `:memory:` |
| `USE_SQLITE` | `true` | `false` | `true` |
| `LOG_LEVEL` | `debug` | `error` | `error` |
| `CORS_ORIGIN` | `localhost:5173` | Actual domain | `*` |
| `JWT_SECRET` | Weak OK | Strong required | Any |

### Commands

```bash
# Development
npm run dev                        # Start with .env

# Production (local testing)
npm run build                      # Build all packages
NODE_ENV=production npm start      # Run production mode

# Test
npm run test                       # Run tests with test config

# Check config
node -e "require('./backend/dist/index.js')"  # Will validate env on startup
```

---

## Additional Resources

- **12-Factor App**: https://12factor.net/config
- **Vite Env Variables**: https://vitejs.dev/guide/env-and-mode.html
- **Zod Documentation**: https://zod.dev
- **dotenv Documentation**: https://github.com/motdotla/dotenv

---

**Need help?** Check [SECRETS_MANAGEMENT.md](./SECRETS_MANAGEMENT.md) or [DATABASE_SETUP.md](./DATABASE_SETUP.md)
