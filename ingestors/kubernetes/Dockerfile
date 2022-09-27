FROM node:lts-alpine

ENV VERSION="6.0.5-r0"

RUN apk add librdkafka --repository=http://dl-cdn.alpinelinux.org/alpine/edge/community

RUN apk add --no-cache grep procps git suricata=$VERSION

WORKDIR /app

COPY . /app

RUN  chmod +x /app/entrypoint.sh

# Setup pre-reqs
RUN mkdir -p /etc/metlo-ingestor && \
        cd /etc/ && \
        rm -rf /etc/metlo-ingestor/* && \
        git clone https://github.com/metlo-labs/metlo.git metlo-ingestor && \
        cd /etc/metlo-ingestor && \
        mkdir -p /etc/suricata-logs && \
        chmod 777 /etc/suricata-logs && \
        mkdir -p /var/lib/suricata && \
        mkdir -p /var/lib/suricata/rules

RUN cp /app/suricata.yaml /etc/suricata/suricata.yaml && \
        cp /app/local.rules /var/lib/suricata/rules

RUN cd /etc/metlo-ingestor/ingestors/suricata && \
        yarn install && \
        yarn build

# WORKDIR /var/lib/suricata/rules


ENTRYPOINT ["/app/entrypoint.sh"]