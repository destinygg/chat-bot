FROM node:8.12.0
COPY lib lib
COPY index.js index.js
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install --production
ENTRYPOINT ["npm", "run", "start"]
