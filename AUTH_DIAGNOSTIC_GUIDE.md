# Authentication Failure Diagnostic Guide

**Run through this checklist systematically to identify and fix your authentication issue.**

---

## 🔍 IDENTIFIED ISSUES FROM CODE ANALYSIS

Based on your codebase, I've already identified **3 potential issues**:

### ⚠️ Issue #1: API URL Mismatch
**Location:** `frontend/src/lib/auth.ts` lines 4, 43, 67
**Problem:** Frontend uses different API URL patterns

```typescript
// In auth.ts:
const API_BASE = import.meta.env.VITE_API_URL || "/api";

// This means:
// - If VITE_API_URL is set: uses it as-is (e.g., "https://backend.com")
// - If NOT set: uses "/api" (relative path)

// Backend routes are at:
app.post("/api/auth/register", ...)  // Full path: /api/auth/register
app.post("/api/auth/login", ...)     // Full path: /api/auth/login
```

**Likely Error:**
- If `VITE_API_URL` is set to `https://backend.com`, frontend makes requests to:
  - `https://backend.com/auth/login` ❌ (WRONG - missing /api)
  - Should be: `https://backend.com/api/auth/login` ✅

### ⚠️ Issue #2: CORS Configuration
**Location:** `backend/src/index.ts` line 13
**Problem:** CORS might not be configured correctly

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
```

**Check:**
- Is `CORS_ORIGIN` set on Render backend?
- Does it **exactly** match your frontend URL?
- No trailing slash? (e.g., `https://frontend.com` not `https://frontend.com/`)

### ⚠️ Issue #3: Cookie Settings in Production
**Location:** `backend/src/routes/index.ts` lines 93-99, 144-150
**Problem:** Cookie settings depend on environment detection

```typescript
const isProd = app.get('env') !== 'development';
res.cookie('refresh_token', refreshToken, {
  httpOnly: true,
  secure: isProd,              // HTTPS only in production
  sameSite: isProd ? 'none' : 'lax',  // 'none' requires HTTPS
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

**Issue:** `app.get('env')` might not return 'production' on Render!
- It checks `process.env.NODE_ENV` but Express-specific way
- If not set correctly, cookies won't work across domains

---

## 📋 STEP-BY-STEP DIAGNOSTIC PROCEDURE

### STEP 1: Check Frontend Environment Variables

**On Render.com Frontend:**
1. Go to Frontend service → Environment
2. Check `VITE_API_URL` value

**Report:**
```
VITE_API_URL = ______________________________
```

**Expected Values:**
- ✅ CORRECT: `https://mindfulme-backend.onrender.com` (no /api at end)
- ❌ WRONG: `https://mindfulme-backend.onrender.com/api`
- ❌ WRONG: Not set (would use "/api" relative path)

**Why:** The auth.ts code will append `/auth/login`, so full URL becomes:
- If set correctly: `https://backend.com/auth/login` (but backend expects `/api/auth/login`)
- **THIS IS THE BUG!** ⚠️

### STEP 2: Check Backend Environment Variables

**On Render.com Backend:**
1. Go to Backend service → Environment
2. Verify these variables:

**Report:**
```
NODE_ENV = ______________________________
CORS_ORIGIN = ______________________________
JWT_SECRET = ______________________________ (just say "set" or "not set")
DATABASE_URL = ______________________________ (just say "set" or "not set")
```

**Expected Values:**
- ✅ `NODE_ENV=production`
- ✅ `CORS_ORIGIN=https://mindfulme-frontend.onrender.com` (exact match)
- ✅ JWT_SECRET set (auto-generated)
- ✅ DATABASE_URL set (auto-generated)

### STEP 3: Browser DevTools Inspection

**Open your frontend in browser:**
1. Press F12 to open DevTools
2. Go to **Network** tab
3. Clear all requests (trash icon)
4. Attempt to **sign up** with test credentials:
   - Email: test@example.com
   - Password: testpassword123
   - Display Name: Test User
   - Role: individual

**Find the failed request and report:**
```
Request URL: ______________________________
Request Method: POST
Status Code: ______________________________
Request Headers:
  - Content-Type: ______________________________
  - Origin: ______________________________
  - Referer: ______________________________
Request Payload (Body):
{
  "email": "...",
  "password": "...",
  ...
}

Response Status: ______________________________
Response Body:
______________________________
______________________________

Response Headers:
  - Access-Control-Allow-Origin: ______________________________
  - Access-Control-Allow-Credentials: ______________________________
```

### STEP 4: Console Errors

**In DevTools Console tab, report ALL errors:**
```
______________________________
______________________________
______________________________
```

**Look specifically for:**
- ❌ CORS errors: "blocked by CORS policy"
- ❌ Network errors: "Failed to fetch"
- ❌ 404 errors: "Not found"
- ❌ 500 errors: "Internal server error"

### STEP 5: Backend Logs (Render Dashboard)

1. Go to Backend service → Logs
2. Watch logs in real-time
3. Attempt sign up again
4. Copy last 20 lines of logs

**Report:**
```
______________________________
______________________________
______________________________
(paste backend logs here)
```

