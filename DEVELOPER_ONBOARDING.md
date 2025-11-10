# 🚀 Developer Onboarding Guide

Welcome to the MindfulMe development team! This guide will get you up and running.

## 📋 Prerequisites Checklist

Before you begin, ensure you have:

- [ ] **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- [ ] **npm** >= 9.0.0 (comes with Node.js)
- [ ] **Git** latest version
- [ ] **Code Editor** (VS Code recommended)
- [ ] **PostgreSQL** (optional, we'll use SQLite for local dev)
- [ ] **GitHub Account** with access to repository

## 🔧 Initial Setup (30 minutes)

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/David-2911/ForYourMind.git
cd ForYourMind

# Create your feature branch
git checkout -b feature/your-name-setup
```

### Step 2: Install Dependencies

```bash
# Install all workspace dependencies
npm install

# This installs dependencies for:
# - Root workspace
# - shared/ package
# - backend/ package  
# - frontend/ package
```

**Expected output:**
```
added 1200+ packages in ~2 minutes
```

### Step 3: Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Open in editor
code .env  # or nano .env
```

**For local development, use these settings:**

```bash
# .env (Development Configuration)

# Use SQLite for local dev (no external DB needed!)
USE_SQLITE=true
SQLITE_DB_PATH=./backend/data/db.sqlite

# JWT Secret (use any random string for dev)
JWT_SECRET=dev-secret-key-change-in-production

# Token expiration
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d

# Server ports
PORT=5000
VITE_PORT=5173

# CORS (allow frontend to call backend)
CORS_ORIGIN=http://localhost:5173

# Frontend API URL
VITE_API_URL=http://localhost:5000
VITE_NODE_ENV=development

# Node environment
NODE_ENV=development
```

### Step 4: Build Shared Package

```bash
# This is REQUIRED before running backend or frontend
npm run build:shared

# Expected output:
# > @mindfulme/shared@1.0.0 build
# > tsc
```

**Why?** The shared package contains all types used by backend and frontend. It must be built first.

### Step 5: Initialize Database

```bash
# Push database schema (creates SQLite file)
npm run db:push

# Expected output:
# ✅ Schema pushed successfully
```

This creates `backend/data/db.sqlite` with all tables.

### Step 6: Start Development Servers

```bash
# Start everything at once
npm run dev

# You should see:
# [SHARED]   Watching for changes...
# [BACKEND]  ✅ Backend server running on http://localhost:5000
# [FRONTEND] ➜ Local: http://localhost:5173/
```

**Or start individually (3 terminals):**

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend

# Terminal 3: Shared (watch mode)
npm run dev:shared
```

### Step 7: Verify Setup

1. **Open browser**: http://localhost:5173
2. **Register account**: Click "Sign Up"
3. **Check backend**: Backend logs should show requests
4. **Test features**: Try logging mood, creating journal entry

**If you see the login page, you're all set! 🎉**

## 🏗️ Project Structure Overview

```
MindfulMe/
│
├── shared/                   # Shared code (types, schemas, constants)
│   ├── src/
│   │   ├── schema.ts        # ⭐ Database schema (Drizzle ORM)
│   │   ├── types/           # Additional TypeScript types
│   │   ├── constants.ts     # App-wide constants
│   │   └── index.ts         # Main exports
│   └── dist/                # Built output (generated)
│
├── backend/                  # Express API server
│   ├── src/
│   │   ├── index.ts         # ⭐ Server entry point
│   │   ├── routes/          # API endpoint handlers
│   │   ├── storage/         # Data access layer
│   │   └── middleware/      # Express middleware
│   └── dist/                # Built bundle (generated)
│
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── main.tsx         # ⭐ React entry point
│   │   ├── App.tsx          # Root component with routing
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable UI components
│   │   ├── lib/             # Utilities (auth, API client)
│   │   └── hooks/           # Custom React hooks
│   └── dist/                # Vite build output (generated)
│
├── docs/                     # Documentation
├── package.json              # ⭐ Root workspace config
├── .env                      # Environment variables (YOU create this)
├── .env.example              # Environment template
└── README.md                 # Main documentation
```

## 💡 Key Concepts

### 1. Monorepo with npm Workspaces

We use a **monorepo** structure where multiple packages live in one repository:

- **shared/** - Types and schemas used by backend and frontend
- **backend/** - Express API server
- **frontend/** - React application

**Benefits:**
- Single source of truth for types
- Easy to make cross-package changes
- Consistent tooling and versions

### 2. Shared Package First

The `shared/` package contains:
- Database schema (Drizzle ORM)
- TypeScript types
- Validation schemas (Zod)
- Constants (API endpoints, validation rules, etc.)

**Always build shared first:**
```bash
npm run build:shared
```

### 3. Import Patterns

**Importing from shared:**
```typescript
// Backend or Frontend
import { User, Journal, MOOD_SCORES } from "@mindfulme/shared";
import { insertUserSchema } from "@mindfulme/shared/schema";
import { API_ENDPOINTS } from "@mindfulme/shared/constants";
```

**Frontend local imports:**
```typescript
import { Button } from "@/components/ui/button";  // @ = frontend/src/
import { useAuth } from "@/lib/auth";
```

### 4. Development Workflow

```
1. Make changes to code
2. TypeScript checks types (in editor)
3. Vite/ts-node reloads automatically
4. See changes in browser immediately
```

**For shared package changes:**
```
1. Edit shared/src/schema.ts (or other file)
2. Save file
3. If dev:shared is running, it rebuilds automatically
4. Backend and frontend pick up changes
```

## 🎯 Your First Task

Let's make a simple change to verify your setup works:

### Task: Add Your Name to the Login Page

1. **Open file:** `frontend/src/pages/auth.tsx`

2. **Find the login form** (around line 150)

3. **Add your name:**
```tsx
<h1 className="text-2xl font-bold text-center text-[--color-primary]">
  Welcome to MindfulMe
  {/* Add this line: */}
  <span className="text-sm block mt-2">Set up by: YOUR NAME</span>
</h1>
```

4. **Save file** and check browser - should update automatically!

5. **Commit your change:**
```bash
git add frontend/src/pages/auth.tsx
git commit -m "Add my name to login page"
git push origin feature/your-name-setup
```

## 📖 Common Tasks

### Adding a New API Endpoint

**Backend: `backend/src/routes/index.ts`**
```typescript
// Add new route
app.get("/api/new-endpoint", async (req, res) => {
  res.json({ message: "Hello from new endpoint!" });
});
```

**Frontend: Call the endpoint**
```typescript
import { apiRequest } from "@/lib/queryClient";

const response = await apiRequest("GET", "/api/new-endpoint");
```

### Adding a New Database Table

1. **Edit schema:** `shared/src/schema.ts`
```typescript
export const myNewTable = pgTable("my_new_table", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type MyNewTable = typeof myNewTable.$inferSelect;
```

2. **Build shared:**
```bash
cd shared && npm run build
```

3. **Push to database:**
```bash
npm run db:push
```

4. **Use in backend/frontend:**
```typescript
import { MyNewTable } from "@mindfulme/shared";
```

### Running Database Migrations

```bash
# Generate migration file
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Drizzle Studio (visual DB editor)
npm run db:studio
```

## 🛠️ Essential Commands

**Daily development:**
```bash
npm run dev              # Start all services
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only
```

**Type checking:**
```bash
npm run check            # Check all packages
npm run check:backend    # Backend types
npm run check:frontend   # Frontend types
```

**Building:**
```bash
npm run build            # Build everything
npm run build:shared     # Build shared (do this first!)
```

**Database:**
```bash
npm run db:push          # Push schema changes
npm run db:studio        # Visual DB editor
```

**Cleanup:**
```bash
npm run clean            # Remove all build artifacts
```

## 🐛 Troubleshooting

### "Cannot find module '@mindfulme/shared'"

**Solution:**
```bash
cd shared
npm run build
cd ..
npm run dev
```

### "Type errors after pulling latest code"

**Solution:**
```bash
npm run clean
npm install
npm run build:shared
npm run check
```

### "Port 5000 already in use"

**Solution:**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in .env
echo "PORT=5001" >> .env
```

### "Database connection failed"

**Solution:**
Make sure SQLite is enabled in `.env`:
```bash
USE_SQLITE=true
SQLITE_DB_PATH=./backend/data/db.sqlite
```

### "Vite: Optimizable dependencies changed"

**Normal behavior** - Vite is re-optimizing dependencies. Just wait a few seconds.

## 📚 Learning Resources

**Project Documentation:**
- [README.md](README.md) - Main documentation
- [SHARED_MODULE_SETUP.md](SHARED_MODULE_SETUP.md) - Shared package guide
- [SHARED_QUICK_REFERENCE.md](SHARED_QUICK_REFERENCE.md) - Command reference
- [MONOREPO_STRUCTURE.md](MONOREPO_STRUCTURE.md) - Architecture diagrams

**External Resources:**
- [React Docs](https://react.dev/) - React framework
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - TypeScript language
- [Drizzle ORM Docs](https://orm.drizzle.team/) - Database ORM
- [Vite Guide](https://vitejs.dev/guide/) - Build tool
- [Shadcn/UI](https://ui.shadcn.com/) - UI components

## ✅ Onboarding Checklist

- [ ] Prerequisites installed (Node.js, npm, Git)
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Environment configured (`.env` file)
- [ ] Shared package built (`npm run build:shared`)
- [ ] Database initialized (`npm run db:push`)
- [ ] Dev servers running (`npm run dev`)
- [ ] Can access frontend (http://localhost:5173)
- [ ] Can register and login
- [ ] Made first commit
- [ ] Read project documentation
- [ ] Understand monorepo structure
- [ ] Know how to import from shared package
- [ ] Ready to code! 🚀

## 🤝 Getting Help

**Stuck? Here's how to get help:**

1. **Check documentation** in this repo first
2. **Search existing issues** on GitHub
3. **Ask team members** in Slack/Discord
4. **Create new issue** with detailed description

**When asking for help, include:**
- What you're trying to do
- What error you're seeing (full error message)
- What you've tried already
- Your environment (OS, Node version, etc.)

## 🎉 Welcome Aboard!

You're now ready to contribute to MindfulMe! 

**Next steps:**
1. Pick a task from the issue tracker
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

Happy coding! 🧠💚
