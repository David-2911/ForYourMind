#!/bin/bash

# ====================================
# MindfulMe API Testing Script
# ====================================
# Quick automated testing of all API endpoints
# Usage: ./scripts/test-api-endpoints.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE="${API_BASE:-http://localhost:5000}"
COOKIE_FILE="./test-cookies.txt"
TOKEN_FILE="./test-token.txt"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# ====================================
# Helper Functions
# ====================================

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}Testing:${NC} $1"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

print_success() {
    echo -e "${GREEN}✓ PASS:${NC} $1\n"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

print_fail() {
    echo -e "${RED}✗ FAIL:${NC} $1"
    echo -e "${RED}       Error: $2${NC}\n"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

# Test API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    local auth=${6:-""}
    
    print_test "$description"
    
    local curl_cmd="curl -s -w '\n%{http_code}' -X $method"
    
    if [ ! -z "$auth" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $auth'"
    fi
    
    if [ ! -z "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    curl_cmd="$curl_cmd $API_BASE$endpoint"
    
    # Execute request
    response=$(eval $curl_cmd)
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status_code" = "$expected_status" ]; then
        print_success "$description (Status: $status_code)"
        echo "$body"
        return 0
    else
        print_fail "$description" "Expected $expected_status, got $status_code"
        echo "Response: $body"
        return 1
    fi
}

# ====================================
# Pre-Test Checks
# ====================================

print_header "PRE-TEST CHECKS"

echo "Checking if backend is running..."
if curl -s "$API_BASE/health" > /dev/null 2>&1; then
    print_success "Backend is running at $API_BASE"
else
    print_fail "Backend not reachable" "Make sure backend is running on $API_BASE"
    exit 1
fi

# ====================================
# Health Check Tests
# ====================================

print_header "HEALTH CHECK TESTS"

print_test "GET /health"
health_response=$(curl -s "$API_BASE/health")
if echo "$health_response" | grep -q "ok"; then
    print_success "Health endpoint responding"
    echo "$health_response" | jq '.' 2>/dev/null || echo "$health_response"
else
    print_fail "Health endpoint" "Response doesn't contain 'ok'"
fi

print_test "GET /healthz (liveness)"
if curl -s "$API_BASE/healthz" | grep -q "OK"; then
    print_success "Liveness probe responding"
else
    print_fail "Liveness probe" "Not responding correctly"
fi

print_test "GET /ready (readiness)"
ready_response=$(curl -s "$API_BASE/ready")
if echo "$ready_response" | grep -q "ready"; then
    print_success "Readiness probe responding"
else
    print_fail "Readiness probe" "Not responding correctly"
fi

# ====================================
# Authentication Tests
# ====================================

print_header "AUTHENTICATION TESTS"

# Generate random email for testing
TEST_EMAIL="test_$(date +%s)@example.com"
TEST_PASSWORD="TestPass123!"
TEST_NAME="Test User"

# Test Registration
print_test "POST /api/auth/register"
register_response=$(curl -s -w '\n%{http_code}' -X POST "$API_BASE/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\",
        \"name\": \"$TEST_NAME\",
        \"role\": \"individual\"
    }")

status_code=$(echo "$register_response" | tail -n1)
body=$(echo "$register_response" | head -n-1)

if [ "$status_code" = "201" ] || [ "$status_code" = "200" ]; then
    print_success "User registration (Status: $status_code)"
    TOKEN=$(echo "$body" | jq -r '.token // .accessToken // empty' 2>/dev/null)
    if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo "$TOKEN" > "$TOKEN_FILE"
        echo "Token saved to $TOKEN_FILE"
    fi
else
    print_fail "User registration" "Expected 200/201, got $status_code"
    echo "Response: $body"
fi

# Test Login
print_test "POST /api/auth/login"
login_response=$(curl -s -w '\n%{http_code}' -X POST "$API_BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -c "$COOKIE_FILE" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

status_code=$(echo "$login_response" | tail -n1)
body=$(echo "$login_response" | head -n-1)

if [ "$status_code" = "200" ]; then
    print_success "User login (Status: $status_code)"
    TOKEN=$(echo "$body" | jq -r '.token // .accessToken // empty' 2>/dev/null)
    if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo "$TOKEN" > "$TOKEN_FILE"
        echo "Token updated in $TOKEN_FILE"
    fi
else
    print_fail "User login" "Expected 200, got $status_code"
    echo "Response: $body"
fi

# Load token for subsequent tests
if [ -f "$TOKEN_FILE" ]; then
    TOKEN=$(cat "$TOKEN_FILE")
fi

# Test Invalid Login
print_test "POST /api/auth/login (invalid credentials)"
invalid_login=$(curl -s -w '\n%{http_code}' -X POST "$API_BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"WrongPassword123!\"
    }")

status_code=$(echo "$invalid_login" | tail -n1)
if [ "$status_code" = "401" ]; then
    print_success "Invalid login correctly rejected (Status: 401)"
else
    print_fail "Invalid login" "Expected 401, got $status_code"
fi

# ====================================
# Protected Route Tests
# ====================================

print_header "PROTECTED ROUTE TESTS"

# Test accessing protected route without token
print_test "GET /api/mood (without token)"
no_auth_response=$(curl -s -w '\n%{http_code}' "$API_BASE/api/mood")
status_code=$(echo "$no_auth_response" | tail -n1)

if [ "$status_code" = "401" ]; then
    print_success "Protected route correctly requires authentication"
else
    print_fail "Protected route" "Expected 401, got $status_code"
fi

# Test with valid token
if [ ! -z "$TOKEN" ]; then
    print_test "GET /api/mood (with valid token)"
    auth_response=$(curl -s -w '\n%{http_code}' -H "Authorization: Bearer $TOKEN" "$API_BASE/api/mood")
    status_code=$(echo "$auth_response" | tail -n1)
    
    if [ "$status_code" = "200" ]; then
        print_success "Authenticated request successful"
    else
        print_fail "Authenticated request" "Expected 200, got $status_code"
    fi
fi

# ====================================
# Mood Entry Tests
# ====================================

print_header "MOOD ENTRY TESTS"

if [ ! -z "$TOKEN" ]; then
    # Create mood entry
    print_test "POST /api/mood"
    create_mood=$(curl -s -w '\n%{http_code}' -X POST "$API_BASE/api/mood" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "mood": "happy",
            "intensity": 8,
            "notes": "Test mood entry"
        }')
    
    status_code=$(echo "$create_mood" | tail -n1)
    body=$(echo "$create_mood" | head -n-1)
    
    if [ "$status_code" = "201" ] || [ "$status_code" = "200" ]; then
        print_success "Mood entry created"
        MOOD_ID=$(echo "$body" | jq -r '.id // .data.id // empty' 2>/dev/null)
        echo "Mood ID: $MOOD_ID"
    else
        print_fail "Create mood entry" "Expected 200/201, got $status_code"
    fi
    
    # Get mood entries
    print_test "GET /api/mood"
    get_moods=$(curl -s -w '\n%{http_code}' -H "Authorization: Bearer $TOKEN" "$API_BASE/api/mood")
    status_code=$(echo "$get_moods" | tail -n1)
    
    if [ "$status_code" = "200" ]; then
        print_success "Retrieved mood entries"
        echo "$get_moods" | head -n-1 | jq '.' 2>/dev/null || echo "Response received"
    else
        print_fail "Get mood entries" "Expected 200, got $status_code"
    fi
    
    # Update mood entry (if ID exists)
    if [ ! -z "$MOOD_ID" ] && [ "$MOOD_ID" != "null" ]; then
        print_test "PUT /api/mood/$MOOD_ID"
        update_mood=$(curl -s -w '\n%{http_code}' -X PUT "$API_BASE/api/mood/$MOOD_ID" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d '{
                "mood": "calm",
                "intensity": 7,
                "notes": "Updated mood entry"
            }')
        
        status_code=$(echo "$update_mood" | tail -n1)
        if [ "$status_code" = "200" ]; then
            print_success "Mood entry updated"
        else
            print_fail "Update mood entry" "Expected 200, got $status_code"
        fi
        
        # Delete mood entry
        print_test "DELETE /api/mood/$MOOD_ID"
        delete_mood=$(curl -s -w '\n%{http_code}' -X DELETE "$API_BASE/api/mood/$MOOD_ID" \
            -H "Authorization: Bearer $TOKEN")
        
        status_code=$(echo "$delete_mood" | tail -n1)
        if [ "$status_code" = "204" ] || [ "$status_code" = "200" ]; then
            print_success "Mood entry deleted"
        else
            print_fail "Delete mood entry" "Expected 200/204, got $status_code"
        fi
    fi
fi

# ====================================
# Journal Entry Tests
# ====================================

print_header "JOURNAL ENTRY TESTS"

if [ ! -z "$TOKEN" ]; then
    # Create journal entry
    print_test "POST /api/journal"
    create_journal=$(curl -s -w '\n%{http_code}' -X POST "$API_BASE/api/journal" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "title": "Test Journal Entry",
            "content": "This is a test journal entry for API testing.",
            "mood": "reflective"
        }')
    
    status_code=$(echo "$create_journal" | tail -n1)
    body=$(echo "$create_journal" | head -n-1)
    
    if [ "$status_code" = "201" ] || [ "$status_code" = "200" ]; then
        print_success "Journal entry created"
        JOURNAL_ID=$(echo "$body" | jq -r '.id // .data.id // empty' 2>/dev/null)
    else
        print_fail "Create journal entry" "Expected 200/201, got $status_code"
    fi
    
    # Get journal entries
    print_test "GET /api/journal"
    get_journals=$(curl -s -w '\n%{http_code}' -H "Authorization: Bearer $TOKEN" "$API_BASE/api/journal")
    status_code=$(echo "$get_journals" | tail -n1)
    
    if [ "$status_code" = "200" ]; then
        print_success "Retrieved journal entries"
    else
        print_fail "Get journal entries" "Expected 200, got $status_code"
    fi
fi

# ====================================
# Error Handling Tests
# ====================================

print_header "ERROR HANDLING TESTS"

# Test 404
print_test "GET /api/nonexistent"
not_found=$(curl -s -w '\n%{http_code}' "$API_BASE/api/nonexistent")
status_code=$(echo "$not_found" | tail -n1)

if [ "$status_code" = "404" ]; then
    print_success "404 error correctly returned"
else
    print_fail "404 handling" "Expected 404, got $status_code"
fi

# Test invalid JSON
print_test "POST /api/auth/login (invalid JSON)"
invalid_json=$(curl -s -w '\n%{http_code}' -X POST "$API_BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{invalid json}')
status_code=$(echo "$invalid_json" | tail -n1)

if [ "$status_code" = "400" ]; then
    print_success "Invalid JSON correctly rejected"
else
    print_fail "Invalid JSON" "Expected 400, got $status_code"
fi

# ====================================
# Cleanup
# ====================================

print_header "CLEANUP"

echo "Cleaning up test files..."
rm -f "$COOKIE_FILE" "$TOKEN_FILE"
print_success "Test files cleaned up"

# ====================================
# Test Summary
# ====================================

print_header "TEST SUMMARY"

echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo -e "Pass Rate: ${BLUE}$PASS_RATE%${NC}\n"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}\n"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Check the output above for details.${NC}\n"
    exit 1
fi
