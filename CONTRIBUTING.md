# Contributing to MindfulMe

First off, thank you for considering contributing to MindfulMe! It's people like you that make MindfulMe such a great tool for mental wellness.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How Can I Contribute?](#how-can-i-contribute)
- [Style Guidelines](#style-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation Guidelines](#documentation-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

**Positive behaviors:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors:**
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git** for version control
- **PostgreSQL** >= 14.0 (optional, SQLite for dev)
- **Docker** (optional, for containerized development)
- **VS Code** (recommended) or your preferred editor

### Development Setup

1. **Fork the repository**
   ```bash
   # Using GitHub CLI
   gh repo fork David-2911/ForYourMind

   # Or via GitHub web interface
   # Visit https://github.com/David-2911/ForYourMind
   # Click "Fork" button
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ForYourMind.git
   cd ForYourMind
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/David-2911/ForYourMind.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up environment**
   ```bash
   cp .env.example .env
   
   # Generate secrets
   node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))" >> .env
   node -e "console.log('COOKIE_SECRET=' + require('crypto').randomBytes(32).toString('hex'))" >> .env
   ```

6. **Build shared package**
   ```bash
   npm run build:shared
   ```

7. **Set up database**
   ```bash
   npm run db:migrate
   ```

8. **Start development servers**
   ```bash
   npm run dev
   ```

9. **Verify setup**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000/health
   - Database GUI: http://localhost:4983

### VS Code Setup (Recommended)

Install recommended extensions when prompted, or manually:

```bash
# Extensions for optimal DX
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-typescript-next
```

**Workspace settings** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## How Can I Contribute?

### Reporting Bugs

**Before submitting a bug report:**
- Check the [documentation](docs/)
- Search [existing issues](https://github.com/David-2911/ForYourMind/issues)
- Try the latest version
- Collect information about the bug

**How to submit a good bug report:**

Use the bug report template:

```markdown
**Description**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. Ubuntu 22.04]
- Node.js: [e.g. 18.17.0]
- Browser: [e.g. Chrome 119]
- Version: [e.g. 1.0.0]

**Additional Context**
Any other context about the problem.

**Logs**
```
Paste relevant logs here
```
```

### Suggesting Enhancements

**Before submitting an enhancement:**
- Check if it's already been suggested
- Consider if it aligns with project goals
- Think about how it benefits the majority

**How to submit a good enhancement suggestion:**

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context, mockups, or examples.

**Implementation ideas**
If you have ideas on how to implement this.
```

### Your First Code Contribution

