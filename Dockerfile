FROM node:22-alpine AS build
WORKDIR /app

# Enable corepack for pnpm
RUN npm install -g corepack@0.24.1 && corepack enable

# copy package manifests first for better caching
COPY package.json pnpm-lock.yaml* ./

# Install deps (no frozen lockfile to avoid CI lock issues in some hosts)
RUN pnpm install --no-frozen-lockfile

# Copy rest of the sources and build
COPY . .
RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app

# Copy built app from build stage
COPY --from=build /app ./

# Expose the port that `vite preview` will use
EXPOSE 3000

# Use pnpm preview to serve the production build on 0.0.0.0:3000
CMD ["pnpm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
