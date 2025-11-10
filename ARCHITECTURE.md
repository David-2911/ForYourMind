# MindfulMe Architecture

Complete architectural documentation for the MindfulMe mental wellness platform.

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Monorepo Architecture](#monorepo-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Database Architecture](#database-architecture)
- [Authentication Flow](#authentication-flow)
- [Deployment Architecture](#deployment-architecture)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Scaling Considerations](#scaling-considerations)

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MindfulMe Platform                           │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser    │────────▶│   Frontend   │────────▶│   Backend    │
│              │         │   (React)    │         │  (Express)   │
│  Users/UI    │◀────────│              │◀────────│              │
└──────────────┘         └──────────────┘         └──────────────┘
                               │                          │
                               │                          │
                               ▼                          ▼
                         ┌──────────┐            ┌──────────────┐
                         │  Shared  │            │  PostgreSQL  │
                         │ Package  │            │   Database   │
                         └──────────┘            └──────────────┘
```

### Technology Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Technology Layers                           │
├─────────────────────────────────────────────────────────────────────┤
│  Presentation    │  React 18.3 + TypeScript + TailwindCSS           │
├─────────────────────────────────────────────────────────────────────┤
│  State Mgmt      │  TanStack Query + React Hooks                    │
├─────────────────────────────────────────────────────────────────────┤
│  Routing         │  Wouter (lightweight React router)               │
├─────────────────────────────────────────────────────────────────────┤
│  UI Components   │  Shadcn/UI + Radix UI (accessible primitives)    │
├─────────────────────────────────────────────────────────────────────┤
│  API Layer       │  Express 4.21 + TypeScript                       │
├─────────────────────────────────────────────────────────────────────┤
│  Data Access     │  Drizzle ORM + Zod validation                    │
├─────────────────────────────────────────────────────────────────────┤
│  Database        │  PostgreSQL 15+ / SQLite 3 (dev)                 │
├─────────────────────────────────────────────────────────────────────┤
│  Authentication  │  JWT + Refresh Tokens + HTTP-only cookies        │
├─────────────────────────────────────────────────────────────────────┤
│  Build Tools     │  Vite (frontend) + esbuild (backend)             │
├─────────────────────────────────────────────────────────────────────┤
│  Containerization│  Docker + Docker Compose                         │
└─────────────────────────────────────────────────────────────────────┘
```

## Monorepo Architecture

### Workspace Structure

```
MindfulMe/                          # Root workspace
│
├── shared/                         # @mindfulme/shared package
│   ├── src/
│   │   ├── schema.ts              # ★ Single source of truth for DB schema
│   │   ├── types/
│   │   │   └── index.ts           # Additional shared types
│   │   ├── constants.ts           # App-wide constants
│   │   └── index.ts               # Main export file
│   ├── dist/                      # Compiled output
│   │   ├── schema.js              # JavaScript
│   │   ├── schema.d.ts            # Type definitions
│   │   └── ...
│   ├── package.json               # Shared package config
│   └── tsconfig.json              # TypeScript config
│
├── backend/                        # Express API server
│   ├── src/
│   │   ├── index.ts               # ★ Server entry + health checks
│   │   ├── database.ts            # DB connection setup
│   │   ├── routes/
│   │   │   ├── index.ts           # Route registration
│   │   │   ├── auth.ts            # Authentication routes
│   │   │   ├── users.ts           # User management
│   │   │   ├── mood.ts            # Mood tracking
│   │   │   └── journal.ts         # Journaling
│   │   ├── storage/
│   │   │   ├── index.ts           # Storage abstraction
│   │   │   ├── sqliteStorage.ts  # SQLite implementation
│   │   │   └── postgresStorage.ts # PostgreSQL implementation
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT verification
│   │   │   ├── error.ts           # Error handling
│   │   │   └── cors.ts            # CORS configuration
│   │   ├── config/
│   │   │   └── env.ts             # Environment validation (Zod)
│   │   └── utils/
│   │       ├── jwt.ts             # JWT utilities
│   │       └── validation.ts      # Input validation
│   ├── dist/
│   │   ├── index.js               # Bundled server (61KB)
│   │   └── index.js.map           # Source map
│   ├── data/
│   │   └── db.sqlite              # SQLite file (dev only)
│   ├── package.json               # Backend dependencies
│   ├── tsconfig.json              # Backend TS config
│   └── Dockerfile                 # Backend container
│
├── frontend/                       # React SPA
│   ├── src/
│   │   ├── main.tsx               # ★ React entry point
│   │   ├── App.tsx                # Root component + router
│   │   ├── pages/
│   │   │   ├── landing.tsx        # Public landing page
│   │   │   ├── employee-dashboard.tsx  # Employee view
│   │   │   └── manager-dashboard.tsx   # Manager view
│   │   ├── components/
│   │   │   ├── ui/                # Shadcn/UI components
│   │   │   ├── auth/              # Auth forms/modals
│   │   │   ├── employee/          # Employee-specific
│   │   │   ├── manager/           # Manager-specific
│   │   │   └── common/            # Shared components
│   │   ├── lib/
│   │   │   ├── auth.ts            # Auth context/hooks
│   │   │   ├── api.ts             # API client
│   │   │   └── utils.ts           # Utility functions
│   │   ├── hooks/
│   │   │   ├── use-auth.ts        # Auth hook
│   │   │   ├── use-api.ts         # API hooks
│   │   │   └── use-toast.ts       # Toast notifications
│   │   └── config/
│   │       └── env.ts             # Frontend env validation
│   ├── dist/                      # Build output (152KB gzipped)
│   │   ├── index.html
│   │   └── assets/
│   │       ├── js/
│   │       │   ├── vendor-*.js    # React, React DOM (141KB)
│   │       │   ├── ui-*.js        # UI library (79KB)
│   │       │   ├── query-*.js     # TanStack Query (40KB)
│   │       │   └── index-*.js     # App code (229KB)
│   │       └── *.css              # Styles (75KB)
│   ├── public/                    # Static assets
│   ├── package.json               # Frontend dependencies
│   ├── tsconfig.json              # Frontend TS config
│   ├── vite.config.ts             # ★ Vite config (code splitting)
│   ├── nginx.conf                 # nginx config for production
│   └── Dockerfile                 # Frontend container
│
├── scripts/                        # Automation scripts
│   ├── build-production.sh        # Full production build
│   ├── docker-build.sh            # Docker image building
│   ├── health-check.sh            # Service health checks
│   ├── analyze-bundle.sh          # Bundle analysis
│   └── benchmark.sh               # Performance testing
│
├── migrations/                     # Database migrations
│   ├── 0000_initial.sql
│   ├── 0001_refresh_tokens.sql
│   └── meta/                      # Migration metadata
│
├── docs/                          # Documentation
│
├── docker-compose.yml             # Dev environment
├── docker-compose.prod.yml        # Production environment
├── render.yaml                    # Render.com blueprint
├── package.json                   # ★ Root workspace config
└── tsconfig.json                  # Root TS config
```

### Package Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                    Dependency Graph                          │
└─────────────────────────────────────────────────────────────┘

                        ┌──────────┐
                        │  shared  │  (No dependencies)
                        └────┬─────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
         ┌──────────┐              ┌──────────┐
         │ backend  │              │ frontend │
         └──────────┘              └──────────┘
          imports:                  imports:
          - @mindfulme/shared       - @mindfulme/shared
          - express                 - react
          - drizzle-orm            - @tanstack/react-query
          - zod                    - wouter
          - jsonwebtoken           - tailwindcss
          - etc.                   - etc.
```

### Build Order

**CRITICAL: Must build in this order:**

```bash
1. shared   → npm run build:shared
   ↓
2. backend  → npm run build:backend
   ↓
3. frontend → npm run build:frontend
```

**Why?** Backend and frontend both import from shared, so shared must be built first to generate `.d.ts` files and JavaScript output.

## Frontend Architecture

### Component Structure

```
Frontend Component Hierarchy:

App.tsx (Root)
├── Landing Page (Public)
│   ├── Hero Section
│   ├── Features Section
│   ├── Login Modal
│   └── Signup Modal
│
├── Employee Dashboard (Protected)
│   ├── Navigation Bar
│   ├── Mood Check-in Widget
│   ├── Journal Entries List
│   ├── Wellness Metrics
│   ├── Anonymous Rants Feed
│   └── Chatbot Widget
│       ├── Breathing Exercises Modal
│       ├── Journaling Modal
│       ├── Therapists Modal
│       └── Wellness Assessment Modal
│
└── Manager Dashboard (Protected)
    ├── Navigation Bar
    ├── Team Wellness Overview
    ├── Department Analytics
    ├── At-Risk Employees Alert
    ├── Anonymous Feedback View
    └── Engagement Metrics
```

### State Management

```
┌─────────────────────────────────────────────────────────────┐
│                    State Management                          │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  React Context   │  Auth state (user, token, role)
└────────┬─────────┘
         │
         ├─────────────┐
         │             │
         ▼             ▼
┌─────────────┐  ┌──────────────┐
│ TanStack    │  │ React        │
│ Query       │  │ Local State  │
└─────────────┘  └──────────────┘
Server state      Component state
(API data)        (UI state only)
- Users           - Form inputs
- Mood entries    - Modal open/close
- Journals        - Loading states
- Analytics       - Temp values

Auto-caching      Transient
Auto-refetch      Ephemeral
Optimistic updates
```

### Routing

```typescript
// Using Wouter (lightweight React router)

Routes:
/                       → Landing Page (public)
/employee-dashboard     → Employee Dashboard (protected, role: employee)
/manager-dashboard      → Manager Dashboard (protected, role: manager/admin)
/profile                → User Profile (protected)
/settings               → Settings (protected)

Route Protection:
- Public routes: Anyone can access
- Protected routes: Requires authentication
- Role-based routes: Requires specific role
```

### API Client

```typescript
// Frontend → Backend communication

┌─────────────┐         ┌─────────────┐
│  Component  │────────▶│  TanStack   │
│             │         │   Query     │
└─────────────┘         └──────┬──────┘
                              │
                              ▼
                        ┌──────────┐
                        │   API    │
                        │  Client  │
                        └────┬─────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Backend API    │
                    │ (Express Server)│
                    └─────────────────┘

Features:
- Automatic token injection
- Request/response interceptors
- Error handling
- Retry logic
- Type-safe endpoints (from shared types)
```

## Backend Architecture

### API Structure

```
Backend API Layers:

┌──────────────────────────────────────────────────────────┐
│                    Express Server                         │
├──────────────────────────────────────────────────────────┤
│  Routes                                                   │
│  ├─ /health          → Health check (no auth)           │
│  ├─ /healthz         → Simple health check              │
│  ├─ /ready           → Readiness probe                  │
│  ├─ /api/auth/*      → Authentication                   │
│  ├─ /api/users/*     → User management                  │
│  ├─ /api/mood/*      → Mood tracking                    │
│  ├─ /api/journal/*   → Journaling                       │
│  ├─ /api/analytics/* → Analytics (manager only)         │
│  └─ /api/rants/*     → Anonymous rants                  │
├──────────────────────────────────────────────────────────┤
│  Middleware (Applied in order)                           │
│  1. CORS           → Cross-origin headers               │
│  2. Body Parser    → JSON parsing                       │
│  3. Cookie Parser  → Cookie handling                    │
│  4. Auth           → JWT verification (protected routes)│
│  5. Role Check     → Role-based access                  │
│  6. Error Handler  → Catch and format errors            │
├──────────────────────────────────────────────────────────┤
│  Storage Layer (Abstraction)                             │
│  ├─ IStorage interface                                  │
│  ├─ SqliteStorage   → Development                       │
│  └─ PostgresStorage → Production                        │
├──────────────────────────────────────────────────────────┤
│  Database (Drizzle ORM)                                  │
│  └─ PostgreSQL / SQLite                                 │
└──────────────────────────────────────────────────────────┘
```

### Request Flow

```
┌──────────┐
│ Client   │
│ Request  │
└────┬─────┘
     │
     ▼
┌─────────────────┐
│  CORS Check     │  Allow origin?
└────┬────────────┘
     │ ✓
     ▼
┌─────────────────┐
│  Parse Body     │  JSON → Object
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Auth Middleware│  JWT valid?
└────┬────────────┘
     │ ✓
     ▼
┌─────────────────┐
│  Role Check     │  Has permission?
└────┬────────────┘
     │ ✓
     ▼
┌─────────────────┐
│  Route Handler  │  Process request
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Validate Input │  Zod schemas
└────┬────────────┘
     │ ✓
     ▼
┌─────────────────┐
│  Storage Layer  │  Query database
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Format Response│  Serialize data
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Send Response  │  JSON response
└─────────────────┘
```

### Storage Abstraction

```typescript
// Storage interface allows swapping databases

interface IStorage {
  // Users
  getUserById(id: number): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(data: NewUser): Promise<User>;
  
  // Mood entries
  getMoodEntries(userId: number, limit?: number): Promise<MoodEntry[]>;
  createMoodEntry(data: NewMoodEntry): Promise<MoodEntry>;
  
  // Journals
  getJournalEntries(userId: number): Promise<JournalEntry[]>;
  createJournalEntry(data: NewJournalEntry): Promise<JournalEntry>;
  
  // Analytics (manager only)
  getTeamWellnessMetrics(organizationId: number): Promise<WellnessMetrics>;
  getAtRiskEmployees(organizationId: number): Promise<User[]>;
}

// Implementations:
class SqliteStorage implements IStorage { ... }  // For development
class PostgresStorage implements IStorage { ... } // For production

// Usage:
const storage = env.USE_SQLITE 
  ? new SqliteStorage() 
  : new PostgresStorage();
```

## Database Architecture

### Schema Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Database Schema                           │
└─────────────────────────────────────────────────────────────┘

users
├─ id (PK)
├─ username
├─ email (unique)
├─ password_hash
├─ role (employee|manager|admin)
├─ created_at
└─ updated_at

organizations
├─ id (PK)
├─ name
├─ plan_type
├─ created_at
└─ updated_at

employees
├─ id (PK)
├─ user_id (FK → users)
├─ organization_id (FK → organizations)
├─ department
├─ position
├─ is_manager
└─ created_at

mood_entries
├─ id (PK)
├─ employee_id (FK → employees)
├─ mood_score (1-10)
├─ note (optional)
├─ timestamp
└─ created_at

journal_entries
├─ id (PK)
├─ employee_id (FK → employees)
├─ title
├─ content
├─ is_private
├─ created_at
└─ updated_at

anonymous_rants
├─ id (PK)
├─ organization_id (FK → organizations)
├─ content
├─ sentiment_score
├─ created_at
└─ (no user_id - truly anonymous)

refresh_tokens
├─ id (PK)
├─ user_id (FK → users)
├─ token
├─ expires_at
└─ created_at
```

### Entity Relationships

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│    users    │────1:1──│  employees   │────N:1──│organizations│
└──────┬──────┘         └──────┬───────┘         └─────────────┘
       │                       │
       │1:N                   │1:N
       │                       │
       ▼                       ▼
┌──────────────┐       ┌────────────────┐
│refresh_tokens│       │  mood_entries  │
└──────────────┘       └────────────────┘
                               │
                               │1:N
                               │
                               ▼
                       ┌────────────────┐
                       │journal_entries │
                       └────────────────┘

┌─────────────┐        ┌─────────────────┐
│organizations│───1:N──│ anonymous_rants │
└─────────────┘        └─────────────────┘
```

### Indexes

```sql
-- Performance indexes

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_org_id ON employees(organization_id);

CREATE INDEX idx_mood_entries_employee ON mood_entries(employee_id);
CREATE INDEX idx_mood_entries_timestamp ON mood_entries(timestamp DESC);

CREATE INDEX idx_journal_entries_employee ON journal_entries(employee_id);
CREATE INDEX idx_journal_entries_created ON journal_entries(created_at DESC);

CREATE INDEX idx_rants_org ON anonymous_rants(organization_id);
CREATE INDEX idx_rants_created ON anonymous_rants(created_at DESC);
```

## Authentication Flow

### Registration Flow

```
┌──────────┐                                    ┌──────────┐
│          │  1. Submit registration form       │          │
│  Client  │───────────────────────────────────▶│  Backend │
│          │     POST /api/auth/register        │          │
└──────────┘     {email, password, username}    └────┬─────┘
                                                      │
                                                      │ 2. Validate input
                                                      │    (Zod schema)
                                                      │
                                                      │ 3. Check email
                                                      │    doesn't exist
                                                      │
                                                      ▼
                                                 ┌─────────┐
                                                 │Database │
                                                 └────┬────┘
                                                      │
                                                      │ 4. Hash password
                                                      │    (bcrypt)
                                                      │
                                                      │ 5. Create user
                                                      │    record
                                                      │
┌──────────┐                                         │
│          │  6. Return user + JWT token            │
│  Client  │◀───────────────────────────────────────┘
│          │     {user, token}                 
└──────────┘
     │
     │ 7. Store token
     │    in context
     ▼
 Authenticated
```

### Login Flow

```
┌──────────┐                              ┌──────────┐
│  Client  │  1. Submit credentials       │  Backend │
│          │─────────────────────────────▶│          │
└──────────┘  POST /api/auth/login        └────┬─────┘
              {email, password}                 │
                                                │ 2. Find user by email
                                                │
                                                ▼
                                           ┌─────────┐
                                           │Database │
                                           └────┬────┘
                                                │
                                                │ 3. Compare password
                                                │    (bcrypt.compare)
                                                │
                                                │ 4. Generate tokens:
                                                │    - Access token (15m)
                                                │    - Refresh token (7d)
                                                │
┌──────────┐                                   │
│  Client  │  5. Receive tokens                │
│          │◀──────────────────────────────────┘
└────┬─────┘     {accessToken, user}
     │            + HTTP-only cookie (refresh)
     │
     │ 6. Store access token
     │    in memory/context
     │
     ▼
 Authenticated
```

### Protected Request Flow

```
┌──────────┐                                    ┌──────────┐
│  Client  │  1. Request protected resource    │  Backend │
│          │───────────────────────────────────▶│          │
└──────────┘     GET /api/users/me              └────┬─────┘
                 Authorization: Bearer <token>       │
                                                     │ 2. Extract token
                                                     │    from header
                                                     │
                                                     │ 3. Verify JWT
                                                     │    signature
                                                     │
                                                     │ 4. Check expiry
                                                     │
                                                     │ 5. Decode payload
                                                     │    {userId, role}
                                                     │
                                                     ▼
                                                ┌─────────┐
                                                │Database │
                                                └────┬────┘
                                                     │
                                                     │ 6. Fetch resource
                                                     │
┌──────────┐                                        │
│  Client  │  7. Return data                       │
│          │◀───────────────────────────────────────┘
└──────────┘     {data}
```

### Token Refresh Flow

```
┌──────────┐                                    ┌──────────┐
│  Client  │  1. Access token expired           │  Backend │
│          │    (401 Unauthorized)              │          │
└────┬─────┘                                    └──────────┘
     │
     │ 2. Detect 401,
     │    initiate refresh
     │
     ▼
┌──────────┐                                    ┌──────────┐
│  Client  │  3. Request new access token       │  Backend │
│          │───────────────────────────────────▶│          │
└──────────┘     POST /api/auth/refresh         └────┬─────┘
                 Cookie: refreshToken=<token>         │
                                                      │ 4. Verify refresh
                                                      │    token
                                                      │
                                                      ▼
                                                 ┌─────────┐
                                                 │Database │
                                                 └────┬────┘
                                                      │
                                                      │ 5. Check token
                                                      │    exists & valid
                                                      │
                                                      │ 6. Generate new
                                                      │    access token
                                                      │
┌──────────┐                                         │
│  Client  │  7. Receive new token                  │
│          │◀───────────────────────────────────────┘
└────┬─────┘     {accessToken}
     │
     │ 8. Retry original request
     │    with new token
     ▼
  Success!
```

## Deployment Architecture

### Development Environment

```
┌──────────────────────────────────────────────────────────────┐
│                    docker-compose.yml                         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐        │
│  │  Frontend  │    │  Backend   │    │ PostgreSQL │        │
│  │  :5173     │◀──▶│  :5000     │◀──▶│  :5432     │        │
│  │  (Vite HMR)│    │  (--watch) │    │            │        │
│  └────────────┘    └────────────┘    └────────────┘        │
│                                                               │
│  ┌────────────────┐                                         │
│  │ Drizzle Studio │                                         │
│  │     :4983      │ (Database GUI)                          │
│  └────────────────┘                                         │
│                                                               │
│  Features:                                                   │
│  - Hot reload for frontend (Vite HMR)                       │
│  - Auto-restart for backend (--watch flag)                  │
│  - Persistent database (named volume)                       │
│  - All services on same network                             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Production Environment (Render.com)

```
┌────────────────────────────────────────────────────────────────┐
│                        Render.com                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Frontend (Static Site)                                   │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │  nginx                                              │  │ │
│  │  │  - Serves static files from frontend/dist/        │  │ │
│  │  │  - SPA routing (all requests → index.html)        │  │ │
│  │  │  - Gzip compression                                │  │ │
│  │  │  - Cache headers for assets                       │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  │  URL: https://your-app.onrender.com                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                            │                                   │
│                            │ API calls                         │
│                            ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Backend (Web Service)                                    │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │  Node.js Express Server                            │  │ │
│  │  │  - API endpoints (/api/*)                          │  │ │
│  │  │  - Health checks (/health, /healthz, /ready)      │  │ │
│  │  │  - JWT authentication                              │  │ │
│  │  │  - Auto-deploy on git push                        │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  │  URL: https://your-api.onrender.com                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                            │                                   │
│                            │ DB queries                        │
│                            ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL (Managed Database)                            │ │
│  │  - Automatic backups                                     │ │
│  │  - High availability                                      │ │
│  │  - Connection pooling                                     │ │
│  │  - Monitoring & alerts                                    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Environment Variables (Auto-injected):                        │
│  - DATABASE_URL (from PostgreSQL service)                      │
│  - JWT_SECRET (auto-generated)                                 │
│  - COOKIE_SECRET (auto-generated)                              │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Production Environment (Docker)

```
┌────────────────────────────────────────────────────────────────┐
│              docker-compose.prod.yml (Self-hosted)              │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│                     Internet                                    │
│                        │                                        │
│                        ▼                                        │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  nginx Proxy (Optional)                                   │ │
│  │  - SSL termination                                        │ │
│  │  - Load balancing                                         │ │
│  │  - Rate limiting                                          │ │
│  │  :80, :443                                                │ │
│  └────────────────┬──────────────┬──────────────────────────┘ │
│                   │              │                             │
│                   ▼              ▼                             │
│  ┌─────────────────────┐  ┌─────────────────────┐            │
│  │  Frontend Container │  │  Backend Container  │            │
│  │  - nginx alpine     │  │  - Node.js alpine   │            │
│  │  - Static files     │  │  - Express API      │            │
│  │  - 50MB image       │  │  - 150MB image      │            │
│  │  :80                │  │  :5000              │            │
│  └─────────────────────┘  └──────────┬──────────┘            │
│                                       │                        │
│                                       │                        │
│                                       ▼                        │
│                          ┌─────────────────────┐              │
│                          │ PostgreSQL Container│              │
│                          │ - postgres:15-alpine│              │
│                          │ - Persistent volume │              │
│                          │ :5432               │              │
│                          └─────────────────────┘              │
│                                                                 │
│  Resource Limits:                                              │
│  - Backend: 1 CPU, 512MB RAM                                  │
│  - Frontend: 0.5 CPU, 256MB RAM                               │
│  - PostgreSQL: 2 CPU, 1GB RAM                                 │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Mood Tracking Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   Mood Entry Data Flow                       │
└─────────────────────────────────────────────────────────────┘

1. User selects mood
   ├─ Component: MoodCheckWidget
   └─ State: local form state

2. Submit mood data
   ├─ API: POST /api/mood/entries
   ├─ Payload: { mood_score, note, timestamp }
   └─ Headers: Authorization: Bearer <token>

3. Backend validation
   ├─ Middleware: authenticateToken
   ├─ Extract: userId from JWT
   └─ Validate: moodEntrySchema (Zod)

4. Database insert
   ├─ ORM: db.insert(moodEntries)
   └─ Table: mood_entries

5. Response sent
   ├─ Status: 201 Created
   └─ Body: { id, mood_score, timestamp, ... }

6. Frontend update
   ├─ TanStack Query: invalidate ['mood-entries']
   ├─ Re-fetch: GET /api/mood/entries
   └─ UI: Update mood history list

7. Analytics update (async)
   ├─ Calculate: team averages
   ├─ Update: dashboard metrics
   └─ Identify: at-risk patterns
```

### Manager Dashboard Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Manager Dashboard Data Flow                     │
└─────────────────────────────────────────────────────────────┘

Manager loads dashboard
        │
        ▼
┌───────────────┐
│ Multiple      │  Parallel API calls:
│ API Requests  │  
└───────┬───────┘
        │
        ├─────────────────────────────────────┐
        │                                     │
        ▼                                     ▼
GET /api/analytics/team-wellness      GET /api/analytics/at-risk
        │                                     │
        │ Returns:                            │ Returns:
        │ - Avg mood score                    │ - List of employees
        │ - Trend data                        │   with low scores
        │ - Dept comparisons                  │ - Risk factors
        │                                     │
        └────────┬────────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │ Data Combined  │
        │ in Frontend    │
        └────────┬───────┘
                 │
                 ▼
        ┌────────────────┐
        │ Render Charts  │
        │ & Metrics      │
        └────────────────┘
        - Line charts (trends)
        - Bar charts (departments)
        - Alert cards (at-risk)
        - Engagement metrics
```

## Security Architecture

### Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
├─────────────────────────────────────────────────────────────┤
│  1. Network Security                                         │
│     ├─ HTTPS only (enforced)                                │
│     ├─ CORS whitelist                                       │
│     └─ Rate limiting                                        │
├─────────────────────────────────────────────────────────────┤
│  2. Authentication                                           │
│     ├─ JWT access tokens (15min expiry)                     │
│     ├─ Refresh tokens (7day expiry, HTTP-only cookies)      │
│     ├─ bcrypt password hashing (10 rounds)                  │
│     └─ Token rotation on refresh                            │
├─────────────────────────────────────────────────────────────┤
│  3. Authorization                                            │
│     ├─ Role-based access control (RBAC)                     │
│     ├─ Resource ownership checks                            │
│     └─ Endpoint-level permissions                           │
├─────────────────────────────────────────────────────────────┤
│  4. Input Validation                                         │
│     ├─ Zod schema validation                                │
│     ├─ SQL injection prevention (parameterized queries)     │
│     ├─ XSS prevention (sanitization)                        │
│     └─ CSRF protection                                      │
├─────────────────────────────────────────────────────────────┤
│  5. Data Protection                                          │
│     ├─ Encrypted secrets in env vars                        │
│     ├─ Secure cookie flags (httpOnly, secure, sameSite)     │
│     ├─ No sensitive data in logs                            │
│     └─ Database encryption at rest                          │
├─────────────────────────────────────────────────────────────┤
│  6. Error Handling                                           │
│     ├─ No stack traces in production                        │
│     ├─ Generic error messages to clients                    │
│     ├─ Detailed logs server-side only                       │
│     └─ Graceful degradation                                 │
└─────────────────────────────────────────────────────────────┘
```

### Security Best Practices Implemented

✅ **Authentication:**
- JWT with short expiry (15 minutes)
- Refresh tokens with HTTP-only cookies
- Password hashing with bcrypt (10 rounds)
- Token blacklisting on logout

✅ **Authorization:**
- Role-based access control (employee, manager, admin)
- Resource ownership verification
- Middleware for protected routes

✅ **Data Protection:**
- Environment variables for secrets
- No secrets in code or version control
- Secure cookie configuration
- HTTPS enforcement in production

✅ **Input Validation:**
- Zod schemas for all inputs
- Parameterized database queries
- XSS prevention
- SQL injection prevention

✅ **Security Headers:**
- CORS configuration
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options

## Scaling Considerations

### Horizontal Scaling

```
┌─────────────────────────────────────────────────────────────┐
│              Horizontal Scaling Architecture                 │
└─────────────────────────────────────────────────────────────┘

                    Internet
                        │
                        ▼
              ┌─────────────────┐
              │  Load Balancer  │
              │   (nginx/HAProxy)│
              └────────┬─────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│ Backend    │  │ Backend    │  │ Backend    │
│ Instance 1 │  │ Instance 2 │  │ Instance 3 │
└──────┬─────┘  └──────┬─────┘  └──────┬─────┘
       │               │               │
       └───────────────┼───────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  PostgreSQL     │
              │  (Primary)      │
              └────────┬─────────┘
                       │
              ┌────────┴─────────┐
              │                  │
              ▼                  ▼
        ┌──────────┐      ┌──────────┐
        │ Read     │      │ Read     │
        │ Replica 1│      │ Replica 2│
        └──────────┘      └──────────┘

Considerations:
- Stateless backend instances
- Session storage in Redis
- Database connection pooling
- Read replicas for analytics
```

### Performance Optimization

**Backend:**
```
1. Caching Strategy:
   ├─ Redis for session storage
   ├─ Cache frequently accessed data
   └─ Invalidate on updates

2. Database Optimization:
   ├─ Proper indexes on query columns
   ├─ Connection pooling
   ├─ Query optimization
   └─ Pagination for large datasets

3. API Optimization:
   ├─ Response compression (gzip)
   ├─ Efficient serialization
   ├─ Batch requests where possible
   └─ Rate limiting per user
```

**Frontend:**
```
1. Code Splitting:
   ✓ Vendor chunk (React, React DOM)
   ✓ UI library chunk (Radix UI)
   ✓ Query library chunk (TanStack Query)
   ✓ Route-based splitting (lazy loading)

2. Asset Optimization:
   ✓ Image compression & lazy loading
   ✓ Font subsetting
   ✓ Tree shaking unused code
   ✓ Minification & uglification

3. Caching Strategy:
   ✓ Service worker for offline support
   ✓ TanStack Query cache (5min default)
   ✓ Browser cache headers
   ✓ CDN for static assets
```

### Monitoring & Observability

```
┌─────────────────────────────────────────────────────────────┐
│                  Monitoring Stack                            │
├─────────────────────────────────────────────────────────────┤
│  Application Monitoring:                                     │
│  ├─ Health checks (/health, /healthz, /ready)              │
│  ├─ Performance metrics (response times)                     │
│  ├─ Error tracking (Sentry)                                 │
│  └─ User analytics (Google Analytics)                       │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Monitoring:                                  │
│  ├─ CPU, memory, disk usage                                 │
│  ├─ Database connections & queries                          │
│  ├─ Network traffic                                         │
│  └─ Container health (Docker)                               │
├─────────────────────────────────────────────────────────────┤
│  Logging:                                                    │
│  ├─ Structured logs (JSON format)                           │
│  ├─ Log aggregation (ELK stack / CloudWatch)               │
│  ├─ Log levels (error, warn, info, debug)                  │
│  └─ Request tracing (correlation IDs)                      │
├─────────────────────────────────────────────────────────────┤
│  Alerting:                                                   │
│  ├─ Health check failures                                   │
│  ├─ High error rates                                        │
│  ├─ Slow response times                                     │
│  └─ Resource exhaustion                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

This architecture provides:

✅ **Scalability** - Can handle growth in users and data
✅ **Maintainability** - Clear separation of concerns
✅ **Security** - Multiple layers of protection
✅ **Performance** - Optimized builds and caching
✅ **Developer Experience** - Type safety and tooling
✅ **Observability** - Comprehensive monitoring

**Next Steps:**
- Implement caching layer (Redis)
- Add comprehensive test suite
- Set up CI/CD pipeline
- Configure monitoring (Sentry, Grafana)
- Add WebSocket support for real-time features

For more detailed information, see:
- [README.md](README.md) - Getting started
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Deployment instructions
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines
