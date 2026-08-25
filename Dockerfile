# ==============================================================================
# EchoSign Voice Inspector & Trust Protocol v4.1
# Enterprise Production Multi-Stage Dockerfile
# ==============================================================================

# --- Stage 1: Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Install build tools needed for native node packages if any
RUN apk add --no-cache python3 make g++

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy full application source code
COPY . .

# Compile frontend (Vite) and backend bundle (esbuild into dist/server.cjs)
ENV NODE_ENV=production
RUN npm run build

# Prune development dependencies
RUN npm prune --production

# --- Stage 2: Production Runtime ---
FROM node:20-alpine AS runner
WORKDIR /app

# Security: run as non-root user
RUN addgroup -g 1001 -S echosign && \
    adduser -S echosign -u 1001 -G echosign

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules and built distribution artifacts
COPY --from=builder --chown=echosign:echosign /app/package.json ./package.json
COPY --from=builder --chown=echosign:echosign /app/node_modules ./node_modules
COPY --from=builder --chown=echosign:echosign /app/dist ./dist

# Switch to non-root user
USER echosign

# Expose production port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/blockchain/stats || exit 1

# Start server
CMD ["node", "dist/server.cjs"]
