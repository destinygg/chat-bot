FROM node:14-slim
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install
COPY lib lib
COPY tests tests
COPY index.js index.js

ENTRYPOINT ["npm", "run", "start"]
CMD npm