FROM node:14-slim

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y \
    python3 \
    gcc \
    build-essential \
    && apt-get clean

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install

RUN apt-get remove -y \
    python3 \
    gcc \
    build-essential \
    && apt-get clean

COPY lib lib
COPY index.js index.js

CMD ["node", "/usr/src/app/index.js"]
