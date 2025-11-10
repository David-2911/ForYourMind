# 🔀 Git Workflow Guide

This document outlines the Git workflow for the MindfulMe project.

## 🌳 Branch Strategy

We use a simplified **GitFlow** workflow:

```
main (production)
  ↑
develop (integration)
  ↑
feature/* (new features)
bugfix/* (bug fixes)
hotfix/* (urgent production fixes)
```

### Branch Descriptions

| Branch | Purpose | Base | Merge To |
|--------|---------|------|----------|
| `main` | Production code | - | - |
| `develop` | Integration branch | `main` | `main` |
| `feature/*` | New features | `develop` | `develop` |
| `bugfix/*` | Bug fixes | `develop` | `develop` |
| `hotfix/*` | Urgent fixes | `main` | `main` + `develop` |

## 🚀 Workflow

### 1. Starting New Work

```bash
# Update your local repository
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b bugfix/issue-description
```

**Branch naming conventions:**
- `feature/add-mood-chart` - New features
- `bugfix/fix-login-error` - Bug fixes
- `hotfix/security-patch` - Urgent production fixes
- `docs/update-readme` - Documentation
- `refactor/optimize-queries` - Code refactoring
- `test/add-unit-tests` - Adding tests

### 2. Making Changes

```bash
# Make your code changes
# Edit files...

# Check what changed
git status
git diff

# Stage changes
git add .

# Or stage specific files
git add backend/src/routes/index.ts
git add frontend/src/pages/dashboard.tsx

# Commit with meaningful message
git commit -m "feat: add mood chart to dashboard"
```

### 3. Pushing Changes

```bash
# First time pushing branch
git push -u origin feature/your-feature-name

# Subsequent pushes
git push
```

### 4. Keeping Branch Updated

```bash
# Fetch latest changes
git fetch origin

# Merge develop into your branch
git merge origin/develop

# Or rebase (cleaner history)
git rebase origin/develop
```

### 5. Creating Pull Request

1. **Push your branch** to GitHub
2. **Go to repository** on GitHub
3. **Click "New Pull Request"**
4. **Select branches:**
   - Base: `develop`
   - Compare: `feature/your-feature-name`
5. **Fill in PR template**
6. **Request review** from team members
7. **Wait for approval** and CI checks

### 6. After PR Merged

```bash
# Switch to develop
git checkout develop

# Pull latest changes
git pull origin develop

# Delete your feature branch
git branch -d feature/your-feature-name

# Delete remote branch
git push origin --delete feature/your-feature-name
```

## 📝 Commit Message Format

We follow **Conventional Commits** specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat: add mood tracking chart` |
| `fix` | Bug fix | `fix: resolve login timeout issue` |
| `docs` | Documentation | `docs: update API documentation` |
| `style` | Code style (formatting) | `style: fix indentation in auth.tsx` |
| `refactor` | Code refactoring | `refactor: simplify journal query` |
| `perf` | Performance improvement | `perf: optimize database queries` |
| `test` | Adding tests | `test: add unit tests for auth` |
| `chore` | Maintenance tasks | `chore: update dependencies` |
| `build` | Build system | `build: configure webpack` |
| `ci` | CI/CD changes | `ci: add GitHub Actions workflow` |

### Scope (Optional)

Indicates which part of codebase changed:

- `frontend` - Frontend code
- `backend` - Backend code
- `shared` - Shared package
- `db` - Database schema
- `auth` - Authentication
- `ui` - UI components
- `api` - API endpoints

### Examples

**Good commits:**
```bash
git commit -m "feat(frontend): add mood chart to dashboard"
git commit -m "fix(backend): resolve JWT token expiration issue"
git commit -m "docs: update README with installation steps"
git commit -m "refactor(shared): reorganize type definitions"
```

**With body and footer:**
```bash
git commit -m "feat(backend): add email notifications

Implement email notifications for:
- New journal entries
- Mood alerts
- Appointment reminders

Closes #123"
```

**Bad commits (avoid these):**
```bash
git commit -m "fix stuff"
git commit -m "update"
git commit -m "changes"
git commit -m "WIP"
```

## 🔍 Code Review Process

### Before Requesting Review

**Checklist:**
- [ ] Code builds successfully (`npm run build`)
- [ ] TypeScript checks pass (`npm run check`)
- [ ] All tests pass (when available)
- [ ] No console.log or debug code
- [ ] Code follows project style
- [ ] Documentation updated if needed
- [ ] Commit messages are clear

### Creating Pull Request

**PR Title:**
```
feat(frontend): add mood tracking chart
```

**PR Description Template:**
```markdown
## What does this PR do?
Brief description of changes

## Why are we making this change?
Context and motivation

## How has this been tested?
- [ ] Manual testing
- [ ] Unit tests added
- [ ] Integration tests added

## Screenshots (if UI changes)
[Add screenshots here]

## Related Issues
Closes #123
Relates to #456

