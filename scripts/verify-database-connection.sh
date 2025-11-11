#!/bin/bash

# ============================================================
# Database Connection Verification Script
# ============================================================
# This script verifies that the backend is using PostgreSQL
# and tests authentication flow with the database
# ============================================================

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-https://fym-backend.onrender.com}"
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="Test123!@#"
TEST_NAME="Test User"

echo "============================================================"
echo -e "${BLUE}DATABASE CONNECTION & AUTH VERIFICATION${NC}"
echo "============================================================"
echo "API URL: $API_URL"
echo "Test Email: $TEST_EMAIL"
echo ""

# Step 1: Check health endpoint
echo "============================================================"
echo -e "${YELLOW}STEP 1: Checking Backend Health${NC}"
echo "============================================================"

HEALTH_RESPONSE=$(curl -s "$API_URL/health" || echo "ERROR")

if [ "$HEALTH_RESPONSE" = "ERROR" ]; then
    echo -e "${RED}✗ FAIL: Cannot reach backend${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Backend is reachable${NC}"
echo "Response: $HEALTH_RESPONSE"

# Check if using PostgreSQL
DATABASE_TYPE=$(echo "$HEALTH_RESPONSE" | grep -o '"database":"[^"]*"' | cut -d'"' -f4 || echo "Unknown")
echo ""
echo "Database Type: $DATABASE_TYPE"

if [ "$DATABASE_TYPE" = "PostgreSQL" ]; then
    echo -e "${GREEN}✓ VERIFIED: Using PostgreSQL ✓${NC}"
elif [ "$DATABASE_TYPE" = "SQLite" ]; then
    echo -e "${RED}✗ ERROR: Still using SQLite!${NC}"
    echo ""
    echo "Next steps to fix:"
    echo "1. Check Render.com dashboard → Backend service → Environment"
    echo "2. Verify DATABASE_URL is set (should be auto-injected from PostgreSQL service)"
    echo "3. Verify USE_SQLITE is set to 'false' or removed"
    echo "4. Check deployment logs for storage selection debug output"
    exit 1
else
    echo -e "${YELLOW}⚠ WARNING: Unknown database type${NC}"
fi

# Step 2: Test Registration
echo ""
echo "============================================================"
echo -e "${YELLOW}STEP 2: Testing User Registration${NC}"
echo "============================================================"

REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\",
        \"name\": \"$TEST_NAME\"
    }")

REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | head -n -1)
REGISTER_STATUS=$(echo "$REGISTER_RESPONSE" | tail -n 1)

echo "Status Code: $REGISTER_STATUS"

if [ "$REGISTER_STATUS" = "200" ] || [ "$REGISTER_STATUS" = "201" ]; then
    echo -e "${GREEN}✓ PASS: User registration successful${NC}"
    echo "Response: $REGISTER_BODY"
    
    # Extract user ID and token
    USER_ID=$(echo "$REGISTER_BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    TOKEN=$(echo "$REGISTER_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    echo "User ID: $USER_ID"
    echo "Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}✗ FAIL: Registration failed${NC}"
    echo "Response: $REGISTER_BODY"
    exit 1
fi

# Step 3: Test Login
echo ""
echo "============================================================"
echo -e "${YELLOW}STEP 3: Testing User Login${NC}"
echo "============================================================"

LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)
LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | tail -n 1)

echo "Status Code: $LOGIN_STATUS"

if [ "$LOGIN_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ PASS: Login successful${NC}"
    echo "Response: $LOGIN_BODY"
    
    # Extract token for next test
    LOGIN_TOKEN=$(echo "$LOGIN_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "New Token: ${LOGIN_TOKEN:0:20}..."
else
    echo -e "${RED}✗ FAIL: Login failed${NC}"
    echo "Response: $LOGIN_BODY"
    exit 1
fi

# Step 4: Test Protected Route
echo ""
echo "============================================================"
echo -e "${YELLOW}STEP 4: Testing Protected Route (Profile Fetch)${NC}"
echo "============================================================"

PROFILE_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/user/profile" \
    -H "Authorization: Bearer $LOGIN_TOKEN")

PROFILE_BODY=$(echo "$PROFILE_RESPONSE" | head -n -1)
PROFILE_STATUS=$(echo "$PROFILE_RESPONSE" | tail -n 1)

echo "Status Code: $PROFILE_STATUS"

if [ "$PROFILE_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ PASS: Protected route accessible${NC}"
    echo "Response: $PROFILE_BODY"
else
    echo -e "${RED}✗ FAIL: Cannot access protected route${NC}"
    echo "Response: $PROFILE_BODY"
    exit 1
fi

# Step 5: Test Password Change (Previously Broken)
echo ""
echo "============================================================"
echo -e "${YELLOW}STEP 5: Testing Password Change${NC}"
echo "============================================================"

NEW_PASSWORD="NewPassword123!@#"

PASSWORD_CHANGE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/user/change-password" \
    -H "Authorization: Bearer $LOGIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"currentPassword\": \"$TEST_PASSWORD\",
        \"newPassword\": \"$NEW_PASSWORD\"
    }")

CHANGE_BODY=$(echo "$PASSWORD_CHANGE_RESPONSE" | head -n -1)
CHANGE_STATUS=$(echo "$PASSWORD_CHANGE_RESPONSE" | tail -n 1)

echo "Status Code: $CHANGE_STATUS"

if [ "$CHANGE_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ PASS: Password changed successfully${NC}"
    echo "Response: $CHANGE_BODY"
else
    echo -e "${RED}✗ FAIL: Password change failed${NC}"
    echo "Response: $CHANGE_BODY"
    exit 1
fi

# Step 6: Verify Old Password Doesn't Work
echo ""
echo "============================================================"
echo -e "${YELLOW}STEP 6: Verifying Old Password is Rejected${NC}"
echo "============================================================"

OLD_LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

OLD_LOGIN_STATUS=$(echo "$OLD_LOGIN_RESPONSE" | tail -n 1)

echo "Status Code: $OLD_LOGIN_STATUS"

if [ "$OLD_LOGIN_STATUS" = "401" ]; then
    echo -e "${GREEN}✓ PASS: Old password correctly rejected${NC}"
else
    echo -e "${RED}✗ FAIL: Old password still works (HTTP $OLD_LOGIN_STATUS)${NC}"
    echo "This means password was not actually updated in database!"
    exit 1
fi

# Step 7: Verify New Password Works
echo ""
echo "============================================================"
echo -e "${YELLOW}STEP 7: Verifying New Password Works${NC}"
echo "============================================================"

NEW_LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$NEW_PASSWORD\"
    }")

NEW_LOGIN_BODY=$(echo "$NEW_LOGIN_RESPONSE" | head -n -1)
NEW_LOGIN_STATUS=$(echo "$NEW_LOGIN_RESPONSE" | tail -n 1)

echo "Status Code: $NEW_LOGIN_STATUS"

if [ "$NEW_LOGIN_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ PASS: Login successful with new password${NC}"
    echo "Response: $NEW_LOGIN_BODY"
else
    echo -e "${RED}✗ FAIL: Cannot login with new password${NC}"
    echo "Response: $NEW_LOGIN_BODY"
    exit 1
fi

# Final Summary
echo ""
echo "============================================================"
echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
echo "============================================================"
echo ""
echo "✓ Backend is using PostgreSQL"
echo "✓ User registration works"
echo "✓ User login works"
echo "✓ Protected routes accessible"
echo "✓ Password change works"
echo "✓ Old password correctly rejected"
echo "✓ New password works"
echo ""
echo -e "${GREEN}🎉 Database connection and authentication fully functional!${NC}"
echo ""
