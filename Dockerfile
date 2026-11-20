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

# Install all dependencies with npm cache mount
RUN --mount=type=cache,target=/root/.npm npm ci

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
ARG NEXT_PUBLIC_SUPABASE_URL="https://placeholder-project.supabase.co"
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder-anon-key"
ARG NEXT_PUBLIC_APP_URL="http://localhost:3000"

ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application (outputs to .next/standalone) with cache mount
RUN --mount=type=cache,target=/app/.next/cache npm run build

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

# Copy standalone server output with direct ownership to avoid layer bloat
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static assets (not included in standalone by default)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public directory
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Expose the application port
EXPOSE 3000

# Set the hostname to allow external connections
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Health check using lightweight api route
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the Next.js standalone server
CMD ["node", "server.js"]
