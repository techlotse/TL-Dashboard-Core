# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY tsconfig.json tsconfig.node.json vite.config.ts postcss.config.js tailwind.config.js ./
COPY index.html ./
COPY src ./src

# VITE_API_URL is baked at build time — override via build arg for custom deployments
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Serve with nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

LABEL org.opencontainers.image.title="TL-Dashboard Frontend"
LABEL org.opencontainers.image.version="0.2.0"
LABEL org.opencontainers.image.description="Family home dashboard — React frontend"

COPY --from=builder /app/dist /usr/share/nginx/html

# nginx config: proxy /api to backend, serve SPA from root
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1
