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

# Set build-time environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_APP_NAME
ARG VITE_POS_CALLBACK_URL
ARG VITE_APP_CALLBACK_URL
ARG VITE_POS_CALLBACK_URL_DEV
ARG VITE_APP_CALLBACK_URL_DEV
ARG VITE_POS_URL
ARG VITE_APP_URL
ARG VITE_AUTH_ORIGIN

# Set NODE_ENV for production build
ENV NODE_ENV=production

# Create .env.production from build args for Vite
RUN echo "PUBLIC_SUPABASE_URL=$VITE_SUPABASE_URL" > .env.production && \
    echo "SUPABASE_URL=$VITE_SUPABASE_URL" >> .env.production && \
    echo "PUBLIC_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY" >> .env.production && \
    echo "SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY" >> .env.production && \
    echo "PUBLIC_APP_NAME=$VITE_APP_NAME" >> .env.production && \
    echo "PUBLIC_POS_CALLBACK_URL=$VITE_POS_CALLBACK_URL" >> .env.production && \
    echo "PUBLIC_APP_CALLBACK_URL=$VITE_APP_CALLBACK_URL" >> .env.production && \
    echo "PUBLIC_POS_CALLBACK_URL_DEV=$VITE_POS_CALLBACK_URL_DEV" >> .env.production && \
    echo "PUBLIC_APP_CALLBACK_URL_DEV=$VITE_APP_CALLBACK_URL_DEV" >> .env.production && \
    echo "PUBLIC_POS_URL=$VITE_POS_URL" >> .env.production && \
    echo "PUBLIC_APP_URL=$VITE_APP_URL" >> .env.production && \
    echo "PUBLIC_AUTH_ORIGIN=$VITE_AUTH_ORIGIN" >> .env.production

# Build the application
RUN pnpm build

# Stage 2: Runner
FROM node:20-alpine AS runner

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

WORKDIR /app

# Set runtime environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_APP_NAME
ARG VITE_POS_CALLBACK_URL
ARG VITE_APP_CALLBACK_URL
ARG VITE_POS_CALLBACK_URL_DEV
ARG VITE_APP_CALLBACK_URL_DEV
ARG VITE_POS_URL
ARG VITE_APP_URL
ARG VITE_AUTH_ORIGIN

ENV PUBLIC_SUPABASE_URL=$VITE_SUPABASE_URL
ENV SUPABASE_URL=$VITE_SUPABASE_URL
ENV PUBLIC_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_POS_CALLBACK_URL=$VITE_POS_CALLBACK_URL
ENV VITE_APP_CALLBACK_URL=$VITE_APP_CALLBACK_URL
ENV VITE_POS_CALLBACK_URL_DEV=$VITE_POS_CALLBACK_URL_DEV
ENV VITE_APP_CALLBACK_URL_DEV=$VITE_APP_CALLBACK_URL_DEV
ENV VITE_POS_URL=$VITE_POS_URL
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_AUTH_ORIGIN=$VITE_AUTH_ORIGIN

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