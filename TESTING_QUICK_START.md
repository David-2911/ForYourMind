# 🚀 Quick Testing Guide

This is a condensed version of the comprehensive [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md). Use this for quick verification.

---

## ⚡ Quick Start (5 Minutes)

### 1. Environment Setup
```bash
# Clone and setup
git clone https://github.com/David-2911/ForYourMind.git
cd ForYourMind
cp .env.example .env
npm install

# Edit .env - set these at minimum:
# JWT_SECRET=your-secret-32-chars-minimum-please-change
# COOKIE_SECRET=your-cookie-secret-32-chars-min
# USE_SQLITE=true
```

### 2. Start Services
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend

# Verify:
# Backend: http://localhost:5000/health
# Frontend: http://localhost:5173
```

### 3. Quick Smoke Test
```bash
# Run automated API tests
./scripts/test-api-endpoints.sh
```

---

## ✅ Critical Path Test (15 Minutes)

Test the most important user flows:

### 1. User Registration & Login
- [ ] Open http://localhost:5173
- [ ] Click "Sign Up"
- [ ] Register: `test@example.com` / `TestPass123!`
- [ ] Verify redirect to dashboard
- [ ] Logout
- [ ] Login with same credentials
- [ ] Verify dashboard loads

### 2. Mood Tracking
- [ ] Click "Track Mood"
- [ ] Select a mood (Happy, Sad, etc.)
- [ ] Rate intensity (1-10)
- [ ] Add notes
- [ ] Save
- [ ] Verify entry appears in history

### 3. Journal Entry
- [ ] Navigate to Journal
- [ ] Create new entry
- [ ] Add title and content
- [ ] Save
- [ ] Verify entry appears in list
- [ ] Edit the entry
- [ ] Delete the entry

### 4. API Health
```bash
curl http://localhost:5000/health
# Should return: {"status":"ok",...}

curl http://localhost:5000/healthz
# Should return: OK

curl http://localhost:5000/ready
# Should return: {"ready":true}
```

---

## 🔍 Common Issues Checklist

### Backend Won't Start
- [ ] Check `.env` file exists with all required variables
- [ ] Check port 5000 is not already in use: `lsof -i :5000`
- [ ] Check database connection (SQLite file created or Postgres accessible)
- [ ] Check logs for error messages

### Frontend Won't Start
- [ ] Check port 5173 is available: `lsof -i :5173`
- [ ] Check `frontend/.env` has `VITE_API_URL=http://localhost:5000`
- [ ] Clear browser cache and restart
- [ ] Check browser console for errors (F12)

### Cannot Login/Register
- [ ] Check backend is running and accessible
- [ ] Check CORS configuration in backend
- [ ] Check browser Network tab (F12) for API errors
- [ ] Check backend logs for authentication errors
- [ ] Verify JWT_SECRET is set in .env

### Database Issues
- [ ] Check `backend/data/` directory exists
- [ ] Run migrations: `cd backend && npm run db:migrate`
- [ ] Check Drizzle Studio: `cd backend && npm run db:studio`
- [ ] Verify table structure in database

---

## 🧪 Automated Testing

### Run All API Tests
```bash
./scripts/test-api-endpoints.sh
```

### Run Specific Tests
```bash
# Just health checks
curl http://localhost:5000/health | jq '.'

# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","name":"Test","role":"individual"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
```

---

## 📊 Test Priority Matrix

### 🔴 CRITICAL (Test First)
- [ ] Backend starts successfully
- [ ] Frontend starts successfully
- [ ] User can register
- [ ] User can login
- [ ] Protected routes require authentication
- [ ] Database migrations run

### 🟡 HIGH (Test Second)
- [ ] Mood tracking CRUD operations
- [ ] Journal CRUD operations
- [ ] User profile management
- [ ] Password reset flow
- [ ] API error handling
- [ ] CORS configuration

### 🟢 MEDIUM (Test Third)
- [ ] Wellness assessments
- [ ] Anonymous venting
- [ ] Therapist directory
- [ ] Manager dashboard
- [ ] Search and filtering
- [ ] Data visualization

### 🔵 LOW (Test Last)
- [ ] UI polish and animations
- [ ] Email notifications
- [ ] Advanced filtering
- [ ] Export functionality
- [ ] Mobile responsiveness

---

## 🐛 Quick Debugging Commands

```bash
# Check if services are running
ps aux | grep node

# Check ports in use
lsof -i :5000  # Backend
lsof -i :5173  # Frontend

# View backend logs
tail -f backend/server.log

# Check database
cd backend && npm run db:studio

# Test database connection
node -e "console.log(require('fs').existsSync('./backend/data/db.sqlite') ? 'SQLite DB exists' : 'DB missing')"

# Check environment variables
cd backend && node -e "require('dotenv').config(); console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Missing')"

# Test API with authentication
TOKEN="your-jwt-token-here"
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/mood

# Clear all node_modules and reinstall
rm -rf node_modules backend/node_modules frontend/node_modules shared/node_modules
npm install
```

---

## 📋 Before Deployment Checklist

- [ ] All critical tests pass
- [ ] No console errors in browser
- [ ] No critical warnings in backend logs
- [ ] Database migrations tested
- [ ] Environment variables documented
- [ ] CORS configured for production domain
- [ ] JWT secrets are strong (32+ characters)
- [ ] Passwords hashed in database
- [ ] HTTPS configured (production)
- [ ] Error pages working (404, 500)
- [ ] Health endpoints responding

---

## 📚 Full Documentation

For comprehensive testing, see:
- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - Complete testing guide (300+ checks)
- **[API.md](./API.md)** - API documentation
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[README.md](./README.md)** - General setup and usage

---

## 🆘 Getting Help

**If tests fail:**
1. Check the error message in terminal
2. Check browser console (F12)
3. Check backend logs
4. Review [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) for detailed troubleshooting
5. Check GitHub Issues: https://github.com/David-2911/ForYourMind/issues

**Common Error Solutions:**
- `EADDRINUSE` → Port already in use, kill process or change port
- `Cannot find module` → Run `npm install` again
- `Database connection failed` → Check DATABASE_URL or USE_SQLITE
- `CORS error` → Check CORS_ORIGIN in backend .env
- `401 Unauthorized` → Check JWT token and authentication

---

**Last Updated:** November 10, 2025  
**Version:** 1.0
