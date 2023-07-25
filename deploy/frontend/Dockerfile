FROM node:alpine AS builder

RUN apk update
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /usr/src/app

ADD ../../../frontend frontend
ADD ../../../common common

WORKDIR /usr/src/app/common
RUN yarn install --frozen-lockfile
RUN yarn build

WORKDIR /usr/src/app/frontend
RUN echo 'BACKEND_URL=http://backend:8080' >> .env
RUN echo 'NODE_ENV=production' >> .env
RUN yarn install --frozen-lockfile
RUN yarn build

FROM node:alpine

WORKDIR /usr/src/app

WORKDIR /usr/src/app/frontend
COPY --from=builder /usr/src/app/frontend/public ./public
COPY --from=builder /usr/src/app/frontend/package.json ./package.json
COPY --from=builder /usr/src/app/frontend/.env ./.env
COPY --from=builder /usr/src/app/frontend/.next/standalone ./
COPY --from=builder /usr/src/app/frontend/.next/static ./.next/static

WORKDIR /usr/src/app/common
COPY --from=builder /usr/src/app/common/package.json ./package.json
COPY --from=builder /usr/src/app/common/dist ./dist
COPY --from=builder /usr/src/app/common/node_modules ./node_modules

WORKDIR /usr/src/app/frontend
EXPOSE 8080

CMD [ "node", "server.js" ]
