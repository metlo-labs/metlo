# Metlo spring-boot-reactive-starter

Basic Spring Boot starter to automatically capture ServerWebExchange request and response traces.

## Quickstart

compile and install:
```shell
mvn clean install
```

maven dependency:
```xml
<dependency>
    <groupId>com.metlo</groupId>
    <artifactId>spring-boot-reactive-starter</artifactId>
    <version>0.3</version>
</dependency>
```

## Spring Boot Properties
```yaml
metlo:
  # Enable Metlo request and response tracing.
  enabled: true
  # The maximum number of threads to use for asynchronous communication.
  thread-pool-size: 2
  # The maximum number of trace requests per second to capture, -1 means unlimited.
  requests-per-second: -1
  # The Metlo connection API key to use for authorization.
  api-key: <your api key>
  # The Metlo API host URL to send traces to.
  host: https://app.metlo.com:8081
  # Case-insensitive collection of field names to omit from headers, bodies, and query arguments.
  protected-keys:
    - password
    - apiKey
    - secret
  # Log trace requests to application logs.
  log-requests: false
  # Manually set the instance hostname for tracing.
  hostname: null
```
