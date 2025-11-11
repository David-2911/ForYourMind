# 🧪 MindfulMe - Comprehensive Testing Checklist

**Last Updated:** November 10, 2025  
**Branch:** feature/backend-separation  
**Tester:** _________________  
**Date:** _________________

---

## 📋 Testing Instructions

1. **Use a fresh environment** - Test as if you're a new developer
2. **Check each box** as you complete the test
3. **Document failures** in the "Test Failures Log" section at the bottom
4. **Mark priority** for each failure (Critical/High/Medium/Low)
5. **Retest** after fixes are applied

---

## 1️⃣ LOCAL ENVIRONMENT SETUP TEST

### Prerequisites Check
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm 9+ installed (`npm --version`)
- [ ] Git installed (`git --version`)
- [ ] PostgreSQL installed (optional, for production testing)

### Fresh Clone & Setup
```bash
# Simulate new developer experience
cd ~/temp-test-location
git clone https://github.com/David-2911/ForYourMind.git
cd ForYourMind
```

- [ ] Repository clones successfully
- [ ] All files are present (check `ls -la`)
- [ ] No missing folders

### Environment Configuration
- [ ] `.env.example` file exists in root
- [ ] Copy `.env.example` to `.env`
- [ ] Fill in all required environment variables:
  - [ ] `DATABASE_URL` or `USE_SQLITE=true`
  - [ ] `JWT_SECRET` (32+ characters)
  - [ ] `COOKIE_SECRET` (32+ characters)
  - [ ] `CORS_ORIGIN` (http://localhost:5173)
  - [ ] `PORT` (5000)
  - [ ] `NODE_ENV` (development)

### Dependencies Installation
```bash
npm install
```

- [ ] Root dependencies install without errors
- [ ] Shared package builds automatically (postinstall hook)
- [ ] Backend dependencies install correctly
- [ ] Frontend dependencies install correctly
- [ ] No vulnerability warnings (or only low severity)

### Backend Startup
```bash
npm run dev:backend
# OR in separate terminal:
cd backend && npm run dev
```

**Expected Output:**
```
✅ Backend server running on http://localhost:5000
📊 Environment: development
🗄️  Database: SQLite (or PostgreSQL)
```

- [ ] Backend starts without errors
- [ ] Runs on port 5000
- [ ] Database connection established
- [ ] Health endpoint accessible: http://localhost:5000/health
- [ ] Logs show no critical errors

### Frontend Startup
```bash
npm run dev:frontend
# OR in separate terminal:
cd frontend && npm run dev
```

**Expected Output:**
```
VITE v5.x.x ready in XXX ms
➜ Local: http://localhost:5173/
```

- [ ] Frontend starts without errors
- [ ] Runs on port 5173
- [ ] Browser opens automatically (or open manually)
- [ ] No console errors in browser developer tools

### API Connection Test
- [ ] Frontend can reach backend
- [ ] Open browser console (F12)
- [ ] Check Network tab for API calls
- [ ] CORS headers present in responses
- [ ] No CORS errors in console

**Test Command:**
```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-10T...",
  "uptime": 123.45,
  "environment": "development",
  "database": "SQLite",
  "version": "1.0.0"
}
```

- [ ] Health endpoint returns 200 OK
- [ ] JSON response is valid
- [ ] All fields present

---

## 2️⃣ DATABASE & MIGRATIONS TEST

### Database Connection
- [ ] Database file created (SQLite: `backend/data/db.sqlite`)
- [ ] PostgreSQL connection string works (if using Postgres)
- [ ] No connection timeout errors
- [ ] Connection pool initializes

### Migration Execution
```bash
cd backend
npm run db:migrate
# OR
npx drizzle-kit migrate
```

- [ ] All migrations run successfully
- [ ] No SQL syntax errors
- [ ] Migration files in correct order

### Schema Verification
```bash
cd backend
npm run db:studio
# Opens Drizzle Studio on http://localhost:4983
```

**Required Tables:**
- [ ] `users` table exists
- [ ] `refresh_tokens` table exists
- [ ] `mood_entries` table exists
- [ ] `journal_entries` table exists
- [ ] `wellness_assessments` table exists
- [ ] `anonymous_vents` table exists
- [ ] `therapists` table exists
- [ ] `appointments` table exists

**Table Structure Checks:**
- [ ] All tables have `id` primary key
- [ ] `created_at` and `updated_at` timestamps present
- [ ] Foreign key relationships defined
- [ ] NOT NULL constraints on required fields
- [ ] Unique constraints (e.g., user email)

### Data Integrity
- [ ] Can insert test record manually
- [ ] Foreign key constraints enforced (try inserting invalid FK)
- [ ] Unique constraints enforced (try duplicate email)
- [ ] Default values applied correctly
- [ ] Timestamps auto-populate

---

## 3️⃣ AUTHENTICATION FLOW TEST

### User Registration

**Test Data:**
```json
{
  "email": "test@example.com",
  "password": "TestPass123!",
  "name": "Test User",
  "role": "individual"
}
```

- [ ] Registration endpoint accessible (`POST /api/auth/register`)
- [ ] User created successfully
- [ ] Password is hashed (check database - should NOT be plain text)
- [ ] Returns JWT token
- [ ] Returns user object (without password)
- [ ] Duplicate email returns 409 Conflict
- [ ] Invalid email format returns 400 Bad Request
- [ ] Weak password rejected
- [ ] Required fields validated

**Test Command:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "name": "Test User",
    "role": "individual"
  }'
