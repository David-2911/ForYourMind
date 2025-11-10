# Secrets Management Guide

Complete guide for managing sensitive credentials, API keys, and secrets in the MindfulMe application.

---

## Table of Contents

1. [Overview](#overview)
2. [Environment Files (.env)](#environment-files-env)
3. [JWT Secrets](#jwt-secrets)
4. [Database Credentials](#database-credentials)
5. [API Keys & Third-Party Services](#api-keys--third-party-services)
6. [Development vs Production](#development-vs-production)
7. [Secret Rotation](#secret-rotation)
8. [Security Best Practices](#security-best-practices)
9. [Emergency Procedures](#emergency-procedures)

---

## Overview

### What are Secrets?

Secrets are sensitive credentials that should **never** be exposed publicly:

🔐 **Backend Secrets** (server-side only):
- JWT signing keys
- Database connection strings
- Cookie secrets
- SMTP passwords
- Private API keys

🌐 **Frontend Secrets** (careful!):
- Public API keys only (Stripe public key, Google Maps key)
- **Never** store private keys in frontend!

### Security Principles

1. **Never commit secrets to Git**
2. **Use different secrets per environment**
3. **Rotate secrets regularly**
4. **Use minimum required permissions**
5. **Store secrets in platform environment variables**

---

## Environment Files (.env)

### File Structure

```
/home/dave/Downloads/MindfulMe/
  .env                    ← Root (for local development)
  .env.example            ← Template (safe to commit)
  .gitignore              ← Ensures .env is not committed
  
  backend/
    .env.example          ← Backend template (safe to commit)
  
  frontend/
    .env.example          ← Frontend template (safe to commit)
```

### Setup for Development

1. **Copy example files**:
   ```bash
   cp .env.example .env
   ```

2. **Generate secure secrets**:
   ```bash
   # Generate JWT secret (32+ characters)
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Generate cookie secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Fill in values** in `.env`:
   ```bash
   JWT_SECRET=<generated-secret-here>
   COOKIE_SECRET=<generated-secret-here>
   DATABASE_URL=postgresql://...
   ```

### .env.example Files

**Purpose**: Templates showing required variables without real secrets

**Safe to commit**: ✅ Yes (no actual secrets)

**Example** (`.env.example`):
```bash
# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-change-in-production
COOKIE_SECRET=your-super-secret-cookie-key-min-32-characters-long

# Database
DATABASE_URL=postgresql://user:password@host:5432/database
```

---

## JWT Secrets

### What is JWT_SECRET?

The **JWT_SECRET** is used to sign and verify JSON Web Tokens for user authentication. If compromised, attackers can forge authentication tokens.

### Requirements

✅ **Minimum 32 characters**  
✅ **Cryptographically random**  
✅ **Unique per environment**  
✅ **Never reused**  

### Generating Secure JWT Secrets

#### Method 1: Node.js (Recommended)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: 8f7d9a6b5c4e3d2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f
```

#### Method 2: OpenSSL

```bash
openssl rand -hex 32
```

#### Method 3: Online (use with caution)

Only for development! Never for production.

```
https://randomkeygen.com/
```

### Setting JWT_SECRET

**Development** (`.env`):
```bash
JWT_SECRET=8f7d9a6b5c4e3d2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f
```

**Production** (platform environment variables):
- Render: Settings → Environment → Add `JWT_SECRET`
- Vercel: Settings → Environment Variables → Add `JWT_SECRET`
- Fly.io: `flyctl secrets set JWT_SECRET=...`

### Token Expiration

Configure token lifetimes:

```bash
# Short-lived access token (15 minutes)
ACCESS_TOKEN_TTL=15m

# Long-lived refresh token (7 days)
REFRESH_TOKEN_TTL=7d
```

**Shorter = more secure, longer = more convenient**

---

## Database Credentials

### Connection Strings

Database credentials are stored in `DATABASE_URL`:

```
postgresql://username:password@host:port/database?sslmode=require
```

### Security Considerations

🔐 **SSL/TLS Required**:
```bash
# Always use SSL in production
DATABASE_URL=postgresql://...?sslmode=require
```

🔑 **Strong Passwords**:
- Minimum 16 characters
- Mix of letters, numbers, symbols
- Avoid dictionary words

🌍 **IP Whitelisting**:
- Restrict database access to your backend server IPs only
- Use VPCs/private networks when possible

### Database Providers

#### Neon (Recommended)

```bash
DATABASE_URL=postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/dbname?sslmode=require
```

**Security features**:
- Automatic SSL encryption
- IP restrictions available
- Connection pooling
- Serverless (no exposed ports)

#### Render

```bash
DATABASE_URL=postgresql://user:pass@dpg-xyz.oregon-postgres.render.com/dbname
```

**Security features**:
- Free SSL certificates
- Private networking
- Automatic backups
- Access control

#### Supabase

```bash
DATABASE_URL=postgresql://postgres:pass@db.xyz.supabase.co:5432/postgres
```

**Security features**:
- Row-level security
- Built-in auth
- API keys separate from DB password

### SQLite (Development Only)

SQLite has no password - the file IS the database:

```bash
USE_SQLITE=true
SQLITE_DB_PATH=./backend/data/db.sqlite
```

⚠️ **Never use SQLite in production** (not suitable for concurrent access)

---

## API Keys & Third-Party Services

### Types of API Keys

1. **Private Keys** (backend only)
   - Full access to service
   - Can incur charges
   - **Never** expose to frontend

2. **Public Keys** (frontend safe)
   - Limited, read-only access
   - Rate-limited
   - Safe to include in client code

### SMTP Email

**Provider**: Gmail, SendGrid, Mailgun, AWS SES

**Configuration**:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # ← Secret!
SMTP_FROM=noreply@mindfulme.com
```

**Gmail App Passwords**:
1. Enable 2FA on your Google account
2. Go to: https://myaccount.google.com/apppasswords
3. Generate app password
4. Use generated password in `SMTP_PASS`

**⚠️ Never use your real Gmail password!**

### Sentry (Error Tracking)

**Backend DSN** (private):
```bash
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**Frontend DSN** (public - different from backend):
```bash
VITE_SENTRY_DSN=https://yyy@yyy.ingest.sentry.io/yyy
```

Create **separate projects** in Sentry for backend and frontend!

### Stripe (Payments)

**Backend** (secret key):
```bash
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx  # ← Never expose!
```

**Frontend** (publishable key):
```bash
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx  # ← Safe to expose
```

Use **test keys** in development:
- Test secret: `sk_test_...`
- Test publishable: `pk_test_...`

### AWS S3 (File Storage)

```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=mindfulme-uploads
AWS_REGION=us-east-1
```

**Best practice**: Use IAM role with minimum permissions:
```json
{
  "Effect": "Allow",
  "Action": ["s3:PutObject", "s3:GetObject"],
  "Resource": "arn:aws:s3:::mindfulme-uploads/*"
}
```

### Redis (Caching)

```bash
REDIS_URL=redis://default:password@redis.example.com:6379
```

**Providers**:
- Upstash (serverless)
- Redis Cloud
- Render Redis

---

## Development vs Production

### Environment Separation

| Aspect | Development | Production |
|--------|-------------|------------|
| **Secrets** | Weak, shared team secrets | Strong, unique secrets |
| **Database** | SQLite or dev PostgreSQL | Production PostgreSQL |
| **API Keys** | Test/sandbox keys | Live keys |
| **Domain** | localhost | Actual domain |
| **SSL** | Not required | Required |

### Development Secrets

**Location**: Local `.env` file (git-ignored)

**Security**: Lower (shared with team via secure channel)

**Example**:
```bash
JWT_SECRET=dev-secret-not-for-production
DATABASE_URL=postgresql://dev:dev@localhost:5432/mindfulme_dev
STRIPE_SECRET_KEY=sk_test_...
```

### Production Secrets

**Location**: Platform environment variables (Render, Vercel, Fly.io)

**Security**: High (unique, rotated, restricted access)

**Example**:
```bash
# Set in Render dashboard
JWT_SECRET=8f7d9a6b5c4e3d2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f
DATABASE_URL=postgresql://prod:strongpass@db.render.com:5432/mindfulme_prod
STRIPE_SECRET_KEY=sk_live_...
```

### Setting Production Secrets

#### Render

1. Go to dashboard → Your service
2. Click "Environment"
3. Add variables:
   - `JWT_SECRET`: `<generated-secret>`
   - `DATABASE_URL`: `<connection-string>`
   - etc.
4. Click "Save Changes"
5. Service auto-restarts

#### Vercel (Frontend)

1. Go to project settings → Environment Variables
2. Add VITE_* variables:
   - `VITE_API_URL`: `https://api.mindfulme.com`
   - `VITE_STRIPE_PUBLIC_KEY`: `pk_live_...`
3. Select environments: Production, Preview, Development
4. Redeploy for changes to take effect

#### Fly.io

```bash
# Set secrets via CLI
flyctl secrets set JWT_SECRET=<secret>
flyctl secrets set DATABASE_URL=<url>

# List secrets (values hidden)
flyctl secrets list
```

---

## Secret Rotation

### Why Rotate Secrets?

- Prevent long-term compromise
- Comply with security policies
- Remove access for ex-employees
- Best practice (like changing passwords)

### When to Rotate

⏰ **Regular Schedule**:
- JWT secrets: Every 90 days
- Database passwords: Every 180 days
- API keys: Per provider recommendation

🚨 **Immediate**:
- Secret leaked in Git
- Employee departure
- Suspected breach
- Service compromise

### How to Rotate

#### JWT Secret Rotation

1. **Generate new secret**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Update in production** (platform environment variables)

3. **Restart service** (happens automatically on most platforms)

4. **Users will be logged out** (need to re-authenticate)

**Zero-downtime rotation** (advanced):
- Support multiple secrets in array
- Sign with new, verify with old + new
- After expiration, remove old

#### Database Password Rotation

1. **Create new user** with same permissions:
   ```sql
   CREATE USER mindfulme_new WITH PASSWORD 'new-strong-password';
   GRANT ALL PRIVILEGES ON DATABASE mindfulme TO mindfulme_new;
   ```

2. **Update DATABASE_URL** with new credentials

3. **Test connection** before deleting old user

4. **Delete old user** after verification:
   ```sql
   DROP USER mindfulme_old;
   ```

#### API Key Rotation

1. **Generate new key** in service dashboard (Stripe, AWS, etc.)

2. **Update environment variable** with new key

3. **Test functionality** with new key

4. **Revoke old key** in service dashboard

---

## Security Best Practices

### ✅ DO

- **Use environment variables** for all secrets
- **Generate cryptographically random secrets**
- **Use different secrets per environment**
- **Rotate secrets regularly**
- **Use minimum required permissions** (principle of least privilege)
- **Enable SSL/TLS** for all connections
- **Monitor for leaked secrets** (GitHub secret scanning, GitGuardian)
- **Store backup secrets securely** (password manager, 1Password, etc.)
- **Limit who has access** to production secrets
- **Use secret management services** (AWS Secrets Manager, HashiCorp Vault) for large teams

### ❌ DON'T

- **Never commit `.env` files** to Git
- **Never hardcode secrets** in code
- **Never log secrets** (watch for console.log, error messages)
- **Never email secrets** (use encrypted channels)
- **Never reuse secrets** across environments
- **Never store secrets in frontend** code (only public keys!)
- **Never share secrets in Slack/Discord**
- **Never use default/example secrets** in production

### Git Protection

**Always in `.gitignore`**:
```gitignore
# Environment files
.env
.env.local
.env.*.local
*.env
backend/.env
frontend/.env

# Database files
*.sqlite
*.sqlite-*
*.db

# Credentials
credentials.json
secrets.json
```

### Secret Validation

Use validation in code:

```typescript
// backend/src/config/env.ts
const envSchema = z.object({
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  COOKIE_SECRET: z.string().min(32, "COOKIE_SECRET must be at least 32 characters"),
  // ... more validation
});
```

This fails fast if secrets are weak or missing!

---

## Emergency Procedures

### Secret Leaked in Git

**1. Rotate immediately**:
```bash
# Generate new secret
NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Update in production (e.g., Render)
# Dashboard → Environment → JWT_SECRET → $NEW_SECRET → Save
```

**2. Remove from Git history** (if recently committed):
```bash
# Revert commit (if not pushed)
git reset --soft HEAD~1

# Or use git-filter-repo (if pushed)
# https://github.com/newren/git-filter-repo
```

**3. Invalidate leaked secret**:
- Revoke API keys in service dashboards
- Change database passwords
- Force user re-authentication (JWT)

**4. Monitor for abuse**:
- Check service logs for unusual activity
- Review database audit logs
- Monitor API usage/billing

### Suspected Breach

**1. Rotate all secrets immediately**

**2. Review access logs**:
```bash
# Check for unauthorized access
grep "401\|403\|500" logs/backend.log
```

**3. Force password reset** for all users (if user data compromised)

**4. Notify users** if required by law (GDPR, etc.)

**5. Conduct security audit**

### Lost Access to Production

**1. Contact platform support** (Render, Vercel, etc.)

**2. Verify identity** (may require ID, billing info)

**3. Reset admin credentials**

**4. Rotate all secrets** after regaining access

---

## Tools & Services

### Secret Management Tools

1. **1Password** / **Bitwarden**
   - Store development secrets
   - Share with team securely
   - Generate strong secrets

2. **AWS Secrets Manager**
   - Automatic rotation
   - Encryption at rest
   - Audit logging

3. **HashiCorp Vault**
   - Enterprise secret management
   - Dynamic secrets
   - Encryption as a service

4. **Doppler**
   - Multi-environment secrets
   - Sync to deployments
   - Team collaboration

### Secret Scanning Tools

1. **GitGuardian**
   - Scans Git commits for secrets
   - Real-time alerts
   - Integrates with GitHub

2. **TruffleHog**
   - Open-source secret scanner
   - Scans Git history
   - CLI tool

3. **GitHub Secret Scanning**
   - Built into GitHub
   - Automatic alerts
   - Free for public repos

---

## Quick Reference

### Generate Secrets

```bash
# JWT/Cookie secret (32 bytes hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Strong password (random, 32 chars)
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"

# UUID
node -e "console.log(require('crypto').randomUUID())"
```

### Check for Leaked Secrets

```bash
# Search Git history for potential secrets
git log -p | grep -E 'password|secret|key|token' -i

# Scan with TruffleHog
trufflehog git file://. --only-verified
```

### Backend Secrets Checklist

- [ ] JWT_SECRET (32+ chars, random)
- [ ] COOKIE_SECRET (32+ chars, random)
- [ ] DATABASE_URL (SSL enabled)
- [ ] SMTP_PASS (app password, not real password)
- [ ] API keys for third-party services

### Frontend Secrets Checklist

- [ ] Only VITE_* prefixed variables
- [ ] Only public API keys (Stripe public, Google Maps, etc.)
- [ ] No private keys or secrets
- [ ] Different values than backend

---

## Additional Resources

- **OWASP Secrets Management**: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- **12-Factor App**: https://12factor.net/config
- **GitHub Secret Scanning**: https://docs.github.com/en/code-security/secret-scanning
- **NIST Password Guidelines**: https://pages.nist.gov/800-63-3/sp800-63b.html

---

**Need help?** Check the main [README.md](./README.md) or [DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md)
