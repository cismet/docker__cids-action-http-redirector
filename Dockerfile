FROM node:carbon-alpine

ENV TZ Europe/Berlin

WORKDIR /app

COPY ./package.json ./package-lock.json ./app.js ./

RUN npm install

EXPOSE 80

CMD ["npm", "start"]
