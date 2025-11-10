# ====================================
# Multi-Stage Dockerfile for Frontend
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
RUN npm ci

# Copy shared source and build
COPY shared/src ./src
RUN npm run build

# ============================================================
# Stage 2: Build frontend
# ============================================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy root package.json for workspace context
COPY package*.json ./

# Copy frontend package files
COPY frontend/package*.json ./frontend/
COPY frontend/tsconfig.json ./frontend/
COPY frontend/vite.config.ts ./frontend/
COPY frontend/tailwind.config.ts ./frontend/
COPY frontend/postcss.config.js ./frontend/
COPY frontend/components.json ./frontend/

# Copy shared build output from previous stage
COPY --from=shared-builder /app/shared ./shared

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm ci

# Copy frontend source
COPY frontend/src ./src
COPY frontend/index.html ./
COPY frontend/public ./public

# Build arguments for environment variables at build time
ARG VITE_API_URL
ARG VITE_NODE_ENV=production
ARG VITE_APP_VERSION=1.0.0

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_NODE_ENV=$VITE_NODE_ENV
ENV VITE_APP_VERSION=$VITE_APP_VERSION

# Build frontend
RUN npm run build

# ============================================================
# Stage 3: Production runtime with nginx
# ============================================================
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Create non-root user for nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chmod -R 755 /usr/share/nginx/html

# Use non-root user
USER nginx

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