```

### User Login

**Test Data:**
```json
{
  "email": "test@example.com",
  "password": "TestPass123!"
}
```

- [ ] Login endpoint accessible (`POST /api/auth/login`)
- [ ] Correct credentials return JWT token
- [ ] Returns user profile data
- [ ] Token stored in httpOnly cookie (check browser DevTools)
- [ ] Refresh token created in database
- [ ] Wrong password returns 401 Unauthorized
- [ ] Non-existent email returns 401 Unauthorized
- [ ] Missing fields return 400 Bad Request

**Test Command:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }' \
  -c cookies.txt
```

### Token Validation
- [ ] Valid token allows access to protected routes
- [ ] Expired token returns 401 Unauthorized
- [ ] Invalid token returns 401 Unauthorized
- [ ] Token contains correct user ID
- [ ] Token contains correct role

### Token Refresh
- [ ] Refresh endpoint accessible (`POST /api/auth/refresh`)
- [ ] Valid refresh token returns new access token
- [ ] Invalid refresh token returns 401
- [ ] Used refresh token is invalidated
- [ ] New refresh token created

**Test Command:**
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -b cookies.txt
```

### Logout
- [ ] Logout endpoint accessible (`POST /api/auth/logout`)
- [ ] Refresh token deleted from database
- [ ] Cookie cleared in browser
- [ ] Subsequent requests with old token fail
- [ ] User must login again to access protected routes

### Protected Routes
- [ ] Accessing protected route without token returns 401
- [ ] Accessing with valid token succeeds
- [ ] Role-based routes enforce role (e.g., manager-only)
- [ ] Admin routes require admin role
- [ ] Cross-role access properly denied

### Role-Based Access Control

**Individual User:**
- [ ] Can access own dashboard
- [ ] Cannot access manager dashboard
- [ ] Cannot access admin dashboard
- [ ] Can only view own data

**Manager User:**
- [ ] Can access manager dashboard
- [ ] Can view team aggregated data
- [ ] Cannot view individual user details
- [ ] Cannot access admin functions

**Admin User:**
- [ ] Can access all dashboards
- [ ] Can view system-wide data
- [ ] Can manage users (if implemented)
- [ ] Has elevated permissions

---

## 4️⃣ CORE FEATURES TEST (Individual User)

### 🎭 Mood Tracking

**Create Mood Entry**
- [ ] Open mood tracking interface
- [ ] Select mood (e.g., Happy, Sad, Anxious, Calm)
- [ ] Add intensity (1-10 scale)
- [ ] Add optional notes
- [ ] Click "Save"
- [ ] Entry appears immediately in mood history
- [ ] Success notification shown
- [ ] Timestamp is correct

**API Test:**
```bash
curl -X POST http://localhost:5000/api/mood \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "mood": "happy",
    "intensity": 8,
    "notes": "Had a great day!"
  }'
