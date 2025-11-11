# Database Schema Verification Summary

**Created:** $(date)  
**Purpose:** Complete PostgreSQL schema verification for production deployment

## Quick Verification Steps

### Step 1: Run Verification Script (5 minutes)

```bash
# Connect to your production database and run the verification script
psql $DATABASE_URL -f scripts/verify-database-schema.sql > schema-verification-output.txt

# Or if you prefer pgAdmin/DBeaver:
# 1. Open scripts/verify-database-schema.sql
# 2. Copy sections and run them one by one
# 3. Save results to a file
```

### Step 2: Review Critical Checkpoints

After running the script, verify these critical elements:

#### ✅ Table Count Check
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
```
**Expected:** 17 tables (16 application tables + drizzle_migrations)

**Application Tables (16):**
1. users
2. refresh_tokens
3. mood_entries
4. journals
5. wellness_assessments
6. assessment_responses
7. anonymous_rants
8. buddy_matches
9. therapists
10. appointments
11. organizations
12. employees
13. wellbeing_surveys
14. survey_responses
15. courses
16. drizzle_migrations (migration tracker)

#### ✅ Users Table Structure
```sql
\d users
```
**Must have columns:**
- id (varchar, PRIMARY KEY)
- email (text, NOT NULL, UNIQUE)
- password (text, NOT NULL)
- role (text, NOT NULL)
- display_name (text, NOT NULL)
- avatar_url (text)
- timezone (text)
- preferences (json)
- created_at (timestamp)

#### ✅ Mood Tracking Table
```sql
\d mood_entries
```
**Must have columns:**
- id (varchar, PRIMARY KEY)
- user_id (varchar, FOREIGN KEY → users.id)
- mood_score (integer, NOT NULL)
- notes (text)
- created_at (timestamp)

#### ✅ Anonymous Rants (CRITICAL ANONYMITY CHECK)
```sql
\d anonymous_rants
```
**Must have columns:**
- id (varchar, PRIMARY KEY)
- anonymous_token (text, NOT NULL)
- content (text, NOT NULL)
- sentiment_score (real)
- support_count (integer)
- created_at (timestamp)

**⚠️ MUST NOT HAVE:**
- user_id column (ensures true anonymity)

**Verification query:**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'anonymous_rants' 
  AND column_name = 'user_id';
-- Should return 0 rows
```

#### ✅ Foreign Key Relationships
```sql
SELECT COUNT(*) 
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
  AND table_schema = 'public';
```
**Expected:** 14 foreign key constraints

**Critical relationships to verify:**
- mood_entries.user_id → users.id
- journals.user_id → users.id
- appointments.user_id → users.id
- appointments.therapist_id → therapists.id
- employees.user_id → users.id
- employees.org_id → organizations.id

#### ✅ Indexes
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;
```
**Must include:**
- users_email_unique (or similar) on users.email
- idx_refresh_tokens_user_id on refresh_tokens.user_id
- employees_anonymized_id_unique on employees.anonymized_id
- Primary key indexes on all 16 tables (*_pkey)

#### ✅ Migration Status
```sql
SELECT * FROM drizzle_migrations ORDER BY created_at;
```
**Expected:** 2 migrations
1. 0000_overjoyed_human_torch (initial schema)
2. 0001_refresh_tokens (refresh tokens table)

## Expected Output Summary

### Table Count Matrix

| Table Name | Should Exist | Columns | Foreign Keys |
|------------|--------------|---------|--------------|
| users | ✅ Yes | 9 | 0 (referenced by others) |
| refresh_tokens | ✅ Yes | 4 | 0 (user_id not formal FK) |
| mood_entries | ✅ Yes | 5 | 1 (user_id) |
| journals | ✅ Yes | 7 | 1 (user_id) |
| wellness_assessments | ✅ Yes | 7 | 1 (user_id) |
| assessment_responses | ✅ Yes | 8 | 2 (assessment_id, user_id) |
| anonymous_rants | ✅ Yes | 6 | 0 (NO user_id!) |
| buddy_matches | ✅ Yes | 6 | 2 (user_a_id, user_b_id) |
| therapists | ✅ Yes | 7 | 0 |
| appointments | ✅ Yes | 7 | 2 (therapist_id, user_id) |
| organizations | ✅ Yes | 6 | 1 (admin_user_id) |
| employees | ✅ Yes | 7 | 2 (user_id, org_id) |
| wellbeing_surveys | ✅ Yes | 6 | 1 (org_id) |
| survey_responses | ✅ Yes | 6 | 1 (survey_id) |
| courses | ✅ Yes | 7 | 0 |
| drizzle_migrations | ✅ Yes | 4 | 0 |

### Foreign Key Map

```
users ← (referenced by many)
  ├─ organizations.admin_user_id
  ├─ employees.user_id
  ├─ journals.user_id
  ├─ appointments.user_id
  ├─ wellness_assessments.user_id
  ├─ assessment_responses.user_id
  ├─ mood_entries.user_id
  ├─ buddy_matches.user_a_id
  └─ buddy_matches.user_b_id