**Good first issues:**
- Look for issues tagged [`good first issue`](https://github.com/David-2911/ForYourMind/labels/good%20first%20issue)
- Issues tagged [`help wanted`](https://github.com/David-2911/ForYourMind/labels/help%20wanted)
- Documentation improvements
- Test coverage improvements

**Areas that need help:**
- 🧪 **Testing** - Unit tests, integration tests, E2E tests
- 📚 **Documentation** - Guides, tutorials, API docs
- 🎨 **UI/UX** - Component improvements, accessibility
- 🐛 **Bug Fixes** - Check open issues
- ✨ **Features** - New wellness tools or analytics

## Style Guidelines

### TypeScript Style Guide

We follow standard TypeScript best practices:

**Types:**
```typescript
// ✅ DO: Use interfaces for object shapes
interface User {
  id: number;
  email: string;
  username: string;
}

// ✅ DO: Use type for unions and complex types
type Status = "active" | "inactive" | "pending";
type ApiResponse<T> = { data: T } | { error: string };

// ❌ DON'T: Use any
const data: any = fetchData();  // Bad

// ✅ DO: Use unknown or specific types
const data: unknown = fetchData();  // Good
const typedData = parseData<User>(data);
```

**Functions:**
```typescript
// ✅ DO: Use explicit return types
function calculateScore(entries: MoodEntry[]): number {
  return entries.reduce((sum, e) => sum + e.score, 0);
}

// ✅ DO: Use async/await for promises
async function fetchUser(id: number): Promise<User> {
  const response = await api.get(`/users/${id}`);
  return response.data;
}

// ❌ DON'T: Use var
var count = 0;  // Bad

// ✅ DO: Use const/let
const count = 0;  // Good
let counter = 0;  // Good
```

**Imports:**
```typescript
// ✅ DO: Use absolute imports for shared
import { User } from "@mindfulme/shared";

// ✅ DO: Use @ alias for frontend
import { Button } from "@/components/ui/button";

// ✅ DO: Group imports
import { useState, useEffect } from "react";  // External
import { User } from "@mindfulme/shared";     // Shared
import { useAuth } from "@/lib/auth";         // Local
```

### React Component Guidelines

```typescript
// ✅ DO: Use functional components
export function UserProfile({ user }: { user: User }) {
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <div>
      <h2>{user.username}</h2>
      {isEditing && <EditForm user={user} />}
    </div>
  );
}

// ✅ DO: Use TypeScript for props
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}

export function Button({ children, onClick, variant = "primary", disabled = false }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
}

// ✅ DO: Use custom hooks for logic
function useUserData(userId: number) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId),
  });
}
```

### CSS/Tailwind Guidelines

```tsx
// ✅ DO: Use Tailwind utility classes
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-md">
  <Avatar className="h-12 w-12" />
  <div className="flex-1">
    <h3 className="text-lg font-semibold">Username</h3>
    <p className="text-sm text-gray-600">Bio text</p>
  </div>
</div>

// ✅ DO: Use cn() helper for conditional classes
import { cn } from "@/lib/utils";

<Button className={cn(
  "base-classes",
  isActive && "active-classes",
  isDisabled && "disabled-classes"
)} />

// ❌ DON'T: Use inline styles (except dynamic values)
<div style={{ color: "red" }}>Bad</div>  // Bad

// ✅ DO: Use Tailwind or CSS modules
<div className="text-red-600">Good</div>  // Good
```

### Backend API Guidelines

```typescript
// ✅ DO: Use proper HTTP methods
app.get("/api/users/:id", async (req, res) => {
  // GET for reading
});

app.post("/api/users", async (req, res) => {
  // POST for creating
});

app.patch("/api/users/:id", async (req, res) => {
  // PATCH for partial updates
});

app.delete("/api/users/:id", async (req, res) => {
  // DELETE for removing
});

// ✅ DO: Validate input
app.post("/api/users", async (req, res) => {
  const result = insertUserSchema.safeParse(req.body);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  const user = await createUser(result.data);
  res.status(201).json(user);
});

// ✅ DO: Handle errors properly
app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await findUser(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
```

### Database Query Guidelines

```typescript
// ✅ DO: Use Drizzle ORM
import { db } from "./database";
import { users, moodEntries } from "@mindfulme/shared/schema";

// Simple query
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
});

// With relations
const userWithMoods = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    moodEntries: {
      orderBy: desc(moodEntries.timestamp),
      limit: 10,
    },
  },
});

// ✅ DO: Use transactions for multiple operations
await db.transaction(async (tx) => {
  const user = await tx.insert(users).values(newUser).returning();
  await tx.insert(employees).values({ userId: user.id, ...employeeData });
});

// ✅ DO: Add indexes for performance
// In schema.ts
export const users = pgTable("users", {
  // ...fields
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  usernameIdx: index("username_idx").on(table.username),
}));
```

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring (no functional changes)
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (deps, config, etc.)
- **ci**: CI/CD changes

### Scopes

- **shared**: Shared package changes
- **backend**: Backend API changes
- **frontend**: Frontend app changes
- **db**: Database schema or migrations
- **docs**: Documentation changes
- **deps**: Dependency updates

### Examples

```bash
# New feature
git commit -m "feat(frontend): add mood tracking chart component"

# Bug fix
git commit -m "fix(backend): correct JWT token expiration time"

# Documentation
git commit -m "docs: update deployment guide with Docker instructions"

# Breaking change
git commit -m "feat(backend)!: change authentication to use refresh tokens

BREAKING CHANGE: Authentication now requires refresh tokens. 
Clients must update to use the new /auth/refresh endpoint."

# Multiple scopes
git commit -m "feat(backend,frontend): add user profile editing"

# With body and footer
git commit -m "fix(backend): prevent duplicate user registration

Check for existing users before creating new accounts.
Add unique constraint on email field.

Fixes #123
Closes #456"
```

## Pull Request Process

### Before Submitting

1. **Update your fork**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow style guidelines
   - Add tests if applicable
   - Update documentation

4. **Test your changes**
   ```bash
   npm run check         # Type check
   npm run build         # Build test
   npm run test          # Unit tests
   npm run dev           # Manual testing
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

### Submitting the PR

1. **Create Pull Request**
   - Go to your fork on GitHub
   - Click "Compare & pull request"
   - Fill out the PR template

2. **PR Title Format**
   ```
   <type>(<scope>): <description>
   ```

3. **PR Description Template**
   ```markdown
   ## Description
   Brief description of what this PR does.

   ## Type of Change
   - [ ] Bug fix (non-breaking change which fixes an issue)
   - [ ] New feature (non-breaking change which adds functionality)
   - [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
   - [ ] Documentation update

   ## How Has This Been Tested?
   Describe the tests you ran:
   - [ ] Unit tests pass
   - [ ] Manual testing completed
   - [ ] Integration tests pass

   ## Checklist
   - [ ] My code follows the style guidelines
   - [ ] I have performed a self-review
   - [ ] I have commented my code where necessary
   - [ ] I have updated the documentation
   - [ ] My changes generate no new warnings
   - [ ] I have added tests that prove my fix/feature works
   - [ ] New and existing tests pass locally

   ## Screenshots (if applicable)
   Add screenshots or GIFs showing the changes.

   ## Related Issues
   Fixes #(issue number)
   Closes #(issue number)
   ```

### Review Process

1. **Automated Checks**
   - TypeScript type checking
   - Build verification
   - Test suite execution
   - Linting checks

2. **Code Review**
   - At least one maintainer approval required
   - Address review comments
   - Update PR as needed

3. **After Approval**
   - Maintainers will merge your PR
   - Your contribution will be credited
   - Branch will be deleted

## Testing Guidelines

### Writing Tests

**Unit Tests (Vitest):**

```typescript
// backend/src/utils/__tests__/validation.test.ts
import { describe, it, expect } from "vitest";
import { validateEmail } from "../validation";

describe("validateEmail", () => {
  it("should accept valid email addresses", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("test.user+tag@domain.co.uk")).toBe(true);
  });

  it("should reject invalid email addresses", () => {
    expect(validateEmail("invalid")).toBe(false);
    expect(validateEmail("@example.com")).toBe(false);
    expect(validateEmail("user@")).toBe(false);
  });
});
```

**Component Tests (React Testing Library):**

```typescript
// frontend/src/components/__tests__/Button.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "../Button";

describe("Button", () => {
  it("renders with children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    
    fireEvent.click(screen.getByText("Click"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText("Disabled")).toBeDisabled();
  });
});
```

**API Tests:**

```typescript
// backend/src/routes/__tests__/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../index";

describe("Auth API", () => {
  beforeAll(async () => {
    // Set up test database
  });

  afterAll(async () => {
    // Clean up
  });

  it("POST /api/auth/register creates new user", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "test@example.com",
        password: "Password123!",
        username: "testuser",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.email).toBe("test@example.com");
  });

  it("POST /api/auth/login returns token", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "Password123!",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
  });
});
```

### Running Tests

```bash
# All tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Specific file
npm run test -- Button.test.tsx

