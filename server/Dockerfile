FROM node:22-alpine

ENV TZ=Asia/Seoul

RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

WORKDIR /home/node/ajoumeow
COPY server/package*.json ./

RUN npm install
COPY server .
COPY web ./web

EXPOSE 5710
CMD [ "npx", "babel-node", "index.js" ]
