FROM node:alpine

WORKDIR /usr/src/app

COPY . .
RUN yarn
EXPOSE 8080

CMD ["node", "index.js"]