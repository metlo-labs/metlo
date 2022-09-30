FROM node:lts-alpine

ENV VERSION="6.0.5-r0"

RUN apk add librdkafka --repository=http://dl-cdn.alpinelinux.org/alpine/edge/community

RUN apk add --no-cache grep procps git suricata=$VERSION

WORKDIR /app

ADD ../../deploy/suricata-daemon suricata-daemon
ADD ../../ingestors/suricata metlo-ingestor

RUN chmod +x /app/suricata-daemon/entrypoint.sh

# Setup pre-reqs
RUN mkdir -p /etc/metlo-ingestor && \
        cd /etc/ && \
        rm -rf /etc/metlo-ingestor/* && \
        mkdir -p /etc/metlo-ingestor/ingestors && \
        cp -r /app/metlo-ingestor /etc/metlo-ingestor/ingestors/suricata && \
        cd /etc/metlo-ingestor && \
        mkdir -p /etc/suricata-logs && \
        chmod 777 /etc/suricata-logs && \
        mkdir -p /var/lib/suricata && \
        mkdir -p /var/lib/suricata/rules

RUN cp /app/suricata-daemon/suricata.yaml /etc/suricata/suricata.yaml && \
        cp /app/suricata-daemon/local.rules /var/lib/suricata/rules

RUN cd /etc/metlo-ingestor/ingestors/suricata && \
        yarn install && \
        yarn build

# WORKDIR /var/lib/suricata/rules


ENTRYPOINT ["/app/suricata-daemon/entrypoint.sh"]