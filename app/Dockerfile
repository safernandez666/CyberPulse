# =============================================================================
# CyberPulse — Dockerfile
# Multi-stage build: builds frontend → serves backend
# =============================================================================

# ─── Stage 1: Build Frontend ───────────────────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /app

# Install build deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ─── Stage 2: Production Server ────────────────────────────────────────────
FROM node:20-slim AS production

WORKDIR /app

# Install runtime deps for better-sqlite3 + curl for Docker healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm install -D tsx

# Copy built frontend
COPY --from=frontend-builder /app/dist ./dist

# Copy server source
COPY server ./server

# Environment
ENV NODE_ENV=production
ENV PORT=3001
ENV CYBERPULSE_API_KEY=""

# Expose port
EXPOSE 3001

# Start command
CMD ["npx", "tsx", "server/index.ts"]
