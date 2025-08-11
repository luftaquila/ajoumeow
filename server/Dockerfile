FROM node:22-alpine

WORKDIR /home/node/ajoumeow
COPY server/package*.json ./

RUN npm install
COPY server .
COPY web ./web

EXPOSE 5710
CMD [ "npx", "babel-node", "index.js" ]
