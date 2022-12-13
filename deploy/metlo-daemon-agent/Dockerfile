FROM --platform=linux/amd64 golang:bullseye AS builder

RUN apt update
RUN apt install libpcap-dev build-essential -y

WORKDIR /app

COPY ../../ingestors/govxlan/ govxlan
RUN cd govxlan && go build -o metlo-pcap
RUN mv govxlan/metlo-pcap metlo-pcap

FROM --platform=linux/amd64 ubuntu:focal

RUN apt update
RUN apt install libpcap-dev ca-certificates -y
RUN update-ca-certificates --fresh 

WORKDIR /app
COPY --from=builder /app/metlo-pcap ./metlo-pcap

ENTRYPOINT ["/app/metlo-pcap"]