## Checklist
- [ ] Code builds successfully
- [ ] TypeScript checks pass
- [ ] Documentation updated
- [ ] Breaking changes documented
```

### Reviewing PRs

**As a Reviewer:**
1. **Pull the branch** and test locally
2. **Check code quality**:
   - Is it readable?
   - Is it well-structured?
   - Are there any obvious bugs?
3. **Verify tests** (when available)
4. **Check documentation**
5. **Leave feedback**:
   - Approve ✅
   - Request changes 🔄
   - Add comments 💬

**Feedback Guidelines:**
- Be constructive and specific
- Suggest solutions, not just problems
- Use prefixes:
  - `[nit]` - Minor style issue
  - `[question]` - Asking for clarification
  - `[suggestion]` - Optional improvement
  - `[blocker]` - Must be fixed

## 🚨 Handling Conflicts

### Merge Conflicts

```bash
# Update your branch
git fetch origin
git merge origin/develop

# Conflicts will be marked
# CONFLICT (content): Merge conflict in file.ts

# Open file and resolve conflicts
# Look for conflict markers:
# <<<<<<< HEAD
# your changes
# =======
# incoming changes
# >>>>>>> origin/develop

# After resolving
git add file.ts
git commit -m "chore: resolve merge conflicts"
git push
```

### Rebasing (Advanced)

```bash
# Rebase your branch onto develop
git fetch origin
git rebase origin/develop

# If conflicts occur
# Resolve them, then:
git add .
git rebase --continue

# Force push (be careful!)
git push --force-with-lease
```

## 🔄 Common Scenarios

### Scenario 1: Update Local Repository

```bash
# From any branch
git fetch origin

# Update develop
git checkout develop
git pull origin develop

# Update main
git checkout main
git pull origin main
```

### Scenario 2: Switching Branches

```bash
# Save current work (if not ready to commit)
git stash

# Switch branches
git checkout feature/other-feature

# Apply stashed changes later
git stash pop
```

### Scenario 3: Undo Last Commit (Not Pushed)

```bash
# Undo commit but keep changes
git reset --soft HEAD~1

# Undo commit and discard changes
git reset --hard HEAD~1
```

### Scenario 4: Amend Last Commit

```bash
# Make additional changes
git add .

# Amend last commit (change message if needed)
git commit --amend -m "Updated commit message"

# If already pushed (be careful!)
git push --force-with-lease
```

### Scenario 5: Cherry-Pick Commit

```bash
# Get commit hash from other branch
git log feature/other-branch

# Apply specific commit to current branch
git cherry-pick abc123def
```

## 📊 Useful Git Commands

### Viewing History

```bash
# View commit history
git log

# Pretty format
git log --oneline --graph --decorate

# View changes in commit
git show abc123def

# View file history
git log --follow backend/src/routes/index.ts
```

### Checking Status

```bash
# Current status
git status

# What changed
git diff

# What's staged
git diff --staged

# Compare branches
git diff develop..feature/my-feature
```

### Branch Management

```bash
# List all branches
git branch -a

# Delete local branch
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature

# Rename current branch
git branch -m new-branch-name
```

### Undoing Changes

```bash
# Discard changes in file
git checkout -- file.ts

# Discard all changes
git reset --hard

# Unstage file
git reset HEAD file.ts

# Revert commit (creates new commit)
git revert abc123def
```

## 🎯 Best Practices

### ✅ Do's

- **Commit often** - Small, focused commits
- **Write clear messages** - Follow conventional commits
- **Keep branches updated** - Merge develop regularly
- **Test before pushing** - Run checks locally
- **Review your own code** - Before requesting review
- **Respond to feedback** - Be open to suggestions
- **Delete merged branches** - Keep repository clean

### ❌ Don'ts

- **Don't commit sensitive data** - API keys, passwords, .env files
- **Don't commit build artifacts** - dist/, node_modules/
- **Don't force push to main/develop** - Ever!
- **Don't commit commented code** - Delete it instead
- **Don't commit debug code** - console.log, debugger statements
- **Don't mix concerns** - One feature per branch
- **Don't ignore CI failures** - Fix them before merging

## 🛡️ Protected Branches

`main` and `develop` are protected:

- Cannot be deleted
- Require pull request for changes
- Require code review approval
- Require CI checks to pass
- No force pushing allowed

## 📋 Quick Reference

**Start new feature:**
```bash
git checkout develop
git pull
git checkout -b feature/my-feature
```

**Save work:**
```bash
git add .
git commit -m "feat: description"
git push
```

**Update branch:**
```bash
git fetch origin
git merge origin/develop
```

**Create PR:**
1. Push branch to GitHub
2. Click "New Pull Request"
3. Fill in details
4. Request review

**After merge:**
```bash
git checkout develop
git pull
git branch -d feature/my-feature
```

## 🆘 Getting Help

**Stuck with Git?**

1. Check this guide
2. Use `git help <command>`
3. Search Stack Overflow
4. Ask team member
5. Check Git documentation

**Useful resources:**
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitFlow](https://nvie.com/posts/a-successful-git-branching-model/)

---

**Remember:** Git is a tool to help you collaborate. When in doubt, ask for help! 🤝
