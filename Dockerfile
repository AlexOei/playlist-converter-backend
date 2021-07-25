FROM node:12.19.0-alpine

WORKDIR /usr/src/App

COPY . ./

RUN npm install

CMD "npm run start"
