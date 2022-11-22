FROM node:alpine

WORKDIR /usr/src/app

ADD ../../../frontend frontend
ADD ../../../common common

WORKDIR /usr/src/app/common
RUN yarn
RUN yarn build

WORKDIR /usr/src/app/frontend
RUN echo 'BACKEND_URL=http://backend:8080' >> .env
RUN echo 'NODE_ENV=production' >> .env
RUN yarn
RUN yarn build
RUN rm -rf src
RUN yarn cache clean

EXPOSE 8080

CMD [ "yarn", "start" ]
