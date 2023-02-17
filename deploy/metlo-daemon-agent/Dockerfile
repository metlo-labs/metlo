FROM --platform=linux/amd64 rust:buster AS rust-builder

RUN apt update
RUN apt install -y protobuf-compiler libprotobuf-dev libclang-dev clang

WORKDIR /app
COPY ../../ingestors/rust-common/ rust-common
RUN cd rust-common && cargo build --release
RUN mv rust-common/target/release/metlo-agent metlo-agent

FROM --platform=linux/amd64 golang:alpine3.17 AS go-builder

RUN apk update
RUN apk add libpcap libpcap-dev gcc g++

WORKDIR /app

COPY ../../ingestors/govxlan/ govxlan
COPY ../../ingestors/rust-common/ rust-common
RUN cd govxlan && go build -o metlo-pcap
RUN mv govxlan/metlo-pcap metlo-pcap

FROM --platform=linux/amd64 alpine:3.17.0

RUN apk update
RUN apk add libpcap-dev libpcap

WORKDIR /app
COPY --from=go-builder /app/metlo-pcap ./metlo-pcap
COPY --from=rust-builder /app/metlo-agent ./metlo-agent

ENTRYPOINT ["/app/metlo-pcap"]