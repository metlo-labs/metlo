FROM kong:2.8.1-alpine
USER root

ENV ENV "/root/.ashrc"

RUN apk add --no-cache git gcc libc-dev curl
RUN mkdir /go-plugins

RUN curl https://raw.githubusercontent.com/Kong/go-plugins/master/go-hello.go -o /go-plugins/go-hello.go
# COPY /Users/ninadsinha/Desktop/metlo_v2/ingestors/kong /go-plugins

ADD https://go.dev/dl/go1.19.1.linux-amd64.tar.gz /usr/local
ENV PATH="${PATH}:/usr/local/go/bin"
RUN echo "export PATH=$PATH:/usr/local/go/bin" > "$ENV"
RUN source ~/.ashrc

RUN ls -la /go-plugins

RUN cd /go-plugins && \
    go mod init kong-go-plugin && \
    go get github.com/Kong/go-pdk && \
    go mod tidy && \
    go build go-hello.go


COPY /go-plugins/go-hello /usr/local/bin/