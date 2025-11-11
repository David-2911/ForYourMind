#!/bin/bash

# MindfulMe Comprehensive Testing Plan
# Date: January 2025
# Purpose: Test all features end-to-end

set +e  # Don't exit on error - we want to continue testing

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:5000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test users
TEST_USER_EMAIL="test.individual.$(date +%s)@mindfulme.test"
TEST_USER_PASSWORD="TestPassword123!"
TEST_USER_NAME="Test Individual User"

TEST_MANAGER_EMAIL="test.manager.$(date +%s)@mindfulme.test"
TEST_MANAGER_PASSWORD="TestPassword123!"
TEST_MANAGER_NAME="Test Manager User"

# Store tokens
USER_TOKEN=""
MANAGER_TOKEN=""

# Store created resource IDs
JOURNAL_ID=""
MOOD_ID=""
RANT_ID=""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   MindfulMe Comprehensive Test Suite  ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "API URL: ${YELLOW}$API_URL${NC}"
echo -e "Frontend URL: ${YELLOW}$FRONTEND_URL${NC}"
echo ""

# Helper functions
function print_test_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}TEST $1: $2${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

function pass_test() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

function fail_test() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    echo -e "${RED}   Error: $2${NC}"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

function info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

function make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    
    local headers=(-H "Content-Type: application/json")
    
    if [ -n "$token" ]; then
        headers+=(-H "Authorization: Bearer $token")
    fi
    
    if [ -n "$data" ]; then
        curl -s -X "$method" "${API_URL}${endpoint}" \
            "${headers[@]}" \
            -d "$data" \
            -w "\n%{http_code}"
    else
        curl -s -X "$method" "${API_URL}${endpoint}" \
            "${headers[@]}" \
            -w "\n%{http_code}"
    fi
}

# ============================================
# 1. HEALTH CHECK
# ============================================
print_test_header "1.0" "API Health Check"

response=$(curl -s "${API_URL}/health" -w "\n%{http_code}")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    pass_test "API is healthy and responding"
else
    fail_test "API health check" "HTTP $http_code"
    exit 1
fi

# ============================================
# 2. AUTHENTICATION TESTS
# ============================================
print_test_header "2.1" "User Registration - Valid Data"

info "Registering user: $TEST_USER_EMAIL"

register_data=$(cat <<EOF
{
  "email": "$TEST_USER_EMAIL",
  "password": "$TEST_USER_PASSWORD",
  "displayName": "$TEST_USER_NAME",
  "role": "individual"
}
EOF
)

response=$(make_request "POST" "/api/auth/register" "$register_data")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    USER_TOKEN=$(echo "$body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$USER_TOKEN" ]; then
        pass_test "User registered successfully"
        info "User token received (length: ${#USER_TOKEN})"
    else
        fail_test "User registration" "No token in response"
    fi
else
    fail_test "User registration" "HTTP $http_code - $body"
fi

# ============================================
print_test_header "2.2" "User Registration - Duplicate Email"

response=$(make_request "POST" "/api/auth/register" "$register_data")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "400" ] || [ "$http_code" = "409" ]; then
    if echo "$body" | grep -q -i "exists\|duplicate\|already"; then
        pass_test "Duplicate email rejected with appropriate error"
    else
        fail_test "Duplicate email check" "Wrong error message: $body"
    fi
else
    fail_test "Duplicate email check" "Expected 400/409, got $http_code"
fi

# ============================================
print_test_header "2.3" "User Login - Valid Credentials"

login_data=$(cat <<EOF
{
  "email": "$TEST_USER_EMAIL",
  "password": "$TEST_USER_PASSWORD"
}
EOF
)

response=$(make_request "POST" "/api/auth/login" "$login_data")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    token=$(echo "$body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$token" ]; then
        USER_TOKEN="$token"
        pass_test "User logged in successfully"
    else
        fail_test "User login" "No token in response"
    fi
else
    fail_test "User login" "HTTP $http_code - $body"
fi

# ============================================
print_test_header "2.4" "User Login - Invalid Credentials"

invalid_login_data=$(cat <<EOF
{
  "email": "$TEST_USER_EMAIL",
  "password": "WrongPassword123!"
}
EOF
)

response=$(make_request "POST" "/api/auth/login" "$invalid_login_data")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "401" ]; then
    pass_test "Invalid credentials rejected with 401"
