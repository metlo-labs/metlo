FROM --platform=linux/amd64 rust:alpine3.17 AS rust-builder
ENV RUSTFLAGS="-C target-feature=-crt-static"

RUN apk update
RUN apk add protoc musl-dev pkgconfig openssl-dev g++ bash autoconf automake libtool g++ make python3 clang-dev

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
RUN apk add bash libpcap-dev libpcap openssl-dev libc6-compat libgcc

WORKDIR /app
COPY ../../../deploy/metlo-daemon-agent/entrypoint.sh ./entrypoint.sh
COPY --from=go-builder /app/metlo-pcap ./metlo-pcap
COPY --from=rust-builder /app/metlo-agent ./metlo-agent

CMD ["/app/entrypoint.sh"]