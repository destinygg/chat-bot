FROM node:14-slim as builder

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y \
    python3 \
    gcc \
    build-essential \
    && apt-get clean

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm ci

##### RUNNER #####
FROM node:14-slim

WORKDIR /usr/src/app
USER node

COPY package.json package.json
COPY --from=builder /usr/src/app/node_modules node_modules

COPY lib lib
COPY index.js index.js

CMD ["node", "/usr/src/app/index.js"]
