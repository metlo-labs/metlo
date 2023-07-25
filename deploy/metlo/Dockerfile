FROM node:alpine AS builder

RUN apk update
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

ADD ../../../frontend frontend
ADD ../../../backend backend
ADD ../../../common common

WORKDIR /usr/src/app/common
RUN yarn
RUN yarn build

WORKDIR /usr/src/app/backend
RUN yarn
RUN yarn build

WORKDIR /usr/src/app/frontend
RUN echo 'BACKEND_URL=http://localhost:8080' >> .env
RUN echo 'NODE_ENV=production' >> .env
RUN yarn install --frozen-lockfile
RUN yarn build

FROM node:alpine

RUN apk update && apk add supervisor redis postgresql postgresql-contrib bash su-exec

VOLUME /var/lib/metlo

RUN mkdir -p /var/run/postgresql
RUN chown -R postgres:postgres /var/run/postgresql
ENV PGDATA=/var/lib/metlo/postgresql/data
RUN mkdir -p "$PGDATA"
RUN mkdir -p /var/lib/metlo/redis-data
RUN mkdir /docker-entrypoint-initdb.d

WORKDIR /usr/src/app/common
COPY --from=builder /usr/src/app/common/package.json ./package.json
COPY --from=builder /usr/src/app/common/dist ./dist
COPY --from=builder /usr/src/app/common/node_modules ./node_modules

WORKDIR /usr/src/app/backend
COPY --from=builder /usr/src/app/backend/package.json ./package.json
COPY --from=builder /usr/src/app/backend/dist ./dist
COPY --from=builder /usr/src/app/backend/node_modules ./node_modules
COPY --from=builder /usr/src/app/backend/tsconfig.json ./tsconfig.json

WORKDIR /usr/src/app/frontend
COPY --from=builder /usr/src/app/frontend/public ./public
COPY --from=builder /usr/src/app/frontend/package.json ./package.json
COPY --from=builder /usr/src/app/frontend/.env ./.env
COPY --from=builder /usr/src/app/frontend/.next/standalone ./
COPY --from=builder /usr/src/app/frontend/.next/static ./.next/static

ENV REDIS_URL=redis://localhost:6379
ENV DB_URL=postgres://postgres:postgres@localhost:5432/metlo_api_security
ENV NODE_OPTIONS=--openssl-legacy-provider
ENV BACKEND_URL=http://localhost:8080
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres

RUN echo 'CREATE DATABASE metlo_api_security; CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' > /docker-entrypoint-initdb.d/init.sql

COPY ../../../deploy/metlo/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY ../../../deploy/metlo/postgres-entrypoint.sh /usr/local/bin/postgres-entrypoint
COPY ../../../deploy/metlo/validate-env.py /usr/local/bin/validate-env
COPY ../../../deploy/metlo/entrypoint.sh /usr/local/bin/entrypoint

EXPOSE 8081
EXPOSE 3000

WORKDIR /usr/src/app

CMD ["/usr/local/bin/entrypoint"]