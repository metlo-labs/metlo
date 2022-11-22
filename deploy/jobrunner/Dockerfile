FROM node:alpine

WORKDIR /usr/src/app

ADD ../../../backend backend
ADD ../../../common common

WORKDIR /usr/src/app/common
RUN yarn
RUN yarn build

WORKDIR /usr/src/app/backend
RUN yarn
RUN yarn build

RUN rm -rf src
RUN yarn cache clean

CMD [ "yarn", "start-jobs" ]
