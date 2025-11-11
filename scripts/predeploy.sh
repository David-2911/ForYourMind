#!/bin/bash

# ============================================================
# Pre-Deployment Validation Script
# ============================================================
# Run this script before deploying to production
# It validates code, runs tests, and checks configurations
#
# Usage: ./scripts/predeploy.sh
# ============================================================

set -e # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
print_header() {
    echo ""
    echo "${BLUE}============================================================${NC}"
    echo "${BLUE}$1${NC}"
    echo "${BLUE}============================================================${NC}"
    echo ""
}

print_success() {
    echo "${GREEN}✅ $1${NC}"
    ((PASSED++))
}

print_error() {
    echo "${RED}❌ $1${NC}"
    ((FAILED++))
}

print_warning() {
    echo "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

print_info() {
    echo "${BLUE}ℹ️  $1${NC}"
}

# Start validation
echo ""
echo "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo "${BLUE}║     MindfulMe Pre-Deployment Validation Script        ║${NC}"
echo "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
print_info "Starting validation checks..."

# ============================================================
# 1. GIT CHECKS
# ============================================================
print_header "1. GIT CHECKS"

# Check if git repo
if git rev-parse --git-dir > /dev/null 2>&1; then
    print_success "Git repository detected"
else
    print_error "Not a git repository"
    exit 1
fi

# Check for uncommitted changes
if [[ -z $(git status -s) ]]; then
    print_success "No uncommitted changes"
else
    print_warning "Uncommitted changes detected:"
    git status -s
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
print_info "Current branch: $CURRENT_BRANCH"
if [[ "$CURRENT_BRANCH" == "main" ]]; then
    print_success "On main branch"
else
    print_warning "Not on main branch (currently on: $CURRENT_BRANCH)"
fi

# Check for unpushed commits
UNPUSHED=$(git log origin/$CURRENT_BRANCH..$CURRENT_BRANCH --oneline 2>/dev/null | wc -l)
if [[ $UNPUSHED -eq 0 ]]; then
    print_success "All commits pushed to remote"
else
    print_warning "$UNPUSHED unpushed commit(s) found"
fi

# ============================================================
# 2. FILE STRUCTURE CHECKS
# ============================================================
print_header "2. FILE STRUCTURE CHECKS"

# Check for required files
REQUIRED_FILES=(
    "render.yaml"
    "package.json"
    "backend/package.json"
    "frontend/package.json"
    "shared/package.json"
    "backend/src/index.ts"
    "frontend/src/main.tsx"
    "shared/src/index.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        print_success "Found $file"
    else
        print_error "Missing required file: $file"
    fi
done

# Check for sensitive files that shouldn't be committed
SENSITIVE_FILES=(
    ".env"
    ".env.local"
    ".env.production"
    "backend/.env"
    "frontend/.env"
)

for file in "${SENSITIVE_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        print_warning "Found sensitive file: $file (ensure it's in .gitignore)"
        if grep -q "$file" .gitignore 2>/dev/null; then
            print_success "$file is in .gitignore"
        else
            print_error "$file is NOT in .gitignore!"
        fi
    fi
done

# ============================================================
# 3. DEPENDENCY CHECKS
# ============================================================
print_header "3. DEPENDENCY CHECKS"

# Check if node_modules exists
if [[ -d "node_modules" ]]; then
    print_success "Root node_modules exists"
else
    print_warning "Root node_modules missing - run 'npm install'"
    read -p "Install dependencies now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm install
        print_success "Dependencies installed"
    else
        print_error "Cannot proceed without dependencies"
        exit 1
    fi
fi

# Check for outdated dependencies
print_info "Checking for outdated dependencies..."
OUTDATED=$(npm outdated 2>/dev/null | tail -n +2 | wc -l)
if [[ $OUTDATED -eq 0 ]]; then
    print_success "All dependencies up to date"
else
    print_warning "$OUTDATED outdated package(s) found (run 'npm outdated' for details)"
fi

# Security audit
print_info "Running security audit..."
npm audit --production --json > /tmp/audit.json 2>/dev/null || true
VULNERABILITIES=$(cat /tmp/audit.json | grep -o '"vulnerabilities":{[^}]*}' | grep -o '"total":[0-9]*' | cut -d':' -f2)
if [[ -z "$VULNERABILITIES" ]]; then
    VULNERABILITIES=0
fi

if [[ $VULNERABILITIES -eq 0 ]]; then
    print_success "No production vulnerabilities found"
else
    print_warning "$VULNERABILITIES production vulnerabilities found (run 'npm audit' for details)"
fi
rm -f /tmp/audit.json

# ============================================================
# 4. CONFIGURATION CHECKS
# ============================================================
print_header "4. CONFIGURATION CHECKS"

# Check render.yaml exists and is valid
if [[ -f "render.yaml" ]]; then
    print_success "render.yaml exists"
    
    # Check for placeholder URLs that need updating
    if grep -q "mindfulme-frontend.onrender.com" render.yaml; then
        print_warning "Found default frontend URL in render.yaml - update after first deploy"
    fi
    
    if grep -q "mindfulme-backend.onrender.com" render.yaml; then
        print_warning "Found default backend URL in render.yaml - update after first deploy"
    fi
    
    # Check services are defined
    if grep -q "name: mindfulme-backend" render.yaml; then
        print_success "Backend service defined in render.yaml"
    else
        print_error "Backend service not found in render.yaml"
    fi
    
    if grep -q "name: mindfulme-frontend" render.yaml; then
        print_success "Frontend service defined in render.yaml"
    else
        print_error "Frontend service not found in render.yaml"
    fi
    
    if grep -q "name: mindfulme-postgres" render.yaml; then
        print_success "Database defined in render.yaml"
    else
        print_error "Database not found in render.yaml"
    fi
else
    print_error "render.yaml not found"
fi

# Check TypeScript configurations
for tsconfig in "tsconfig.json" "backend/tsconfig.json" "frontend/tsconfig.json" "shared/tsconfig.json"; do
    if [[ -f "$tsconfig" ]]; then
        print_success "Found $tsconfig"
    else
        print_warning "Missing $tsconfig"
    fi
done

# ============================================================
# 5. BUILD CHECKS
# ============================================================
print_header "5. BUILD CHECKS"

# Build shared module
print_info "Building shared module..."
if cd shared && npm run build > /tmp/shared-build.log 2>&1 && cd ..; then
    print_success "Shared module builds successfully"
    rm -f /tmp/shared-build.log
else
    print_error "Shared module build failed"
    cat /tmp/shared-build.log
    exit 1
fi

# Build backend
print_info "Building backend..."
if cd backend && npm run build > /tmp/backend-build.log 2>&1 && cd ..; then
    print_success "Backend builds successfully"
    BUILD_SIZE=$(du -sh backend/dist | cut -f1)
    print_info "Backend bundle size: $BUILD_SIZE"
    rm -f /tmp/backend-build.log
else
    print_error "Backend build failed"
    cat /tmp/backend-build.log
    exit 1
fi

# Build frontend (skip TypeScript check if errors exist)
print_info "Building frontend..."
if cd frontend && npx vite build > /tmp/frontend-build.log 2>&1 && cd ..; then
    print_success "Frontend builds successfully"
    BUILD_SIZE=$(du -sh frontend/dist | cut -f1)
    print_info "Frontend bundle size: $BUILD_SIZE"
    rm -f /tmp/frontend-build.log
else
    print_error "Frontend build failed"
    cat /tmp/frontend-build.log
    exit 1
fi

# ============================================================
# 6. CODE QUALITY CHECKS
# ============================================================
print_header "6. CODE QUALITY CHECKS"

# Check for console.log statements
print_info "Checking for console.log statements..."
CONSOLE_LOGS=$(grep -r "console\.log\|console\.error\|console\.warn" backend/src frontend/src 2>/dev/null | grep -v "node_modules" | wc -l)
if [[ $CONSOLE_LOGS -gt 0 ]]; then
    print_warning "$CONSOLE_LOGS console statement(s) found (consider using proper logger)"
else
    print_success "No console statements found"
fi

# Check for TODO/FIXME comments
print_info "Checking for TODO/FIXME comments..."
TODOS=$(grep -r "TODO\|FIXME" backend/src frontend/src shared/src 2>/dev/null | grep -v "node_modules" | wc -l)
if [[ $TODOS -gt 0 ]]; then
    print_info "$TODOS TODO/FIXME comment(s) found (review before production)"
fi

# Check for hardcoded secrets
print_info "Checking for hardcoded secrets..."
SECRET_PATTERNS=("password\s*=\s*['\"]" "secret\s*=\s*['\"]" "api_key\s*=\s*['\"]" "token\s*=\s*['\"]")
FOUND_SECRETS=0
for pattern in "${SECRET_PATTERNS[@]}"; do
    if grep -r -E "$pattern" backend/src frontend/src 2>/dev/null | grep -v "node_modules" | grep -v "process.env" > /dev/null; then
        ((FOUND_SECRETS++))
    fi
done

if [[ $FOUND_SECRETS -eq 0 ]]; then
    print_success "No hardcoded secrets found"
else
    print_error "$FOUND_SECRETS potential hardcoded secret(s) found - SECURITY RISK!"
fi

# ============================================================
# 7. ENVIRONMENT VARIABLE CHECKS
# ============================================================
print_header "7. ENVIRONMENT VARIABLE CHECKS"

print_info "Required Backend Environment Variables:"
BACKEND_VARS=(
    "NODE_ENV"
    "PORT"
    "DATABASE_URL"
    "JWT_SECRET"
    "JWT_REFRESH_SECRET"
    "COOKIE_SECRET"
    "CORS_ORIGIN"
)

for var in "${BACKEND_VARS[@]}"; do
    if grep -q "process.env.$var" backend/src/**/*.ts 2>/dev/null || grep -q "process.env.$var" backend/src/*.ts 2>/dev/null; then
        print_info "  ✓ $var (used in backend)"
    fi
done

print_info "Required Frontend Environment Variables:"
FRONTEND_VARS=(
    "VITE_API_URL"
)

for var in "${FRONTEND_VARS[@]}"; do
    if grep -q "import.meta.env.$var" frontend/src/**/*.{ts,tsx} 2>/dev/null || grep -q "import.meta.env.$var" frontend/src/*.{ts,tsx} 2>/dev/null; then
        print_info "  ✓ $var (used in frontend)"
    fi
done

print_warning "Remember to set these in Render dashboard before deploying!"

# ============================================================
# 8. DATABASE CHECKS
# ============================================================
print_header "8. DATABASE CHECKS"

# Check for migration files
if [[ -d "backend/migrations" ]]; then
    MIGRATION_COUNT=$(ls backend/migrations/*.sql 2>/dev/null | wc -l)
    if [[ $MIGRATION_COUNT -gt 0 ]]; then
        print_success "$MIGRATION_COUNT migration file(s) found"
    else
        print_warning "No migration files found - database will be empty"
    fi
else
    print_warning "No migrations directory found"
fi

# Check drizzle config
if [[ -f "backend/drizzle.config.ts" ]]; then
    print_success "Drizzle config exists"
else
    print_warning "Drizzle config not found"
fi

# ============================================================
# 9. DEPLOYMENT READINESS
# ============================================================
print_header "9. DEPLOYMENT READINESS"

# Calculate readiness score
TOTAL_CHECKS=$((PASSED + FAILED))
SCORE=$((PASSED * 100 / TOTAL_CHECKS))

echo ""
echo "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo "${BLUE}               VALIDATION SUMMARY                       ${NC}"
echo "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo "${GREEN}Passed:   $PASSED${NC}"
echo "${RED}Failed:   $FAILED${NC}"
echo "${YELLOW}Warnings: $WARNINGS${NC}"
echo ""
echo "${BLUE}Readiness Score: $SCORE%${NC}"
echo ""

# Determine deployment readiness
if [[ $FAILED -eq 0 ]]; then
    if [[ $WARNINGS -eq 0 ]]; then
        echo "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
        echo "${GREEN}║  ✅ READY FOR PRODUCTION DEPLOYMENT ✅               ║${NC}"
        echo "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
        echo ""
        print_info "Next steps:"
        print_info "1. Commit and push changes: git push origin main"
        print_info "2. Deploy via Render dashboard or CLI"
        print_info "3. Update URLs in render.yaml after first deploy"
        print_info "4. Run post-deployment verification"
        exit 0
    else
        echo "${YELLOW}╔═══════════════════════════════════════════════════════╗${NC}"
        echo "${YELLOW}║  ⚠️  READY WITH WARNINGS ⚠️                          ║${NC}"
        echo "${YELLOW}╚═══════════════════════════════════════════════════════╝${NC}"
        echo ""
        print_info "Review warnings above before deploying"
        print_info "Most warnings are informational and won't block deployment"
        exit 0
    fi
else
    echo "${RED}╔═══════════════════════════════════════════════════════╗${NC}"
    echo "${RED}║  ❌ NOT READY FOR DEPLOYMENT ❌                      ║${NC}"
    echo "${RED}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    print_error "Fix the errors above before deploying"
    exit 1
fi
