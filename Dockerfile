FROM node:25-slim AS deps

WORKDIR /app

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
  npm ci --omit=dev --no-audit --no-fund

FROM node:25-slim AS runner

WORKDIR /app

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ENV NODE_ENV=production \
  PUPPETEER_SKIP_DOWNLOAD=true \
  PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# hadolint ignore=DL3008
RUN --mount=type=cache,target=/var/cache/apt \
  --mount=type=cache,target=/var/lib/apt/lists \
  apt-get update && \
  apt-get install -y --no-install-recommends tini chromium && \
  rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .

USER node

ENTRYPOINT ["/usr/bin/tini", "--"]

CMD ["node", "index.js"]
