# Stage 1: Builder
FROM node:20-alpine AS builder

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Environment variables should be set in Dokploy or build args

# Build the application
RUN pnpm build

# Stage 2: Runner
FROM node:20-alpine AS runner

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/build ./build
COPY --from=builder /app/server.js ./server.js

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Expose the port
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]