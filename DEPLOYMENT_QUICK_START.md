# Deployment Quick Start Guide

**Get your MindfulMe app deployed to production in under 30 minutes**

---

## Prerequisites

- ✅ Code builds successfully locally
- ✅ GitHub/GitLab repository with code
- ✅ Render.com account (free tier OK)
- ✅ 30 minutes of focused time

---

## Step 1: Pre-Deployment Validation (5 minutes)

Run the automated validation script:

```bash
./scripts/predeploy.sh
```

This checks:
- ✅ Git status and branch
- ✅ All required files present
- ✅ Dependencies installed
- ✅ Builds complete successfully
- ✅ No security vulnerabilities
- ✅ Configuration files valid

**Expected Output:** "READY FOR PRODUCTION DEPLOYMENT" ✅

If you see errors, fix them before proceeding.

---

## Step 2: Deploy to Render (10 minutes)

### Option A: Deploy via Blueprint (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "chore: prepare for production deployment"
   git push origin main
   ```

2. **Connect to Render:**
   - Go to https://dashboard.render.com
   - Click **"New" → "Blueprint"**
   - Select your repository
   - Grant Render access

3. **Apply Blueprint:**
   - Render detects `render.yaml` automatically
   - Review services (Backend, Frontend, Database)
   - Click **"Apply"**

4. **Wait for Deployment:**
   - Backend: ~8 minutes (installing deps, building, migrations)
   - Frontend: ~5 minutes (installing deps, building)
   - Database: ~2 minutes (provisioning)
   - **Total: ~10 minutes**

### Option B: Manual Service Creation

If Blueprint doesn't work, create services manually:

1. **Create Database:**
   - New → PostgreSQL
   - Name: `mindfulme-postgres`
   - Plan: Free
   - Region: Oregon
   - Click Create

2. **Create Backend:**
   - New → Web Service
   - Connect repository
   - Name: `mindfulme-backend`
   - Branch: `main`
   - Build: `npm install && npm run build:shared && npm run build -w backend`
   - Start: `npm run start:prod -w backend`
   - Plan: Free
   - Add Environment Variables (see Step 3)

3. **Create Frontend:**
   - New → Static Site
   - Connect repository
   - Name: `mindfulme-frontend`
   - Branch: `main`
   - Build: `npm install && npm run build:shared && npm run build -w frontend`
   - Publish: `frontend/dist`
   - Add Environment Variables (see Step 3)

---

## Step 3: Configure Environment Variables (5 minutes)

### Backend Service

Go to **Backend → Environment** and verify/add:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Should be auto-set |
| `DATABASE_URL` | Auto-generated | From database |
| `JWT_SECRET` | Auto-generated | Check it exists |
| `JWT_REFRESH_SECRET` | Auto-generated | Check it exists |
| `COOKIE_SECRET` | Auto-generated | Check it exists |
| `USE_SQLITE` | `false` | **CRITICAL** |
| `CORS_ORIGIN` | `https://mindfulme-frontend.onrender.com` | Update after frontend deploys |

**After Frontend Deploys:**
- Note frontend URL (e.g., `https://mindfulme-frontend.onrender.com`)
- Update `CORS_ORIGIN` to match frontend URL **exactly**
- Trigger manual redeploy of backend

### Frontend Service

Go to **Frontend → Environment** and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_URL` | `https://mindfulme-backend.onrender.com` | Update with actual backend URL |
| `VITE_NODE_ENV` | `production` | Build setting |
| `VITE_APP_NAME` | `MindfulMe` | Application name |

**After Backend Deploys:**
- Note backend URL (e.g., `https://mindfulme-backend.onrender.com`)
- Update `VITE_API_URL` to match backend URL
- Trigger manual redeploy of frontend

---

## Step 4: Verify Deployment (5 minutes)

Run the automated verification script:

```bash
./scripts/postdeploy.sh https://your-backend-url.onrender.com https://your-frontend-url.onrender.com
```

This checks:
- ✅ Backend health endpoint
- ✅ Frontend accessibility
- ✅ SSL certificates
- ✅ CORS configuration
- ✅ Security headers
- ✅ API endpoints
- ✅ Database connection
- ✅ Response times

**Expected Output:** "DEPLOYMENT VERIFICATION SUCCESSFUL" ✅

---

## Step 5: Manual Testing (5 minutes)

Open your frontend URL and test:

1. **Homepage loads** ✅
2. **Register new account** ✅
3. **Login with credentials** ✅
4. **Navigate to dashboard** ✅
5. **Create journal entry** ✅
6. **Check browser console** (no errors) ✅

If everything works, **you're live!** 🎉

---

## Troubleshooting

### Backend Health Check Fails

**Symptom:** `/health` endpoint returns error or 500

**Fixes:**
1. Check `DATABASE_URL` is set (Backend → Environment)
2. Set `USE_SQLITE=false` (Backend → Environment)
3. Check logs: Backend → Logs tab
4. Verify database is "Available" (Database service status)

### Frontend Shows Blank Page

**Symptom:** White screen, console errors

**Fixes:**
1. Check build logs: Frontend → Logs tab
2. Verify `VITE_API_URL` is set correctly
3. Check for 404 errors in Network tab
4. Verify static files published to `frontend/dist`

### CORS Errors

**Symptom:** "blocked by CORS policy" in console

