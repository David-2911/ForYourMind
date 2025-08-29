#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== MindfulMe Vercel Build Script ===${NC}"

# Step 1: Clean previous build artifacts
echo -e "\n${YELLOW}Cleaning previous build artifacts...${NC}"
rm -rf dist
rm -rf api/dist

# Step 2: Build the frontend (Vite/React)
echo -e "\n${YELLOW}Building frontend...${NC}"
npm run build

# Step 3: Create the api directory for Vercel serverless functions
echo -e "\n${YELLOW}Setting up serverless functions...${NC}"
mkdir -p api/dist

# Step 4: Build the backend for serverless
echo -e "\n${YELLOW}Building backend for serverless...${NC}"
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=api/dist

# Step 5: Create the main serverless function entry point
echo -e "\n${YELLOW}Creating serverless entry point...${NC}"
cat > api/index.js << 'EOF'
// Vercel serverless function entry point
import { app } from './dist/index.js';
import { initializeDatabase } from './dist/database.js';

// Initialize database on cold start
let isDbInitialized = false;

export default async function handler(req, res) {
  try {
    // Initialize database if not already done (for cold starts)
    if (!isDbInitialized) {
      await initializeDatabase();
      isDbInitialized = true;
      console.log('Database initialized for serverless function');
    }
    
    // Handle the request with the Express app
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
EOF

echo -e "\n${GREEN}Build completed successfully!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Deploy with './vercel-deploy.sh'"
echo -e "2. Configure environment variables in Vercel"
echo -e "3. Run database migration if needed"
