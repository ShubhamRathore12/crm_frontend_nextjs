# Stage 1: Install dependencies with caching
FROM node:20-alpine AS deps
WORKDIR /app

# Copy only package files first for better caching
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
COPY .npmrc ./

# Install dependencies with optimizations
RUN npm ci --legacy-peer-deps --prefer-offline --no-audit && \
    npm cache clean --force

# Stage 2: Build the application (optional - can use pre-built .next)
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build environment variables
ENV NEXT_PUBLIC_BASE_PATH=/crm
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Skip build if .next already exists, otherwise build
RUN if [ ! -d ".next" ]; then npm run build; fi

# Stage 3: Production runner - minimal image
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public 2>/dev/null || true

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Use exec form to ensure proper signal handling
CMD ["node", "server.js"]
