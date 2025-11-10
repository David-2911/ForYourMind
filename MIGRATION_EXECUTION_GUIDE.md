# Monorepo Migration Execution Guide

**Complete step-by-step guide for executing and verifying the backend separation migration.**

---

## Table of Contents

1. [Pre-Execution Checklist](#pre-execution-checklist)
2. [Execution Steps](#execution-steps)
3. [Checkpoint Verification](#checkpoint-verification)
4. [Troubleshooting Guide](#troubleshooting-guide)
5. [Final Verification](#final-verification)
6. [Cleanup Steps](#cleanup-steps)
7. [Commit and Merge](#commit-and-merge)

---

## Pre-Execution Checklist

### 1. Create Backup

```bash
# 1.1 Backup the entire project
cd /home/dave/Downloads/
tar -czf MindfulMe-backup-$(date +%Y%m%d-%H%M%S).tar.gz MindfulMe/

# 1.2 Backup the database (if using SQLite)
cd /home/dave/Downloads/MindfulMe
cp data/db.sqlite data/db.sqlite.backup-$(date +%Y%m%d)

# 1.3 Verify backup exists
ls -lh ../MindfulMe-backup-*.tar.gz
ls -lh data/db.sqlite.backup-*
```

**✅ Verify**: Backup files exist and have reasonable size

### 2. Git Preparation

```bash
# 2.1 Check current branch
git branch

# 2.2 Ensure clean working directory
git status

# 2.3 Stage all current work
git add .

# 2.4 Check what will be committed
git status

# 2.5 Commit current state
git commit -m "feat: complete monorepo setup with backend separation

- Set up npm workspaces (shared, backend, frontend)
- Configure TypeScript project references
- Add comprehensive build and deployment configuration
- Add Docker support (dev and prod)
- Add Render.com deployment blueprint
- Add extensive documentation (87,000+ words)

All packages build successfully:
- shared: 50KB
- backend: 61KB (minified)
- frontend: 489KB → 152KB gzipped

Includes:
- Database configuration and migrations
- Environment variable management
- Secrets management
- Health check endpoints
- CI/CD scripts
- Deployment guides"
```

**✅ Verify**: 
- Working directory is clean
- All files are committed
- You're on `feature/backend-separation` branch

### 3. Environment Check

```bash
# 3.1 Check Node.js version
node -v  # Should be 18+

# 3.2 Check npm version
npm -v   # Should be 9+

# 3.3 Verify all dependencies installed
npm install

# 3.4 Check for any outdated packages (optional)
npm outdated
```

**✅ Verify**:
- Node.js >= 18.0.0
- npm >= 9.0.0
- No installation errors

---

## Execution Steps

### Step 1: Install Dependencies

```bash
# 1.1 Install all workspace dependencies
cd /home/dave/Downloads/MindfulMe
npm install

# Expected output:
# - Installs root dependencies
# - Installs shared dependencies
# - Installs backend dependencies
# - Installs frontend dependencies
```

**✅ Verify**: No errors, all packages installed

**Time estimate**: 2-3 minutes

---

### Step 2: Build Shared Package

```bash
# 2.1 Build the shared package (required first!)
npm run build:shared

# Expected output:
# > @mindfulme/shared@1.0.0 build
# > tsc
# 
# [Compiled successfully]
```

**✅ Verify**: 
```bash
# Check dist directory exists
ls -la shared/dist/

# Should see:
# - schema.js
# - schema.d.ts
# - constants.js
# - constants.d.ts
# - types/index.js
# - types/index.d.ts
```

**⚠️ CRITICAL**: This must succeed before building backend/frontend!

**Time estimate**: 5-10 seconds

---

### Step 3: Run Type Checks

```bash
# 3.1 Check TypeScript compilation for all packages
npm run check

# Expected output:
# ✓ shared TypeScript check: PASSED
# ✓ backend TypeScript check: PASSED
# ✓ frontend TypeScript check: PASSED
```

**✅ Verify**: All checks pass with no errors

**If errors occur**: See [Troubleshooting - TypeScript Errors](#typescript-compilation-errors)

**Time estimate**: 10-15 seconds

---

### Step 4: Create Environment File

```bash
# 4.1 Copy environment template
cp .env.example .env

# 4.2 Generate secrets
echo "Generating JWT secret..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "JWT_SECRET=$JWT_SECRET"

echo "Generating Cookie secret..."
COOKIE_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "COOKIE_SECRET=$COOKIE_SECRET"

# 4.3 Update .env file with generated secrets
# (Do this manually or use sed)
```

**Manual edit** `.env`:
```bash
# Update these lines:
JWT_SECRET=<paste-generated-jwt-secret-here>
COOKIE_SECRET=<paste-generated-cookie-secret-here>

# Ensure these are set for SQLite development:
USE_SQLITE=true
SQLITE_DB_PATH=./backend/data/db.sqlite
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:5000
```

**✅ Verify**: 
```bash
# Check secrets are set
grep "JWT_SECRET=" .env
grep "COOKIE_SECRET=" .env

# Secrets should be 64 characters (32 bytes hex)
```

**Time estimate**: 2 minutes

---

### Step 5: Build All Packages

```bash
# 5.1 Build all packages (shared already built)
npm run build

# Expected output:
# > @mindfulme/root@1.0.0 build
# > npm run build:shared && npm run build:backend && npm run build:frontend
# 
# [Shared] ✓ Already built
# [Backend] ✓ dist/index.js 61.2kb ⚡ Done in 59ms
# [Frontend] ✓ built in 18.23s
#   - index.html
#   - assets/js/vendor-*.js (141KB)
#   - assets/js/ui-*.js (79KB)
#   - assets/js/query-*.js (40KB)
#   - assets/js/index-*.js (229KB)
```

**✅ Verify**:
```bash
# Check backend build
ls -lh backend/dist/index.js

# Check frontend build
ls -la frontend/dist/
```

**Time estimate**: 20-30 seconds

---

### Step 6: Database Setup (SQLite)

```bash
# 6.1 Create data directory for SQLite
mkdir -p backend/data

# 6.2 Check if database exists
ls -la backend/data/db.sqlite

# 6.3 If database doesn't exist, run migrations
npm run db:migrate

# Expected output:
# > drizzle-kit migrate
# Reading migrations...
# Applying migrations...
# [✓] 0000_overjoyed_human_torch.sql
# [✓] 0001_refresh_tokens.sql
# Done!
```

**✅ Verify**:
```bash
# Check database file exists
ls -lh backend/data/db.sqlite

# Should be at least 20KB
```

**Time estimate**: 5-10 seconds

---

### Step 7: Start Backend Server

```bash
# 7.1 Start backend in development mode
cd backend
npm run dev

# Expected output:
# > mindfulme-backend@1.0.0 dev
# > node --watch --loader ts-node/esm src/index.ts
# 
# ✅ Backend server running on http://localhost:5000
# 📊 Environment: development
# 🗄️  Database: SQLite
```

**✅ Verify**: Backend is running without errors

**Keep this terminal open!**

**In a new terminal**, test the health endpoint:
```bash
# Test health endpoint
curl http://localhost:5000/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2024-11-09T...",
#   "uptime": 1.234,
#   "environment": "development",
#   "database": "SQLite",
#   "version": "1.0.0"
# }
```

**✅ Checkpoint 1**: Backend is running and responding

**Time estimate**: 5 seconds to start

---

### Step 8: Start Frontend Server

```bash
# 8.1 In a NEW terminal, start frontend
cd /home/dave/Downloads/MindfulMe/frontend
npm run dev

# Expected output:
# > mindfulme-frontend@1.0.0 dev
# > vite
# 
# VITE v5.4.21  ready in 500 ms
# 
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
# ➜  press h to show help
```

**✅ Verify**: Frontend is running without errors

**Keep this terminal open!**

**In a browser**, open: http://localhost:5173

**✅ Checkpoint 2**: Frontend loads in browser

**Time estimate**: 3-5 seconds to start

---

### Step 9: Test Communication

```bash
# 9.1 In a NEW terminal, test API communication
curl http://localhost:5173

# Should return HTML (frontend)

curl http://localhost:5000/health

# Should return JSON (backend)

# 9.2 Check browser console
# Open DevTools (F12) in browser
# Go to Network tab
# Refresh page
# Look for successful API calls
```

**✅ Verify**:
- Frontend loads in browser
- No CORS errors in console
- Backend health check works

**✅ Checkpoint 3**: Frontend and backend are communicating

---

## Checkpoint Verification

### Checkpoint 1: Backend Runs Independently

**Test**:
```bash
# Terminal 1: Start backend
cd /home/dave/Downloads/MindfulMe/backend
npm run dev
```

**Verify**:
```bash
# Terminal 2: Test endpoints
curl http://localhost:5000/health
curl http://localhost:5000/healthz
curl http://localhost:5000/ready

# All should return successful responses
```

**✅ Success Criteria**:
- Backend starts without errors
- Health endpoints respond
- No TypeScript compilation errors
- Database connection successful (SQLite file exists)

**⚠️ If backend won't start**: See [Troubleshooting - Backend Won't Start](#backend-wont-start)

---

### Checkpoint 2: Frontend Runs Independently

**Test**:
```bash
# Terminal 1: Start frontend
cd /home/dave/Downloads/MindfulMe/frontend
npm run dev
```

**Verify**:
```bash
# Browser: Open http://localhost:5173
# Should see the MindfulMe app
# Check DevTools console for errors
```

**✅ Success Criteria**:
- Frontend starts without errors
- Page loads in browser
- No console errors (some warnings OK)
- No module not found errors

**⚠️ If frontend won't start**: See [Troubleshooting - Frontend Won't Start](#frontend-wont-start)

---

### Checkpoint 3: Communication Works

**Test**:
```bash
# Both backend and frontend running
# Browser: http://localhost:5173
# Open DevTools → Network tab
# Try to log in or register
```

**Verify**:
- API calls appear in Network tab
- Requests to `http://localhost:5000/api/*` succeed
- No CORS errors
- 200/201 status codes (not 404 or 500)

**✅ Success Criteria**:
- Frontend can make API calls to backend
- Backend responds with correct data
- CORS is configured correctly
- No proxy errors

**⚠️ If CORS errors occur**: See [Troubleshooting - CORS Errors](#cors-errors)

---

### Checkpoint 4: Database Operations Work

**Test**:
```bash
# Start Drizzle Studio (optional)
npm run db:studio

# Opens at https://local.drizzle.studio
# Check tables exist:
# - users
# - organizations
# - employees
# - journal_entries
# - mood_entries
# etc.
```

**Verify**:
```bash
# Check SQLite database file
ls -lh backend/data/db.sqlite

# Should be at least 20KB

# Check tables exist
sqlite3 backend/data/db.sqlite ".tables"

# Should show all tables
```

**✅ Success Criteria**:
- Database file exists
- All tables created
- Migrations ran successfully
- Can view data in Drizzle Studio

**⚠️ If database errors**: See [Troubleshooting - Database Errors](#database-connection-errors)

---

### Checkpoint 5: Authentication Works

**Test in Browser** (http://localhost:5173):

**5.1 User Registration**:
```
1. Go to registration page
2. Fill in:
   - Username: testuser
   - Email: test@example.com
   - Password: TestPassword123!
   - Organization: Test Company
3. Submit
4. Check for success message
```

**5.2 User Login**:
```
1. Go to login page
2. Fill in:
   - Email: test@example.com
   - Password: TestPassword123!
3. Submit
4. Should redirect to dashboard
```

**5.3 Check Browser DevTools**:
```
1. Open DevTools → Application → Cookies
2. Should see auth cookie set
3. Open Network tab
4. Login request should return 200
5. Response should include user data
```

**✅ Success Criteria**:
- User can register without errors
- User can log in successfully
- Auth cookie is set
- User is redirected to dashboard
- JWT token is valid

**⚠️ If auth fails**: See [Troubleshooting - Authentication Errors](#authentication-errors)

---

## Troubleshooting Guide

### TypeScript Compilation Errors

**Error**: `Cannot find module '@mindfulme/shared'`

**Solution**:
```bash
# 1. Build shared package
npm run build:shared

# 2. Check dist exists
ls -la shared/dist/

# 3. Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build:shared
```

---

**Error**: `Property 'xyz' does not exist on type...`

**Solution**:
```bash
# 1. Check TypeScript version matches
cd shared && npm list typescript
cd backend && npm list typescript
cd frontend && npm list typescript

# All should be ^5.6.3

# 2. Rebuild shared package
npm run build:shared

# 3. Restart TS server in VS Code
# Ctrl+Shift+P → TypeScript: Restart TS Server
```

---

**Error**: `Module '"@mindfulme/shared/schema"' has no exported member...`

**Solution**:
```bash
# Check what's actually exported
cat shared/src/schema.ts | grep "export"

# Rebuild with verbose output
cd shared
npm run build -- --listFiles

# Check generated .d.ts files
cat dist/schema.d.ts
```

---

### Backend Won't Start

**Error**: `Error: Cannot find module ...`

**Solution**:
```bash
# 1. Ensure shared is built
npm run build:shared

# 2. Reinstall backend dependencies
cd backend
rm -rf node_modules
npm install

# 3. Check backend can see shared
node -e "console.log(require.resolve('@mindfulme/shared'))"
# Should print path to shared package
```

---

**Error**: `JWT_SECRET must be at least 32 characters`

**Solution**:
```bash
# 1. Check .env file exists
ls -la .env

# 2. Generate new secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. Add to .env
echo "JWT_SECRET=<generated-secret>" >> .env

# 4. Restart backend
```

---

**Error**: `DATABASE_URL is not defined`

**Solution**:
```bash
# For SQLite development
echo "USE_SQLITE=true" >> .env
echo "SQLITE_DB_PATH=./backend/data/db.sqlite" >> .env

# Restart backend
```

---

**Error**: `Port 5000 is already in use`

**Solution**:
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change port in .env
echo "PORT=5001" >> .env

# Update frontend VITE_API_URL
echo "VITE_API_URL=http://localhost:5001" >> .env
```

---

### Frontend Won't Start

**Error**: `Cannot find module '@mindfulme/shared'`

**Solution**:
```bash
# 1. Build shared package
npm run build:shared

# 2. Reinstall frontend dependencies
cd frontend
rm -rf node_modules
npm install

# 3. Clear Vite cache
rm -rf node_modules/.vite
```

---

**Error**: `Failed to resolve import ... from shared`

**Solution**:
```bash
# Check import path in frontend code
# Should be: import { ... } from '@mindfulme/shared/schema'
# NOT: import { ... } from '../shared/src/schema'

# Fix any incorrect imports:
grep -r "../shared" frontend/src/
# Replace with '@mindfulme/shared'
```

---

**Error**: `Module not found: Can't resolve '@/components/...'`

**Solution**:
```bash
# Check vite.config.ts has alias
cat frontend/vite.config.ts | grep -A 5 "alias"

# Should have:
# alias: {
#   "@": path.resolve(__dirname, "./src"),
# }

# Restart Vite dev server
```

---

### CORS Errors

**Error**: `Access to fetch at 'http://localhost:5000/api/...' from origin 'http://localhost:5173' has been blocked by CORS`

**Solution 1 - Check Backend CORS**:
```bash
# Check .env file
cat .env | grep CORS_ORIGIN

# Should be:
# CORS_ORIGIN=http://localhost:5173

# Restart backend
```

**Solution 2 - Check Vite Proxy**:
```typescript
// frontend/vite.config.ts
server: {
  proxy: {
    "/api": {
      target: process.env.VITE_API_URL || "http://localhost:5000",
      changeOrigin: true,
    },
  },
}
```

**Solution 3 - Check Backend CORS Middleware**:
```typescript
// backend/src/index.ts
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
```

---

### Database Connection Errors

**Error**: `SQLITE_CANTOPEN: unable to open database file`

**Solution**:
```bash
# 1. Create data directory
mkdir -p backend/data

# 2. Check permissions
ls -ld backend/data

# 3. Run migrations
npm run db:migrate

# 4. Verify database exists
ls -lh backend/data/db.sqlite
```

---

**Error**: `relation "users" does not exist` (PostgreSQL)

**Solution**:
```bash
# Run migrations
npm run db:migrate

# Or push schema directly
npm run db:push

# Check migrations applied
npm run db:studio
# View tables in Drizzle Studio
```

---

**Error**: `Migration failed: table already exists`

**Solution**:
```bash
# Reset database (DEVELOPMENT ONLY!)
rm backend/data/db.sqlite

# Run migrations fresh
npm run db:migrate

# Verify tables
sqlite3 backend/data/db.sqlite ".tables"
```

---

### Authentication Errors

**Error**: `User registration fails silently`

**Solution**:
```bash
# 1. Check backend logs in terminal
# Look for validation errors

# 2. Check network tab in browser
# Look for error response

# 3. Test endpoint directly
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123!",
    "organizationName": "Test Company"
  }'

# Should return 201 with user data
```

---

**Error**: `Login fails with 401 Unauthorized`

**Solution**:
```bash
# 1. Check user exists in database
npm run db:studio
# View users table

# 2. Try login via curl
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'

# 3. Check password is correct
# 4. Check JWT_SECRET is set in .env
```

---

## Final Verification

### End-to-End Test Scenarios

#### Test 1: User Registration and Login Flow

**Steps**:
```
1. Open http://localhost:5173
2. Click "Sign Up" or "Register"
3. Fill form:
   - Username: e2etest
   - Email: e2e@test.com
   - Password: E2ETest123!
   - Organization: E2E Test Company
4. Submit → Should succeed
5. Click "Login"
6. Fill form:
   - Email: e2e@test.com
   - Password: E2ETest123!
7. Submit → Should redirect to dashboard
```

**✅ Success Criteria**:
- Registration completes
- User is created in database
- Login succeeds
- User is redirected to appropriate dashboard
- Auth cookie is set

---

#### Test 2: Mood Tracking

**Steps**:
```
1. Login as employee user
2. Navigate to "Mood Tracker" or "Check-in"
3. Select a mood (Happy, Sad, Anxious, etc.)
4. Add optional note
5. Submit
6. Verify mood appears in history
```

**✅ Success Criteria**:
- Mood entry is saved
- Entry appears in mood history
- Database has new mood_entries record
- No errors in console

**Verify in Drizzle Studio**:
```bash
npm run db:studio
# Check mood_entries table has new entry
```

---

#### Test 3: Journal Entry

**Steps**:
```
1. Login as employee
2. Navigate to "Journal" or "Reflections"
3. Create new entry
4. Add title and content
5. Set privacy (private/shared)
6. Save entry
7. Verify entry appears in journal list
```

**✅ Success Criteria**:
- Journal entry saved
- Entry appears in list
- Privacy setting respected
- Can edit entry
- Can delete entry

---

#### Test 4: Manager Dashboard

**Steps**:
```
1. Login as manager/admin user
2. Navigate to "Dashboard" or "Analytics"
3. View team wellbeing data
4. Check aggregate mood trends
5. View anonymous feedback
```

**✅ Success Criteria**:
- Dashboard loads without errors
- Aggregate data displays correctly
- Charts/graphs render
- No personal data exposed in anonymous views

---

#### Test 5: Anonymous Venting

**Steps**:
```
1. Navigate to anonymous vent feature
2. Write anonymous message
3. Submit without login
4. Verify message appears in feed
5. Check message is truly anonymous
```

**✅ Success Criteria**:
- Anonymous post succeeds
- No user information attached
- Post appears in feed
- Cannot trace back to user

---

#### Test 6: API Endpoints

**Test all core endpoints**:
```bash
# Health checks
curl http://localhost:5000/health
curl http://localhost:5000/healthz
curl http://localhost:5000/ready

# Authentication
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"apitest","email":"api@test.com","password":"ApiTest123!","organizationName":"API Test"}'

curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"api@test.com","password":"ApiTest123!"}'

# Protected endpoints (need auth token)
TOKEN="<get-from-login-response>"
curl http://localhost:5000/api/users/me \
  -H "Authorization: Bearer $TOKEN"
```

**✅ Success Criteria**:
- All endpoints respond with correct status codes
- Authentication works
- Protected endpoints require auth
- Error responses have meaningful messages

---

### Database Verification

```bash
# Open Drizzle Studio
npm run db:studio

# Check all tables exist and have data:
# - users (should have test users)
# - organizations (should have test orgs)
# - employees (linked to users and orgs)
# - journal_entries (test journals)
# - mood_entries (test moods)
# - anonymous_rants (test vents)
# - refresh_tokens (active sessions)

# Verify relationships:
# - Users belong to organizations
# - Employees linked to users
# - Journal entries belong to employees
# - Mood entries belong to employees
```

**✅ Success Criteria**:
- All expected tables exist
- Test data is present
- Foreign key relationships work
- No orphaned records
- Data integrity maintained

---

## Cleanup Steps

### Step 1: Identify Old Files

```bash
# List files that may need cleanup
cd /home/dave/Downloads/MindfulMe

# Check for old server files in root
ls -la server/

# Check for old client files
ls -la client/

# Check for old monolithic files
ls -la src/

# Check for duplicate files
find . -name "*.duplicate" -o -name "*.old" -o -name "*.backup"
```

**Files to potentially remove** (if they exist and are duplicates):
- `server/` directory (if backend/ is the new version)
- `client/` directory (if frontend/ is the new version)
- Root `src/` directory (if moved to packages)
- Any `.old`, `.backup`, `.duplicate` files

**⚠️ CAUTION**: Only remove after confirming everything works!

---

### Step 2: Remove Old Files (CAREFULLY)

```bash
# Create a safety branch first
git checkout -b cleanup-old-files

# Move old files to archive (don't delete yet)
mkdir -p archive/old-structure
mv server/ archive/old-structure/ 2>/dev/null || true
mv client/ archive/old-structure/ 2>/dev/null || true
mv src/ archive/old-structure/ 2>/dev/null || true

# Check what was moved
ls -la archive/old-structure/

# Test that everything still works
npm run dev
# Let it run for 30 seconds, test in browser

# If everything works, commit the archive
git add archive/
git commit -m "chore: archive old monolithic structure"
```

**✅ Verify**: Application still works after moving old files

---

### Step 3: Update .gitignore

```bash
# .gitignore should already be updated, but verify:
cat .gitignore | grep -E "node_modules|dist|\.env"

# Should include:
# node_modules/
# dist/
# .env
# .env.local
# .env.prod
# *.sqlite
# data/
```

**✅ Verify**: All necessary patterns are in .gitignore

---

### Step 4: Remove Unused Dependencies

```bash
# Check for unused dependencies (optional)
npx depcheck

# If any unused dependencies found, remove them:
# npm uninstall <package-name>

# Update all packages to latest (optional, careful!)
# npm outdated
# npm update
```

**⚠️ CAUTION**: Only remove dependencies you're certain are unused!

---

### Step 5: Final Cleanup

```bash
# Remove temporary files
find . -name "*.log" -delete
find . -name "*.tmp" -delete
find . -name ".DS_Store" -delete

# Clean build artifacts (will rebuild)
npm run clean

# Rebuild everything
npm run build

# Verify build succeeds
npm run check
```

**✅ Verify**: Everything builds and runs after cleanup

---

## Commit and Merge

### Step 1: Final Commit

```bash
# Stage all changes
git add .

# Check status
git status

# Create final commit
git commit -m "feat: complete monorepo migration to backend separation

BREAKING CHANGE: Restructured project into npm workspaces

Migration Summary:
- ✅ Separated backend and frontend into independent packages
- ✅ Created shared package for common types and schemas
- ✅ Set up npm workspaces for dependency management
- ✅ Configured TypeScript project references
- ✅ Added comprehensive build and deployment configuration
- ✅ Added Docker support (development and production)
- ✅ Added Render.com deployment blueprint
- ✅ Added extensive documentation (87,000+ words)

Build Results:
- Shared: 50KB (compiled types and schemas)
- Backend: 61KB minified (Express API server)
- Frontend: 489KB → 152KB gzipped (React SPA)

Testing:
- ✅ All TypeScript checks pass
- ✅ All packages build successfully
- ✅ Backend runs independently on port 5000
- ✅ Frontend runs independently on port 5173
- ✅ Inter-service communication works (CORS configured)
- ✅ Database operations work (SQLite/PostgreSQL)
- ✅ Authentication flow works
- ✅ Core features tested (mood tracking, journaling, etc.)
- ✅ Manager dashboard works
- ✅ Anonymous venting works
- ✅ All API endpoints respond correctly

Documentation:
- README.md (8,000 words)
- DEVELOPER_ONBOARDING.md (7,500 words)
- GIT_WORKFLOW.md (6,500 words)
- DATABASE_SETUP.md (8,500 words)
- SECRETS_MANAGEMENT.md (12,000 words)
- ENVIRONMENT_CONFIG.md (13,000 words)
- DEPLOYMENT_GUIDE.md (12,000 words)
- BUILD_DEPLOYMENT_COMPLETE.md (complete summary)

Configuration:
- npm workspaces for monorepo management
- TypeScript project references for incremental builds
- Drizzle ORM with PostgreSQL/SQLite support
- Environment variable validation with Zod
- Multi-stage Docker builds (dev and prod)
- Render.com blueprint for one-click deployment
- Health check endpoints for monitoring
- CI/CD scripts for automation

Next Steps:
- Merge to main branch
- Deploy to Render.com
- Set up monitoring (Sentry, UptimeRobot)
- Add automated tests
- Set up CI/CD pipeline

Co-authored-by: GitHub Copilot <copilot@github.com>"
```

---

### Step 2: Push to GitHub

```bash
# Push feature branch
git push origin feature/backend-separation

# If this is the first push:
git push -u origin feature/backend-separation
```

**✅ Verify**: Branch pushed successfully

---

### Step 3: Create Pull Request

**In GitHub**:
```
1. Go to https://github.com/David-2911/ForYourMind
2. Click "Pull requests"
3. Click "New pull request"
4. Base: main
5. Compare: feature/backend-separation
6. Click "Create pull request"
7. Title: "feat: Complete monorepo migration to backend separation"
8. Description: (Copy from commit message)
9. Add labels: enhancement, breaking-change
10. Request review (if team)
11. Click "Create pull request"
```

---

### Step 4: Review Changes

**Check the diff**:
- Files added (should be ~100+ files)
- Files modified (package.json, configs, etc.)
- Files deleted (old structure, if any)

**Run final checks**:
```bash
# On the feature branch
npm run verify

# Should show:
# ✅ All TypeScript checks passed
# ✅ All packages built successfully
# ✅ All checks passed!
```

---

### Step 5: Merge to Main

**Option A: Merge via GitHub** (Recommended):
```
1. In the pull request, click "Merge pull request"
2. Choose "Squash and merge" or "Create a merge commit"
3. Confirm merge
4. Delete feature branch (optional)
```

**Option B: Merge locally**:
```bash
# Switch to main
git checkout main

# Pull latest
git pull origin main

# Merge feature branch
git merge feature/backend-separation

# Push to GitHub
git push origin main

# Delete feature branch (optional)
git branch -d feature/backend-separation
git push origin --delete feature/backend-separation
```

**✅ Verify**: Main branch has all changes

---

### Step 6: Deploy to Production

**After merging to main**:

**Option A: Deploy to Render.com**:
```bash
# Render auto-deploys from main branch
# Just push render.yaml to main:
git push origin main

# Monitor deployment:
# 1. Go to https://dashboard.render.com
# 2. Watch services deploy
# 3. Check logs for errors
```

**Option B: Deploy with Docker**:
```bash
# Build production images
./scripts/docker-build.sh --tag v1.0.0

# Deploy with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

**✅ Verify**: Production deployment successful

---

## Final Checklist Summary

### Pre-Execution
- [ ] Created backup of entire project
- [ ] Backed up database file
- [ ] Committed all changes to Git
- [ ] On `feature/backend-separation` branch
- [ ] Node.js >= 18.0.0
- [ ] npm >= 9.0.0

### Execution
- [ ] Installed all dependencies (`npm install`)
- [ ] Built shared package (`npm run build:shared`)
- [ ] Ran type checks (`npm run check`)
- [ ] Created `.env` file with secrets
- [ ] Built all packages (`npm run build`)
- [ ] Set up SQLite database (`npm run db:migrate`)
- [ ] Started backend (`cd backend && npm run dev`)
- [ ] Started frontend (`cd frontend && npm run dev`)
- [ ] Verified communication between services

### Verification
- [ ] Backend runs independently on port 5000
- [ ] Frontend runs independently on port 5173
- [ ] Health endpoints respond (`/health`, `/healthz`, `/ready`)
- [ ] No CORS errors in browser console
- [ ] Database operations work (Drizzle Studio)
- [ ] User registration works
- [ ] User login works
- [ ] Mood tracking works
- [ ] Journal entries work
- [ ] Manager dashboard works
- [ ] Anonymous venting works
- [ ] All API endpoints respond correctly

### Cleanup
- [ ] Archived old structure files
- [ ] Removed temporary files
- [ ] Verified `.gitignore` is correct
- [ ] Removed unused dependencies
- [ ] Final build succeeds

### Commit & Merge
- [ ] All changes committed with descriptive message
- [ ] Pushed to GitHub
- [ ] Created pull request
- [ ] Reviewed changes
- [ ] Merged to main
- [ ] Deployed to production (optional)

---

## Quick Reference Commands

```bash
# Full verification sequence
npm install                    # Install dependencies
npm run build:shared          # Build shared (critical!)
npm run check                 # TypeScript checks
npm run build                 # Build all packages
npm run db:migrate            # Set up database
npm run dev                   # Start all services

# Individual service testing
cd backend && npm run dev     # Backend on port 5000
cd frontend && npm run dev    # Frontend on port 5173

# Health checks
curl http://localhost:5000/health
curl http://localhost:5000/healthz
curl http://localhost:5000/ready

# Database management
npm run db:studio             # Visual database browser
npm run db:migrate            # Run migrations
npm run db:push               # Push schema changes

# Production build
npm run build                 # Build all packages
./scripts/build-production.sh # Automated build script
./scripts/docker-build.sh     # Build Docker images

# Deployment
git push origin main          # Trigger Render auto-deploy
docker-compose up -d          # Start Docker production
```

---

## Success Indicators

### You know the migration is successful when:

✅ **Build Phase**:
- All packages build without errors
- Shared package has `dist/` directory with `.js` and `.d.ts` files
- Backend builds to single `dist/index.js` file (~61KB)
- Frontend builds with code splitting (~152KB gzipped)

✅ **Runtime Phase**:
- Backend starts on port 5000 without errors
- Frontend starts on port 5173 without errors
- No TypeScript compilation errors
- No module resolution errors

✅ **Communication Phase**:
- Frontend can call backend APIs
- No CORS errors in browser console
- Health endpoints respond with 200 status
- Auth cookies are set correctly

✅ **Database Phase**:
- SQLite database file exists (`backend/data/db.sqlite`)
- All tables exist (users, organizations, etc.)
- Migrations applied successfully
- Can view data in Drizzle Studio

✅ **Feature Phase**:
- User registration works
- User login works
- Mood tracking saves data
- Journal entries save and display
- Manager dashboard shows data
- Anonymous venting posts successfully

✅ **Production Ready**:
- Docker images build successfully
- Production build runs without errors
- Environment variables validated
- Secrets properly configured
- Documentation complete

---

**🎉 Congratulations! Your monorepo migration is complete!**

If you encounter any issues not covered in this guide, check:
- [DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md)
- [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [TROUBLESHOOTING sections above](#troubleshooting-guide)
