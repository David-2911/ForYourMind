# MindfulMe Database Schema Diagram

Complete PostgreSQL database schema with all 16 tables, relationships, and constraints.

## Schema Overview

```
Total Tables: 16
Total Foreign Keys: 14 relationships
Migrations Applied: 2 (0000_overjoyed_human_torch, 0001_refresh_tokens)
Primary Key Type: UUID (gen_random_uuid())
```

## Entity Relationship Diagram

```
┌─────────────────────────┐
│        USERS            │ ◄──────────────┐
│─────────────────────────│                │
│ • id (PK, UUID)         │                │
│ • email (UNIQUE)        │                │
│ • password              │                │
│ • role                  │                │
│ • display_name          │                │
│ • avatar_url            │                │
│ • timezone              │                │
│ • preferences (JSON)    │                │
│ • created_at            │                │
└─────────────────────────┘                │
         ▲                                 │
         │                                 │
         │ ┌───────────────────────────────┤
         │ │                               │
         │ │                               │
         │ │  ┌─────────────────────────┐  │
         │ │  │   REFRESH_TOKENS        │  │
         │ └──┤─────────────────────────│  │
         │    │ • token (PK)            │  │
         │    │ • user_id               │  │
         │    │ • expires_at            │  │
         │    │ • created_at            │  │
         │    │ • idx_user_id (INDEX)   │  │
         │    └─────────────────────────┘  │
         │                                 │
         │                                 │
┌────────┼─────────────────────────────────┼──────────┐
│        │                                 │          │
│        │                                 │          │
│  ┌─────▼─────────────┐       ┌──────────▼────────┐ │
│  │  MOOD_ENTRIES     │       │     JOURNALS      │ │
│  │───────────────────│       │───────────────────│ │
│  │ • id (PK, UUID)   │       │ • id (PK, UUID)   │ │
│  │ • user_id (FK)    │       │ • user_id (FK)    │ │
│  │ • mood_score      │       │ • mood_score      │ │
│  │ • notes           │       │ • content         │ │
│  │ • created_at      │       │ • tags (JSON)     │ │
│  └───────────────────┘       │ • is_private      │ │
│                              │ • created_at      │ │
│                              └───────────────────┘ │
│                                                    │
│  ┌────────────────────────┐                       │
│  │  WELLNESS_ASSESSMENTS  │                       │
│  │────────────────────────│                       │
│  │ • id (PK, UUID)        │                       │
│  │ • user_id (FK) ────────┼───────────────────────┘
│  │ • assessment_type      │
│  │ • title                │
│  │ • questions (JSON)     │
│  │ • is_active            │
│  │ • created_at           │
│  └────────────────────────┘
│           ▲
│           │
│           │
│  ┌────────┴───────────────┐
│  │  ASSESSMENT_RESPONSES  │
│  │────────────────────────│
│  │ • id (PK, UUID)        │
│  │ • assessment_id (FK)   │
│  │ • user_id (FK) ────────┼────────────────────────┐
│  │ • responses (JSON)     │                        │
│  │ • total_score          │                        │
│  │ • category_scores(JSON)│                        │
│  │ • recommendations(JSON)│                        │
│  │ • completed_at         │                        │
│  └────────────────────────┘                        │
│                                                    │
│                                                    │
│  ┌─────────────────────┐                          │
│  │  BUDDY_MATCHES      │                          │
│  │─────────────────────│                          │
│  │ • id (PK, UUID)     │                          │
│  │ • user_a_id (FK) ───┼──────────────────────────┤
│  │ • user_b_id (FK) ───┼──────────────────────────┘
│  │ • compatibility_score│
│  │ • status            │
│  │ • created_at        │
│  └─────────────────────┘
│
└────────────────────────────────────────────────────


┌───────────────────────────────────────────────────────┐
│              ANONYMOUS FEATURES (NO FK)               │
│───────────────────────────────────────────────────────│
│                                                       │
│  ┌──────────────────────┐                            │
│  │  ANONYMOUS_RANTS     │  ⚠️  NO user_id column!    │
│  │──────────────────────│                            │
│  │ • id (PK, UUID)      │      Truly anonymous       │
│  │ • anonymous_token    │      for safe venting      │
│  │ • content            │                            │
│  │ • sentiment_score    │                            │
│  │ • support_count      │                            │
│  │ • created_at         │                            │
│  └──────────────────────┘                            │
│                                                       │
└───────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────┐
│           THERAPIST DIRECTORY & APPOINTMENTS            │
│─────────────────────────────────────────────────────────│
│                                                         │
│  ┌──────────────────────┐        ┌──────────────────┐  │
│  │    THERAPISTS        │        │   APPOINTMENTS   │  │
│  │──────────────────────│        │──────────────────│  │
│  │ • id (PK, UUID)      │◄───────│ • id (PK, UUID)  │  │
│  │ • name               │        │ • therapist_id(FK│  │
│  │ • specialization     │        │ • user_id (FK) ──┼──┼─► users
│  │ • license_number     │        │ • start_time     │  │
│  │ • profile_url        │        │ • end_time       │  │
│  │ • rating             │        │ • status         │  │
│  │ • availability (JSON)│        │ • notes          │  │
│  └──────────────────────┘        └──────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│        MANAGER DASHBOARD & ORGANIZATIONAL FEATURES          │
│─────────────────────────────────────────────────────────────│
│                                                             │
│  ┌──────────────────────┐                                  │
│  │   ORGANIZATIONS      │                                  │
│  │──────────────────────│                                  │
│  │ • id (PK, UUID)      │                                  │
│  │ • name               │                                  │
│  │ • admin_user_id (FK)─┼──► users.id                     │
│  │ • settings (JSON)    │                                  │
│  │ • wellness_score     │                                  │
│  │ • created_at         │                                  │
│  └──────────────────────┘                                  │
│           ▲                                                │
│           │                                                │
│           │                                                │
│  ┌────────┴────────────┐       ┌─────────────────────┐    │
│  │    EMPLOYEES        │       │ WELLBEING_SURVEYS   │    │
│  │─────────────────────│       │─────────────────────│    │
│  │ • id (PK, UUID)     │       │ • id (PK, UUID)     │    │
│  │ • user_id (FK) ─────┼───────┼─► users.id          │    │
│  │ • org_id (FK)       │       │ • org_id (FK) ──────┘    │
│  │ • job_title         │       │ • title             │    │
│  │ • department        │       │ • questions (JSON)  │    │
│  │ • anonymized_id(UNQ)│       │ • is_active         │    │
│  │ • wellness_streak   │       │ • created_at        │    │
│  └─────────────────────┘       └─────────────────────┘    │
│                                          ▲                 │
│                                          │                 │
│                                          │                 │
│                                 ┌────────┴────────────┐    │
│                                 │ SURVEY_RESPONSES    │    │
│                                 │─────────────────────│    │
│                                 │ • id (PK, UUID)     │    │
│                                 │ • survey_id (FK)    │    │
│                                 │ • anonymous_token   │    │
│                                 │ • responses (JSON)  │    │
│                                 │ • wellness_score    │    │
│                                 │ • created_at        │    │
│                                 └─────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘


┌───────────────────────────┐
│  LEARNING CONTENT         │
│───────────────────────────│
│                           │
│  ┌──────────────────────┐ │
│  │      COURSES         │ │
│  │──────────────────────│ │
│  │ • id (PK, UUID)      │ │
│  │ • title              │ │
│  │ • description        │ │
│  │ • duration_minutes   │ │
│  │ • difficulty         │ │
│  │ • thumbnail_url      │ │
│  │ • modules (JSON)     │ │
│  └──────────────────────┘ │
│                           │
└───────────────────────────┘
```

