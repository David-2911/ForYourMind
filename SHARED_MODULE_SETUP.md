# Shared Module Setup Guide

This document describes the shared code module setup for the MindfulMe monorepo.

## 📁 Folder Structure

```
MindfulMe/
├── tsconfig.json              # Root TypeScript project references
├── tsconfig.base.json         # Base TypeScript config (extended by all packages)
├── shared/                    # Shared code package
│   ├── package.json          # @mindfulme/shared package definition
│   ├── tsconfig.json         # Shared package TypeScript config
│   ├── dist/                 # Compiled output (generated)
│   └── src/
│       ├── index.ts          # Main entry point (re-exports everything)
│       ├── schema.ts         # Drizzle ORM database schema
│       ├── constants.ts      # Application constants
│       └── types/
│           └── index.ts      # Additional TypeScript types
├── backend/                   # Backend API package
│   ├── package.json          # Backend dependencies (includes @mindfulme/shared)
│   ├── tsconfig.json         # Backend TypeScript config (extends base)
│   └── src/
├── frontend/                  # Frontend React package
│   ├── package.json          # Frontend dependencies (includes @mindfulme/shared)
│   ├── tsconfig.json         # Frontend TypeScript config (extends base)
│   └── src/
```

## 📦 Shared Package Structure

### `/shared/src/schema.ts`
- **Purpose**: Single source of truth for database schema
- **Contains**: 
  - Drizzle ORM table definitions (users, journals, mood_entries, etc.)
  - Zod validation schemas (insertUserSchema, insertJournalSchema, etc.)
  - TypeScript types inferred from schema (User, Journal, MoodEntry, etc.)
- **Used by**: Backend (database operations), Frontend (type checking)

### `/shared/src/types/index.ts`
- **Purpose**: Additional types not in database schema
- **Contains**:
  - `AuthResponse` - Authentication response structure
  - `WellnessMetrics` - Manager dashboard metrics
- **Used by**: Frontend and Backend

### `/shared/src/constants.ts`
- **Purpose**: Application-wide constants
- **Contains**:
  - `MOOD_SCORES` - Mood score ranges and thresholds
  - `USER_ROLES` - User role definitions
  - `APPOINTMENT_STATUS` - Appointment status values
  - `API_ENDPOINTS` - API endpoint paths
  - `TIME_CONSTANTS` - Time-related constants
  - `VALIDATION` - Validation rules
  - `CHART_COLORS` - UI color scheme
- **Used by**: Frontend and Backend

### `/shared/src/index.ts`
- **Purpose**: Main entry point for the shared package
- **Exports**: All types, schemas, and constants
- **Usage**: `import { User, MOOD_SCORES } from "@mindfulme/shared"`

## 🔧 TypeScript Configuration

### Root Configuration (`tsconfig.json`)
```json
{
  "files": [],
  "references": [
    { "path": "./shared" },
    { "path": "./backend" },
    { "path": "./frontend" }
  ]
}
```
- **Purpose**: TypeScript project references for monorepo
- **Enables**: Cross-package type checking and incremental builds

### Base Configuration (`tsconfig.base.json`)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```
- **Purpose**: Shared compiler options for all packages
- **Extended by**: `shared/`, `backend/`, and `frontend/`

### Shared Package (`shared/tsconfig.json`)
```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "declaration": true,
    "declarationMap": true
  }
}
```
- **Key Options**:
  - `composite: true` - Enables project references
  - `declaration: true` - Generates `.d.ts` type declaration files
  - `outDir: "./dist"` - Compiled output directory

### Backend Package (`backend/tsconfig.json`)
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "paths": {
      "@mindfulme/shared": ["../shared/src/index.ts"],
      "@mindfulme/shared/*": ["../shared/src/*"]
    }
  },
  "references": [{ "path": "../shared" }]
}
```
- **Key Features**:
  - Path aliases for shared package
  - Project reference to shared
  - Extends base config

### Frontend Package (`frontend/tsconfig.json`)
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./src/*"],
      "@mindfulme/shared": ["../shared/src/index.ts"],
      "@mindfulme/shared/*": ["../shared/src/*"]
    }
  },
  "references": [{ "path": "../shared" }]
}
```
- **Key Features**:
  - React JSX support
  - Path aliases for both local and shared code
  - Project reference to shared

## 📥 Package Dependencies

### Installing Shared Package

The shared package is installed as a local dependency in both backend and frontend:

```bash
# In backend
cd backend
npm install ../shared

# In frontend
cd frontend
npm install ../shared
```

This creates entries in `package.json`:
```json
{
  "dependencies": {
    "@mindfulme/shared": "file:../shared"
  }
}
```

## 🔄 Import Paths

### Before Refactoring
```typescript
// Backend
import { User } from "../../../shared/schema.js";

// Frontend
import { User } from "@/types";
```

### After Refactoring
```typescript
// Both Backend and Frontend
import { User } from "@mindfulme/shared";
import { MOOD_SCORES } from "@mindfulme/shared";

// Specific submodule imports
import { insertUserSchema } from "@mindfulme/shared/schema";
import { API_ENDPOINTS } from "@mindfulme/shared/constants";
```