organizations ← 
  ├─ employees.org_id
  └─ wellbeing_surveys.org_id

therapists ←
  └─ appointments.therapist_id

wellness_assessments ←
  └─ assessment_responses.assessment_id

wellbeing_surveys ←
  └─ survey_responses.survey_id
```

## Troubleshooting Common Issues

### Issue: Missing Tables

**Symptom:** Table count is less than 16

**Diagnosis:**
```sql
-- See which tables are actually present
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Solution:**
```bash
# Run migrations manually
cd backend
npm run db:push

# Or re-run migrations
npm run db:migrate
```

### Issue: Anonymous Rants Has user_id Column

**Symptom:** anonymous_rants table contains user_id column (breaks anonymity!)

**Diagnosis:**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'anonymous_rants';
```

**Solution:**
```sql
-- Remove user_id column if it exists (DANGEROUS - check data first!)
ALTER TABLE anonymous_rants DROP COLUMN IF EXISTS user_id;
```

### Issue: Missing Foreign Keys

**Symptom:** Foreign key count is less than 14

**Diagnosis:**
```sql
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

**Solution:**
```bash
# Re-run initial migration
psql $DATABASE_URL -f backend/migrations/0000_overjoyed_human_torch.sql
```

### Issue: Missing Indexes

**Symptom:** idx_refresh_tokens_user_id index not found

**Diagnosis:**
```sql
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname = 'idx_refresh_tokens_user_id';
```

**Solution:**
```bash
# Re-run refresh tokens migration
psql $DATABASE_URL -f backend/migrations/0001_refresh_tokens.sql
```

### Issue: Migrations Not Recorded

**Symptom:** drizzle_migrations table is empty or missing migrations

**Diagnosis:**
```sql
SELECT * FROM drizzle_migrations ORDER BY created_at;
```

**Solution:**
```bash
# Manually insert migration records
psql $DATABASE_URL <<EOF
INSERT INTO drizzle_migrations (hash, created_at) 
VALUES 
  ('0000_overjoyed_human_torch', NOW()),
  ('0001_refresh_tokens', NOW())
ON CONFLICT (hash) DO NOTHING;
EOF
```

## Production Readiness Checklist

After verification, confirm these items:

### Database Schema ✅
- [ ] All 16 application tables exist
- [ ] drizzle_migrations table exists with 2 entries
- [ ] users.email has unique constraint
- [ ] anonymous_rants has NO user_id column
- [ ] All 14 foreign keys exist
- [ ] idx_refresh_tokens_user_id index exists
- [ ] employees.anonymized_id has unique constraint
- [ ] All tables have UUID primary keys
- [ ] All tables have created_at timestamps
- [ ] No orphaned foreign key values

### Authentication Flow ✅
- [ ] users table accepts new registrations
- [ ] refresh_tokens table stores JWT tokens
- [ ] Email uniqueness enforced (no duplicate accounts)
- [ ] Password column exists (stores bcrypt hashes)
- [ ] Role column exists (individual/manager/admin)

