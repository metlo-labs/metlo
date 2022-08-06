FROM node:alpine

WORKDIR /usr/src/app

ADD ../../../backend .

WORKDIR /usr/src/app/backend

RUN yarn
EXPOSE 8080

RUN yarn build

CMD [ "yarn", "start" ]
