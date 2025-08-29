#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== MindfulMe Render Deployment Guide ===${NC}"

# Make scripts executable
chmod +x render-frontend-build.sh

echo -e "\n${YELLOW}STEP 1: Prerequisites${NC}"
echo -e "1. Create a Render.com account at https://render.com"
echo -e "2. Connect your Git repository to Render"
echo -e "3. Have your code committed and pushed to your repository"

echo -e "\n${YELLOW}STEP 2: Blueprint Deployment${NC}"
echo -e "The easiest way to deploy both services is using the render.yaml blueprint:"
echo -e "1. Go to https://dashboard.render.com/blueprints"
echo -e "2. Click 'New Blueprint Instance'"
echo -e "3. Connect your repository"
echo -e "4. Render will automatically set up both services and the database"

echo -e "\n${YELLOW}STEP 3: Manual Deployment (Alternative)${NC}"
echo -e "If you prefer to set up services manually:"

echo -e "\n${YELLOW}3.1: Set up PostgreSQL Database${NC}"
echo -e "1. Go to https://dashboard.render.com/new/database"
echo -e "2. Create a new PostgreSQL database"
echo -e "3. Name: mindfulme-db"
echo -e "4. Choose Free plan"
echo -e "5. Note the connection string for the next steps"

echo -e "\n${YELLOW}3.2: Deploy Backend API${NC}"
echo -e "1. Go to https://dashboard.render.com/new/web-service"
echo -e "2. Connect your repository"
echo -e "3. Name: mindfulme-api"
echo -e "4. Build Command: npm install && npm run build"
echo -e "5. Start Command: npm run start"
echo -e "6. Add the following environment variables:"
echo -e "   - NODE_ENV=production"
echo -e "   - PORT=10000"
echo -e "   - USE_SQLITE=false"
echo -e "   - JWT_SECRET (generate a secure random string)"
echo -e "   - COOKIE_SECRET (generate a secure random string)"
echo -e "   - DATABASE_URL (from your PostgreSQL database)"
echo -e "   - CORS_ORIGIN=https://mindfulme-web.onrender.com"

echo -e "\n${YELLOW}3.3: Deploy Frontend${NC}"
echo -e "1. Go to https://dashboard.render.com/new/web-service"
echo -e "2. Connect your repository"
echo -e "3. Name: mindfulme-web"
echo -e "4. Build Command: npm install && npm run build:frontend"
echo -e "5. Start Command: npm run serve:frontend"
echo -e "6. Add the environment variable:"
echo -e "   - VITE_API_URL=https://mindfulme-api.onrender.com/api"

echo -e "\n${YELLOW}STEP 4: Database Migration${NC}"
echo -e "After deployment, you need to migrate your database:"
echo -e "1. Set your DATABASE_URL environment variable locally:"
echo -e "   export DATABASE_URL=your_postgres_connection_string"
echo -e "2. Run the migration script:"
echo -e "   ./db-migrate.sh"

echo -e "\n${GREEN}Congratulations! Your MindfulMe app should now be deployed on Render.com.${NC}"
echo -e "Frontend: https://mindfulme-web.onrender.com"
echo -e "Backend API: https://mindfulme-api.onrender.com"
echo -e "Health Check: https://mindfulme-api.onrender.com/api/health"
