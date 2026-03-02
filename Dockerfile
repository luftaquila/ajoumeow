# Stage 1: Frontend build
FROM node:22-alpine AS frontend-build
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npx vite build --outDir /build/dist --emptyOutDir

# Stage 2: Server
FROM node:22-alpine

ENV TZ=Asia/Seoul

RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

WORKDIR /home/node/ajoumeow
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ .
COPY --from=frontend-build /build/dist ./dist/
RUN mkdir -p data

EXPOSE 5710
CMD ["node", "index.js"]
