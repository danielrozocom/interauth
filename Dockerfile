# ============================================================================
# Production Dockerfile for InterAuth
# ============================================================================
# 🎯 THIS IS THE CORRECT DOCKERFILE FOR PRODUCTION
#
# This Dockerfile is optimized for production deployments.
# It uses a multi-stage build to keep the final image size small.
#
# ⚠️  DO NOT USE Dockerfile.dev FOR PRODUCTION!
#     Dockerfile.dev runs 'vite dev' (dev server with hot reload)
#     This file runs 'pnpm start' (vite preview on port 3000)
#
# Stages:
#   1. builder: Installs dependencies and builds the SvelteKit app with Vite
#   2. runner:  Runs the built app using Vite preview server on port 3000
#
# Key features:
#   - Multi-stage build for minimal final image size
#   - Production build (NOT dev server) in the builder stage
#   - Explicit CMD to run 'pnpm start' (vite preview)
#   - Non-root user for security
#   - No dev dependencies in final image
#   - Health checks enabled
#
# Usage:
#   docker build -t interauth:prod -f Dockerfile .
#   docker run -p 3000:3000 -e NODE_ENV=production interauth:prod
#
# ============================================================================

# ============================================================================
# STAGE 1: Builder
# ============================================================================
FROM node:22-alpine AS builder
WORKDIR /app

# Enable corepack for pnpm package manager
RUN npm install -g corepack@0.24.1 && corepack enable

# Copy package manifests first (for Docker layer caching)
COPY package.json pnpm-lock.yaml* ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --no-frozen-lockfile

# Copy the entire application source
COPY . .

# Build the SvelteKit application for production
# This creates the 'build' directory with optimized assets
RUN pnpm run build

# ============================================================================
# STAGE 2: Runner (Production)
# ============================================================================
FROM node:22-alpine AS runner
WORKDIR /app

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Ensure pnpm is available in the runner stage as well. The builder stage enabled
# corepack earlier (to run pnpm during build), so we must enable it here too
# otherwise `pnpm` will be missing and `pnpm install --prod` will fail.
RUN npm install -g corepack@0.24.1 && corepack enable

# Copy package manifests only (needed for 'pnpm start')
COPY --from=builder /app/package.json /app/pnpm-lock.yaml* ./

# Install production dependencies ONLY
# This excludes devDependencies (vite, svelte, etc.)
RUN pnpm install --prod --no-frozen-lockfile

# Copy built application from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/server.js ./server.js

# Ensure proper permissions
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port 3000 for production
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# ============================================================================
# CRITICAL: Production Startup Command
# ============================================================================
# This MUST run 'pnpm start' which executes:
#   $ pnpm start
#   > vite preview --host 0.0.0.0 --port 3000
#
# ⚠️  NEVER CHANGE THIS TO:
#   - ["pnpm", "dev"]         ← WRONG! This runs the dev server
#   - ["npm", "run", "dev"]   ← WRONG! This runs the dev server
#   - ["vite", "dev", ...]    ← WRONG! This runs the dev server
#
# If the container is running 'vite dev', check:
#   1. Ensure Dockerfile (not Dockerfile.dev) is being used
#   2. Ensure NODE_ENV=production
#   3. Ensure the deployment platform is not overriding CMD
# ============================================================================
CMD ["pnpm", "start"]