```

- [ ] Returns 201 Created
- [ ] Entry saved to database
- [ ] `user_id` correctly linked

**View Mood History**
- [ ] Mood history page loads
- [ ] All mood entries displayed
- [ ] Entries sorted by date (newest first)
- [ ] Chart/visualization renders correctly
- [ ] Pagination works (if implemented)
- [ ] Filter by date range works
- [ ] Empty state shows when no entries

**Edit Mood Entry**
- [ ] Click "Edit" on mood entry
- [ ] Modal/form opens with current data
- [ ] Change mood, intensity, or notes
- [ ] Click "Save"
- [ ] Changes reflected immediately
- [ ] Cannot edit other users' entries

**Delete Mood Entry**
- [ ] Click "Delete" on mood entry
- [ ] Confirmation dialog appears
- [ ] Confirm deletion
- [ ] Entry removed from list
- [ ] Entry deleted from database
- [ ] Cannot delete other users' entries

### 📝 Journaling

**Create Journal Entry**
- [ ] Open journaling interface
- [ ] Enter title
- [ ] Write content (rich text editor if available)
- [ ] Add optional mood tag
- [ ] Click "Save"
- [ ] Entry appears in journal list
- [ ] Auto-save works (if implemented)

**API Test:**
```bash
curl -X POST http://localhost:5000/api/journal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "My First Journal Entry",
    "content": "Today was a good day...",
    "mood": "happy"
  }'
```

- [ ] Returns 201 Created
- [ ] Entry saved with correct user_id
- [ ] Timestamps populated

**View All Entries**
- [ ] Journal entries page loads
- [ ] All entries displayed
- [ ] Search functionality works
- [ ] Filter by mood works
- [ ] Sort options work (date, title)
- [ ] Can view entry details

**Edit Entry**
- [ ] Click "Edit" on entry
- [ ] Form pre-fills with current content
- [ ] Make changes
- [ ] Save successfully
- [ ] `updated_at` timestamp changes
- [ ] Previous version not lost (if versioning implemented)

**Delete Entry**
- [ ] Click "Delete"
- [ ] Confirmation prompt
- [ ] Entry removed
- [ ] Cannot recover (unless soft delete implemented)

### 🏥 Wellness Assessments

**Start Assessment**
- [ ] Navigate to wellness assessment
- [ ] Click "Start Assessment"
- [ ] Questions load correctly
- [ ] Question progression works
- [ ] Can go back to previous questions
- [ ] Progress indicator shows

**Complete Assessment**
- [ ] Answer all questions
- [ ] Validation prevents skipping required questions
- [ ] Submit assessment
- [ ] Processing indicator shows
- [ ] Results page loads

**View Results**
- [ ] Score/results displayed clearly
- [ ] Visual representation (chart/graph)
- [ ] Recommendations provided
- [ ] Results saved to database
- [ ] Can download/print results (if implemented)

**View Assessment History**
- [ ] History page shows all past assessments
- [ ] Can compare results over time
- [ ] Trend visualization works
- [ ] Can re-take assessment

---

## 5️⃣ MANAGER DASHBOARD TEST

### Access Control
- [ ] Login as manager user
- [ ] Manager dashboard accessible
- [ ] Individual dashboard still accessible
- [ ] Admin dashboard NOT accessible (if not admin)

### Team Wellbeing Metrics
- [ ] Dashboard loads without errors
- [ ] Team size/count displayed
- [ ] Average wellbeing score shown
- [ ] Mood trends chart renders
- [ ] Data is aggregated (not individual)
- [ ] Date range filter works

### Anonymized Data
- [ ] Cannot see individual user names
- [ ] Cannot identify specific employees
- [ ] Data properly anonymized in API response
- [ ] No user IDs exposed in frontend

### Charts & Visualizations
- [ ] Team mood distribution chart
- [ ] Wellness score trends over time
- [ ] Assessment completion rate
- [ ] Anonymous vent sentiment analysis (if implemented)
- [ ] Charts responsive on mobile
- [ ] Export functionality works (if implemented)

### Manager Actions
- [ ] Can view team statistics
- [ ] Can generate reports (if implemented)
- [ ] Can set team goals (if implemented)
- [ ] Cannot modify individual user data
- [ ] Cannot access individual journals/moods

---

## 6️⃣ ANONYMOUS VENTING TEST

### Create Anonymous Post
- [ ] Navigate to venting feature
- [ ] Create new vent
- [ ] Enter message/content
- [ ] Optional mood/category selection
- [ ] Submit anonymously
- [ ] Post appears in feed

**Database Verification:**
- [ ] Check database: `anonymous_vents` table
- [ ] `user_id` should be NULL or anonymized
- [ ] No identifying information stored
- [ ] IP address NOT stored (privacy concern)

**API Test:**
```bash
curl -X POST http://localhost:5000/api/vents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "Feeling stressed about work deadlines",
    "category": "work"
  }'
