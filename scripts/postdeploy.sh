#!/bin/bash

# ============================================================
# Post-Deployment Verification Script
# ============================================================
# Run this script after deploying to production
# It verifies all services are working correctly
#
# Usage: ./scripts/postdeploy.sh [backend-url] [frontend-url]
# Example: ./scripts/postdeploy.sh https://api.example.com https://app.example.com
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get URLs from arguments or use defaults
BACKEND_URL="${1:-https://mindfulme-backend.onrender.com}"
FRONTEND_URL="${2:-https://mindfulme-frontend.onrender.com}"

# Counters
PASSED=0
FAILED=0

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

print_info() {
    echo "${BLUE}ℹ️  $1${NC}"
}

echo ""
echo "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo "${BLUE}║    MindfulMe Post-Deployment Verification Script      ║${NC}"
echo "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
print_info "Backend URL:  $BACKEND_URL"
print_info "Frontend URL: $FRONTEND_URL"
echo ""

# ============================================================
# 1. BACKEND HEALTH CHECK
# ============================================================
print_header "1. BACKEND HEALTH CHECK"

print_info "Checking backend health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/health" 2>/dev/null || echo "000")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [[ "$HTTP_CODE" == "200" ]]; then
    print_success "Backend health check passed (HTTP 200)"
    
    # Parse health response
    if echo "$HEALTH_BODY" | grep -q '"status":"ok"'; then
        print_success "Backend status: OK"
    else
        print_error "Backend status is not OK"
    fi
    
    # Check database connection
    if echo "$HEALTH_BODY" | grep -q '"database":"PostgreSQL"'; then
        print_success "Database: PostgreSQL (correct)"
    elif echo "$HEALTH_BODY" | grep -q '"database":"SQLite"'; then
        print_error "Database: SQLite (should be PostgreSQL in production!)"
    fi
    
    # Check environment
    if echo "$HEALTH_BODY" | grep -q '"environment":"production"'; then
        print_success "Environment: production (correct)"
    else
        print_error "Environment is not set to production"
    fi
else
    print_error "Backend health check failed (HTTP $HTTP_CODE)"
    print_info "Response: $HEALTH_BODY"
fi

# ============================================================
# 2. FRONTEND ACCESSIBILITY
# ============================================================
print_header "2. FRONTEND ACCESSIBILITY"

print_info "Checking frontend homepage..."
FRONTEND_RESPONSE=$(curl -s -w "\n%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")
HTTP_CODE=$(echo "$FRONTEND_RESPONSE" | tail -n1)

if [[ "$HTTP_CODE" == "200" ]]; then
    print_success "Frontend accessible (HTTP 200)"
    
    # Check if it's actually HTML
    if echo "$FRONTEND_RESPONSE" | grep -q "<html"; then
        print_success "Frontend serves HTML content"
    else
        print_error "Frontend doesn't serve HTML"
    fi
    
    # Check for bundle files reference
    if echo "$FRONTEND_RESPONSE" | grep -q "assets/js"; then
        print_success "Frontend references JavaScript bundles"
    fi
    
    if echo "$FRONTEND_RESPONSE" | grep -q "assets/.*\.css"; then
        print_success "Frontend references CSS bundles"
    fi
else
    print_error "Frontend not accessible (HTTP $HTTP_CODE)"
fi

# ============================================================
# 3. SSL/HTTPS CHECK
# ============================================================
print_header "3. SSL/HTTPS CHECK"