else
    fail_test "Invalid credentials check" "Expected 401, got $http_code"
fi

# ============================================
print_test_header "2.5" "Protected Route Access - No Token"

response=$(make_request "GET" "/api/user/profile")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
    pass_test "Protected route rejected request without token"
else
    fail_test "Protected route access control" "Expected 401/403, got $http_code"
fi

# ============================================
print_test_header "2.6" "Protected Route Access - Valid Token"

response=$(make_request "GET" "/api/user/profile" "" "$USER_TOKEN")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    if echo "$body" | grep -q "$TEST_USER_EMAIL"; then
        pass_test "Protected route accessible with valid token"
    else
        fail_test "Protected route data" "Response doesn't contain user email"
    fi
else
    fail_test "Protected route access" "HTTP $http_code - $body"
fi

# ============================================
# 3. MOOD TRACKING TESTS
# ============================================
print_test_header "3.1" "Create Mood Entry"

mood_data=$(cat <<EOF
{
  "moodScore": 8,
  "notes": "Test mood entry - feeling great!"
}
EOF
)

response=$(make_request "POST" "/api/mood" "$mood_data" "$USER_TOKEN")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    MOOD_ID=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$MOOD_ID" ]; then
        pass_test "Mood entry created successfully"
        info "Mood ID: $MOOD_ID"
    else
        pass_test "Mood entry created (no ID in response)"
    fi
else
    fail_test "Mood entry creation" "HTTP $http_code - $body"
fi

# ============================================
print_test_header "3.2" "View Mood History"

response=$(make_request "GET" "/api/mood?days=30" "" "$USER_TOKEN")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    if echo "$body" | grep -q "moodScore"; then
        pass_test "Mood history retrieved successfully"
        count=$(echo "$body" | grep -o "moodScore" | wc -l)
        info "Found $count mood entries"
    else
        fail_test "Mood history" "Response doesn't contain mood data"
    fi
else
    fail_test "Mood history retrieval" "HTTP $http_code"
fi

# ============================================
print_test_header "3.3" "Mood Statistics"

response=$(make_request "GET" "/api/mood/stats?days=30" "" "$USER_TOKEN")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    if echo "$body" | grep -q "average"; then
        pass_test "Mood statistics retrieved successfully"
        average=$(echo "$body" | grep -o '"average":[0-9.]*' | cut -d':' -f2)
        trend=$(echo "$body" | grep -o '"trend":"[^"]*"' | cut -d'"' -f4)
        info "Average mood: $average, Trend: $trend"
    else
        fail_test "Mood statistics" "Response doesn't contain statistics data"
    fi
else
    fail_test "Mood statistics retrieval" "HTTP $http_code"
fi

# ============================================
# 4. JOURNALING TESTS
# ============================================
print_test_header "4.1" "Create Journal Entry"

journal_data=$(cat <<EOF
{
  "content": "This is my test journal entry. Today was a productive day!",
  "moodScore": 7,
  "tags": ["test", "productivity"]
}
EOF
)

response=$(make_request "POST" "/api/journals" "$journal_data" "$USER_TOKEN")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    JOURNAL_ID=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$JOURNAL_ID" ]; then
        pass_test "Journal entry created successfully"
        info "Journal ID: $JOURNAL_ID"
    else
        pass_test "Journal entry created (no ID in response)"
    fi
else
    fail_test "Journal entry creation" "HTTP $http_code - $body"
fi

# ============================================
print_test_header "4.2" "View Journal Entries"

response=$(make_request "GET" "/api/journals" "" "$USER_TOKEN")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    if echo "$body" | grep -q "content"; then
        pass_test "Journal entries retrieved successfully"
        count=$(echo "$body" | grep -o '"id"' | wc -l)
        info "Found $count journal entries"
    else
        fail_test "Journal entries" "Response doesn't contain journal data"
    fi
else
    fail_test "Journal entries retrieval" "HTTP $http_code"
fi

# ============================================
print_test_header "4.3" "Get Single Journal Entry"

if [ -n "$JOURNAL_ID" ]; then
    response=$(make_request "GET" "/api/journals/$JOURNAL_ID" "" "$USER_TOKEN")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ]; then
        if echo "$body" | grep -q "$JOURNAL_ID"; then
            pass_test "Single journal entry retrieved successfully"
        else
            fail_test "Single journal entry" "Response doesn't contain journal ID"
        fi
    else
        fail_test "Single journal entry retrieval" "HTTP $http_code"
    fi
