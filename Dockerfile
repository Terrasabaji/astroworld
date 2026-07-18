# Astro World — production image (Next.js standalone + Python Swiss Ephemeris)
# Build:  docker build -t astroworld .
# Run:    docker run --rm -p 3000:3000 -e AUTH_SECRET=... astroworld

# ---- deps ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ---- runner ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV ASTRO_WORLD_PYTHON=/app/python_engine/.venv/bin/python
# Set AUTH_BYPASS_OTP / AUTH_SECRET at runtime (see render.yaml / docker-compose).

# Next.js standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Python calculation engine + Swiss Ephemeris data
COPY --from=builder /app/python_engine ./python_engine
COPY --from=builder /app/ephe ./ephe
COPY --from=builder /app/data ./data
COPY --from=builder /app/scripts ./scripts

RUN python3 -m venv /app/python_engine/.venv \
  && /app/python_engine/.venv/bin/pip install --no-cache-dir -r /app/python_engine/requirements.txt \
  && apt-get purge -y --auto-remove build-essential python3-dev \
  && rm -rf /var/lib/apt/lists/* /root/.cache

COPY scripts/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh \
  && node /app/scripts/seed-data.mjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
