FROM node:12.19.0

WORKDIR /usr/src/app

COPY . ./

RUN npm install

CMD "npm start"
