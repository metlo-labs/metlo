FROM --platform=linux/amd64 rust:buster AS rust-builder
ENV RUSTFLAGS="-C target-feature=-crt-static"

RUN apt update
RUN apt install musl-dev g++ gcc bash autoconf automake libtool make python3 protobuf-compiler clang libclang-dev -y

WORKDIR /app
COPY ../../ingestors/rust-common/ rust-common
RUN cd rust-common && cargo build --release
RUN mv rust-common/target/release/metlo-agent metlo-agent

FROM --platform=linux/amd64 golang:buster AS go-builder

RUN apt update
RUN apt install libpcap-dev gcc g++ -y

WORKDIR /app

COPY ../../ingestors/govxlan/ govxlan
COPY ../../ingestors/rust-common/ rust-common
RUN cd govxlan && go build -o metlo-pcap
RUN mv govxlan/metlo-pcap metlo-pcap

FROM --platform=linux/amd64 debian:buster

RUN apt update
RUN apt install bash libpcap-dev gcc -y

WORKDIR /app
COPY ../../../deploy/metlo-daemon-agent/entrypoint.sh ./entrypoint.sh
COPY --from=go-builder /app/metlo-pcap ./metlo-pcap
COPY --from=rust-builder /app/metlo-agent ./metlo-agent

CMD ["/app/entrypoint.sh"]