#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== MindfulMe Environment Setup ===${NC}"

# Check if .env.example exists
if [ ! -f .env.example ]; then
  echo -e "${RED}Error: .env.example file not found!${NC}"
  exit 1
fi

# Determine environment type
echo -e "\n${YELLOW}Select environment type:${NC}"
echo "1) Local Development"
echo "2) Production"
read -p "Enter your choice (1/2): " ENV_TYPE

if [ "$ENV_TYPE" == "1" ]; then
  # Local development setup
  echo -e "\n${YELLOW}Setting up local development environment...${NC}"
  cp .env.example .env.local
  
  # Generate random secrets
  DEV_JWT_SECRET=$(openssl rand -hex 32)
  DEV_COOKIE_SECRET=$(openssl rand -hex 32)
  
  # Update .env.local with development settings
  sed -i "s/NODE_ENV=production/NODE_ENV=development/" .env.local
  sed -i "s/your-secure-jwt-secret-key-replace-this-in-production/$DEV_JWT_SECRET/" .env.local
  sed -i "s/your-secure-cookie-secret-replace-this-in-production/$DEV_COOKIE_SECRET/" .env.local
  sed -i "s/CORS_ORIGIN=https:\/\/your-production-domain.com/CORS_ORIGIN=http:\/\/localhost:5173/" .env.local
  
  echo -e "${GREEN}Local development environment set up successfully!${NC}"
  echo -e "Configuration saved to .env.local"
  
elif [ "$ENV_TYPE" == "2" ]; then
  # Production setup
  echo -e "\n${YELLOW}Setting up production environment...${NC}"
  
  # Ask for production domain
  read -p "Enter your production domain (e.g., app.mindfulme.com): " PROD_DOMAIN
  
  # Ask for database type
  echo -e "\n${YELLOW}Select database type:${NC}"
  echo "1) SQLite (not recommended for production)"
  echo "2) PostgreSQL (recommended for production)"
  read -p "Enter your choice (1/2): " DB_TYPE
  
  if [ "$DB_TYPE" == "2" ]; then
    read -p "Enter your PostgreSQL connection string: " DB_URL
  fi
  
  # Generate production secrets
  PROD_JWT_SECRET=$(openssl rand -hex 32)
  PROD_COOKIE_SECRET=$(openssl rand -hex 32)
  
  # Create .env file for production
  cp .env.example .env
  
  # Update .env with production settings
  sed -i "s/your-secure-jwt-secret-key-replace-this-in-production/$PROD_JWT_SECRET/" .env
  sed -i "s/your-secure-cookie-secret-replace-this-in-production/$PROD_COOKIE_SECRET/" .env
  sed -i "s/CORS_ORIGIN=https:\/\/your-production-domain.com/CORS_ORIGIN=https:\/\/$PROD_DOMAIN/" .env
  
  if [ "$DB_TYPE" == "2" ]; then
    sed -i "s/USE_SQLITE=true/USE_SQLITE=false/" .env
    sed -i "s/# DATABASE_URL=postgresql:\/\/username:password@your-neon-db-host\/dbname/DATABASE_URL=$DB_URL/" .env
  fi
  
  echo -e "${GREEN}Production environment set up successfully!${NC}"
  echo -e "Configuration saved to .env"
  
  echo -e "\n${YELLOW}Important:${NC}"
  echo -e "For Vercel deployment, make sure to add these environment variables in the Vercel dashboard."
else
  echo -e "${RED}Invalid choice. Exiting.${NC}"
  exit 1
fi

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1) For local development: npm run dev"
echo "2) For production deployment: ./vercel-deploy.sh"
