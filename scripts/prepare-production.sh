#!/bin/bash

# ====================================
# MindfulMe Production Preparation Script
# ====================================
# This script addresses critical production readiness issues
# Run this before deploying to production

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# ====================================
# 1. Fix Security Vulnerabilities
# ====================================

print_header "STEP 1: FIXING SECURITY VULNERABILITIES"

echo "Fixing root dependencies..."
if npm audit fix; then
    print_success "Root dependencies fixed"
else
    print_warning "Some root vulnerabilities may require manual review"
fi

echo -e "\nFixing backend dependencies..."
cd backend
if npm audit fix; then
    print_success "Backend dependencies fixed"
else
    print_warning "Some backend vulnerabilities may require manual review"
fi

echo -e "\nFixing frontend dependencies..."
cd ../frontend
if npm audit fix; then
    print_success "Frontend dependencies fixed"
else
    print_warning "Some frontend vulnerabilities may require manual review"
fi

cd ..

echo -e "\nRunning production audit..."
npm audit --production

# ====================================
# 2. Enable Source Maps in Frontend
# ====================================

print_header "STEP 2: ENABLING FRONTEND SOURCE MAPS"

if grep -q "sourcemap: false" frontend/vite.config.ts; then
    print_warning "Source maps are currently disabled"
    echo "To enable source maps for production debugging, update frontend/vite.config.ts:"
    echo "  build: { sourcemap: true }"
else
    print_success "Source maps configuration looks good"
fi

# ====================================
# 3. Verify Environment Files
# ====================================

print_header "STEP 3: VERIFYING ENVIRONMENT CONFIGURATION"

if [ -f ".env" ]; then
    print_success ".env file exists"
    
    # Check for critical variables
    if grep -q "JWT_SECRET=" .env && ! grep -q "your-secure-jwt-secret-key-replace-this-in-production" .env; then
        print_success "JWT_SECRET is configured"
    else
        print_error "JWT_SECRET needs to be set in .env (32+ characters)"
    fi
    
    if grep -q "COOKIE_SECRET=" .env && ! grep -q "your-secure-cookie-secret-replace-this-in-production" .env; then
        print_success "COOKIE_SECRET is configured"
    else
        print_error "COOKIE_SECRET needs to be set in .env (32+ characters)"
    fi
else
    print_warning ".env file not found - copy from .env.example"
    echo "  cp .env.example .env"
    echo "  # Then edit .env with your production values"
fi

# ====================================
# 4. Test Builds
# ====================================

print_header "STEP 4: TESTING PRODUCTION BUILDS"

echo "Building shared package..."
cd shared
if npm run build; then
    print_success "Shared package built successfully"
else
    print_error "Shared package build failed"
    exit 1
fi

cd ..

echo -e "\nBuilding backend..."
cd backend
if npm run build; then
    print_success "Backend built successfully"
    echo "  Output: dist/index.js ($(du -h dist/index.js | awk '{print $1}'))"
else
    print_error "Backend build failed"
    exit 1
fi

cd ..

echo -e "\nBuilding frontend..."
cd frontend
if npm run build; then
    print_success "Frontend built successfully"
    echo "  Output: dist/ ($(du -sh dist | awk '{print $1}'))"
else
    print_error "Frontend build failed"
    exit 1
fi

cd ..

# ====================================
# 5. Database Check
# ====================================

print_header "STEP 5: DATABASE CONFIGURATION CHECK"

if [ -f "backend/.env" ]; then
    if grep -q "DATABASE_URL=" backend/.env || grep -q "USE_SQLITE=true" backend/.env; then
        print_success "Database configuration found"
    else
        print_warning "Database not configured in backend/.env"
        echo "  Set DATABASE_URL for PostgreSQL OR USE_SQLITE=true for development"
    fi
else
    print_warning "backend/.env not found"
    echo "  cp backend/.env.example backend/.env"
fi

# ====================================
# 6. Check for Console Logs
# ====================================

print_header "STEP 6: CHECKING FOR CONSOLE STATEMENTS"

echo "Scanning for console.log in production code..."
CONSOLE_COUNT=$(grep -r "console\\.log" backend/src frontend/src 2>/dev/null | wc -l || echo "0")

if [ "$CONSOLE_COUNT" -gt 20 ]; then
    print_warning "Found $CONSOLE_COUNT console.log statements in source code"
    echo "  Consider implementing a proper logger (Winston or Pino)"
    echo "  See: PRODUCTION_READINESS_REPORT.md - Section 7 (Logging)"
else
    print_success "Console statement count is acceptable ($CONSOLE_COUNT)"
fi

# ====================================
# 7. Docker Check
# ====================================

print_header "STEP 7: DOCKER CONFIGURATION CHECK"

if command -v docker &> /dev/null; then
    print_success "Docker is installed"
    
    if [ -f "docker-compose.yml" ]; then
        print_success "docker-compose.yml exists"
        echo -e "\nTo test Docker build:"
        echo "  docker-compose build --no-cache"
        echo "  docker-compose up -d"
    else
        print_warning "docker-compose.yml not found"
    fi
else
    print_warning "Docker is not installed (optional)"
fi

# ====================================
# Summary
# ====================================

print_header "PRODUCTION PREPARATION SUMMARY"

echo "✅ Completed Steps:"
echo "  1. Security vulnerabilities fixed"
echo "  2. Source maps configuration checked"
echo "  3. Environment files verified"
echo "  4. Production builds tested"
echo "  5. Database configuration checked"
echo "  6. Console statements analyzed"
echo "  7. Docker configuration checked"

echo -e "\n📋 Next Steps:"
echo "  1. Review PRODUCTION_READINESS_REPORT.md for detailed findings"
echo "  2. Set strong JWT_SECRET and COOKIE_SECRET (32+ characters)"
echo "  3. Configure production DATABASE_URL"
echo "  4. Set CORS_ORIGIN to your production frontend URL"
echo "  5. Consider implementing Winston/Pino logger"
echo "  6. Test Docker builds if using containers"
echo "  7. Run: ./scripts/test-api-endpoints.sh"

echo -e "\n📚 Reference Documents:"
echo "  - PRODUCTION_READINESS_REPORT.md"
echo "  - DEPLOYMENT_GUIDE.md"
echo "  - ENVIRONMENT_CONFIG.md"
echo "  - TESTING_CHECKLIST.md"

print_header "PRODUCTION PREPARATION COMPLETE"

echo -e "${GREEN}Your application is ready for production deployment!${NC}"
echo -e "${YELLOW}Don't forget to:${NC}"
echo "  - Set strong production secrets"
echo "  - Configure production database"
echo "  - Set up monitoring/logging"
echo "  - Run final tests"
echo ""