```

- [ ] Returns 201 Created
- [ ] Response does NOT include user info
- [ ] Post ID returned for tracking (if allowing deletion)

### View All Vents
- [ ] Vent feed loads
- [ ] All vents displayed (not just own)
- [ ] No usernames/identifying info shown
- [ ] Sorted by recent (or votes if implemented)
- [ ] Pagination works
- [ ] Load more functionality

### Anonymity Verification
- [ ] Author name NOT shown
- [ ] User avatar NOT shown
- [ ] Cannot trace back to user
- [ ] Even admins cannot identify (unless special flag)
- [ ] Browser inspection doesn't reveal user

### Interaction (if implemented)
- [ ] Can upvote/downvote vents
- [ ] Can report inappropriate content
- [ ] Cannot edit other's vents
- [ ] Cannot see who posted

### Delete Own Vent
- [ ] Can delete own vent (if tracking method exists)
- [ ] Cannot delete others' vents
- [ ] Deletion confirmation required
- [ ] Vent removed from feed and database

---

## 7️⃣ THERAPIST DIRECTORY TEST

### View Therapist Listings
- [ ] Navigate to therapist directory
- [ ] List of therapists loads
- [ ] Each listing shows:
  - [ ] Name
  - [ ] Photo (if available)
  - [ ] Specialties
  - [ ] Experience
  - [ ] Availability
  - [ ] Contact info or booking button

### Filter Functionality
- [ ] Filter by specialty (e.g., Anxiety, Depression, PTSD)
- [ ] Filter by availability (dates/times)
- [ ] Filter by insurance accepted (if implemented)
- [ ] Multiple filters work together
- [ ] Clear filters button works
- [ ] Filter results update immediately

### Search Functionality
- [ ] Search bar present
- [ ] Search by name works
- [ ] Search by specialty works
- [ ] Search by keyword works
- [ ] Results highlight search terms
- [ ] Empty search shows all results

### Therapist Details
- [ ] Click on therapist
- [ ] Detail page/modal opens
- [ ] Full bio displayed
- [ ] Credentials shown
- [ ] Specialties listed
- [ ] Contact information available
- [ ] Reviews/ratings (if implemented)

### Book Appointment
- [ ] Click "Book Appointment"
- [ ] Calendar interface loads
- [ ] Available slots highlighted
- [ ] Select date and time
- [ ] Confirm booking
- [ ] Confirmation message/email
- [ ] Booking saved to database

**API Test:**
```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "therapist_id": 1,
    "date": "2025-11-15",
    "time": "14:00",
    "notes": "First time visit"
  }'
