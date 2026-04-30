# ============================================
# Nama Medical ERP — Production Dockerfile
# Multi-stage build for minimal image size
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ---- Production Image ----
FROM node:20-alpine

LABEL maintainer="Nama Medical ERP"
LABEL version="2.0.0"
LABEL description="Hospital ERP System with 46 modular route modules"

WORKDIR /app

# Security: run as non-root user
RUN addgroup -S nama && adduser -S nama -G nama

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create required directories
RUN mkdir -p public/uploads/radiology \
    && chown -R nama:nama /app

# Switch to non-root user
USER nama

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server_modular.js"]