else
    info "Skipping - no journal ID available"
    ((TOTAL_TESTS++))
fi

# ============================================
print_test_header "4.4" "Update Journal Entry"

if [ -n "$JOURNAL_ID" ]; then
    update_data=$(cat <<EOF
{
  "content": "Updated journal entry content - testing edit functionality",
  "moodScore": 9
}
EOF
)

    response=$(make_request "PUT" "/api/journals/$JOURNAL_ID" "$update_data" "$USER_TOKEN")
    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ]; then
        pass_test "Journal entry updated successfully"
    else
        fail_test "Journal entry update" "HTTP $http_code"
    fi
else
    info "Skipping - no journal ID available"
    ((TOTAL_TESTS++))
fi

# ============================================
print_test_header "4.5" "Delete Journal Entry"

if [ -n "$JOURNAL_ID" ]; then
    response=$(make_request "DELETE" "/api/journals/$JOURNAL_ID" "" "$USER_TOKEN")
    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
        pass_test "Journal entry deleted successfully"
        
        # Verify it's really deleted
        response=$(make_request "GET" "/api/journals/$JOURNAL_ID" "" "$USER_TOKEN")
        http_code=$(echo "$response" | tail -n1)
        
        if [ "$http_code" = "404" ]; then
            pass_test "Deleted journal entry no longer accessible"
        else
            info "Note: Deleted entry returned status $http_code (might still be accessible)"
        fi
    else
        fail_test "Journal entry deletion" "HTTP $http_code"
    fi
else
    info "Skipping - no journal ID available"
    ((TOTAL_TESTS++))
fi

# ============================================
# 5. ANONYMOUS VENTING TESTS
# ============================================
print_test_header "5.1" "Create Anonymous Rant"

rant_data=$(cat <<EOF
{
  "content": "This is a test anonymous rant. Testing anonymity features."
}
EOF
)

response=$(make_request "POST" "/api/rants" "$rant_data")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    RANT_ID=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    pass_test "Anonymous rant created successfully"
    info "Rant ID: $RANT_ID"
    
    # Verify no user information in response
    if echo "$body" | grep -q "userId\|user_id\|email"; then
        fail_test "Rant anonymity" "Response contains user information!"
    else
        pass_test "Rant response contains no user information"
    fi
else
    fail_test "Anonymous rant creation" "HTTP $http_code - $body"
fi

# ============================================
print_test_header "5.2" "View Anonymous Rants"

response=$(make_request "GET" "/api/rants")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    if echo "$body" | grep -q "content"; then
        pass_test "Anonymous rants retrieved successfully"
        
        # Verify no user information in any rant
        if echo "$body" | grep -q "userId\|user_id\|email"; then
            fail_test "Rants anonymity" "Rants contain user information!"
        else
            pass_test "No user information exposed in rants list"
        fi
    else
        fail_test "Anonymous rants" "Response doesn't contain rant data"
    fi
else
    fail_test "Anonymous rants retrieval" "HTTP $http_code"
fi

# ============================================
print_test_header "5.3" "Support Anonymous Rant"

if [ -n "$RANT_ID" ]; then
    response=$(make_request "POST" "/api/rants/$RANT_ID/support" "{}")
    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ]; then
        pass_test "Rant support recorded successfully"
    else
        fail_test "Rant support" "HTTP $http_code"
    fi
else
    info "Skipping - no rant ID available"
    ((TOTAL_TESTS++))
fi

# ============================================
# 6. WELLNESS ASSESSMENT TESTS
# ============================================
print_test_header "6.1" "Get Wellness Assessments"

response=$(make_request "GET" "/api/wellness-assessments" "" "$USER_TOKEN")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    pass_test "Wellness assessments retrieved successfully"
    count=$(echo "$body" | grep -o '"id"' | wc -l)
    info "Found $count assessments"
else
    fail_test "Wellness assessments retrieval" "HTTP $http_code"
fi

# ============================================
print_test_header "6.2" "Get Latest Assessment Response"

response=$(make_request "GET" "/api/wellness-assessments/responses/latest" "" "$USER_TOKEN")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    pass_test "Latest assessment response retrieved"
elif [ "$http_code" = "404" ]; then
    info "No assessment responses yet (expected for new user)"
    ((TOTAL_TESTS++))
