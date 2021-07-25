FROM node:12.19.0-alpine

WORKDIR /usr/src/App

copy ../

RUN npm install

CMD "npm run start"
