# Deployment Guide

Complete guide for building and deploying the MindfulMe application to various platforms.

---

## Table of Contents

1. [Build Process Overview](#build-process-overview)
2. [Local Production Build](#local-production-build)
3. [Docker Deployment](#docker-deployment)
4. [Render.com Deployment](#rendercom-deployment)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Health Checks](#health-checks)
7. [Troubleshooting](#troubleshooting)

---

## Build Process Overview

### Build Order

The monorepo requires a **specific build order** due to dependencies:

```
1. shared/     → Build types, schemas, constants
2. backend/    → Build API server (depends on shared)
3. frontend/   → Build React app (depends on shared)
```

### Build Scripts

```bash
# Full production build (all packages)
npm run build

# Individual package builds
npm run build:shared    # Build shared package first
npm run build:backend   # Build backend (requires shared)
npm run build:frontend  # Build frontend (requires shared)

# Clean and rebuild everything
npm run clean && npm run build
```

### Build Outputs

| Package | Output Directory | Size (approx) | Contents |
|---------|------------------|---------------|----------|
| `shared` | `shared/dist/` | ~50KB | Compiled TypeScript (JS + .d.ts) |
| `backend` | `backend/dist/` | ~90KB | Bundled Express server (ESM) |
| `frontend` | `frontend/dist/` | ~480KB | Optimized React SPA |

---

## Local Production Build

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- All dependencies installed

### Step-by-Step

#### 1. Install Dependencies

```bash
npm install
```

This automatically builds the shared package via `postinstall`.

#### 2. Run Type Checks

```bash
npm run check
```

Validates TypeScript in all packages.

#### 3. Build All Packages

```bash
npm run build
```

**Or use the automated script**:

```bash
./scripts/build-production.sh
```

This script:
- ✅ Checks Node.js version
- ✅ Cleans previous builds
- ✅ Installs dependencies
- ✅ Builds all packages in order
- ✅ Runs type checks
- ✅ Runs tests (if available)
- ✅ Shows build summary

#### 4. Test Production Build Locally

**Backend**:
```bash
cd backend
NODE_ENV=production node dist/index.js
```

**Frontend** (preview):
```bash
cd frontend
npm run preview
# Opens at http://localhost:4173
```

---

## Docker Deployment

### Prerequisites

- Docker installed and running
- Docker Compose (for multi-container setup)

### Development Environment

Use `docker-compose.yml` for local development with hot reload:

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Services**:
- `postgres` - PostgreSQL database (port 5432)
- `backend` - Backend API with hot reload (port 5000)
- `frontend` - Frontend with Vite HMR (port 5173)
- `drizzle-studio` - Database GUI (port 4983)

**Access**:
- Backend: http://localhost:5000
- Frontend: http://localhost:5173
- Drizzle Studio: http://localhost:4983

### Production Environment

Use `docker-compose.prod.yml` for production deployment:

#### 1. Create Environment File

```bash
# Create .env.prod file
cat > .env.prod << EOF
# PostgreSQL
POSTGRES_USER=mindfulme
POSTGRES_PASSWORD=$(openssl rand -base64 32)
POSTGRES_DB=mindfulme_prod

# Backend
JWT_SECRET=$(openssl rand -hex 32)
COOKIE_SECRET=$(openssl rand -hex 32)
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=error

# Frontend
VITE_API_URL=https://api.yourdomain.com
VITE_APP_VERSION=1.0.0
EOF
```

#### 2. Build Images

```bash
# Build all images
./scripts/docker-build.sh

# Or build individually
./scripts/docker-build.sh --backend-only
./scripts/docker-build.sh --frontend-only

# Build with custom tag
./scripts/docker-build.sh --tag v1.0.0
```

#### 3. Start Production Stack

```bash
# Start with environment file
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check status
docker-compose -f docker-compose.prod.yml ps
```

#### 4. Run Migrations

```bash
# Execute migrations in backend container
docker-compose -f docker-compose.prod.yml exec backend npm run migrate
```

#### 5. Health Check

```bash
# Check backend health
curl http://localhost:5000/health

# Check frontend health
curl http://localhost:80/health
```

### Docker Commands Reference

```bash
# Build images
docker-compose build

# Rebuild without cache
docker-compose build --no-cache

# Start services
docker-compose up -d

# Stop services
docker-compose down

# Remove volumes (⚠️ deletes data!)
docker-compose down -v

# View logs
docker-compose logs -f [service-name]

# Execute command in container
docker-compose exec backend sh

# Scale services (paid Docker Swarm/K8s)
docker-compose up -d --scale backend=3
```

---

## Render.com Deployment

### Prerequisites

- Render.com account
- GitHub repository connected to Render
- `render.yaml` in repository root

### Automatic Deployment

Render automatically deploys from `render.yaml`:

#### 1. Push render.yaml to Repository

```bash
git add render.yaml
git commit -m "Add Render deployment configuration"
git push origin main
```

#### 2. Connect Repository in Render

1. Go to https://dashboard.render.com
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Select `ForYourMind` repository
5. Render detects `render.yaml` automatically

#### 3. Review Services

Render creates:
- ✅ `mindfulme-backend` (Web Service)
- ✅ `mindfulme-frontend` (Static Site)
- ✅ `mindfulme-postgres` (PostgreSQL Database)

#### 4. Configure Environment Variables

**Backend** (auto-generated in render.yaml):
- `JWT_SECRET` - Auto-generated
- `COOKIE_SECRET` - Auto-generated
- `DATABASE_URL` - Auto-linked from database
- `CORS_ORIGIN` - **Update manually** with frontend URL

**Frontend**:
- `VITE_API_URL` - **Update manually** with backend URL

**To update**:
1. Go to service dashboard
2. Click "Environment"
3. Update variables
4. Save (triggers redeploy)

#### 5. Update URLs

After first deployment, update these variables:

**Backend `CORS_ORIGIN`**:
```
https://mindfulme-frontend.onrender.com
# Or your custom domain
```

**Frontend `VITE_API_URL`**:
```
https://mindfulme-backend.onrender.com
# Or your custom backend domain
```

#### 6. Run Migrations

Migrations run automatically during backend build (if added to buildCommand):

```yaml
buildCommand: npm install && npm run build:shared && npm run build -w backend && npm run db:migrate -w backend
```

Or run manually:
1. Go to backend service → Shell
2. Run: `npm run migrate`

### Manual Deployment

If not using `render.yaml`:

#### Backend Service

1. **New Web Service**
   - Name: `mindfulme-backend`
   - Runtime: Node
   - Build Command: `npm install && npm run build:shared && npm run build -w backend`
   - Start Command: `npm run start:prod -w backend`
   - Plan: Free (or higher)

2. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=[from database]
   JWT_SECRET=[generate]
   COOKIE_SECRET=[generate]
   CORS_ORIGIN=[frontend URL]
   ```

#### Frontend Static Site

1. **New Static Site**
   - Name: `mindfulme-frontend`
   - Build Command: `npm install && npm run build:shared && npm run build -w frontend`
   - Publish Directory: `frontend/dist`

2. **Environment Variables**:
   ```
   VITE_API_URL=[backend URL]
   VITE_NODE_ENV=production
   ```

#### PostgreSQL Database

1. **New PostgreSQL**
   - Name: `mindfulme-postgres`
   - Database: `mindfulme_prod`
   - User: `mindfulme`
   - Plan: Free (or higher)

2. **Link to Backend**:
   - Copy connection string
   - Add to backend `DATABASE_URL`

### Custom Domains

#### Add Custom Domain

1. Go to service settings
2. Click "Custom Domains"
3. Add your domain: `app.yourdomain.com`
4. Update DNS records (Render provides instructions)

#### Update Environment Variables

After adding custom domains:

**Backend**:
```bash
CORS_ORIGIN=https://app.yourdomain.com
```

**Frontend**:
```bash
VITE_API_URL=https://api.yourdomain.com
```

### Monitoring on Render

**Health Checks**:
- Automatic via `healthCheckPath: /healthz`
- Render restarts service if health check fails

**Logs**:
- View in service dashboard → Logs
- Real-time streaming
- Search and filter

**Metrics** (paid plans):
- CPU usage
- Memory usage
- Request counts
- Response times

---

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Run type checks
        run: npm run check
        
      - name: Run tests
        run: npm run test
        
      - name: Build
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Render
        # Render auto-deploys on push to main
        run: echo "Deploying to Render..."
```

### Build Verification Script

Add to your CI/CD:

```bash
# Run all checks
npm run verify

# Or individual checks
npm run check      # TypeScript
npm run test       # Tests
npm run build      # Production build
```

---

## Health Checks

### Health Check Endpoints

**Backend**:

1. **`/health`** - Detailed health information
   ```json
   {
     "status": "ok",
     "timestamp": "2024-11-09T...",
     "uptime": 123.45,
     "environment": "production",
     "database": "PostgreSQL",
     "version": "1.0.0"
   }
   ```

2. **`/healthz`** - Simple liveness probe
   ```
   OK
   ```

3. **`/ready`** - Readiness probe
   ```json
   {
     "ready": true
   }
   ```

**Frontend** (nginx):

- **`/health`** - Returns `OK`

### Check Health Locally

```bash
# Use health check script
./scripts/health-check.sh

# Or manually
curl http://localhost:5000/health
curl http://localhost:5173/health
```

### Production Health Monitoring

**Render**:
- Automatic health checks every 30s
- Restarts service on failure
- Alerts available (paid plans)

**Uptime Monitoring** (external):
- UptimeRobot (free)
- Pingdom
- StatusCake
- Better Uptime

---

## Troubleshooting

### Build Failures

**"Cannot find module '@mindfulme/shared'"**:

```bash
# Build shared package first
npm run build:shared
```

**"esbuild: command not found"**:

```bash
# Install dependencies
npm install
```

**TypeScript errors**:

```bash
# Check all packages
npm run check

# Fix and rebuild
npm run build
```

### Docker Issues

**"Cannot connect to Docker daemon"**:

```bash
# Start Docker
sudo systemctl start docker
# or Docker Desktop
```

**"Port already in use"**:

```bash
# Stop existing containers
docker-compose down

# Or change ports in docker-compose.yml
```

**"No space left on device"**:

```bash
# Clean up Docker
docker system prune -a
docker volume prune
```

### Render Deployment Issues

**Build failing**:

1. Check build logs in Render dashboard
2. Verify build command is correct
3. Ensure all dependencies in package.json
4. Check Node.js version matches (18+)

**Service not starting**:

1. Check start command
2. Verify environment variables
3. Check logs for errors
4. Ensure PORT is set to 5000 (backend)

**Database connection failed**:

1. Verify `DATABASE_URL` is set
2. Check database is running
3. Verify SSL mode: `?sslmode=require`
4. Check IP allowlist (if configured)

**CORS errors**:

1. Update `CORS_ORIGIN` with correct frontend URL
2. Ensure no trailing slash in URL
3. Verify HTTPS in production

### Performance Issues

**Backend slow**:

1. Check database queries (enable SQL logging)
2. Add database indexes
3. Implement caching (Redis)
4. Scale to higher plan

**Frontend slow**:

1. Check bundle size: `npm run build -w frontend`
2. Optimize images (compress, WebP)
3. Enable CDN (Render CDN automatic)
4. Implement code splitting

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing: `npm run test`
- [ ] Type checks passing: `npm run check`
- [ ] Production build successful: `npm run build`
- [ ] Environment variables configured
- [ ] Secrets generated (JWT, Cookie)
- [ ] Database migrations ready
- [ ] Health checks working

### Render Deployment

- [ ] `render.yaml` pushed to repository
- [ ] Services created in Render dashboard
- [ ] Environment variables set
- [ ] Custom domains added (if applicable)
- [ ] CORS_ORIGIN updated with frontend URL
- [ ] VITE_API_URL updated with backend URL
- [ ] Database connected
- [ ] Migrations run
- [ ] Health checks passing

### Post-Deployment

- [ ] Test authentication flow
- [ ] Test API endpoints
- [ ] Check error logging (Sentry)
- [ ] Monitor performance
- [ ] Set up uptime monitoring
- [ ] Configure backups (database)
- [ ] Document deployment process

---

## Quick Reference

### Build Commands

```bash
npm run build              # Build all packages
npm run build:shared       # Build shared only
npm run build:backend      # Build backend only
npm run build:frontend     # Build frontend only
npm run clean && npm run build  # Clean rebuild
```

### Docker Commands

```bash
docker-compose up -d                          # Start dev
docker-compose -f docker-compose.prod.yml up -d  # Start prod
docker-compose logs -f                        # View logs
docker-compose down                           # Stop
./scripts/docker-build.sh                     # Build images
```

### Health Check Commands

```bash
./scripts/health-check.sh                     # Run health checks
curl http://localhost:5000/health             # Backend health
curl http://localhost:5173/health             # Frontend health
```

### Render Commands

```bash
# View logs (via Render CLI)
render logs --service mindfulme-backend

# SSH into service
render shell --service mindfulme-backend

# Run migrations
render run --service mindfulme-backend "npm run migrate"
```

---

## Additional Resources

- **Render Docs**: https://render.com/docs
- **Docker Docs**: https://docs.docker.com
- **GitHub Actions**: https://docs.github.com/en/actions
- **Vite Build**: https://vitejs.dev/guide/build.html
- **esbuild**: https://esbuild.github.io

---

**Need help?** Check [README.md](./README.md) or [DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md)
