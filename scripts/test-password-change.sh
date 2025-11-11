#!/bin/bash

# Test Password Change Fix
# This test verifies that the password change flow now works correctly

set +e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_URL="${API_URL:-https://fym-backend.onrender.com}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Password Change Fix Verification    ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "API URL: ${YELLOW}$API_URL${NC}"
echo ""

# Test user
TEST_EMAIL="test.pwchange.$(date +%s)@mindfulme.test"
ORIGINAL_PASSWORD="OriginalPass123!"
NEW_PASSWORD="NewPassword456!"

echo -e "${BLUE}Step 1: Register test user${NC}"
temp_file=$(mktemp)
http_code=$(curl -s -o "$temp_file" -w "%{http_code}" -X POST "${API_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$ORIGINAL_PASSWORD\",
    \"displayName\": \"Password Test User\",
    \"role\": \"individual\"
  }")

body=$(cat "$temp_file")
rm -f "$temp_file"

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    TOKEN=$(echo "$body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✓${NC} User registered successfully"
    echo -e "   Email: $TEST_EMAIL"
else
    echo -e "${RED}✗${NC} Registration failed (HTTP $http_code)"
    echo "$body"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 2: Change password${NC}"
temp_file=$(mktemp)
http_code=$(curl -s -o "$temp_file" -w "%{http_code}" -X PATCH "${API_URL}/api/user/password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"currentPassword\": \"$ORIGINAL_PASSWORD\",
    \"newPassword\": \"$NEW_PASSWORD\"
  }")

body=$(cat "$temp_file")
rm -f "$temp_file"

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓${NC} Password changed successfully"
    
    # Check if requiresReauthentication flag is present
    if echo "$body" | grep -q "requiresReauthentication"; then
        echo -e "${GREEN}✓${NC} Backend signals re-authentication required"
    else
        echo -e "${YELLOW}⚠${NC} Backend doesn't signal re-authentication (not critical)"
    fi
else
    echo -e "${RED}✗${NC} Password change failed (HTTP $http_code)"
    echo "$body"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 3: Wait for potential cache/token issues (2 seconds)${NC}"
sleep 2

echo ""
echo -e "${BLUE}Step 4: Try logging in with OLD password (should fail)${NC}"
temp_file=$(mktemp)
http_code=$(curl -s -o "$temp_file" -w "%{http_code}" -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$ORIGINAL_PASSWORD\"
  }")

body=$(cat "$temp_file")
rm -f "$temp_file"

if [ "$http_code" = "401" ]; then
    echo -e "${GREEN}✓${NC} Old password correctly rejected (HTTP 401)"
else
    echo -e "${RED}✗${NC} Old password still works! (HTTP $http_code) - PASSWORD CHANGE FAILED"
    echo -e "${YELLOW}Response body:${NC} $body"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 5: Try logging in with NEW password (should succeed)${NC}"
temp_file=$(mktemp)
http_code=$(curl -s -o "$temp_file" -w "%{http_code}" -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$NEW_PASSWORD\"
  }")

body=$(cat "$temp_file")
rm -f "$temp_file"

if [ "$http_code" = "200" ]; then
    NEW_TOKEN=$(echo "$body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$NEW_TOKEN" ]; then
        echo -e "${GREEN}✓${NC} Login successful with new password"
        echo -e "   New token received"
    else
        echo -e "${YELLOW}⚠${NC} Login returned 200 but no token"
    fi
else
    echo -e "${RED}✗${NC} Login with new password failed (HTTP $http_code)"
    echo "$body"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 6: Verify new token works${NC}"
temp_file=$(mktemp)
http_code=$(curl -s -o "$temp_file" -w "%{http_code}" -X GET "${API_URL}/api/user/profile" \
  -H "Authorization: Bearer $NEW_TOKEN")

body=$(cat "$temp_file")
rm -f "$temp_file"

if [ "$http_code" = "200" ]; then
    if echo "$body" | grep -q "$TEST_EMAIL"; then
        echo -e "${GREEN}✓${NC} New token is valid and works correctly"
    else
        echo -e "${YELLOW}⚠${NC} Token works but profile data seems incorrect"
    fi
else
    echo -e "${RED}✗${NC} New token doesn't work (HTTP $http_code)"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   PASSWORD CHANGE FIX VERIFIED! ✓     ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}All tests passed:${NC}"
echo -e "  ✓ Password changed successfully"
echo -e "  ✓ Old password rejected"
echo -e "  ✓ New password works"
echo -e "  ✓ New token is valid"
echo ""
echo -e "${BLUE}The password change issue is now FIXED!${NC}"
echo ""

exit 0