### Path Alias Resolution

**TypeScript** resolves via `tsconfig.json` paths:
```json
"paths": {
  "@mindfulme/shared": ["../shared/src/index.ts"]
}
```

**Node.js Runtime** resolves via `package.json`:
```json
{
  "name": "@mindfulme/shared",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

## ✅ Verification Commands

### 1. Check TypeScript Compilation

```bash
# Check shared package
cd shared && npm run check

# Check backend
cd backend && npm run check

# Check frontend
cd frontend && npm run check
```

All commands should complete without errors.

### 2. Build All Packages

```bash
# Build shared (generates dist/ with .js and .d.ts files)
cd shared && npm run build

# Build backend (generates dist/index.js bundle)
cd backend && npm run build

# Build frontend (generates dist/ with Vite build output)
cd frontend && npm run build
```

### 3. Test Runtime

```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start frontend
cd frontend && npm run dev

# Verify:
# - Backend runs on http://localhost:5000
# - Frontend runs on http://localhost:5173
# - No import errors in console
# - Types are working correctly
```

## 🐛 Common Issues and Solutions

### Issue 1: "Cannot find module '@mindfulme/shared'"

**Cause**: Shared package not installed or not built

**Solution**:
```bash
cd shared
npm install
npm run build

cd ../backend
npm install ../shared

cd ../frontend
npm install ../shared
```

### Issue 2: TypeScript can't resolve types

**Cause**: Path aliases not configured or `composite: true` missing

**Solution**: Verify `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "composite": true,
    "paths": {
      "@mindfulme/shared": ["../shared/src/index.ts"]
    }
  },
  "references": [{ "path": "../shared" }]
}
```

### Issue 3: Runtime import errors with ES modules

**Cause**: Shared package not built, or Node.js can't resolve the package

**Solution**:
```bash
# Rebuild shared package
cd shared && npm run build

# Reinstall in backend/frontend
cd ../backend && npm install ../shared
cd ../frontend && npm install ../shared
```

### Issue 4: Type mismatches between packages

**Cause**: Frontend using stale cached types

**Solution**:
```bash
# Clear TypeScript build cache
rm -rf shared/dist
rm -rf backend/dist
rm -rf frontend/dist
rm -rf */tsconfig.tsbuildinfo

# Rebuild everything
cd shared && npm run build
cd ../backend && npm run build
cd ../frontend && npm run build
```

### Issue 5: Circular dependencies

**Cause**: Shared package trying to import from backend or frontend

**Solution**: 
- Shared package should NEVER import from backend or frontend
- Only backend and frontend import from shared
- Move any shared code into the shared package

## 🔄 Workflow for Making Changes

### Adding New Types to Shared

1. **Edit the appropriate file**:
   ```bash
   # For database types
   vim shared/src/schema.ts
   
   # For additional types
   vim shared/src/types/index.ts
   
   # For constants
   vim shared/src/constants.ts
   ```

2. **Export from index.ts** (if needed):
   ```typescript
   // shared/src/index.ts
   export * from "./new-module.js";
   ```

3. **Rebuild shared package**:
   ```bash
   cd shared && npm run build
   ```

4. **Verify in consuming packages**:
   ```bash
   cd ../backend && npm run check
   cd ../frontend && npm run check
   ```

### Updating Import Paths

When you need to update imports across the codebase:

```bash
# Find old imports
grep -r "from ['\"]../../../shared" backend/
grep -r "from ['\"]@/types" frontend/

# Replace with new import
# Example: Replace all occurrences
find backend/src -name "*.ts" -exec sed -i 's|from "../../../shared/schema.js"|from "@mindfulme/shared"|g' {} +
```

## 📊 Package Exports

The shared package uses modern package.json exports:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./schema": {
      "types": "./dist/schema.d.ts",
      "import": "./dist/schema.js"
    },
    "./types": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/types/index.js"
    },
    "./constants": {
      "types": "./dist/constants.d.ts",
      "import": "./dist/constants.js"
    }
  }
}
```

This allows imports like:
```typescript
import { User } from "@mindfulme/shared";           // Main export
import { users } from "@mindfulme/shared/schema";   // Schema only
import { MOOD_SCORES } from "@mindfulme/shared/constants"; // Constants only
```

## 🎯 Benefits of This Structure

1. **Single Source of Truth**: Database schema defined once, used everywhere
2. **Type Safety**: Full TypeScript support across packages
3. **No Code Duplication**: Constants and types shared between frontend and backend
4. **Incremental Builds**: TypeScript project references enable fast rebuilds
5. **Clear Dependencies**: Explicit package boundaries and imports
6. **Easy Maintenance**: Change types in one place, TypeScript validates everywhere
7. **Production Ready**: Compiled dist/ folder works in all environments

## 🚀 Next Steps

After setting up the shared module:

1. ✅ Update any remaining relative imports to use `@mindfulme/shared`
2. ✅ Add more constants to `shared/src/constants.ts` as needed
3. ✅ Consider adding utility functions to `shared/src/utils/`
4. ✅ Set up automated testing for shared package
5. ✅ Add CI/CD pipeline to build shared before backend/frontend
6. ✅ Document any new additions to this guide