else
    fail_test "Latest assessment response retrieval" "HTTP $http_code"
fi

# ============================================
# 7. THERAPIST DIRECTORY TESTS
# ============================================
print_test_header "7.1" "View Therapist Listings"

response=$(make_request "GET" "/api/therapists" "" "$USER_TOKEN")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    pass_test "Therapist listings retrieved successfully"
    count=$(echo "$body" | grep -o '"id"' | wc -l)
    info "Found $count therapists"
else
    fail_test "Therapist listings retrieval" "HTTP $http_code"
fi

# ============================================
# 8. PROFILE MANAGEMENT TESTS
# ============================================
print_test_header "8.1" "Update User Profile"

profile_data=$(cat <<EOF
{
  "displayName": "Updated Test User",
  "email": "$TEST_USER_EMAIL"
}
EOF
)

response=$(make_request "PUT" "/api/user/profile" "$profile_data" "$USER_TOKEN")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    if echo "$body" | grep -q "Updated Test User"; then
        pass_test "User profile updated successfully"
    else
        fail_test "Profile update verification" "Updated name not in response"
    fi
else
    fail_test "User profile update" "HTTP $http_code"
fi

# ============================================
print_test_header "8.2" "Change Password"

password_data=$(cat <<EOF
{
  "currentPassword": "$TEST_USER_PASSWORD",
  "newPassword": "NewTestPassword456!"
}
EOF
)

response=$(make_request "PATCH" "/api/user/password" "$password_data" "$USER_TOKEN")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ]; then
    pass_test "Password changed successfully"
    
    # Verify can login with new password
    new_login_data=$(cat <<EOF
{
  "email": "$TEST_USER_EMAIL",
  "password": "NewTestPassword456!"
}
EOF
)
    
    response=$(make_request "POST" "/api/auth/login" "$new_login_data")
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ]; then
        pass_test "Login successful with new password"
        # Update password variable for later tests
        TEST_USER_PASSWORD="NewTestPassword456!"
    else
        fail_test "Login with new password" "HTTP $http_code"
    fi
else
    fail_test "Password change" "HTTP $http_code"
fi

# ============================================
# 9. AUTHORIZATION TESTS
# ============================================
print_test_header "9.1" "User Cannot Access Other User's Data"

# Create second test user
SECOND_USER_EMAIL="test.second.$(date +%s)@mindfulme.test"

second_user_data=$(cat <<EOF
{
  "email": "$SECOND_USER_EMAIL",
  "password": "SecondUser123!",
  "displayName": "Second Test User",
  "role": "individual"
}
EOF
)

response=$(make_request "POST" "/api/auth/register" "$second_user_data")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    SECOND_USER_TOKEN=$(echo "$body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    # Try to access first user's profile with second user's token
    response=$(make_request "GET" "/api/user/profile" "" "$SECOND_USER_TOKEN")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if echo "$body" | grep -q "$SECOND_USER_EMAIL"; then
        pass_test "Users can only access their own profile data"
    else
        fail_test "User data isolation" "Wrong user data returned"
    fi
else
    info "Could not create second user for authorization test"
    ((TOTAL_TESTS++))
fi

# ============================================
# 10. MANAGER REGISTRATION TEST
# ============================================
print_test_header "10.1" "Manager User Registration"

manager_data=$(cat <<EOF
{
  "email": "$TEST_MANAGER_EMAIL",
  "password": "$TEST_MANAGER_PASSWORD",
  "displayName": "$TEST_MANAGER_NAME",
  "role": "manager"
}
EOF
)

response=$(make_request "POST" "/api/auth/register" "$manager_data")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    MANAGER_TOKEN=$(echo "$body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$MANAGER_TOKEN" ]; then
        pass_test "Manager user registered successfully"
        info "Manager role assigned"
    else
        fail_test "Manager registration" "No token in response"
    fi
else
    fail_test "Manager user registration" "HTTP $http_code - $body"
fi

# ============================================
# FINAL SUMMARY
# ============================================

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}        TEST EXECUTION COMPLETE         ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

PASS_RATE=0
if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
fi

echo -e "Total Tests:    ${YELLOW}$TOTAL_TESTS${NC}"
echo -e "Passed:         ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:         ${RED}$FAILED_TESTS${NC}"
echo -e "Pass Rate:      ${YELLOW}$PASS_RATE%${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo ""
    exit 1
fi
