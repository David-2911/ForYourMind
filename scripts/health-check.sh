#!/bin/bash
# ====================================
# Health Check Script
# ====================================
# Checks the health of all services

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo -e "${YELLOW}ℹ${NC} $1"; }

# Default URLs
BACKEND_URL="${BACKEND_URL:-http://localhost:5000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"

echo "======================================"
echo "🏥 Health Check"
echo "======================================"
echo ""

# Check backend
print_info "Checking backend at ${BACKEND_URL}..."
if curl -f -s "${BACKEND_URL}/health" > /dev/null 2>&1; then
    RESPONSE=$(curl -s "${BACKEND_URL}/health")
    print_success "Backend is healthy"
    echo "${RESPONSE}" | jq '.' 2>/dev/null || echo "${RESPONSE}"
else
    print_error "Backend is not responding"
    exit 1
fi
echo ""

# Check backend readiness
print_info "Checking backend readiness..."
if curl -f -s "${BACKEND_URL}/ready" > /dev/null 2>&1; then
    print_success "Backend is ready"
else
    print_error "Backend is not ready"
fi
echo ""

# Check frontend (if static site)
print_info "Checking frontend at ${FRONTEND_URL}..."
if curl -f -s "${FRONTEND_URL}" > /dev/null 2>&1; then
    print_success "Frontend is accessible"
else
    print_error "Frontend is not responding"
    # Don't exit for frontend failure in dev mode
fi
echo ""

# Summary
echo "======================================"
echo -e "${GREEN}✅ Health Check Complete${NC}"
echo "======================================"
echo ""
echo "Services Status:"
echo "  Backend:  ${BACKEND_URL}"
echo "  Frontend: ${FRONTEND_URL}"
echo ""
