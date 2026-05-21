# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --ignore-scripts

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ── Stage 2: Production runtime ───────────────────────────────────────────────
FROM node:20-alpine AS runtime

LABEL org.opencontainers.image.title="TL-Dashboard Backend"
LABEL org.opencontainers.image.version="0.0.1"
LABEL org.opencontainers.image.description="Family home dashboard — API backend"

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --ignore-scripts && \
    addgroup -S dashboard && \
    adduser  -S dashboard -G dashboard

COPY --from=builder /app/dist ./dist

# Background images mount point
RUN mkdir -p /app/backgrounds && chown dashboard:dashboard /app/backgrounds

USER dashboard

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/health || exit 1

CMD ["node", "dist/index.js"]