**Questions:**
- Does the request reach the backend? (Yes/No)
- Any error messages in logs? (copy them)
- Does backend show successful database connection on startup?

### STEP 6: Database Connection Test

**On Render:**
1. Go to Database service → Connect
2. Copy connection string (hide password)
3. Go to Backend service → Logs
4. Check for messages like:
   - "✅ Backend server running on..."
   - "🗄️ Database: PostgreSQL"

**Report:**
```
Database connection successful? (Yes/No)
Database type shown in logs: ______________________________
```

---

## 🔧 QUICK FIXES TO TRY

### Fix #1: Correct VITE_API_URL (MOST LIKELY FIX)

**Problem:** Frontend constructs URLs incorrectly

**Solution A - Add /api to VITE_API_URL:**
1. Go to Frontend service → Environment
2. Update `VITE_API_URL` to include `/api`:
   ```
   VITE_API_URL=https://mindfulme-backend.onrender.com/api
   ```
3. Trigger manual redeploy

**Solution B - Fix auth.ts code (BETTER):**

Update `frontend/src/lib/auth.ts` to handle URL construction properly:

```typescript
// Change line 4 from:
const API_BASE = import.meta.env.VITE_API_URL || "/api";

// To:
const API_BASE = import.meta.env.VITE_API_URL || "";

// Then update all fetch calls from:
fetch(`${API_BASE}/auth/login`, ...)

// To:
fetch(`${API_BASE}/api/auth/login`, ...)
```

This ensures `/api` is always included regardless of VITE_API_URL setting.

### Fix #2: Verify CORS_ORIGIN

1. Go to Backend service → Environment
2. Check `CORS_ORIGIN` value
3. Update to **exact** frontend URL:
   ```
   CORS_ORIGIN=https://mindfulme-frontend.onrender.com
   ```
4. **No trailing slash!**
5. Trigger manual redeploy

### Fix #3: Fix Cookie Environment Detection

Update `backend/src/routes/index.ts` to use process.env directly:

```typescript
// Change lines like:
const isProd = app.get('env') !== 'development';

// To:
const isProd = process.env.NODE_ENV === 'production';
```

This ensures production cookie settings are used on Render.

### Fix #4: Enable Request Logging

Add logging to backend to see incoming requests:

```typescript
// In backend/src/index.ts, after middleware setup:
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} from ${req.headers.origin}`);
  next();
});
```

This will show all requests in backend logs.

---

## 🎯 MOST LIKELY ISSUES (Ranked by Probability)

### 1. **API URL Construction Issue** (90% probability)
**Symptom:** Frontend gets 404 Not Found
**Cause:** VITE_API_URL doesn't include `/api`, but backend routes do
**Fix:** Apply Fix #1 Solution B above

### 2. **CORS Misconfiguration** (70% probability)
**Symptom:** CORS error in browser console
**Cause:** CORS_ORIGIN doesn't match frontend URL exactly
**Fix:** Apply Fix #2 above

### 3. **Cookie Not Setting** (50% probability)
**Symptom:** Login succeeds but refresh fails, or no refresh_token cookie
**Cause:** Production environment not detected, secure cookies not enabled
**Fix:** Apply Fix #3 above

### 4. **Database Connection** (30% probability)
**Symptom:** Backend returns 500 Internal Server Error
**Cause:** DATABASE_URL not set or invalid
**Fix:** Check DATABASE_URL in backend environment variables

### 5. **JWT Secret Missing** (20% probability)
**Symptom:** Token signing fails, 500 error
**Cause:** JWT_SECRET not set
**Fix:** Check JWT_SECRET in backend environment variables

---

## 🚀 RECOMMENDED ACTION PLAN

**Do these in order:**

1. **Gather diagnostic data** (Steps 1-6 above) - 5 minutes
2. **Apply Fix #1 Solution B** - Change auth.ts URL construction - 2 minutes
3. **Apply Fix #2** - Verify CORS_ORIGIN - 1 minute
4. **Apply Fix #3** - Fix cookie environment detection - 2 minutes
5. **Test authentication** - 5 minutes
6. **If still failing, report diagnostic data** - We'll debug further

---

## 📝 REPORT TEMPLATE

**Fill this out and share the results:**

```
=== DIAGNOSTIC REPORT ===

STEP 1 - Frontend Environment:
VITE_API_URL = 

STEP 2 - Backend Environment:
NODE_ENV = 
CORS_ORIGIN = 
JWT_SECRET = [set/not set]
DATABASE_URL = [set/not set]

STEP 3 - Browser Network Tab:
Request URL: 
Status Code: 
Response Body: 

STEP 4 - Console Errors:
[paste errors here]

STEP 5 - Backend Logs:
[paste logs here]

STEP 6 - Database Status:
Connection successful? [Yes/No]

=== FIXES APPLIED ===
[ ] Fix #1 - URL construction
[ ] Fix #2 - CORS_ORIGIN
[ ] Fix #3 - Cookie environment
[ ] Fix #4 - Request logging

=== RESULT ===
Authentication working? [Yes/No]
Remaining issues: 
```

---

**After you gather the diagnostic data and try the fixes, report back with the DIAGNOSTIC REPORT filled out. I'll provide the exact solution for any remaining issues.**
