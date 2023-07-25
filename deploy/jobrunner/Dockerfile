FROM node:alpine AS builder

RUN apk update
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

ADD ../../../backend backend
ADD ../../../common common

WORKDIR /usr/src/app/common
RUN yarn
RUN yarn build

WORKDIR /usr/src/app/backend
RUN yarn
RUN yarn build

FROM node:alpine

WORKDIR /usr/src/app

WORKDIR /usr/src/app/common
COPY --from=builder /usr/src/app/common/package.json ./package.json
COPY --from=builder /usr/src/app/common/dist ./dist
COPY --from=builder /usr/src/app/common/node_modules ./node_modules

WORKDIR /usr/src/app/backend
COPY --from=builder /usr/src/app/backend/package.json ./package.json
COPY --from=builder /usr/src/app/backend/dist ./dist
COPY --from=builder /usr/src/app/backend/node_modules ./node_modules
COPY --from=builder /usr/src/app/backend/tsconfig.json ./tsconfig.json

CMD [ "yarn", "start-jobs" ]
