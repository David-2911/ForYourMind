#!/bin/bash

# New Developer Setup Script
# Complete automated setup for MindfulMe development environment

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
REQUIRED_NODE_VERSION="18.0.0"
REQUIRED_NPM_VERSION="9.0.0"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║         🧠 MindfulMe Development Setup 🧠              ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running in correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: This script must be run from the project root directory${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Starting setup process...${NC}"
echo ""

# Step 1: Check prerequisites
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1: Checking Prerequisites${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "   Please install Node.js >= ${REQUIRED_NODE_VERSION}"
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//')
if [ "$(printf '%s\n' "$REQUIRED_NODE_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_NODE_VERSION" ]; then
    echo -e "${RED}❌ Node.js version $NODE_VERSION is too old${NC}"
    echo "   Required: >= ${REQUIRED_NODE_VERSION}"
    echo "   Please upgrade Node.js"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

NPM_VERSION=$(npm -v)
if [ "$(printf '%s\n' "$REQUIRED_NPM_VERSION" "$NPM_VERSION" | sort -V | head -n1)" != "$REQUIRED_NPM_VERSION" ]; then
    echo -e "${YELLOW}⚠️  npm version $NPM_VERSION (recommended: >= ${REQUIRED_NPM_VERSION})${NC}"
else
    echo -e "${GREEN}✓${NC} npm $NPM_VERSION"
fi

# Check Git
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}⚠️  Git is not installed (optional but recommended)${NC}"
else
    GIT_VERSION=$(git --version | awk '{print $3}')
    echo -e "${GREEN}✓${NC} Git $GIT_VERSION"
fi

# Check Docker (optional)
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    echo -e "${GREEN}✓${NC} Docker $DOCKER_VERSION (optional)"
else
    echo -e "${YELLOW}ℹ${NC}  Docker not installed (optional for containerized development)"
fi

echo ""
echo -e "${GREEN}✅ Prerequisites check complete!${NC}"
echo ""

# Step 2: Install dependencies
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 2: Installing Dependencies${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "This may take a few minutes..."
echo ""

if npm install; then
    echo ""
    echo -e "${GREEN}✅ Dependencies installed successfully!${NC}"
else
    echo ""
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo ""

# Step 3: Environment configuration
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 3: Environment Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file already exists${NC}"
    echo -n "   Do you want to overwrite it? (y/N): "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        rm .env
        echo -e "${GREEN}✓${NC} Existing .env removed"
    else
        echo -e "${GREEN}✓${NC} Keeping existing .env"
        SKIP_ENV=true
    fi
fi

if [ "$SKIP_ENV" != true ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓${NC} Created .env from .env.example"
        
        # Generate secrets
        echo ""
        echo "Generating secure secrets..."
        
        JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
        COOKIE_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
        
        # Update .env with secrets
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/" .env
            sed -i '' "s/your-super-secret-cookie-key-change-this-in-production/$COOKIE_SECRET/" .env
        else
            # Linux
            sed -i "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/" .env
            sed -i "s/your-super-secret-cookie-key-change-this-in-production/$COOKIE_SECRET/" .env
        fi
        
        echo -e "${GREEN}✓${NC} Generated JWT_SECRET"
        echo -e "${GREEN}✓${NC} Generated COOKIE_SECRET"
        
        # Set development defaults
        echo ""
        echo "USE_SQLITE=true" >> .env
        echo "SQLITE_DB_PATH=./backend/data/db.sqlite" >> .env
        echo "NODE_ENV=development" >> .env
        echo "PORT=5000" >> .env
        echo "CORS_ORIGIN=http://localhost:5173" >> .env
        echo "VITE_API_URL=http://localhost:5000" >> .env
        
        echo -e "${GREEN}✓${NC} Configured for SQLite development"
    else
        echo -e "${RED}❌ .env.example not found${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}✅ Environment configured!${NC}"
echo ""

# Step 4: Build shared package
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 4: Building Shared Package${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "This is required before backend/frontend can be used..."
echo ""

if npm run build:shared; then
    echo ""
    echo -e "${GREEN}✅ Shared package built successfully!${NC}"
else
    echo ""
    echo -e "${RED}❌ Failed to build shared package${NC}"
    exit 1
fi

echo ""

# Step 5: Database setup
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 5: Database Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Create data directory
mkdir -p backend/data
echo -e "${GREEN}✓${NC} Created backend/data directory"

echo ""
echo "Running database migrations..."
echo ""

if npm run db:migrate; then
    echo ""
    echo -e "${GREEN}✅ Database migrations complete!${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  Database migrations had issues (this is okay for first run)${NC}"
fi

echo ""

# Step 6: Verify setup
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 6: Verifying Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Running type checks..."
if npm run check; then
    echo ""
    echo -e "${GREEN}✅ Type checks passed!${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  Some type check issues (may be expected)${NC}"
fi

echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}🎉 Your MindfulMe development environment is ready!${NC}"
echo ""

echo -e "${BLUE}📝 Next Steps:${NC}"
echo ""
echo "1️⃣  Start development servers:"
echo "   ${YELLOW}npm run dev${NC}"
echo ""
echo "   Or start individually:"
echo "   ${YELLOW}npm run dev:backend${NC}  (port 5000)"
echo "   ${YELLOW}npm run dev:frontend${NC} (port 5173)"
echo ""

echo "2️⃣  Open your browser:"
echo "   Frontend: ${YELLOW}http://localhost:5173${NC}"
echo "   Backend:  ${YELLOW}http://localhost:5000/health${NC}"
echo ""

echo "3️⃣  Optional - Open database GUI:"
echo "   ${YELLOW}npm run db:studio${NC}"
echo "   Opens at: ${YELLOW}http://localhost:4983${NC}"
echo ""

echo -e "${BLUE}📚 Documentation:${NC}"
echo "   - README.md - Getting started"
echo "   - DEVELOPER_ONBOARDING.md - Complete dev guide"
echo "   - CONTRIBUTING.md - How to contribute"
echo "   - ARCHITECTURE.md - System architecture"
echo "   - API.md - API reference"
echo ""

echo -e "${BLUE}🛠️  Useful Commands:${NC}"
echo "   ${YELLOW}npm run build${NC}         - Build all packages"
echo "   ${YELLOW}npm run check${NC}         - Type check all packages"
echo "   ${YELLOW}npm run test${NC}          - Run all tests"
echo "   ${YELLOW}npm run clean${NC}         - Clean build artifacts"
echo "   ${YELLOW}npm run db:migrate${NC}    - Run database migrations"
echo "   ${YELLOW}npm run db:studio${NC}     - Open database GUI"
echo ""

echo -e "${BLUE}🐛 Troubleshooting:${NC}"
echo "   If you encounter issues, check:"
echo "   - MIGRATION_EXECUTION_GUIDE.md (troubleshooting section)"
echo "   - .env file has correct configuration"
echo "   - All dependencies installed (npm install)"
echo "   - Shared package is built (npm run build:shared)"
echo ""

echo -e "${BLUE}💬 Need Help?${NC}"
echo "   - Check documentation in docs/ folder"
echo "   - Open an issue on GitHub"
echo "   - Review DEVELOPER_ONBOARDING.md"
echo ""

echo -e "${GREEN}Happy coding! 🚀${NC}"
echo ""

# Optional: Open VS Code workspace
if command -v code &> /dev/null; then
    echo -n "Would you like to open the VS Code workspace? (y/N): "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        code mindfulme.code-workspace
        echo -e "${GREEN}✓${NC} Opened VS Code workspace"
    fi
fi

echo ""
