-- Quick Database Verification (Essential Checks Only)
-- Run this for a fast schema health check

-- 1. Count all tables (should be 17)
\echo '=== TABLE COUNT ==='
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 2. List all tables
\echo '\n=== ALL TABLES ==='
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 3. Check users table exists and has email unique
\echo '\n=== USERS TABLE ==='
SELECT 
    c.column_name,
    c.data_type,
    c.is_nullable,
    CASE 
        WHEN tc.constraint_type = 'UNIQUE' THEN 'UNIQUE'
        ELSE ''
    END as constraint_type
FROM information_schema.columns c
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON c.column_name = ccu.column_name AND c.table_name = ccu.table_name
LEFT JOIN information_schema.table_constraints tc 
    ON tc.constraint_name = ccu.constraint_name AND tc.constraint_type = 'UNIQUE'
WHERE c.table_name = 'users'
ORDER BY c.ordinal_position;

-- 4. CRITICAL: Check anonymous_rants has NO user_id
\echo '\n=== ANONYMOUS RANTS COLUMNS ==='
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'anonymous_rants'
ORDER BY ordinal_position;

\echo '\n=== ANONYMITY CHECK ==='
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'anonymous_rants' AND column_name = 'user_id'
        ) 
        THEN '❌ FAIL: user_id column found (breaks anonymity!)'
        ELSE '✅ PASS: No user_id column (anonymity preserved)'
    END as anonymity_status;

-- 5. Count foreign keys (should be 14)
\echo '\n=== FOREIGN KEY COUNT ==='
SELECT COUNT(*) as foreign_key_count
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';

-- 6. Check migration status (should be 2)
\echo '\n=== MIGRATION STATUS ==='
SELECT 
    id,
    hash,
    created_at
FROM drizzle_migrations 
ORDER BY created_at;

-- 7. Check refresh_tokens index exists
\echo '\n=== REFRESH TOKENS INDEX ==='
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'refresh_tokens'
  AND indexname = 'idx_refresh_tokens_user_id';

\echo '\n=== VERIFICATION SUMMARY ==='
SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
    (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public') as foreign_keys,
    (SELECT COUNT(*) FROM drizzle_migrations) as migrations_applied,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anonymous_rants' AND column_name = 'user_id')
        THEN '❌ ANONYMITY BROKEN'
        ELSE '✅ ANONYMITY OK'
    END as anonymity_check;
