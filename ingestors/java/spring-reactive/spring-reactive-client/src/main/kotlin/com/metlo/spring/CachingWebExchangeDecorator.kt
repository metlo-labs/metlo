package com.metlo.spring

import org.reactivestreams.Publisher
import org.springframework.core.io.buffer.DataBuffer
import org.springframework.http.server.reactive.ServerHttpRequest
import org.springframework.http.server.reactive.ServerHttpRequestDecorator
import org.springframework.http.server.reactive.ServerHttpResponse
import org.springframework.http.server.reactive.ServerHttpResponseDecorator
import org.springframework.web.server.ServerWebExchange
import org.springframework.web.server.ServerWebExchangeDecorator
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import java.nio.charset.StandardCharsets

@FunctionalInterface
interface CachedWebExchangeHandler {
    /**
     * Called when the ServerWebExchange has completed the filter chain and cached data should be populated.
     * @param exchange The [CachingWebExchangeDecorator] to be used for analysis.
     */
    fun complete(exchange: CachingWebExchangeDecorator)
}

class CachingWebExchangeDecorator(
    delegate: ServerWebExchange,
    private val completionHandler: CachedWebExchangeHandler
) : ServerWebExchangeDecorator(delegate) {
    private val requestDecorator = CachingServerRequestDecorator(delegate.request)
    private val responseDecorator = CachingServerResponseDecorator(delegate.response, this)

    override fun getRequest(): CachingServerRequestDecorator {
        return requestDecorator
    }

    override fun getResponse(): CachingServerResponseDecorator {
        return responseDecorator
    }

    fun handleResponseCompleted() {
        return completionHandler.complete(this)
    }
}

class CachingServerRequestDecorator(
    delegate: ServerHttpRequest
) : ServerHttpRequestDecorator(delegate) {
    private val cachedBodyBuilder = StringBuilder()

    override fun getBody(): Flux<DataBuffer> {
        return super.getBody().doOnNext {
            cache(it)
        }
    }

    private fun cache(buffer: DataBuffer) {
        cachedBodyBuilder.append(StandardCharsets.UTF_8.decode(buffer.asByteBuffer()).toString())
    }

    fun getCachedBody(): String {
        return cachedBodyBuilder.toString()
    }
}

class CachingServerResponseDecorator(
    delegate: ServerHttpResponse,
    private val parent: CachingWebExchangeDecorator
) : ServerHttpResponseDecorator(delegate) {
    private val cachedBodyBuilder = StringBuilder()

    override fun writeWith(body: Publisher<out DataBuffer>): Mono<Void> {
        return super.writeWith(
            Flux.from(body).doOnNext {
                cache(it)
            }
        ).doOnTerminate {
            parent.handleResponseCompleted()
        }
    }

    override fun writeAndFlushWith(body: Publisher<out Publisher<out DataBuffer>>): Mono<Void> {
        return super.writeAndFlushWith(body).doOnTerminate {
            parent.handleResponseCompleted()
        }
    }

    private fun cache(buffer: DataBuffer) {
        cachedBodyBuilder.append(StandardCharsets.UTF_8.decode(buffer.asByteBuffer().asReadOnlyBuffer()).toString())
    }

    fun getCachedBody(): String {
        return cachedBodyBuilder.toString()
    }
}
