FROM node:alpine

WORKDIR /usr/src/app

ADD ../../../frontend frontend
ADD ../../../common common

WORKDIR /usr/src/app/common
RUN yarn
RUN yarn build

WORKDIR /usr/src/app/frontend
RUN yarn
RUN yarn build

EXPOSE 8080

CMD [ "yarn", "start" ]