# Check backend SSL
if [[ "$BACKEND_URL" == https://* ]]; then
    print_success "Backend uses HTTPS"
    
    # Test SSL certificate
    if curl -s --head "$BACKEND_URL" > /dev/null 2>&1; then
        print_success "Backend SSL certificate valid"
    else
        print_error "Backend SSL certificate issue"
    fi
else
    print_error "Backend not using HTTPS"
fi

# Check frontend SSL
if [[ "$FRONTEND_URL" == https://* ]]; then
    print_success "Frontend uses HTTPS"
    
    if curl -s --head "$FRONTEND_URL" > /dev/null 2>&1; then
        print_success "Frontend SSL certificate valid"
    fi
else
    print_error "Frontend not using HTTPS"
fi

# ============================================================
# 4. CORS CONFIGURATION
# ============================================================
print_header "4. CORS CONFIGURATION"

print_info "Testing CORS from frontend to backend..."
CORS_RESPONSE=$(curl -s -H "Origin: $FRONTEND_URL" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     "$BACKEND_URL/api/auth/login" \
     -i 2>/dev/null || echo "")

if echo "$CORS_RESPONSE" | grep -qi "Access-Control-Allow-Origin"; then
    ALLOWED_ORIGIN=$(echo "$CORS_RESPONSE" | grep -i "Access-Control-Allow-Origin" | cut -d' ' -f2 | tr -d '\r')
    if [[ "$ALLOWED_ORIGIN" == "$FRONTEND_URL" ]] || [[ "$ALLOWED_ORIGIN" == "*" ]]; then
        print_success "CORS configured correctly"
        print_info "Allowed origin: $ALLOWED_ORIGIN"
    else
        print_error "CORS misconfigured (allows: $ALLOWED_ORIGIN, expected: $FRONTEND_URL)"
    fi
else
    print_error "CORS headers not found"
fi

# ============================================================
# 5. SECURITY HEADERS CHECK
# ============================================================
print_header "5. SECURITY HEADERS CHECK"

print_info "Checking frontend security headers..."
HEADERS=$(curl -s -I "$FRONTEND_URL" 2>/dev/null)

# Check for security headers
SECURITY_HEADERS=(
    "X-Frame-Options"
    "X-Content-Type-Options"
    "X-XSS-Protection"
    "Referrer-Policy"
)

for header in "${SECURITY_HEADERS[@]}"; do
    if echo "$HEADERS" | grep -qi "$header"; then
        print_success "$header header present"
    else
        print_error "$header header missing"
    fi
done

# Check Content-Security-Policy
if echo "$HEADERS" | grep -qi "Content-Security-Policy"; then
    print_success "Content-Security-Policy header present"
else
    print_info "Content-Security-Policy header not found (optional)"
fi

# ============================================================
# 6. API ENDPOINT TESTS
# ============================================================
print_header "6. API ENDPOINT TESTS"

# Test public endpoint
print_info "Testing public API endpoint..."
HEALTHZ_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/healthz" 2>/dev/null || echo "000")
HTTP_CODE=$(echo "$HEALTHZ_RESPONSE" | tail -n1)

if [[ "$HTTP_CODE" == "200" ]]; then
    print_success "Public healthz endpoint accessible"
else
    print_info "Public healthz endpoint returned HTTP $HTTP_CODE (may not be implemented)"
fi

# Test auth endpoint (should return 400/401, not 500)
print_info "Testing auth endpoint..."
AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}' \
    "$BACKEND_URL/api/auth/login" 2>/dev/null || echo "000")
HTTP_CODE=$(echo "$AUTH_RESPONSE" | tail -n1)

if [[ "$HTTP_CODE" == "400" ]] || [[ "$HTTP_CODE" == "401" ]]; then
    print_success "Auth endpoint responds correctly (HTTP $HTTP_CODE for invalid credentials)"
elif [[ "$HTTP_CODE" == "500" ]]; then
    print_error "Auth endpoint returns server error (HTTP 500)"
else
    print_info "Auth endpoint returned HTTP $HTTP_CODE"
fi

# ============================================================
# 7. RESPONSE TIME CHECK
# ============================================================
print_header "7. RESPONSE TIME CHECK"

print_info "Measuring backend response time..."
START_TIME=$(date +%s%3N)
curl -s "$BACKEND_URL/health" > /dev/null 2>&1
END_TIME=$(date +%s%3N)
RESPONSE_TIME=$((END_TIME - START_TIME))

if [[ $RESPONSE_TIME -lt 1000 ]]; then
    print_success "Backend response time: ${RESPONSE_TIME}ms (excellent)"
elif [[ $RESPONSE_TIME -lt 3000 ]]; then
    print_success "Backend response time: ${RESPONSE_TIME}ms (acceptable)"
else
    print_error "Backend response time: ${RESPONSE_TIME}ms (slow, might be cold start)"
fi

print_info "Measuring frontend response time..."
START_TIME=$(date +%s%3N)
curl -s "$FRONTEND_URL" > /dev/null 2>&1
END_TIME=$(date +%s%3N)
RESPONSE_TIME=$((END_TIME - START_TIME))

if [[ $RESPONSE_TIME -lt 1000 ]]; then
    print_success "Frontend response time: ${RESPONSE_TIME}ms (excellent)"
elif [[ $RESPONSE_TIME -lt 3000 ]]; then
    print_success "Frontend response time: ${RESPONSE_TIME}ms (acceptable)"
else
    print_error "Frontend response time: ${RESPONSE_TIME}ms (slow)"
fi

# ============================================================
# 8. DATABASE CONNECTION
# ============================================================
print_header "8. DATABASE CONNECTION"

print_info "Verifying database connection through API..."
# The health endpoint already checked database, so we can infer from that
if [[ "$HEALTH_BODY" == *"PostgreSQL"* ]]; then
    print_success "Database connection verified via health endpoint"
else
    print_error "Database connection could not be verified"
fi

# ============================================================
# 9. ENVIRONMENT CONFIGURATION
# ============================================================
print_header "9. ENVIRONMENT CONFIGURATION"

print_info "Checking critical environment variables..."

# Check if backend is using correct database
if echo "$HEALTH_BODY" | grep -q "SQLite"; then
    print_error "Backend using SQLite instead of PostgreSQL!"
    print_info "Set USE_SQLITE=false in backend environment variables"
else
    print_success "Backend using PostgreSQL"
fi

# Check if production mode
if echo "$HEALTH_BODY" | grep -q '"environment":"production"'; then
    print_success "NODE_ENV set to production"
else
    print_error "NODE_ENV not set to production"
fi

# ============================================================
# 10. SUMMARY
# ============================================================
print_header "10. DEPLOYMENT VERIFICATION SUMMARY"

TOTAL_CHECKS=$((PASSED + FAILED))
if [[ $TOTAL_CHECKS -eq 0 ]]; then
    TOTAL_CHECKS=1  # Avoid division by zero
fi
SCORE=$((PASSED * 100 / TOTAL_CHECKS))

echo ""
echo "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo "${GREEN}Passed: $PASSED${NC}"
echo "${RED}Failed: $FAILED${NC}"
echo ""
echo "${BLUE}Verification Score: $SCORE%${NC}"
echo ""

if [[ $FAILED -eq 0 ]]; then
    echo "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo "${GREEN}║  ✅ DEPLOYMENT VERIFICATION SUCCESSFUL ✅            ║${NC}"
    echo "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    print_info "Your deployment is live and healthy!"
    print_info ""
    print_info "Next steps:"
    print_info "1. Test critical user flows manually"
    print_info "2. Monitor logs for any errors"
    print_info "3. Set up monitoring alerts"
    print_info "4. Update documentation with production URLs"
    echo ""
    exit 0
elif [[ $FAILED -le 2 ]]; then
    echo "${YELLOW}╔═══════════════════════════════════════════════════════╗${NC}"
    echo "${YELLOW}║  ⚠️  DEPLOYMENT LIVE WITH MINOR ISSUES ⚠️            ║${NC}"
    echo "${YELLOW}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    print_info "Your deployment is live but has minor issues"
    print_info "Review failed checks above and fix when possible"
    echo ""
    exit 0
else
    echo "${RED}╔═══════════════════════════════════════════════════════╗${NC}"
    echo "${RED}║  ❌ DEPLOYMENT HAS CRITICAL ISSUES ❌                ║${NC}"
    echo "${RED}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    print_error "Your deployment has critical issues"
    print_error "Review failed checks above and fix immediately"
    print_error ""
    print_error "Common fixes:"
    print_error "1. Update CORS_ORIGIN in backend environment variables"
    print_error "2. Update VITE_API_URL in frontend environment variables"
    print_error "3. Set USE_SQLITE=false in backend"
    print_error "4. Set NODE_ENV=production in backend"
    print_error "5. Verify DATABASE_URL is set correctly"
    echo ""
    exit 1
fi
