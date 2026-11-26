# ==============================================================
# Collage Story - Production Frontend Multi-Stage Dockerfile
# Architecture: Multi-Arch (linux/amd64, linux/arm64)
# ==============================================================

# --------------------------------------------------------------
# Stage 1: Build Frontend Assets
# --------------------------------------------------------------
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder

WORKDIR /app

# Cache package manifests
COPY package.json package-lock.json* ./

# Install dependencies (overrides rollup with wasm for cross-architecture builds)
RUN npm ci --ignore-scripts || npm install

# Copy application source
COPY . .

# Build production distribution
RUN npm run build

# --------------------------------------------------------------
# Stage 2: Serve with Non-Root Nginx
# --------------------------------------------------------------
FROM nginxinc/nginx-unprivileged:alpine AS runner

# Remove default nginx configurations
RUN rm -rf /etc/nginx/conf.d/*

# Copy production Nginx reverse proxy configuration
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy compiled SPA assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose non-privileged HTTP port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/healthz || exit 1

# Run unprivileged nginx
STOPSIGNAL SIGQUIT
CMD ["nginx", "-g", "daemon off;"]
