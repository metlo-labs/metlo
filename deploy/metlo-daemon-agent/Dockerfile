FROM --platform=linux/amd64 golang:alpine3.17 AS builder

RUN apk update
RUN apk add libpcap libpcap-dev gcc g++

WORKDIR /app

COPY ../../ingestors/govxlan/ govxlan
RUN cd govxlan && go build -o metlo-pcap
RUN mv govxlan/metlo-pcap metlo-pcap

FROM --platform=linux/amd64 alpine:3.17.0

RUN apk update
RUN apk add libpcap-dev libpcap

WORKDIR /app
COPY --from=builder /app/metlo-pcap ./metlo-pcap

ENTRYPOINT ["/app/metlo-pcap"]