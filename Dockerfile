# ==============================================================================
# EchoSign Attest — multi-stage production image
# ==============================================================================

FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./

# Lockfile may lag package.json during pilot cuts — prefer install over strict ci
RUN npm install --no-audit --no-fund --engine-strict=false

COPY . .

ENV NODE_ENV=production
RUN npm run build

RUN npm prune --production

FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -g 1001 -S echosign && \
    adduser -S echosign -u 1001 -G echosign

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder --chown=echosign:echosign /app/package.json ./package.json
COPY --from=builder --chown=echosign:echosign /app/node_modules ./node_modules
COPY --from=builder --chown=echosign:echosign /app/dist ./dist

USER echosign

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/server.cjs"]
