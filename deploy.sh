#!/bin/bash

# MindfulMe Deployment Script
# This script automates the process of deploying the MindfulMe application

echo "====== MindfulMe Deployment Script ======"
echo "Starting deployment process..."

# Check for .env file
if [ ! -f .env ]; then
  echo "ERROR: .env file not found!"
  echo "Please create a .env file based on .env.example"
  exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm ci

# Run type checking
echo "Running type checking..."
npm run check

# Build the application
echo "Building the application..."
npm run build

# Create database directory if it doesn't exist
if [ ! -d "data" ]; then
  echo "Creating data directory..."
  mkdir -p data
fi

# Check if the database exists, if not create it
if [ ! -f "./data/db.sqlite" ]; then
  echo "Database file not found. A new one will be created on first run."
fi

echo "Deployment build complete! To start the application, run:"
echo "npm run start"
echo ""
echo "For production deployment with PM2:"
echo "pm2 start npm --name \"mindfulme\" -- run start"
