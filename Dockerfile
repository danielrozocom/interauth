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

# Set the production port and expose it. This is the port the preview server will listen on.
ENV PORT=3000
EXPOSE 3000

# Production CMD: run the built app using the preview server on port 3000.
# This CMD is intended for production images only — development uses `Dockerfile.dev` or `docker-compose.dev.yml`.
# `npm start` runs the `preview` script from `package.json`, which runs `vite preview --host 0.0.0.0 --port 3000`.
CMD ["npm", "start"]
