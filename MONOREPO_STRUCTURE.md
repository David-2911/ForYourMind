# MindfulMe Monorepo Structure

```
MindfulMe/
│
├── 📄 tsconfig.json                    # Root: Project references
├── 📄 tsconfig.base.json               # Base config (extended by all)
├── 📄 package.json                     # Root package
│
├── 📦 shared/                          # @mindfulme/shared package
│   ├── 📄 package.json                # Package definition
│   ├── 📄 tsconfig.json               # Extends base, composite: true
│   ├── 📁 src/
│   │   ├── 📄 index.ts                # Main entry (re-exports all)
│   │   ├── 📄 schema.ts               # Database schema + types
│   │   ├── 📄 constants.ts            # App-wide constants
│   │   └── 📁 types/
│   │       └── 📄 index.ts            # Additional types
│   └── 📁 dist/                       # Built output (.js + .d.ts)
│       ├── index.js, index.d.ts
│       ├── schema.js, schema.d.ts
│       ├── constants.js, constants.d.ts
│       └── types/
│
├── 📦 backend/                         # Backend API server
│   ├── 📄 package.json                # Includes @mindfulme/shared
│   ├── 📄 tsconfig.json               # Extends base, references shared
│   ├── 📁 src/
│   │   ├── 📄 index.ts
│   │   ├── 📄 database.ts             # Uses @mindfulme/shared
│   │   ├── 📁 storage/
│   │   │   ├── index.ts               # Uses @mindfulme/shared
│   │   │   ├── sqliteStorage.ts       # Uses @mindfulme/shared
│   │   │   └── postgresStorage.ts     # Uses @mindfulme/shared
│   │   └── 📁 routes/
│   │       └── index.ts               # Uses @mindfulme/shared/schema
│   └── 📁 dist/                       # esbuild bundle
│       └── index.js
│
└── 📦 frontend/                        # React SPA
    ├── 📄 package.json                # Includes @mindfulme/shared
    ├── 📄 tsconfig.json               # Extends base, references shared
    ├── 📁 src/
    │   ├── 📄 main.tsx
    │   ├── 📁 types/
    │   │   └── index.ts               # Re-exports @mindfulme/shared
    │   ├── 📁 pages/
    │   │   └── employee-dashboard.tsx # Uses @mindfulme/shared
    │   └── 📁 components/
    └── 📁 dist/                       # Vite build output
        ├── index.html
        └── assets/
```

## 🔗 Dependency Flow

```
┌─────────────────────────────────────────────────────────────┐
│                       MindfulMe Root                         │
│                    (tsconfig.json)                           │
└──────────────────┬──────────────────────────────────────────┘
                   │
       ┌───────────┼───────────┐
       │           │           │
       ▼           ▼           ▼
   ┌───────┐  ┌─────────┐  ┌──────────┐
   │shared │  │ backend │  │ frontend │
   │       │  │         │  │          │
   │ 📦    │  │ 📦      │  │ 📦       │
   └───────┘  └────┬────┘  └─────┬────┘
              │    │         │    │
              │    └─────────┼────┘
              │              │
              └──────────────┘
                imports from
              @mindfulme/shared
```

## 📊 Import Relationships

### Shared Package (No external imports)
```typescript
// shared/src/schema.ts
import { pgTable } from "drizzle-orm/pg-core";
import { z } from "zod";

export const users = pgTable("users", {...});
export type User = typeof users.$inferSelect;
```

### Backend (Imports from shared)
```typescript
// backend/src/routes/index.ts
import { insertUserSchema, User } from "@mindfulme/shared";
import { MOOD_SCORES } from "@mindfulme/shared/constants";

// backend/src/database.ts
import * as schema from "@mindfulme/shared/schema";
```

### Frontend (Imports from shared)
```typescript
// frontend/src/pages/employee-dashboard.tsx
import { Journal, MoodEntry } from "@mindfulme/shared";

// frontend/src/types/index.ts
export type { User, Journal } from "@mindfulme/shared";
```

## 🔄 TypeScript Compilation Flow

```
1️⃣  tsc in shared/
    └─> Generates dist/*.js and dist/*.d.ts

2️⃣  tsc in backend/
    └─> Uses shared/dist/*.d.ts for type checking
    └─> esbuild bundles to dist/index.js

3️⃣  tsc in frontend/
    └─> Uses shared/dist/*.d.ts for type checking
    └─> vite builds to dist/
```

## 🎯 Path Resolution

### TypeScript (Development)
```json
// tsconfig.json paths
"@mindfulme/shared": ["../shared/src/index.ts"]
                               ↓
               TypeScript resolves to source
```

### Node.js (Runtime - Backend)
```json
// package.json
"@mindfulme/shared": "file:../shared"
                          ↓
          Node resolves to shared/dist/index.js
```

### Vite (Build - Frontend)
```json
// package.json
"@mindfulme/shared": "file:../shared"
                          ↓
      Vite bundles from shared/dist/index.js
```

## 📦 Package Exports

```typescript
// From shared/package.json
{
  "exports": {
    ".": "./dist/index.js",              // @mindfulme/shared
    "./schema": "./dist/schema.js",      // @mindfulme/shared/schema
    "./constants": "./dist/constants.js", // @mindfulme/shared/constants
    "./types": "./dist/types/index.js"   // @mindfulme/shared/types
  }
}
```

## 🚀 Build Order

```
Step 1: Build Shared
┌─────────────────────────┐
│ cd shared               │
│ npm run build           │
│   └─> tsc               │
│       └─> dist/*.js     │
│       └─> dist/*.d.ts   │
└─────────────────────────┘
            ↓
Step 2: Build Backend
┌─────────────────────────┐
│ cd backend              │
│ npm run build           │
│   └─> esbuild           │
│       └─> dist/index.js │
└─────────────────────────┘
            ↓
Step 3: Build Frontend
┌─────────────────────────┐
│ cd frontend             │
│ npm run build           │
│   └─> tsc + vite        │
│       └─> dist/         │
└─────────────────────────┘
```

## 🎭 Development vs Production

### Development (npm run dev)
```
Backend:  Uses ts-node/esm
          └─> Compiles TypeScript on-the-fly
          └─> Imports @mindfulme/shared from ../shared/dist/

Frontend: Uses Vite dev server
          └─> Fast HMR with esbuild
          └─> Imports @mindfulme/shared from ../shared/dist/
```

### Production (npm run build)
```
Backend:  esbuild bundles everything
          └─> Single dist/index.js file
          └─> External packages not bundled

Frontend: Vite production build
          └─> Optimized and minified
          └─> dist/assets/*.js with hash
```

## 🔍 Type Checking Flow

```
Developer writes code
        ↓
VS Code / Editor
        ↓
TypeScript Language Server
        ↓
Reads tsconfig.json paths
        ↓
Resolves @mindfulme/shared → ../shared/src/index.ts
        ↓
Loads type definitions
        ↓
Provides IntelliSense & error checking
        ↓
npm run check (tsc --noEmit)
        ↓
Validates all types across projects
```

## 📝 Key Principles

1. **Shared is independent** - Never imports from backend or frontend
2. **Always build shared first** - Backend and frontend depend on it
3. **Path aliases for DX** - TypeScript uses src/, runtime uses dist/
4. **Type safety everywhere** - .d.ts files ensure correctness
5. **Composite projects** - Enables incremental builds
6. **File: protocol** - Local npm install keeps packages in sync

---

**This structure enables:**
- ✅ Full type safety across packages
- ✅ No code duplication
- ✅ Fast incremental builds
- ✅ Clear dependency boundaries
- ✅ Easy to understand and maintain
