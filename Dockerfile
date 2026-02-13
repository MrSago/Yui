FROM node:25-slim

WORKDIR /app

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ENV PUPPETEER_SKIP_DOWNLOAD=true \
  PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN apt-get update && \
  apt-get upgrade && \
  apt-get install -y --no-install-recommends \
  tini \
  chromium && \
  rm -rf /var/lib/apt/lists/*

COPY package.json ./

RUN npm install --omit=dev

COPY . .

RUN groupadd --gid 1001 nodejs && \
  useradd --uid 1001 --gid 1001 --create-home --shell /usr/sbin/nologin nodejs && \
  chown -R nodejs:nodejs /app

USER nodejs

ENTRYPOINT ["/usr/bin/tini", "--"]

CMD ["node", "index.js"]
