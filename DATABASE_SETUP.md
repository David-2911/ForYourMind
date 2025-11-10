# Database Setup & Migration Guide

Complete guide for database configuration, migrations, and schema management in the MindfulMe monorepo.

---

## Table of Contents

1. [Overview](#overview)
2. [Development Setup (SQLite)](#development-setup-sqlite)
3. [Production Setup (PostgreSQL)](#production-setup-postgresql)
4. [Schema Management](#schema-management)
5. [Running Migrations](#running-migrations)
6. [Creating New Migrations](#creating-new-migrations)
7. [Drizzle Studio](#drizzle-studio)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### Architecture

The MindfulMe monorepo uses **Drizzle ORM** for database management with a shared schema approach:

```
shared/
  src/
    schema.ts          ← Single source of truth for database schema
    
backend/
  drizzle.config.ts    ← Drizzle configuration (points to shared schema)
  migrations/          ← Generated SQL migration files
    0000_*.sql
    0001_*.sql
    meta/
```

### Database Options

- **SQLite**: Recommended for local development (zero setup, file-based)
- **PostgreSQL**: Required for production (Neon, Render, Supabase, etc.)

---

## Development Setup (SQLite)

### Why SQLite for Development?

✅ Zero configuration - no external database server needed  
✅ Fast - runs directly from a file  
✅ Portable - easy to backup and share  
✅ Perfect for local development and testing  

### Quick Start

1. **Set environment variable** (in root `.env`):
   ```bash
   USE_SQLITE=true
   SQLITE_DB_PATH=./backend/data/db.sqlite
   ```

2. **The database file is created automatically** when you start the backend:
   ```bash
   npm run dev
   ```

3. **That's it!** SQLite requires no additional setup.

### SQLite File Location

By default: `/home/dave/Downloads/MindfulMe/backend/data/db.sqlite`

This file is **git-ignored** to prevent accidentally committing local data.

### Backup SQLite Database

```bash
# Create a backup
cp backend/data/db.sqlite backend/data/db.sqlite.backup-$(date +%Y%m%d)

# Restore from backup
cp backend/data/db.sqlite.backup-YYYYMMDD backend/data/db.sqlite
```

---

## Production Setup (PostgreSQL)

### Recommended Providers

1. **Neon** (https://neon.tech)
   - Serverless PostgreSQL
   - Generous free tier
   - Auto-scaling
   - Fast cold starts

2. **Render** (https://render.com)
   - Fully managed PostgreSQL
   - Free tier available
   - Easy integration with backend deployment

3. **Supabase** (https://supabase.com)
   - PostgreSQL + additional features
   - Free tier available
   - Built-in auth and storage

### Setup Steps

#### 1. Create Database

Choose a provider and create a new PostgreSQL database. You'll receive a connection string like:

```
postgresql://user:password@host.region.provider.com:5432/database?sslmode=require
```

#### 2. Set Environment Variables

**In production hosting platform** (Render, Vercel, etc.):

```bash
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
USE_SQLITE=false
NODE_ENV=production
```

#### 3. Run Migrations

On **first deployment**, run migrations to create tables:

```bash
npm run db:migrate
```

Or if using Render, add to your build command:
```bash
npm run build && npm run db:migrate
```

---

## Schema Management

### The Shared Schema

**Location**: `shared/src/schema.ts`

This file defines the **entire database schema** using Drizzle ORM syntax. Both backend and frontend reference this for type safety.

### Example Schema

```typescript
// shared/src/schema.ts
import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  mood: text("mood"),
  isPrivate: boolean("is_private").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Making Schema Changes

**Workflow**:

1. Edit `shared/src/schema.ts`
2. Build shared package: `npm run build -w shared`
3. Generate migration: `npm run db:generate`
4. Review generated SQL in `backend/migrations/`
5. Apply migration: `npm run db:migrate`

---

## Running Migrations

### What are Migrations?

Migrations are SQL files that transform your database from one version to another. They're version-controlled and reproducible.

### Apply Migrations

#### Development (SQLite)

```bash
# From root
npm run db:migrate

# Or from backend
cd backend && npm run migrate
```

This applies all pending migrations to your SQLite database.

#### Production (PostgreSQL)

**Option 1: Manual** (after deployment)
```bash
npm run db:migrate
```

**Option 2: Automatic** (in build script)

Add to `package.json` or build command:
```json
{
  "scripts": {
    "deploy": "npm run build && npm run db:migrate && npm start"
  }
}
```

### Check Migration Status

```bash
# View migration history
npm run db:studio
# Navigate to "Migrations" tab
```

---

## Creating New Migrations

### When to Create a Migration

Create a migration when you:
- Add a new table
- Add/remove columns
- Change column types
- Add indexes or constraints
- Modify relationships

### Step-by-Step Process

#### 1. Edit Schema

```bash
# Edit shared/src/schema.ts
code shared/src/schema.ts
```

Add your changes:
```typescript
export const newTable = pgTable("new_table", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});
```

#### 2. Build Shared Package

```bash
npm run build -w shared
```

This compiles your TypeScript schema to JavaScript so Drizzle can read it.

#### 3. Generate Migration

```bash
npm run db:generate
```

Drizzle will:
- Compare your schema to the current database
- Generate SQL migration files in `backend/migrations/`
- Create a new file like `0002_some_name.sql`

#### 4. Review Migration

**IMPORTANT**: Always review the generated SQL!

```bash
cat backend/migrations/0002_*.sql
```

Check for:
- Correct table/column names
- Proper data types
- No unexpected DROP statements
- Correct foreign key constraints

#### 5. Apply Migration

```bash
npm run db:migrate
```

#### 6. Test Changes

```bash
# Start development server
npm run dev

# Check Drizzle Studio
npm run db:studio
```

### Example: Adding a New Field

```typescript
// Before
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
});

// After (add phone field)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  phone: text("phone"),  // ← New field
});
```

Then run:
```bash
npm run build -w shared && npm run db:generate && npm run db:migrate
```

---

## Drizzle Studio

### What is Drizzle Studio?

Drizzle Studio is a **visual database browser** that lets you:
- View all tables and data
- Edit data directly
- Run queries
- Inspect schema
- View relationships

### Launch Studio

```bash
npm run db:studio
```

This opens a web interface at `https://local.drizzle.studio`

### Features

1. **Browse Tables**: See all tables with data preview
2. **Edit Records**: Click any cell to edit
3. **Filter & Sort**: Built-in data filtering
4. **Relationships**: Visual foreign key connections
5. **Schema View**: Inspect table structures

### When to Use Studio

✅ Quick data inspection  
✅ Manual data fixes  
✅ Debugging relationships  
✅ Verifying migrations  
✅ Development testing  

⚠️ **Don't use in production** - it connects directly to your database!

---

## Database Commands Reference

### Available Scripts

```bash
# Development workflow
npm run dev              # Start backend with SQLite
npm run db:generate      # Generate new migration from schema changes
npm run db:migrate       # Apply pending migrations
npm run db:push          # Push schema changes directly (skip migration)
npm run db:studio        # Open Drizzle Studio

# Production
npm run build            # Build all packages
npm run db:migrate       # Apply migrations to production DB

# Workspace-specific
npm run db:migrate -w backend    # Run migrations from backend
```

### Migration Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `db:generate` | Create migration file | After schema changes |
| `db:migrate` | Apply migrations | Deployment, new DB |
| `db:push` | Direct schema sync | Development only |
| `db:studio` | Visual browser | Data inspection |

---

## Troubleshooting

### "Cannot find module '@mindfulme/shared/schema'"

**Cause**: Shared package not built

**Solution**:
```bash
npm run build -w shared
```

### "Migration failed: relation already exists"

**Cause**: Migration already applied or manual table creation

**Solution**:
```bash
# Reset migrations (development only!)
rm -rf backend/migrations
rm backend/data/db.sqlite

# Regenerate from scratch
npm run db:generate
npm run db:migrate
```

### "DATABASE_URL is not defined"

**Cause**: Missing environment variable

**Solution**:
```bash
# For SQLite (development)
echo "USE_SQLITE=true" >> .env

# For PostgreSQL (production)
echo "DATABASE_URL=postgresql://..." >> .env
```

### "Connection timeout" (PostgreSQL)

**Causes**:
- Database not running
- Wrong connection string
- Firewall blocking connection
- SSL mode mismatch

**Solution**:
```bash
# Test connection
npm run db:studio

# Check connection string format
echo $DATABASE_URL

# Ensure it ends with ?sslmode=require
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

### "Table doesn't exist" after migration

**Cause**: Migration not applied

**Solution**:
```bash
# Check migration files exist
ls -la backend/migrations/

# Apply migrations
npm run db:migrate

# Verify in Studio
npm run db:studio
```

### SQLite "database is locked"

**Cause**: Multiple processes accessing database

**Solution**:
```bash
# Stop all backend processes
pkill -f "node.*backend"

# Restart
npm run dev
```

---

## Best Practices

### ✅ DO

- Use SQLite for local development
- Always build shared before generating migrations
- Review generated SQL before applying
- Keep migrations in version control
- Use descriptive names for tables/columns
- Test migrations on development before production
- Back up production database before migrations

### ❌ DON'T

- Don't edit migration files manually (unless you know what you're doing)
- Don't use `db:push` in production (use `db:migrate`)
- Don't commit `.env` files
- Don't commit SQLite database files
- Don't skip migration reviews
- Don't delete old migrations (breaks history)

---

## Production Deployment Checklist

Before deploying to production:

- [ ] All schema changes committed to `shared/src/schema.ts`
- [ ] Shared package built: `npm run build -w shared`
- [ ] Migrations generated: `npm run db:generate`
- [ ] Migrations reviewed and tested locally
- [ ] PostgreSQL database created and connection string obtained
- [ ] `DATABASE_URL` set in production environment
- [ ] `USE_SQLITE=false` set in production
- [ ] Migrations applied: `npm run db:migrate`
- [ ] Database connection tested: `npm run db:studio`
- [ ] Backup strategy in place for production database

---

## Quick Reference

```bash
# Common workflows

# 1. Add new table/field
code shared/src/schema.ts          # Edit schema
npm run build -w shared            # Build shared
npm run db:generate                # Generate migration
npm run db:migrate                 # Apply migration
npm run db:studio                  # Verify changes

# 2. Fresh database (development)
rm backend/data/db.sqlite          # Delete old database
npm run db:migrate                 # Recreate with migrations

# 3. Production deployment
npm run build                      # Build all packages
npm run db:migrate                 # Apply migrations
npm start                          # Start server

# 4. Inspect database
npm run db:studio                  # Visual browser
```

---

## Additional Resources

- **Drizzle ORM Docs**: https://orm.drizzle.team
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **SQLite Docs**: https://www.sqlite.org/docs.html
- **Neon Docs**: https://neon.tech/docs/introduction
- **Render Postgres**: https://render.com/docs/databases

---

**Need help?** Check the main [README.md](./README.md) or [DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md)
