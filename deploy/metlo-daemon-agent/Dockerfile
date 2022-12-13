# FROM --platform=linux/amd64 debian:bullseye-slim AS builder
FROM --platform=linux/amd64 golang:bullseye AS builder

RUN apt update
RUN apt install wget libpcap-dev build-essential curl -y

WORKDIR /app
# RUN curl -s https://api.github.com/repos/metlo-labs/metlo/releases/latest \
#         | grep "browser_download_url.*_linux_amd64\.tar\.gz" \
#         | cut -d : -f 2,3 \
#         | tr -d \" \
#         | wget -O - -qi - \
#         | tar -xzf -
COPY ../../ingestors/govxlan/ govxlan
RUN cd govxlan && go build -o metlo-pcap
RUN mv govxlan/metlo-pcap metlo-pcap

FROM --platform=linux/amd64 debian:bullseye-slim

RUN apt update
RUN apt install libpcap-dev sudo -y

WORKDIR /app
COPY --from=builder /app/metlo-pcap ./metlo-pcap

ADD ../../deploy/metlo-daemon-agent/entrypoint.sh entrypoint.sh

ENTRYPOINT ["/bin/bash","/app/entrypoint.sh"]