**Fixes:**
1. Update `CORS_ORIGIN` in backend to **exact** frontend URL
2. Include `https://` protocol
3. No trailing slash
4. Redeploy backend after changing
5. Hard refresh frontend (Ctrl+Shift+R)

### Database Connection Fails

**Symptom:** "Connection terminated" or "ECONNREFUSED"

**Fixes:**
1. Check database status (should be "Available")
2. Verify `DATABASE_URL` in backend env vars
3. Check database logs for errors
4. Verify database and backend in same region

### Slow Response Times (Cold Start)

**Symptom:** First request takes 30-60 seconds

**Explanation:** Free tier services sleep after 15 minutes of inactivity

**Solutions:**
- Wait for service to wake up (normal behavior)
- Upgrade to paid plan for always-on service
- Accept cold start (most users only notice on first visit)

---

## Common Post-Deployment Tasks

### Update URLs After First Deploy

1. Note actual URLs from Render dashboard:
   - Backend: `https://mindfulme-backend.onrender.com`
   - Frontend: `https://mindfulme-frontend.onrender.com`

2. Update `render.yaml` (for future reference):
   - Line 45: `CORS_ORIGIN`
   - Line 123: `VITE_API_URL`
   - Line 201: Content-Security-Policy `connect-src`

3. Update environment variables in Render dashboard

4. Trigger manual redeploys (Backend, then Frontend)

### Add Custom Domain

1. **Backend Domain (api.yourdomain.com):**
   - Backend → Settings → Custom Domain
   - Add domain: `api.yourdomain.com`
   - Update DNS: `CNAME api → mindfulme-backend.onrender.com`
   - Wait for SSL certificate (5-60 minutes)
   - Update `CORS_ORIGIN` in backend env vars
   - Update `VITE_API_URL` in frontend env vars
   - Redeploy both services

2. **Frontend Domain (app.yourdomain.com):**
   - Frontend → Settings → Custom Domain
   - Add domain: `app.yourdomain.com`
   - Update DNS: `CNAME app → mindfulme-frontend.onrender.com`
   - Wait for SSL certificate
   - Update `CORS_ORIGIN` in backend env vars
   - Redeploy backend

### Monitor Application

**View Logs:**
```bash
# Install Render CLI
npm install -g render-cli

# Login
render login

# Tail logs
render logs --service=mindfulme-backend --tail
```

**Via Dashboard:**
- Backend → Logs (real-time errors, requests)
- Frontend → Logs (build logs only)
- Database → Logs (connection logs, slow queries)

**Set Up Alerts:**
- Service → Settings → Notifications
- Enable "Notify on deploy failures"
- Enable "Notify on service restarts"
- Add email/Slack webhook

---

## Next Steps

After successful deployment:

1. ✅ **Document URLs:** Update README with production URLs
2. ✅ **Set up monitoring:** Configure alerts in Render dashboard
3. ✅ **Test user flows:** Have team test all features
4. ✅ **Enable analytics:** Add Google Analytics (optional)
5. ✅ **Configure backups:** Upgrade database plan for automatic backups (optional)
6. ✅ **Add custom domain:** Improve branding with own domain (optional)
7. ✅ **Schedule maintenance:** Set up regular checks (weekly)

---

## Useful Commands

```bash
# Pre-deployment validation
./scripts/predeploy.sh

# Post-deployment verification
./scripts/postdeploy.sh https://backend-url https://frontend-url

# Test API endpoints
./scripts/test-api-endpoints.sh https://backend-url

# Check backend health
curl https://your-backend-url.onrender.com/health

# View service logs
render logs --service=mindfulme-backend --tail

# List all services
render services list

# Trigger manual deploy
render services deploy --service=mindfulme-backend
```

---

## Emergency Rollback

If deployment goes wrong:

1. **Go to Service → Deploys tab**
2. **Find last successful deployment** (green checkmark)
3. **Click three dots (⋮) → "Redeploy"**
4. **Confirm rollback**
5. **Wait 3-5 minutes for redeployment**
6. **Verify health endpoint**

See `RENDER_DEPLOYMENT_CHECKLIST.md` for detailed rollback procedures.

---

## Support Resources

- **Render Documentation:** https://render.com/docs
- **Render Status:** https://status.render.com
- **MindfulMe Docs:** See `RENDER_DEPLOYMENT_CHECKLIST.md` for detailed guide
- **API Reference:** See `API.md`
- **Architecture:** See `ARCHITECTURE.md`

---

## Success Checklist

Your deployment is successful when:

- [x] ✅ Backend returns 200 on `/health`
- [x] ✅ Frontend loads without errors
- [x] ✅ User can register and login
- [x] ✅ CORS allows frontend → backend requests
- [x] ✅ HTTPS enabled on both services
- [x] ✅ Database connected (PostgreSQL)
- [x] ✅ Security headers present
- [x] ✅ No console errors in browser
- [x] ✅ All critical user flows work
- [x] ✅ Response times under 3 seconds

---

**Congratulations! Your MindfulMe app is live in production!** 🎉

For ongoing maintenance and advanced configurations, see:
- `RENDER_DEPLOYMENT_CHECKLIST.md` - Complete deployment guide
- `PRODUCTION_READINESS_REPORT.md` - Production optimization recommendations
- `TESTING_CHECKLIST.md` - Comprehensive testing procedures

---

**Last Updated:** November 11, 2025  
**Version:** 1.0.0
