-- ============================================================
-- PostgreSQL Database Schema Verification Script
-- ============================================================
-- Run this script against your PostgreSQL database to verify
-- that all tables, columns, constraints, and indexes are correct
-- 
-- Usage:
--   psql $DATABASE_URL -f scripts/verify-database-schema.sql
-- Or copy-paste sections into your database client (pgAdmin, DBeaver, etc.)
-- ============================================================

-- ============================================================
-- 1. LIST ALL TABLES
-- ============================================================
\echo '\n=== 1. ALL TABLES IN DATABASE ==='
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Expected tables (16 total):
-- anonymous_rants, appointments, assessment_responses, buddy_matches,
-- courses, employees, journals, mood_entries, organizations,
-- refresh_tokens, survey_responses, therapists, users,
-- wellbeing_surveys, wellness_assessments, drizzle_migrations

-- ============================================================
-- 2. USERS TABLE VERIFICATION
-- ============================================================
\echo '\n=== 2. USERS TABLE SCHEMA ==='
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Expected columns:
-- id (varchar, PK, UUID default)
-- email (text, NOT NULL, UNIQUE)
-- password (text, NOT NULL) - bcrypt hashed
-- role (text, NOT NULL) - 'individual', 'manager', or 'admin'
-- display_name (text, NOT NULL)
-- avatar_url (text, nullable)
-- timezone (text, default 'UTC')
-- preferences (json, default {})
-- created_at (timestamp, default now())

\echo '\n=== Users Table Constraints ==='
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'users'
ORDER BY tc.constraint_type, tc.constraint_name;

-- ============================================================
-- 3. MOOD TRACKING TABLE
-- ============================================================
\echo '\n=== 3. MOOD_ENTRIES TABLE SCHEMA ==='
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'mood_entries'
ORDER BY ordinal_position;

-- Expected columns:
-- id (varchar, PK, UUID default)
-- user_id (varchar, FK to users.id)
-- mood_score (integer, NOT NULL) - 1-10 scale
-- notes (text, nullable)
-- created_at (timestamp, default now())

\echo '\n=== Mood Entries Foreign Keys ==='
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'mood_entries';

-- Expected: user_id → users.id

-- ============================================================
-- 4. JOURNAL ENTRIES TABLE
-- ============================================================
\echo '\n=== 4. JOURNALS TABLE SCHEMA ==='
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'journals'
ORDER BY ordinal_position;

-- Expected columns:
-- id (varchar, PK, UUID default)
-- user_id (varchar, FK to users.id)
-- mood_score (integer, nullable) - optional mood with journal
-- content (text, nullable)
-- tags (json, default [])
-- is_private (boolean, default true)
-- created_at (timestamp, default now())

\echo '\n=== Journals Foreign Keys ==='
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'journals';

-- Expected: user_id → users.id

-- ============================================================
-- 5. WELLNESS ASSESSMENTS TABLES
-- ============================================================
\echo '\n=== 5A. WELLNESS_ASSESSMENTS TABLE SCHEMA ==='
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'wellness_assessments'
ORDER BY ordinal_position;

-- Expected columns:
-- id (varchar, PK, UUID default)
-- user_id (varchar, FK to users.id)
-- assessment_type (text, NOT NULL) - 'comprehensive', 'quick-check', 'monthly-review'
-- title (text, NOT NULL)
-- questions (json, default []) - array of question objects
-- is_active (boolean, default true)
-- created_at (timestamp, default now())

\echo '\n=== 5B. ASSESSMENT_RESPONSES TABLE SCHEMA ==='
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'assessment_responses'
ORDER BY ordinal_position;

-- Expected columns:
-- id (varchar, PK, UUID default)
-- assessment_id (varchar, FK to wellness_assessments.id)
-- user_id (varchar, FK to users.id)
-- responses (json, default {}) - question_id → answer mapping
-- total_score (real, nullable) - calculated score
-- category_scores (json, default {}) - category → score mapping
-- recommendations (json, default []) - array of recommendation strings
-- completed_at (timestamp, default now())

\echo '\n=== Wellness Assessment Foreign Keys ==='
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (tc.table_name = 'wellness_assessments' OR tc.table_name = 'assessment_responses');

-- Expected:
-- wellness_assessments.user_id → users.id
-- assessment_responses.assessment_id → wellness_assessments.id
-- assessment_responses.user_id → users.id

-- ============================================================
-- 6. ANONYMOUS RANTS TABLE (CRITICAL ANONYMITY CHECK)
-- ============================================================
\echo '\n=== 6. ANONYMOUS_RANTS TABLE SCHEMA ==='
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'anonymous_rants'
ORDER BY ordinal_position;

-- Expected columns:
-- id (varchar, PK, UUID default)
-- anonymous_token (text, NOT NULL) - random token, not linkable to user
-- content (text, NOT NULL)
-- sentiment_score (real, nullable) - optional sentiment analysis
-- support_count (integer, default 0) - number of "me too" clicks
-- created_at (timestamp, default now())

