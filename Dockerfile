# Build the React frontend and install the production Node runtime.
FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=3001

WORKDIR /app

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server ./server
COPY --from=build /app/dist ./dist

RUN mkdir -p data local_storage/original local_storage/thumbs \
    && chown -R node:node /app

USER node

EXPOSE 3001

VOLUME ["/app/data", "/app/local_storage"]

CMD ["node", "server/index.js"]