# Specific package
npm run test -w backend
npm run test -w frontend
```

## Documentation Guidelines

### Code Documentation

```typescript
/**
 * Calculates the average mood score for a user over a time period.
 * 
 * @param userId - The unique identifier of the user
 * @param startDate - The start date of the period (inclusive)
 * @param endDate - The end date of the period (inclusive)
 * @returns The average mood score (1-10) or null if no entries exist
 * 
 * @example
 * ```typescript
 * const avgScore = await calculateAverageMood(123, new Date("2024-01-01"), new Date("2024-01-31"));
 * console.log(avgScore); // 7.5
 * ```
 */
export async function calculateAverageMood(
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<number | null> {
  // Implementation
}
```

### README Documentation

- Keep language clear and concise
- Use code examples
- Include screenshots for UI changes
- Update Table of Contents
- Test all commands/links

### API Documentation

Document all API endpoints:

```markdown
### POST /api/auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "johndoe",
  "organizationName": "Acme Corp"
}
```

**Success Response (201):**
```json
{
  "id": 123,
  "email": "user@example.com",
  "username": "johndoe",
  "role": "employee"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input
- `409 Conflict` - Email already exists
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123!","username":"john"}'
```
```

## Questions?

Don't hesitate to ask questions:

- **GitHub Discussions**: [Start a discussion](https://github.com/David-2911/ForYourMind/discussions)
- **Issues**: [Open an issue](https://github.com/David-2911/ForYourMind/issues)
- **Documentation**: Check [docs/](docs/) folder

## Thank You! 🙏

Your contributions make MindfulMe better for everyone. We appreciate your time and effort!

---

**Remember**: The best contribution is one that helps someone else. Whether it's code, documentation, or support - it all matters. ❤️
