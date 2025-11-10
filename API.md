# MindfulMe API Documentation

Complete API reference for the MindfulMe backend.

**Base URL**: `http://localhost:5000` (development) or `https://your-api.onrender.com` (production)

**API Version**: v1

---

## Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Mood Tracking](#mood-tracking)
- [Journaling](#journaling)
- [Anonymous Rants](#anonymous-rants)
- [Analytics (Manager)](#analytics-manager)
- [Health Checks](#health-checks)
- [Error Responses](#error-responses)

---

## Authentication

All authenticated endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### POST /api/auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "username": "johndoe",
  "organizationName": "Acme Corporation"
}
```

**Validation Rules:**
- `email`: Valid email format, unique
- `password`: Min 8 characters, must contain uppercase, lowercase, number
- `username`: 3-30 characters, alphanumeric + underscore/dash
- `organizationName`: 2-100 characters

**Success Response (201 Created):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "role": "employee",
  "organizationId": 1,
  "createdAt": "2024-11-10T10:30:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data
- `409 Conflict`: Email already exists
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!",
    "username": "johndoe",
    "organizationName": "Acme Corp"
  }'
```

---

### POST /api/auth/login

Authenticate and receive access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "role": "employee"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Sets HTTP-only cookie:**
- Name: `refreshToken`
- HttpOnly: true
- Secure: true (production)
- SameSite: Strict
- Max-Age: 7 days

**Error Responses:**
- `400 Bad Request`: Missing credentials
- `401 Unauthorized`: Invalid credentials
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

---

### POST /api/auth/refresh

Refresh expired access token using refresh token.

**Request:**
- Refresh token from HTTP-only cookie
- No body required

**Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "role": "employee"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired refresh token
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Cookie: refreshToken=<token-from-login>" \
  --cookie-jar cookies.txt
```

---

### POST /api/auth/logout

Invalidate current refresh token.

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer <your-token>" \
  -H "Cookie: refreshToken=<token>"
```

---

## Users

### GET /api/users/me

Get current user's profile.

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "role": "employee",
  "organizationId": 1,
  "organization": {
    "id": 1,
    "name": "Acme Corporation"
  },
  "employee": {
    "id": 1,
    "department": "Engineering",
    "position": "Software Engineer",
    "isManager": false
  },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl http://localhost:5000/api/users/me \
  -H "Authorization: Bearer <your-token>"
```

---

### PATCH /api/users/me

Update current user's profile.

**Authentication:** Required

**Request Body (all fields optional):**
```json
{
  "username": "newusername",
  "department": "Marketing",
  "position": "Senior Engineer"
}
```

**Success Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "newusername",
  "employee": {
    "department": "Marketing",
    "position": "Senior Engineer"
  }
}
```

**Example:**
```bash
curl -X PATCH http://localhost:5000/api/users/me \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"username": "newname", "department": "Sales"}'
```

---

## Mood Tracking

### GET /api/mood/entries

Get mood entries for current user.

**Authentication:** Required

**Query Parameters:**
- `limit` (optional): Number of entries to return (default: 30, max: 100)
- `startDate` (optional): ISO 8601 date string (inclusive)
- `endDate` (optional): ISO 8601 date string (inclusive)

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "employeeId": 1,
    "moodScore": 8,
    "note": "Feeling great after team meeting!",
    "timestamp": "2024-11-10T14:30:00.000Z",
    "createdAt": "2024-11-10T14:30:05.000Z"
  },
  {
    "id": 2,
    "employeeId": 1,
    "moodScore": 6,
    "note": "Bit tired but productive day",
    "timestamp": "2024-11-09T16:00:00.000Z",
    "createdAt": "2024-11-09T16:00:12.000Z"
  }
]
```

**Example:**
```bash
# Get last 30 entries
curl http://localhost:5000/api/mood/entries \
  -H "Authorization: Bearer <your-token>"

# Get entries for specific date range
curl "http://localhost:5000/api/mood/entries?startDate=2024-11-01&endDate=2024-11-10&limit=50" \
  -H "Authorization: Bearer <your-token>"
```

---

### POST /api/mood/entries

Create a new mood entry.

**Authentication:** Required

**Request Body:**
```json
{
  "moodScore": 8,
  "note": "Feeling great after finishing the project!",
  "timestamp": "2024-11-10T14:30:00.000Z"
}
```

**Validation Rules:**
- `moodScore`: Integer between 1 and 10
- `note` (optional): Max 500 characters
- `timestamp` (optional): ISO 8601 date, defaults to current time

**Success Response (201 Created):**
```json
{
  "id": 1,
  "employeeId": 1,
  "moodScore": 8,
  "note": "Feeling great after finishing the project!",
  "timestamp": "2024-11-10T14:30:00.000Z",
  "createdAt": "2024-11-10T14:30:05.000Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X POST http://localhost:5000/api/mood/entries \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "moodScore": 8,
    "note": "Great day!",
    "timestamp": "2024-11-10T14:30:00.000Z"
  }'
```

---

### GET /api/mood/stats

Get mood statistics for current user.

**Authentication:** Required

**Query Parameters:**
- `period` (optional): `week`, `month`, `quarter`, `year` (default: `month`)

**Success Response (200 OK):**
```json
{
  "period": "month",
  "startDate": "2024-10-10T00:00:00.000Z",
  "endDate": "2024-11-10T23:59:59.000Z",
  "totalEntries": 25,
  "averageScore": 7.2,
  "highestScore": 10,
  "lowestScore": 4,
  "trend": "improving",
  "distribution": {
    "1": 0,
    "2": 1,
    "3": 2,
    "4": 1,
    "5": 3,
    "6": 4,
    "7": 5,
    "8": 6,
    "9": 2,
    "10": 1
  }
}
```

**Example:**
```bash
curl "http://localhost:5000/api/mood/stats?period=week" \
  -H "Authorization: Bearer <your-token>"
```

---

## Journaling

### GET /api/journal/entries

Get journal entries for current user.

**Authentication:** Required

**Query Parameters:**
- `limit` (optional): Number of entries (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `isPrivate` (optional): Filter by privacy (true/false)

**Success Response (200 OK):**
```json
{
  "entries": [
    {
      "id": 1,
      "employeeId": 1,
      "title": "Reflection on Q4 Goals",
      "content": "Today I made great progress on...",
      "isPrivate": true,
      "createdAt": "2024-11-10T10:00:00.000Z",
      "updatedAt": "2024-11-10T10:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

**Example:**
```bash
# Get all entries
curl http://localhost:5000/api/journal/entries \
  -H "Authorization: Bearer <your-token>"

# Get only private entries
curl "http://localhost:5000/api/journal/entries?isPrivate=true" \
  -H "Authorization: Bearer <your-token>"

# Pagination
curl "http://localhost:5000/api/journal/entries?limit=10&offset=20" \
  -H "Authorization: Bearer <your-token>"
```

---

### POST /api/journal/entries

Create a new journal entry.

**Authentication:** Required

**Request Body:**
```json
{
  "title": "My Reflection",
  "content": "Today I learned about...",
  "isPrivate": true
}
```

**Validation Rules:**
- `title`: 1-200 characters
- `content`: 1-10,000 characters
- `isPrivate`: Boolean (default: true)

**Success Response (201 Created):**
```json
{
  "id": 1,
  "employeeId": 1,
  "title": "My Reflection",
  "content": "Today I learned about...",
  "isPrivate": true,
  "createdAt": "2024-11-10T10:00:00.000Z",
  "updatedAt": "2024-11-10T10:00:00.000Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/journal/entries \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Daily Reflection",
    "content": "Today was productive...",
    "isPrivate": true
  }'
```

---

### PATCH /api/journal/entries/:id

Update a journal entry.

**Authentication:** Required (must own entry)

**Request Body (all fields optional):**
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "isPrivate": false
}
```

**Success Response (200 OK):**
```json
{
  "id": 1,
  "title": "Updated Title",
  "content": "Updated content...",
  "isPrivate": false,
  "updatedAt": "2024-11-10T11:00:00.000Z"
}
```

**Error Responses:**
- `403 Forbidden`: Not owner of entry
- `404 Not Found`: Entry doesn't exist

**Example:**
```bash
curl -X PATCH http://localhost:5000/api/journal/entries/1 \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "New Title", "isPrivate": false}'
```

---

### DELETE /api/journal/entries/:id

Delete a journal entry.

**Authentication:** Required (must own entry)

**Success Response (204 No Content)**

**Error Responses:**
- `403 Forbidden`: Not owner of entry
- `404 Not Found`: Entry doesn't exist

**Example:**
```bash
curl -X DELETE http://localhost:5000/api/journal/entries/1 \
  -H "Authorization: Bearer <your-token>"
```

---

## Anonymous Rants

### GET /api/rants

Get anonymous rants for current user's organization.

**Authentication:** Required

**Query Parameters:**
- `limit` (optional): Number of rants (default: 50, max: 200)
- `offset` (optional): Pagination offset (default: 0)

**Success Response (200 OK):**
```json
{
  "rants": [
    {
      "id": 1,
      "organizationId": 1,
      "content": "I wish we had better communication tools...",
      "sentimentScore": -0.2,
      "createdAt": "2024-11-10T09:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

**Note:** No user information is included - truly anonymous.

**Example:**
```bash
curl http://localhost:5000/api/rants \
  -H "Authorization: Bearer <your-token>"
```

---

### POST /api/rants

Post an anonymous rant.

**Authentication:** Required

**Request Body:**
```json
{
  "content": "I feel frustrated about the lack of work-life balance..."
}
```

**Validation Rules:**
- `content`: 10-2,000 characters

**Success Response (201 Created):**
```json
{
  "id": 1,
  "organizationId": 1,
  "content": "I feel frustrated about the lack of work-life balance...",
  "sentimentScore": -0.5,
  "createdAt": "2024-11-10T10:00:00.000Z"
}
```

**Note:** Response does NOT include any user-identifying information.

**Example:**
```bash
curl -X POST http://localhost:5000/api/rants \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "I wish we had better remote work policies..."
  }'
```

---

## Analytics (Manager)

**Note:** All analytics endpoints require `manager` or `admin` role.

### GET /api/analytics/team-wellness

Get overall team wellness metrics.

**Authentication:** Required (role: manager/admin)

**Query Parameters:**
- `period` (optional): `week`, `month`, `quarter`, `year` (default: `month`)
- `departmentId` (optional): Filter by specific department

**Success Response (200 OK):**
```json
{
  "period": "month",
  "startDate": "2024-10-10T00:00:00.000Z",
  "endDate": "2024-11-10T23:59:59.000Z",
  "totalEmployees": 50,
  "activeUsers": 45,
  "engagementRate": 0.9,
  "averageMoodScore": 7.3,
  "moodTrend": "improving",
  "departmentBreakdown": [
    {
      "department": "Engineering",
      "averageScore": 7.5,
      "employeeCount": 20,
      "activeCount": 18
    },
    {
      "department": "Sales",
      "averageScore": 7.1,
      "employeeCount": 15,
      "activeCount": 14
    }
  ],
  "riskFactors": {
    "low": 40,
    "medium": 8,
    "high": 2
  }
}
```

**Error Responses:**
- `403 Forbidden`: Not a manager/admin
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl "http://localhost:5000/api/analytics/team-wellness?period=month" \
  -H "Authorization: Bearer <your-manager-token>"
```

---

### GET /api/analytics/at-risk

Get list of employees showing at-risk behavior.

**Authentication:** Required (role: manager/admin)

**Success Response (200 OK):**
```json
{
  "atRiskEmployees": [
    {
      "employeeId": 5,
      "department": "Engineering",
      "riskLevel": "high",
      "recentAverageMood": 3.2,
      "daysWithLowMood": 7,
      "lastActivity": "2024-11-09T15:00:00.000Z",
      "recommendations": [
        "Check in with employee",
        "Offer wellness resources",
        "Consider workload adjustment"
      ]
    }
  ],
  "total": 1,
  "summary": {
    "high": 1,
    "medium": 3,
    "low": 5
  }
}
```

**Note:** No PII (personally identifiable information) returned to protect privacy.

**Example:**
```bash
curl http://localhost:5000/api/analytics/at-risk \
  -H "Authorization: Bearer <your-manager-token>"
```

---

### GET /api/analytics/engagement

Get engagement metrics.

**Authentication:** Required (role: manager/admin)

**Query Parameters:**
- `period` (optional): `week`, `month`, `quarter`, `year` (default: `month`)

**Success Response (200 OK):**
```json
{
  "period": "month",
  "metrics": {
    "dailyActiveUsers": 35,
    "weeklyActiveUsers": 42,
    "monthlyActiveUsers": 48,
    "totalUsers": 50,
    "engagementRate": 0.96,
    "averageSessionDuration": 420,
    "featuresUsed": {
      "moodTracking": 45,
      "journaling": 32,
      "anonymousRants": 28,
      "wellnessExercises": 25
    }
  },
  "trend": "increasing"
}
```

**Example:**
```bash
curl "http://localhost:5000/api/analytics/engagement?period=week" \
  -H "Authorization: Bearer <your-manager-token>"
```

---

## Health Checks

### GET /health

Detailed health check with system information.

**Authentication:** Not required

**Success Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2024-11-10T12:00:00.000Z",
  "uptime": 3600.5,
  "environment": "development",
  "database": "PostgreSQL",
  "version": "1.0.0",
  "checks": {
    "database": "connected",
    "memory": "ok",
    "cpu": "ok"
  }
}
```

**Example:**
```bash
curl http://localhost:5000/health
```

---

### GET /healthz

Simple liveness probe (Kubernetes-style).

**Authentication:** Not required

**Success Response (200 OK):**
```
OK
```

**Example:**
```bash
curl http://localhost:5000/healthz
```

---

### GET /ready

Readiness probe - checks if service can handle requests.

**Authentication:** Not required

**Success Response (200 OK):**
```json
{
  "ready": true,
  "checks": {
    "database": "ready",
    "dependencies": "ready"
  }
}
```

**Example:**
```bash
curl http://localhost:5000/ready
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {} // Optional additional info
}
```

### Common Error Codes

**400 Bad Request:**
```json
{
  "error": "Invalid input data",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  }
}
```

**401 Unauthorized:**
```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

**403 Forbidden:**
```json
{
  "error": "Insufficient permissions",
  "code": "FORBIDDEN",
  "details": {
    "required": "manager",
    "current": "employee"
  }
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found",
  "code": "NOT_FOUND"
}
```

**409 Conflict:**
```json
{
  "error": "Email already exists",
  "code": "CONFLICT",
  "details": {
    "field": "email"
  }
}
```

**429 Too Many Requests:**
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT",
  "details": {
    "retryAfter": 60
  }
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

---

## Rate Limiting

**Rate limits per user:**
- Authentication endpoints: 5 requests/minute
- Data read endpoints: 60 requests/minute
- Data write endpoints: 30 requests/minute

**Response headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1699632000
```

---

## Postman Collection

Import this OpenAPI specification into Postman:

```yaml
openapi: 3.0.0
info:
  title: MindfulMe API
  version: 1.0.0
  description: Mental wellness platform API
servers:
  - url: http://localhost:5000
    description: Development
  - url: https://your-api.onrender.com
    description: Production
```

---

## SDKs & Client Libraries

**JavaScript/TypeScript Client:**

```typescript
import { MindfulMeClient } from '@mindfulme/client';

const client = new MindfulMeClient({
  baseURL: 'http://localhost:5000',
  token: 'your-jwt-token'
});

// Get mood entries
const moods = await client.mood.getEntries({ limit: 30 });

// Create mood entry
const newMood = await client.mood.createEntry({
  moodScore: 8,
  note: 'Feeling great!'
});
```

---

For more information, see:
- [README.md](README.md) - Getting started
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines
