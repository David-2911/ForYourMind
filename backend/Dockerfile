# ====================================
# Multi-Stage Dockerfile for Backend
# ====================================

# ============================================================
# Stage 1: Build shared package
# ============================================================
FROM node:18-alpine AS shared-builder

WORKDIR /app

# Copy shared package files
COPY shared/package*.json ./shared/
COPY shared/tsconfig.json ./shared/

# Install shared dependencies
WORKDIR /app/shared
RUN npm ci --only=production

# Copy shared source and build
COPY shared/src ./src
RUN npm run build

# ============================================================
# Stage 2: Build backend
# ============================================================
FROM node:18-alpine AS backend-builder

WORKDIR /app

# Copy root package.json for workspace context
COPY package*.json ./

# Copy backend package files
COPY backend/package*.json ./backend/
COPY backend/tsconfig.json ./backend/

# Copy shared build output from previous stage
COPY --from=shared-builder /app/shared ./shared

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci --only=production && \
    npm ci --only=development

# Copy backend source
COPY backend/src ./src
COPY backend/drizzle.config.ts ./

# Build backend
RUN npm run build

# ============================================================
# Stage 3: Production runtime
# ============================================================
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY --chown=nodejs:nodejs backend/package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder stage
COPY --chown=nodejs:nodejs --from=backend-builder /app/backend/dist ./dist
COPY --chown=nodejs:nodejs --from=shared-builder /app/shared/dist ./node_modules/@mindfulme/shared/dist

# Copy migration files (if needed at runtime)
COPY --chown=nodejs:nodejs backend/migrations ./migrations

# Create data directory for SQLite (if using SQLite in development)
RUN mkdir -p ./data && chown -R nodejs:nodejs ./data

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/healthz', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
