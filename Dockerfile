# Multi-stage build for MindfulMe application

# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built app from build stage
COPY --from=build /app/dist ./dist

# Copy SQLite database directory (if using SQLite)
COPY --from=build /app/data ./data

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV USE_SQLITE=true
ENV SQLITE_DB_PATH=./data/db.sqlite

# Start the application
CMD ["node", "dist/index.js"]
