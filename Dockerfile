FROM node:16-alpine as base
WORKDIR /
COPY package*.json ./

FROM base as dev
RUN apk add --no-cache bash
RUN wget -O /bin/wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh
RUN chmod +x /bin/wait-for-it.sh

ENV NODE_ENV=development
RUN npm install\
  && npm install typescript -g\
  && npm install nodemon -g
COPY . .
RUN tsc
