# ============================================================
# ChronicAI — Multi-Stage Production Dockerfile
# Next.js 16 with standalone output optimization
# ============================================================

# ----------------------------------------------------------
# Stage 1: Install dependencies
# ----------------------------------------------------------
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files for dependency caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# ----------------------------------------------------------
# Stage 2: Build the application
# ----------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build-time environment variables
# NEXT_PUBLIC_* vars must be available at build time since they
# are inlined into the client bundle during `next build`
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application (outputs to .next/standalone)
RUN npm run build

# ----------------------------------------------------------
# Stage 3: Production runner (minimal image)
# ----------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the standalone server output
COPY --from=builder /app/.next/standalone ./

# Copy static assets (not included in standalone by default)
COPY --from=builder /app/.next/static ./.next/static

# Copy the public directory if it exists
# (using a wildcard so the build doesn't fail if public/ is absent)
COPY --from=builder /app/public* ./public/

# Set correct ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the application port
EXPOSE 3000

# Set the hostname to allow external connections
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the Next.js standalone server
CMD ["node", "server.js"]