## Table Breakdown by Feature

### 🔐 Authentication & User Management
- **users** - Core user accounts with roles (individual/manager/admin)
- **refresh_tokens** - JWT refresh token storage for persistent sessions

### 😊 Mood Tracking & Wellness
- **mood_entries** - Daily mood scores (1-10) with notes
- **journals** - Private journaling entries with optional mood
- **wellness_assessments** - Wellness questionnaires/surveys
- **assessment_responses** - User responses to wellness assessments

### 🤐 Anonymous Features
- **anonymous_rants** - Safe venting with NO user_id (truly anonymous)
- **survey_responses** - Anonymous survey responses using tokens

### 👥 Social Features
- **buddy_matches** - Peer matching system with compatibility scores

### 🩺 Therapist Directory
- **therapists** - Therapist profiles with specializations
- **appointments** - Booking system for therapy sessions

### 🏢 Manager Dashboard
- **organizations** - Company/organization entities
- **employees** - User-organization associations with anonymized IDs
- **wellbeing_surveys** - Manager-created organizational surveys

### 📚 Learning
- **courses** - Educational content modules

## Foreign Key Relationships (14 total)

| From Table | Column | → To Table | Column | Notes |
|------------|--------|-----------|--------|-------|
| organizations | admin_user_id | → users | id | Organization owner |
| employees | user_id | → users | id | User in organization |
| employees | org_id | → organizations | id | Organization membership |
| journals | user_id | → users | id | Personal journals |
| appointments | therapist_id | → therapists | id | Which therapist |
| appointments | user_id | → users | id | Which user booked |
| wellbeing_surveys | org_id | → organizations | id | Survey belongs to org |
| wellness_assessments | user_id | → users | id | Assessment created by user |
| assessment_responses | assessment_id | → wellness_assessments | id | Response to assessment |
| assessment_responses | user_id | → users | id | Who took assessment |
| survey_responses | survey_id | → wellbeing_surveys | id | Response to org survey |
| mood_entries | user_id | → users | id | User's mood tracking |
| buddy_matches | user_a_id | → users | id | First buddy |
| buddy_matches | user_b_id | → users | id | Second buddy |