-- ⚠️ CRITICAL: This table should have NO user_id column for anonymity!

\echo '\n=== Anonymous Rants Foreign Keys (should be NONE) ==='
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'anonymous_rants';

-- Expected: NO FOREIGN KEYS (ensures anonymity)

-- ============================================================
-- 7. THERAPIST DIRECTORY TABLES
-- ============================================================
\echo '\n=== 7A. THERAPISTS TABLE SCHEMA ==='
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'therapists'
ORDER BY ordinal_position;

-- Expected columns:
-- id (varchar, PK, UUID default)
-- name (text, NOT NULL)
-- specialization (text, nullable)
-- license_number (text, nullable)
-- profile_url (text, nullable)
-- rating (real, default 0)
-- availability (json, default {})

\echo '\n=== 7B. APPOINTMENTS TABLE SCHEMA ==='
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- Expected columns:
-- id (varchar, PK, UUID default)
-- therapist_id (varchar, FK to therapists.id)
-- user_id (varchar, FK to users.id)
-- start_time (timestamp, nullable)
-- end_time (timestamp, nullable)
-- status (text, default 'pending') - 'pending', 'confirmed', 'completed', 'cancelled'
-- notes (text, nullable)

\echo '\n=== Therapist/Appointments Foreign Keys ==='
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'appointments';

-- Expected:
-- appointments.therapist_id → therapists.id
-- appointments.user_id → users.id

-- ============================================================
-- 8. MANAGER-SPECIFIC TABLES
-- ============================================================
\echo '\n=== 8A. ORGANIZATIONS TABLE SCHEMA ==='
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'organizations'
ORDER BY ordinal_position;

-- Expected columns:
-- id (varchar, PK, UUID default)
-- name (text, NOT NULL)
-- admin_user_id (varchar, FK to users.id)
-- settings (json, default {})
-- wellness_score (real, default 0) - aggregated wellness metric
-- created_at (timestamp, default now())

\echo '\n=== 8B. EMPLOYEES TABLE SCHEMA ==='
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'employees'
ORDER BY ordinal_position;

-- Expected columns:
-- id (varchar, PK, UUID default)
-- user_id (varchar, FK to users.id)
-- org_id (varchar, FK to organizations.id)
-- job_title (text, nullable)
-- department (text, nullable)
-- anonymized_id (text, UNIQUE, nullable) - for anonymous aggregation
-- wellness_streak (integer, default 0)

\echo '\n=== 8C. WELLBEING_SURVEYS TABLE SCHEMA ==='
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'wellbeing_surveys'
ORDER BY ordinal_position;

-- Expected columns:
-- id (varchar, PK, UUID default)
-- org_id (varchar, FK to organizations.id)
-- title (text, NOT NULL)
-- questions (json, default {})
-- is_active (boolean, default true)
-- created_at (timestamp, default now())

\echo '\n=== 8D. SURVEY_RESPONSES TABLE SCHEMA ==='
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'survey_responses'
ORDER BY ordinal_position;

-- Expected columns:
-- id (varchar, PK, UUID default)
-- survey_id (varchar, FK to wellbeing_surveys.id)
-- anonymous_token (text, NOT NULL) - anonymous response
-- responses (json, default {})
-- wellness_score (real, nullable)
-- created_at (timestamp, default now())

\echo '\n=== Manager Tables Foreign Keys ==='
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('organizations', 'employees', 'wellbeing_surveys', 'survey_responses');

-- Expected:
-- organizations.admin_user_id → users.id
-- employees.user_id → users.id
-- employees.org_id → organizations.id
-- wellbeing_surveys.org_id → organizations.id
-- survey_responses.survey_id → wellbeing_surveys.id

-- ============================================================
-- 9. REFRESH TOKENS TABLE (Authentication)
-- ============================================================
\echo '\n=== 9. REFRESH_TOKENS TABLE SCHEMA ==='
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'refresh_tokens'
ORDER BY ordinal_position;

-- Expected columns:
-- token (text, PK, NOT NULL) - the refresh token itself
-- user_id (varchar, NOT NULL) - FK to users.id (but no formal constraint)
-- expires_at (timestamp, NOT NULL)
-- created_at (timestamp, default now())

-- ============================================================
-- 10. BUDDY MATCHING TABLE
-- ============================================================
\echo '\n=== 10. BUDDY_MATCHES TABLE SCHEMA ==='
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'buddy_matches'
ORDER BY ordinal_position;

-- Expected columns:
-- id (varchar, PK, UUID default)
-- user_a_id (varchar, FK to users.id)
-- user_b_id (varchar, FK to users.id)
-- compatibility_score (real, default 0)
-- status (text, default 'pending') - 'pending', 'accepted', 'declined'
-- created_at (timestamp, default now())

