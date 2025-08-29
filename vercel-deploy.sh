#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== MindfulMe Vercel Deployment Script ===${NC}"

# Step 1: Install Vercel CLI if not already installed
echo -e "\n${YELLOW}Checking for Vercel CLI...${NC}"
if ! command -v vercel &> /dev/null; then
  echo -e "${YELLOW}Installing Vercel CLI...${NC}"
  npm install -g vercel
fi

# Step 2: Ensure all dependencies are installed
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install

# Step 3: Run tests if they exist
if grep -q "\"test\":" package.json; then
  echo -e "\n${YELLOW}Running tests...${NC}"
  npm test
fi

# Step 4: Build the project
echo -e "\n${YELLOW}Building the project...${NC}"
npm run build:vercel

# Step 5: Login to Vercel if needed
echo -e "\n${YELLOW}Verifying Vercel login...${NC}"
vercel whoami || vercel login

# Step 6: Deploy to Vercel
echo -e "\n${YELLOW}Deploying to Vercel...${NC}"
vercel --prod

echo -e "\n${GREEN}Deployment process completed!${NC}"
echo -e "\n${YELLOW}IMPORTANT: Configure these environment variables in your Vercel project settings:${NC}"
echo -e "- NODE_ENV=production"
echo -e "- JWT_SECRET (use a strong, unique value)"
echo -e "- DATABASE_URL (for PostgreSQL connection)"
echo -e "- CORS_ORIGIN (set to your frontend URL)"
echo -e "- COOKIE_SECRET (use a strong, unique value)"
echo -e "- USE_SQLITE=false (to use PostgreSQL in production)"

echo -e "\n${YELLOW}After deployment, you may need to run the database migration:${NC}"
echo -e "1. Set DATABASE_URL environment variable locally"
echo -e "2. Run: ./db-migrate.sh"
