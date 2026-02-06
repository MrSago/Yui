FROM node:lts-alpine3.23

WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont

COPY package.json ./

RUN npm install --omit=dev

COPY . .

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

CMD ["node", "index.js"]