\echo '\n=== Buddy Matches Foreign Keys ==='
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'buddy_matches';

-- Expected:
-- buddy_matches.user_a_id → users.id
-- buddy_matches.user_b_id → users.id

-- ============================================================
-- 11. COURSES TABLE (Learning Modules)
-- ============================================================
\echo '\n=== 11. COURSES TABLE SCHEMA ==='
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'courses'
ORDER BY ordinal_position;

-- Expected columns:
-- id (varchar, PK, UUID default)
-- title (text, NOT NULL)
-- description (text, nullable)
-- duration_minutes (integer, nullable)
-- difficulty (text, nullable)
-- thumbnail_url (text, nullable)
-- modules (json, default {})

-- ============================================================
-- 12. ALL INDEXES
-- ============================================================
\echo '\n=== 12. ALL INDEXES ==='
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Expected indexes:
-- users_email_unique (on users.email)
-- users_pkey (on users.id)
-- employees_anonymized_id_unique (on employees.anonymized_id)
-- idx_refresh_tokens_user_id (on refresh_tokens.user_id)
-- Plus primary key indexes on all tables

-- ============================================================
-- 13. ALL FOREIGN KEY RELATIONSHIPS
-- ============================================================
\echo '\n=== 13. COMPLETE FOREIGN KEY MAP ==='
SELECT
    tc.table_name AS from_table, 
    kcu.column_name AS from_column,
    ccu.table_name AS to_table,
    ccu.column_name AS to_column,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Expected: 14 foreign key relationships total

-- ============================================================
-- 14. MIGRATION STATUS
-- ============================================================
\echo '\n=== 14. DRIZZLE MIGRATIONS APPLIED ==='
SELECT * FROM drizzle_migrations ORDER BY created_at;

-- Expected migrations:
-- 0000_overjoyed_human_torch (creates all main tables)
-- 0001_refresh_tokens (adds refresh_tokens table)

-- ============================================================
-- 15. ROW COUNTS (Current Data)
-- ============================================================
\echo '\n=== 15. TABLE ROW COUNTS ==='
SELECT 
    'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'organizations', COUNT(*) FROM organizations
UNION ALL
SELECT 'employees', COUNT(*) FROM employees
UNION ALL
SELECT 'journals', COUNT(*) FROM journals
UNION ALL
SELECT 'mood_entries', COUNT(*) FROM mood_entries
UNION ALL
SELECT 'anonymous_rants', COUNT(*) FROM anonymous_rants
UNION ALL
SELECT 'therapists', COUNT(*) FROM therapists
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'wellness_assessments', COUNT(*) FROM wellness_assessments
UNION ALL
SELECT 'assessment_responses', COUNT(*) FROM assessment_responses
UNION ALL
SELECT 'buddy_matches', COUNT(*) FROM buddy_matches
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'wellbeing_surveys', COUNT(*) FROM wellbeing_surveys
UNION ALL
SELECT 'survey_responses', COUNT(*) FROM survey_responses
UNION ALL
SELECT 'refresh_tokens', COUNT(*) FROM refresh_tokens
ORDER BY table_name;

-- ============================================================
-- 16. SCHEMA HEALTH CHECK
-- ============================================================
\echo '\n=== 16. SCHEMA HEALTH CHECK ==='

-- Check for tables without primary keys (should be none)
\echo '\n--- Tables without primary keys (should be empty):'
SELECT table_name
FROM information_schema.tables t
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        WHERE tc.table_name = t.table_name
            AND tc.constraint_type = 'PRIMARY KEY'
    );

-- Check for orphaned foreign key values (can indicate data integrity issues)
\echo '\n--- Check for orphaned appointments (therapist_id not in therapists):'
SELECT COUNT(*) as orphaned_appointments
FROM appointments a
WHERE a.therapist_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM therapists t WHERE t.id = a.therapist_id);

\echo '\n--- Check for orphaned appointments (user_id not in users):'
SELECT COUNT(*) as orphaned_appointments
FROM appointments a
WHERE a.user_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = a.user_id);

\echo '\n--- Check for orphaned mood_entries:'
SELECT COUNT(*) as orphaned_mood_entries
FROM mood_entries m
WHERE m.user_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = m.user_id);

\echo '\n--- Check for orphaned journals:'
SELECT COUNT(*) as orphaned_journals
FROM journals j
WHERE j.user_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = j.user_id);

-- ============================================================
-- END OF VERIFICATION SCRIPT
-- ============================================================
\echo '\n=== VERIFICATION COMPLETE ==='
\echo 'Review the output above to ensure all tables, columns, constraints,'
\echo 'foreign keys, and indexes are present and correct.'
\echo ''
\echo 'For a visual schema diagram, see DATABASE_SCHEMA_DIAGRAM.md'