```

### View Booked Appointments
- [ ] Navigate to "My Appointments"
- [ ] All booked appointments listed
- [ ] Sorted by date (upcoming first)
- [ ] Shows therapist details
- [ ] Shows date, time, location
- [ ] Past appointments marked differently

### Cancel Appointment
- [ ] Click "Cancel" on appointment
- [ ] Confirmation dialog appears
- [ ] Reason for cancellation (optional)
- [ ] Confirm cancellation
- [ ] Appointment status updated
- [ ] Therapist notified (if implemented)
- [ ] Cannot cancel within 24 hours (if policy)

---

## 8️⃣ API ENDPOINTS TEST

### Authentication Endpoints

**POST `/api/auth/register`**
- [ ] Returns 201 on success
- [ ] Returns 400 for invalid data
- [ ] Returns 409 for duplicate email
- [ ] Response includes token and user

**POST `/api/auth/login`**
- [ ] Returns 200 on success
- [ ] Returns 401 for invalid credentials
- [ ] Returns 400 for missing fields
- [ ] Sets httpOnly cookie

**POST `/api/auth/refresh`**
- [ ] Returns 200 with new token
- [ ] Returns 401 for invalid refresh token
- [ ] Rotates refresh token

**POST `/api/auth/logout`**
- [ ] Returns 200 on success
- [ ] Clears cookies
- [ ] Invalidates refresh token

### Mood Endpoints

**GET `/api/mood`**
- [ ] Returns 200 with mood array
- [ ] Returns only current user's moods
- [ ] Returns 401 if not authenticated
- [ ] Supports pagination
- [ ] Supports filtering by date

**POST `/api/mood`**
- [ ] Returns 201 with created mood
- [ ] Returns 400 for invalid data
- [ ] Returns 401 if not authenticated
- [ ] Validates required fields

**PUT `/api/mood/:id`**
- [ ] Returns 200 with updated mood
- [ ] Returns 404 if mood not found
- [ ] Returns 403 if not owner
- [ ] Returns 401 if not authenticated

**DELETE `/api/mood/:id`**
- [ ] Returns 204 on success
- [ ] Returns 404 if not found
- [ ] Returns 403 if not owner
- [ ] Actually deletes from database

### Journal Endpoints

**GET `/api/journal`**
- [ ] Returns 200 with journal array
- [ ] Returns only user's journals
- [ ] Supports search query
- [ ] Supports pagination

**POST `/api/journal`**
- [ ] Returns 201 with created entry
- [ ] Validates title and content
- [ ] Sanitizes input (XSS prevention)

**PUT `/api/journal/:id`**
- [ ] Returns 200 with updated entry
- [ ] Returns 403 if not owner
- [ ] Updates `updated_at` timestamp

**DELETE `/api/journal/:id`**
- [ ] Returns 204 on success
- [ ] Returns 403 if not owner
- [ ] Soft delete or hard delete (verify)

### Wellness Assessment Endpoints

**GET `/api/assessments`**
- [ ] Returns all user's assessments
- [ ] Includes scores and dates
- [ ] Sorted by date descending

**POST `/api/assessments`**
- [ ] Creates new assessment
- [ ] Validates all answers
- [ ] Calculates score server-side
- [ ] Returns results

**GET `/api/assessments/:id`**
- [ ] Returns specific assessment
- [ ] Returns 404 if not found
- [ ] Returns 403 if not owner

### Anonymous Vent Endpoints

**GET `/api/vents`**
- [ ] Returns all vents (paginated)
- [ ] No user information in response
- [ ] Supports filtering

**POST `/api/vents`**
- [ ] Creates anonymous vent
- [ ] Strips identifying information
- [ ] Returns 201 with post ID

**DELETE `/api/vents/:id`**
- [ ] Allows deletion of own vent only
- [ ] Returns 403 for others' vents
- [ ] Returns 404 if not found

### Therapist Endpoints

**GET `/api/therapists`**
- [ ] Returns all therapists
- [ ] Supports filtering
- [ ] Supports search
- [ ] Returns public information only

**GET `/api/therapists/:id`**
- [ ] Returns specific therapist details
- [ ] Returns 404 if not found

### Appointment Endpoints

**POST `/api/appointments`**
- [ ] Creates appointment
- [ ] Validates date/time
- [ ] Checks therapist availability
- [ ] Returns 409 if time slot taken

**GET `/api/appointments`**
- [ ] Returns user's appointments
- [ ] Includes therapist details
- [ ] Sorted by date

**DELETE `/api/appointments/:id`**
- [ ] Cancels appointment
- [ ] Returns 403 if not owner
- [ ] Updates status, not hard delete

### Manager Dashboard Endpoints

**GET `/api/manager/team-stats`**
- [ ] Returns aggregated team data
- [ ] Returns 403 if not manager
- [ ] Data is anonymized
- [ ] No individual user info

### Error Handling Across All Endpoints
- [ ] 400 Bad Request for invalid input
- [ ] 401 Unauthorized for missing/invalid token
- [ ] 403 Forbidden for insufficient permissions
- [ ] 404 Not Found for non-existent resources
- [ ] 409 Conflict for duplicate resources
- [ ] 422 Unprocessable Entity for validation errors
- [ ] 500 Internal Server Error caught and logged
- [ ] Error messages are user-friendly
- [ ] Stack traces not exposed in production

### Input Validation
- [ ] Email format validated
- [ ] Password strength enforced
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (input sanitization)
- [ ] Max length limits enforced
- [ ] Required fields validated
- [ ] Type checking (string, number, date)

### Rate Limiting (if implemented)
- [ ] Too many requests return 429
- [ ] Rate limit headers present
- [ ] Different limits for different endpoints
- [ ] Authenticated users have higher limits

---

## 9️⃣ ERROR HANDLING TEST

### 404 - Not Found
- [ ] Navigate to non-existent route (e.g., `/fake-page`)
- [ ] Custom 404 page displays
- [ ] Page has navigation back to home
- [ ] API 404s return proper JSON:
  ```json
  {
    "error": "Not Found",
    "message": "Resource not found",
    "statusCode": 404
  }
  ```

### 500 - Server Error
- [ ] Force a server error (e.g., database connection failure)
- [ ] 500 error page displays
- [ ] Error logged on backend
- [ ] User-friendly message (no stack trace)
- [ ] "Try again" or "Contact support" option

### Form Validation Errors
- [ ] Empty required field shows error
- [ ] Invalid email shows specific error
- [ ] Password mismatch shows clear message
- [ ] Errors appear near relevant fields
- [ ] Errors clear when corrected
- [ ] Submit button disabled until valid

### Network Errors
- [ ] Stop backend server
- [ ] Try to make API call from frontend
- [ ] Error message displays: "Unable to connect to server"
- [ ] Retry button available
- [ ] App doesn't crash
- [ ] Console logs error appropriately

### Loading States
- [ ] Loading spinner shows during API calls
- [ ] Skeleton loaders for content (if implemented)
- [ ] Button shows "Loading..." when submitting
- [ ] Submit button disabled during submission
- [ ] Loading doesn't last forever (timeout)

### Empty States
- [ ] Empty mood history shows: "No mood entries yet. Track your first mood!"
- [ ] Empty journal shows: "Start writing your first journal entry"
- [ ] No search results shows: "No results found. Try different keywords."
- [ ] Empty therapist list shows appropriate message
- [ ] Empty states have call-to-action buttons

---

## 🔟 SECURITY TEST

### CORS Configuration
- [ ] Frontend origin allowed in backend CORS config
- [ ] Other origins blocked
- [ ] Credentials (cookies) allowed
- [ ] Preflight requests handled (OPTIONS)

**Test:**
```bash
curl -H "Origin: http://malicious-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  http://localhost:5000/api/auth/login
```
- [ ] Request denied or no CORS headers returned

### SQL Injection Protection
- [ ] Try SQL injection in login: `admin' OR '1'='1`
- [ ] Try injection in search: `'; DROP TABLE users; --`
- [ ] Parameterized queries used everywhere
- [ ] ORM/query builder prevents injection (Drizzle)

