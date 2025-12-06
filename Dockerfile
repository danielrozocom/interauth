# ============================================================================
# Production Dockerfile for Dokploy
# ============================================================================
# This Dockerfile is used for production deployments via Dokploy.
# It uses a multi-stage build to keep the final image size small.
# 
# - Build stage: Compiles the SvelteKit application with Vite
# - Runtime stage: Serves the built app using Vite preview on port 3000
#
# Local development should use `npm run dev` (port 5173) instead.
# ============================================================================

FROM node:22-alpine AS build
WORKDIR /app

# Enable corepack for pnpm
RUN npm install -g corepack@0.24.1 && corepack enable

# Copy package manifests first for better caching
COPY package.json pnpm-lock.yaml* ./

# Install dependencies (no frozen lockfile to avoid CI lock issues in some hosts)
RUN pnpm install --no-frozen-lockfile

# Copy rest of the sources and build
COPY . .
RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app

# Copy built app from build stage
COPY --from=build /app ./

# This container listens on port 3000 for production
EXPOSE 3000

# Production command: runs the built app using Vite preview server
# The `start` script in package.json is: `vite preview --host 0.0.0.0 --port 3000`
CMD ["pnpm", "start"]
