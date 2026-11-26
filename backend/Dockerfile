# ==============================================================
# Collage Story - Production Backend Multi-Stage Dockerfile
# Architecture: Multi-Arch (linux/amd64, linux/arm64)
# Target Base: Debian Bookworm Slim for native glibc & OpenSSL 3.0
# ==============================================================

# --------------------------------------------------------------
# Stage 1: Dependencies & Prisma Engine Build
# --------------------------------------------------------------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install native compilation dependencies for C++ modules (sharp, argon2) & OpenSSL
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package manifests
COPY package.json package-lock.json* ./

# Install all dependencies including devDependencies for Prisma generate
RUN npm ci

# Copy Prisma schema and generate engine binaries for current target
COPY prisma ./prisma
RUN npx prisma generate

# Prune devDependencies for production image
RUN npm prune --production

# --------------------------------------------------------------
# Stage 2: Production Runtime Container
# --------------------------------------------------------------
FROM node:22-bookworm-slim AS runner

WORKDIR /app

# Install runtime dependencies: tini for signal forwarding, curl for healthchecks, postgresql-client for backups
RUN apt-get update && apt-get install -y --no-install-recommends \
    tini \
    curl \
    openssl \
    ca-certificates \
    postgresql-client \
    tar \
    gzip \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-root application user and group
RUN groupadd -g 1001 collage && \
    useradd -u 1001 -g collage -m -s /bin/bash collage

# Create private storage and backup directories with correct ownership
RUN mkdir -p /app/storage/private/photos \
             /app/storage/private/thumbnails \
             /app/storage/private/documents \
             /app/storage/private/discovery \
             /app/storage/private/voice \
             /app/storage/backups/local \
             /app/storage/backups/offsite \
             /app/storage/security \
    && chown -R collage:collage /app/storage

# Copy production node_modules with prebuilt engines from builder stage
COPY --from=builder --chown=collage:collage /app/node_modules ./node_modules
COPY --from=builder --chown=collage:collage /app/prisma ./prisma

# Copy application source code and scripts
COPY --chown=collage:collage package.json ./
COPY --chown=collage:collage src ./src
COPY --chown=collage:collage scripts ./scripts

# Set production environment variables
ENV NODE_ENV=production \
    PORT=5000 \
    PRISMA_CLI_QUERY_ENGINE_TYPE=binary

# Switch to non-root application user
USER collage

# Expose internal API port (not exposed to host in production compose)
EXPOSE 5000

# Container Healthcheck hitting the live health route
HEALTHCHECK --interval=20s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5000/api/v1/health || exit 1

# Use tini as PID 1 init process to handle SIGTERM/SIGINT cleanly
ENTRYPOINT ["/usr/bin/tini", "--"]

# Start application server
CMD ["node", "src/server.js"]