**Test:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "' OR '1'='1"
  }'
```
- [ ] Login fails (not successful)
- [ ] No SQL error messages exposed

### XSS Protection
- [ ] Try XSS in journal entry: `<script>alert('XSS')</script>`
- [ ] Try XSS in mood notes: `<img src=x onerror=alert('XSS')>`
- [ ] Input sanitized on backend
- [ ] Content escaped when rendered
- [ ] No JavaScript executed from user input

**Test:**
```bash
curl -X POST http://localhost:5000/api/journal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test",
    "content": "<script>alert(\"XSS\")</script>"
  }'
```
- [ ] Script tags stripped or escaped
- [ ] Content displays as text, not executed

### CSRF Protection (if using session-based auth)
- [ ] CSRF token required for state-changing operations
- [ ] Token validated on backend
- [ ] Token expires appropriately
- [ ] Cross-origin requests blocked

### Sensitive Data Protection
- [ ] Passwords never returned in API responses
- [ ] User passwords hashed in database (bcrypt)
- [ ] JWT secrets not in client-side code
- [ ] Environment variables not exposed to client
- [ ] API keys not in frontend bundle

**Test:**
```bash
# Check compiled frontend bundle
grep -r "JWT_SECRET" frontend/dist/
grep -r "DATABASE_URL" frontend/dist/
```
- [ ] No secrets found in frontend bundle

### Environment Variables Security
- [ ] `.env` file in `.gitignore`
- [ ] `.env.example` has placeholder values only
- [ ] Production secrets not committed to repo
- [ ] Environment variables loaded correctly
- [ ] Missing required env vars cause startup failure

### HTTPS Enforcement (Production)
- [ ] Production uses HTTPS
- [ ] HTTP redirects to HTTPS
- [ ] Cookies have `Secure` flag in production
- [ ] HSTS header set (if applicable)

### Authentication Token Security
- [ ] JWT tokens have reasonable expiration (15 min)
- [ ] Refresh tokens expire (7 days)
- [ ] Tokens use strong secret (32+ characters)
- [ ] Tokens stored in httpOnly cookies (not localStorage)
- [ ] Old tokens invalidated on logout

### Authorization Checks
- [ ] User can only access own data
- [ ] Manager cannot access individual user details
- [ ] Admin routes require admin role
- [ ] Authorization checked on every request
- [ ] Cannot bypass via API manipulation

### Password Security
- [ ] Minimum length enforced (8+ characters)
- [ ] Complexity requirements (if implemented)
- [ ] Passwords hashed with bcrypt
- [ ] Salt rounds sufficient (10+ rounds)
- [ ] Password reset requires email verification

---

## 📊 TEST COMPLETION SUMMARY

### Overall Progress
**Tests Completed:** ___ / 300+  
**Pass Rate:** ____%  
**Critical Failures:** ___  
**High Priority Failures:** ___  
**Medium Priority Failures:** ___  
**Low Priority Failures:** ___

### Test Categories Status
- [ ] Local Environment Setup: ___/30
- [ ] Database & Migrations: ___/25
- [ ] Authentication Flow: ___/35
- [ ] Core Features (Individual): ___/40
- [ ] Manager Dashboard: ___/15
- [ ] Anonymous Venting: ___/15
- [ ] Therapist Directory: ___/20
- [ ] API Endpoints: ___/50
- [ ] Error Handling: ___/20
- [ ] Security: ___/30

---

## 🐛 TEST FAILURES LOG

**Instructions:** For each failed test, fill in the table below.

| # | Feature/Endpoint | Expected Behavior | Actual Behavior | Error Message | Priority | Status |
|---|------------------|-------------------|-----------------|---------------|----------|--------|
| 1 | | | | | Critical/High/Med/Low | Open/Fixed |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |
| 6 | | | | | | |
| 7 | | | | | | |
| 8 | | | | | | |
| 9 | | | | | | |
| 10 | | | | | | |

**Add more rows as needed**

---

## 🔄 RETEST TRACKING

After fixes are applied, retest failed items:

| Failure # | Retest Date | Retest Result | Notes |
|-----------|-------------|---------------|-------|
| | | Pass/Fail | |
| | | | |
| | | | |

---

## 📝 NOTES & OBSERVATIONS

**Testing Environment:**
- OS: _______________
- Node Version: _______________
- Browser: _______________
- Database: _______________

**Performance Notes:**
- Average API response time: _______
- Page load times: _______
- Any slow queries: _______

**Usability Observations:**
- User experience issues: _______________________________________________
- UI/UX improvements needed: _______________________________________________
- Accessibility concerns: _______________________________________________

**Additional Comments:**
___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________

---

## ✅ SIGN-OFF

**Tester Name:** _____________________  
**Date:** _____________________  
**Overall Assessment:** Pass / Conditional Pass / Fail  
**Ready for Production:** Yes / No / With Fixes  

**Signature:** _____________________

---

## 📚 RELATED DOCUMENTS

- [README.md](./README.md) - Setup instructions
- [API.md](./API.md) - API documentation
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment steps
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development guidelines

---

**Version:** 1.0  
**Last Updated:** November 10, 2025  
**Maintained by:** Development Team