⚠️ **Note:** `refresh_tokens.user_id` references `users.id` but may not have a formal FK constraint.

## Indexes

| Table | Index Name | Columns | Purpose |
|-------|-----------|---------|---------|
| users | users_email_unique | email | Unique constraint + fast login lookup |
| users | users_pkey | id | Primary key index (auto-created) |
| employees | employees_anonymized_id_unique | anonymized_id | Unique anonymous ID per employee |
| refresh_tokens | idx_refresh_tokens_user_id | user_id | Fast token lookup by user |
| *(all tables)* | *_pkey | id | Primary key indexes (auto-created) |

## Unique Constraints

1. **users.email** - No duplicate email addresses (enforces unique accounts)
2. **employees.anonymized_id** - Unique anonymous identifier for survey responses

## Critical Schema Notes

### ✅ Anonymity Guarantees

**anonymous_rants table has NO user_id column:**
- Uses `anonymous_token` instead (random string)
- Ensures true anonymity for sensitive venting
- Cannot be linked back to user accounts

**survey_responses uses anonymous_token:**
- Managers cannot identify which employee submitted responses
- Protects employee privacy during org-wide surveys

### 🔑 Authentication Flow

1. User registers → Creates entry in `users` table
2. User logs in → Creates entry in `refresh_tokens` table
3. Access token expires (15min) → Frontend uses refresh token
4. Refresh token validated → New access token issued
5. User logs out → Refresh token deleted

### 📊 Data Types

- **Primary Keys:** All `varchar` with `gen_random_uuid()` default
- **Timestamps:** All use `timestamp` with `now()` default
- **Flexible Data:** JSON columns for preferences, questions, responses, modules
- **Enums:** Stored as `text` (role, status, difficulty, assessment_type)

## Migration History

### Migration 0000: Initial Schema (0000_overjoyed_human_torch.sql)
Created 14 tables:
- anonymous_rants
- appointments
- assessment_responses
- buddy_matches
- courses
- employees
- journals
- mood_entries
- organizations
- survey_responses
- therapists
- users
- wellbeing_surveys
- wellness_assessments

### Migration 0001: Refresh Tokens (0001_refresh_tokens.sql)
Added:
- refresh_tokens table
- idx_refresh_tokens_user_id index

## Verification Checklist

Use this checklist after running `scripts/verify-database-schema.sql`:

- [ ] All 16 tables exist
- [ ] users table has email unique constraint
- [ ] All tables have UUID primary keys
- [ ] anonymous_rants has NO user_id column
- [ ] All 14 foreign key relationships exist
- [ ] idx_refresh_tokens_user_id index exists
- [ ] employees.anonymized_id is unique
- [ ] Both migrations applied in drizzle_migrations table
- [ ] No orphaned foreign key values
- [ ] All tables have timestamps (created_at)

## Production Verification Commands

### Quick Schema Check
```bash
# List all tables
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"

# Count tables (should be 16 + drizzle_migrations = 17)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# Check migration status
psql $DATABASE_URL -c "SELECT * FROM drizzle_migrations ORDER BY created_at;"
```

### Full Verification
```bash
# Run complete verification script
psql $DATABASE_URL -f scripts/verify-database-schema.sql > schema-verification-results.txt

# Review output
cat schema-verification-results.txt
```

## Schema Health Metrics

After running verification script, check:

1. **Table Count:** Should be 16 application tables + 1 drizzle_migrations = 17 total
2. **Foreign Key Count:** Should be 14 relationships
3. **Index Count:** Minimum 18 (16 primary keys + 1 email unique + 1 refresh_tokens user_id)
4. **Orphaned Records:** Should be 0 for all foreign key checks
5. **Migration Count:** Should be 2 (0000_overjoyed_human_torch, 0001_refresh_tokens)

## Next Steps

1. ✅ Run verification script: `psql $DATABASE_URL -f scripts/verify-database-schema.sql`
2. ✅ Review output for any missing tables/columns
3. ✅ Verify anonymity: Confirm `anonymous_rants` has no `user_id` column
4. ✅ Check indexes: Ensure performance indexes exist
5. ✅ Validate migrations: Both should be in `drizzle_migrations` table
6. ✅ Test queries: Run sample queries to ensure data integrity

## Related Documentation

- **scripts/verify-database-schema.sql** - SQL verification queries
- **shared/src/schema.ts** - TypeScript schema definitions (source of truth)
- **backend/migrations/** - Applied database migrations
- **POSTGRES_MIGRATION_GUIDE.md** - Migration execution guide
