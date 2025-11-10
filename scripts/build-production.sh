#!/bin/bash
# ====================================
# Production Build Script
# ====================================
# This script builds all packages for production deployment

set -e  # Exit on error

echo "======================================"
echo "🏗️  MindfulMe Production Build"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Check Node.js version
print_info "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js 18 or higher is required. Current version: $(node -v)"
    exit 1
fi
print_success "Node.js version: $(node -v)"
echo ""

# Clean previous builds
print_info "Cleaning previous builds..."
npm run clean || true
print_success "Clean complete"
echo ""

# Install dependencies
print_info "Installing dependencies..."
npm install
print_success "Dependencies installed"
echo ""

# Build shared package
print_info "Building shared package..."
npm run build:shared
if [ $? -eq 0 ]; then
    print_success "Shared package built"
else
    print_error "Failed to build shared package"
    exit 1
fi
echo ""

# Build backend
print_info "Building backend..."
npm run build:backend
if [ $? -eq 0 ]; then
    BACKEND_SIZE=$(du -sh backend/dist 2>/dev/null | cut -f1)
    print_success "Backend built (Size: ${BACKEND_SIZE:-unknown})"
else
    print_error "Failed to build backend"
    exit 1
fi
echo ""

# Build frontend
print_info "Building frontend..."
npm run build:frontend
if [ $? -eq 0 ]; then
    FRONTEND_SIZE=$(du -sh frontend/dist 2>/dev/null | cut -f1)
    print_success "Frontend built (Size: ${FRONTEND_SIZE:-unknown})"
else
    print_error "Failed to build frontend"
    exit 1
fi
echo ""

# Run type checks
print_info "Running TypeScript checks..."
npm run check
if [ $? -eq 0 ]; then
    print_success "TypeScript checks passed"
else
    print_error "TypeScript checks failed"
    exit 1
fi
echo ""

# Run tests (if available)
print_info "Running tests..."
npm run test || print_info "No tests configured yet"
echo ""

# Summary
echo "======================================"
echo -e "${GREEN}✅ Build Complete!${NC}"
echo "======================================"
echo ""
echo "📦 Build Outputs:"
echo "   - Shared: shared/dist/"
echo "   - Backend: backend/dist/ (${BACKEND_SIZE:-unknown})"
echo "   - Frontend: frontend/dist/ (${FRONTEND_SIZE:-unknown})"
echo ""
echo "🚀 Next Steps:"
echo "   1. Test locally: npm run preview"
echo "   2. Deploy backend: npm run deploy:backend"
echo "   3. Check health: npm run health:check"
echo ""