### Feature Completeness ✅
- [ ] Mood tracking: mood_entries table exists
- [ ] Journaling: journals table exists
- [ ] Assessments: wellness_assessments + assessment_responses exist
- [ ] Anonymous venting: anonymous_rants exists (no user_id!)
- [ ] Therapist directory: therapists + appointments exist
- [ ] Manager dashboard: organizations + employees + wellbeing_surveys exist
- [ ] Buddy matching: buddy_matches table exists
- [ ] Learning: courses table exists

### Performance ✅
- [ ] Primary key indexes on all tables (automatic)
- [ ] users.email indexed for fast login lookup
- [ ] refresh_tokens.user_id indexed for token validation
- [ ] employees.anonymized_id indexed for survey aggregation

### Data Integrity ✅
- [ ] Foreign keys enforce referential integrity
- [ ] Unique constraints prevent duplicates
- [ ] NOT NULL constraints on critical fields
- [ ] Default values set for optional fields

## Next Steps After Verification

### If All Checks Pass ✅

Your database schema is complete and production-ready!

**Proceed with:**
1. ✅ Test authentication flow (sign up, login, refresh, logout)
2. ✅ Test mood tracking feature (create mood entry)
3. ✅ Test journaling feature (create journal entry)
4. ✅ Test anonymous venting (verify no user tracking)
5. ✅ Monitor production logs for errors
6. ✅ Set up database backups (Render auto-backups)
7. ✅ Document any environment-specific configurations

### If Checks Fail ❌

**Missing Tables:**
1. Check migration status: `SELECT * FROM drizzle_migrations;`
2. Re-run migrations: `npm run db:migrate` in backend directory
3. Or manually apply: `psql $DATABASE_URL -f backend/migrations/0000_overjoyed_human_torch.sql`

**Schema Mismatches:**
1. Compare actual schema with shared/src/schema.ts
2. Generate new migration if needed: `npm run db:generate`
3. Apply migration: `npm run db:migrate`

**Performance Issues:**
1. Check missing indexes: Review Section 12 of verification output
2. Add indexes for commonly queried columns
3. Monitor slow queries with pg_stat_statements

## Resources

- **Verification Script:** `/scripts/verify-database-schema.sql`
- **Visual Diagram:** `/DATABASE_SCHEMA_DIAGRAM.md`
- **Schema Definition:** `/shared/src/schema.ts`
- **Migrations:** `/backend/migrations/`
- **Migration Guide:** `/POSTGRES_MIGRATION_GUIDE.md`

## Support

If you encounter issues during verification:

1. **Check Documentation:**
   - DATABASE_SCHEMA_DIAGRAM.md (visual reference)
   - POSTGRES_MIGRATION_GUIDE.md (migration troubleshooting)
   - ARCHITECTURE.md (system overview)

2. **Review Logs:**
   - Render backend logs (deployment issues)
   - PostgreSQL logs (query errors)
   - Migration output (schema changes)

3. **Common Commands:**
   ```bash
   # View database connection
   echo $DATABASE_URL
   
   # Connect to database
   psql $DATABASE_URL
   
   # List all tables
   \dt
   
   # Describe table structure
   \d table_name
   
   # View indexes
   \di
   
   # Exit psql
   \q
   ```

## Verification Report Template

After running the script, document your findings:

```
=== SCHEMA VERIFICATION REPORT ===
Date: [Date]
Database: [Production/Staging]
Environment: [Render/Local]

SUMMARY:
- Total Tables: [Count] (Expected: 17)
- Foreign Keys: [Count] (Expected: 14)
- Indexes: [Count] (Expected: 18+)
- Migrations: [Count] (Expected: 2)

CRITICAL CHECKS:
✅/❌ All 16 application tables exist
✅/❌ anonymous_rants has NO user_id
✅/❌ users.email is unique
✅/❌ All foreign keys exist
✅/❌ Performance indexes exist
✅/❌ Both migrations applied

ISSUES FOUND:
[List any issues or "None"]

RECOMMENDATIONS:
[Any suggestions or "Schema is production-ready"]

VERIFIED BY: [Your name]
```

---

**Status:** Ready for production verification  
**Last Updated:** Generated during deployment preparation  
**Maintenance:** Re-run after any schema changes or migrations
