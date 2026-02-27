# Stage 1: Build Vue client
FROM node:22-alpine AS client-build
WORKDIR /app

COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm ci

COPY tsconfig.json ./
COPY client/ ./client/
RUN cd client && npm run build

# Stage 2: Build Fastify server
FROM node:22-alpine AS server-build
WORKDIR /app

# Install build dependencies for native modules (better-sqlite3, sharp)
RUN apk add --no-cache python3 make g++

COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci

COPY tsconfig.json ./
COPY server/src/ ./server/src/
COPY server/tsconfig.json ./server/
RUN cd server && npm run build

# Stage 3: Production runtime
FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV TZ=Asia/Seoul

# Install runtime deps: tzdata for timezone, build tools for native modules (better-sqlite3, sharp)
RUN apk add --no-cache tzdata python3 make g++

# Install server production dependencies (includes native module compilation)
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev \
    && apk del python3 make g++

# Copy Drizzle migration files
COPY server/drizzle/ ./server/drizzle/
COPY server/drizzle.config.ts ./server/

# Copy server build output
COPY --from=server-build /app/server/dist/ ./server/dist/

# Copy client build output
COPY --from=client-build /app/client/dist/ ./client/dist/

# Copy static data files referenced at runtime (map, weather fallback)
COPY web/res/map.json web/res/weather.json ./web/res/

EXPOSE 5710

CMD ["node", "server/dist/index.js"]
