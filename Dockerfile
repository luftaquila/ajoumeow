# Stage 1: Vue timetable build
FROM node:22-alpine AS timetable-build
WORKDIR /build
COPY timetable/package*.json ./
RUN npm ci
COPY timetable/ ./
RUN npx vite build --outDir dist --emptyOutDir

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
COPY web/ ./web/
COPY --from=timetable-build /build/dist ./timetable-dist/
RUN mkdir -p data

EXPOSE 5710
CMD ["node", "index.js"]
