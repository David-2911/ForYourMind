# Shared Module Quick Reference

## 🎯 Import Examples

### Common Imports
```typescript
// Types from database schema
import { User, Journal, MoodEntry } from "@mindfulme/shared";

// Zod validation schemas
import { insertUserSchema, insertJournalSchema } from "@mindfulme/shared/schema";

// Constants
import { MOOD_SCORES, USER_ROLES, API_ENDPOINTS } from "@mindfulme/shared/constants";

// Additional types
import { AuthResponse, WellnessMetrics } from "@mindfulme/shared";
```

## 📂 File Locations

| What | Where | Used By |
|------|-------|---------|
| Database schema | `shared/src/schema.ts` | Backend (DB ops), Frontend (types) |
| Additional types | `shared/src/types/index.ts` | Frontend & Backend |
| Constants | `shared/src/constants.ts` | Frontend & Backend |
| Main exports | `shared/src/index.ts` | All consumers |

## 🛠️ Common Commands

```bash
# Build shared package (always do this first!)
cd shared && npm run build

# Check TypeScript in all packages
cd shared && npm run check
cd backend && npm run check
cd frontend && npm run check

# Install shared in backend/frontend
cd backend && npm install ../shared
cd frontend && npm install ../shared

# Build everything
cd shared && npm run build
cd ../backend && npm run build
cd ../frontend && npm run build

# Run servers
cd backend && npm run dev    # http://localhost:5000
cd frontend && npm run dev   # http://localhost:5173
```

## 📋 TypeScript Config Pattern

Each package follows this pattern:

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

## ⚠️ Important Rules

1. **Shared package NEVER imports from backend or frontend**
2. **Always rebuild shared after changes**: `cd shared && npm run build`
3. **Use `@mindfulme/shared` imports**, not relative paths
4. **Keep database types in schema.ts**, UI-only types in types/index.ts
5. **Add new constants to constants.ts**, not scattered in code

## 🔍 Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Can't find module | `cd shared && npm run build && cd ../backend && npm install ../shared` |
| Type errors | `rm -rf */dist && cd shared && npm run build` |
| Runtime import error | `cd shared && npm run build` |
| Stale types | `rm */tsconfig.tsbuildinfo && npm run check` |

## 📊 Available Types

### Database Tables
- `User` / `InsertUser`
- `Journal` / `InsertJournal`
- `MoodEntry` / `InsertMoodEntry`
- `AnonymousRant` / `InsertAnonymousRant`
- `Therapist`
- `Appointment` / `InsertAppointment`
- `Course`
- `Organization`
- `Employee`
- `WellbeingSurvey`
- `SurveyResponse`
- `WellnessAssessment` / `InsertWellnessAssessment`
- `AssessmentResponse` / `InsertAssessmentResponse`
- `BuddyMatch`

### Additional Types
- `AuthResponse`
- `WellnessMetrics`

### Validation Schemas
- `insertUserSchema`
- `insertJournalSchema`
- `insertMoodEntrySchema`
- `insertAnonymousRantSchema`
- `insertAppointmentSchema`
- `insertWellnessAssessmentSchema`
- `insertAssessmentResponseSchema`

### Constants
- `MOOD_SCORES` - Min, max, thresholds
- `USER_ROLES` - Individual, manager, admin
- `APPOINTMENT_STATUS` - Pending, confirmed, completed, cancelled
- `BUDDY_MATCH_STATUS` - Pending, accepted, declined
- `ASSESSMENT_TYPES` - Comprehensive, quick-check, monthly-review
- `QUESTION_TYPES` - Scale, multiple-choice, text
- `API_ENDPOINTS` - All API routes
- `TIME_CONSTANTS` - Token expiry times
- `VALIDATION` - Password length, email regex, etc.
- `CHART_COLORS` - UI color scheme
