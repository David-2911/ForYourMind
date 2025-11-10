#!/bin/bash
# Shared Module Verification Script
# Run this to verify the entire shared module setup is working

set -e  # Exit on error

echo "🔍 MindfulMe Shared Module Verification"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
PASSED=0
FAILED=0

# Test function
test_command() {
    local name=$1
    local command=$2
    
    echo -n "Testing: $name... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
    fi
}

echo "📦 Step 1: Checking package structure"
echo "--------------------------------------"
test_command "Shared package.json exists" "test -f shared/package.json"
test_command "Shared tsconfig.json exists" "test -f shared/tsconfig.json"
test_command "Shared src/index.ts exists" "test -f shared/src/index.ts"
test_command "Shared src/schema.ts exists" "test -f shared/src/schema.ts"
test_command "Shared src/constants.ts exists" "test -f shared/src/constants.ts"
test_command "Shared src/types/index.ts exists" "test -f shared/src/types/index.ts"
echo ""

echo "🔨 Step 2: Building shared package"
echo "-----------------------------------"
cd shared
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Shared package built successfully${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Shared package build failed${NC}"
    ((FAILED++))
fi
cd ..
echo ""

echo "📋 Step 3: Checking TypeScript compilation"
echo "-------------------------------------------"
test_command "Shared TypeScript check" "cd shared && npm run check"
test_command "Backend TypeScript check" "cd backend && npm run check"
test_command "Frontend TypeScript check" "cd frontend && npm run check"
echo ""

echo "🏗️  Step 4: Building all packages"
echo "----------------------------------"
test_command "Backend build" "cd backend && npm run build"
test_command "Frontend build" "cd frontend && npm run build"
echo ""

echo "🔗 Step 5: Checking imports"
echo "---------------------------"
test_command "Backend uses @mindfulme/shared" "grep -r '@mindfulme/shared' backend/src/ > /dev/null"
test_command "Frontend uses @mindfulme/shared" "grep -r '@mindfulme/shared' frontend/src/ > /dev/null"
test_command "No old relative imports in backend" "! grep -r \"from ['\\\"]../../shared\" backend/src/"
echo ""

echo "📊 Step 6: Checking exports"
echo "---------------------------"
test_command "Shared dist/index.js exists" "test -f shared/dist/index.js"
test_command "Shared dist/index.d.ts exists" "test -f shared/dist/index.d.ts"
test_command "Shared dist/schema.js exists" "test -f shared/dist/schema.js"
test_command "Shared dist/constants.js exists" "test -f shared/dist/constants.js"
echo ""

echo "✨ Step 7: Checking TypeScript config"
echo "--------------------------------------"
test_command "Root tsconfig.json exists" "test -f tsconfig.json"
test_command "Base tsconfig.base.json exists" "test -f tsconfig.base.json"
test_command "Backend extends base config" "grep -q 'extends.*tsconfig.base.json' backend/tsconfig.json"
test_command "Frontend extends base config" "grep -q 'extends.*tsconfig.base.json' frontend/tsconfig.json"
test_command "Backend references shared" "grep -q '\"path\".*\"../shared\"' backend/tsconfig.json"
test_command "Frontend references shared" "grep -q '\"path\".*\"../shared\"' frontend/tsconfig.json"
echo ""

# Summary
echo "========================================"
echo "📊 VERIFICATION SUMMARY"
echo "========================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Shared module is properly configured.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Start backend: cd backend && npm run dev"
    echo "  2. Start frontend: cd frontend && npm run dev"
    echo "  3. Visit http://localhost:5173"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please review the errors above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  - Run: cd shared && npm run build"
    echo "  - Run: cd backend && npm install ../shared"
    echo "  - Run: cd frontend && npm install ../shared"
    echo "  - Check SHARED_MODULE_SETUP.md for troubleshooting"
    exit 1
fi
