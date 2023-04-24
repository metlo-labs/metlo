FROM --platform=linux/amd64 rust:alpine3.17 AS rust-builder
ENV RUSTFLAGS="-C target-feature=-crt-static"

RUN apk update
RUN apk add protoc musl-dev pkgconfig openssl-dev g++ bash autoconf automake libtool g++ make python3 clang-dev libpcap libpcap-dev

WORKDIR /app
COPY ../../ingestors/rust-common/ rust-common
RUN cd rust-common && cargo build --release
RUN mv rust-common/target/release/metlo-agent metlo-agent

FROM --platform=linux/amd64 alpine:3.17.0

RUN apk update
RUN apk add bash libpcap-dev libpcap openssl-dev libc6-compat libgcc

WORKDIR /app
COPY --from=rust-builder /app/metlo-agent ./metlo-agent

CMD ["/app/metlo-agent"]