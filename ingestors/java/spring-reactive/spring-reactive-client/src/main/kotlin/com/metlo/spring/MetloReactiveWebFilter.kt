package com.metlo.spring

import com.google.gson.GsonBuilder
import com.google.gson.reflect.TypeToken
import com.metlo.client.reactive.ReactiveMetloRequestClient
import com.metlo.configuration.MetloConfigurationProperties
import com.metlo.model.MetloServerRequestParameters
import com.metlo.model.MetloServerRequestTrace
import com.metlo.model.MetloServerResponseTrace
import com.metlo.model.MetloTraceRequest
import com.metlo.model.NameValuePair
import com.metlo.model.toNameValuePairs
import mu.KotlinLogging
import org.springframework.boot.web.reactive.filter.OrderedWebFilter
import org.springframework.core.Ordered
import org.springframework.util.AntPathMatcher
import org.springframework.web.server.ServerWebExchange
import org.springframework.web.server.WebFilterChain
import reactor.core.publisher.Mono

/**
 * [OrderedWebFilter] implementation that caches [ServerWebExchange] request and response data in
 * order to send trace requests to a configured Metlo API.
 */
class MetloReactiveWebFilter(
    config: MetloConfigurationProperties,
    private val client: ReactiveMetloRequestClient
) : OrderedWebFilter, CachedWebExchangeHandler {
    private val configuredHostname: String? = config.hostname?.trim()
    private val protectedKeys = generateProtectedKeys(config.protectedKeys)
    private val ignoredPaths: Set<String> = config.ignoredPaths.toSet()
    private val pathMatcher = AntPathMatcher("/")
    private val doLogRequests = config.logRequests
    private val gson = GsonBuilder().setPrettyPrinting().create()
    private val logger = KotlinLogging.logger { }

    override fun getOrder(): Int {
        return Ordered.HIGHEST_PRECEDENCE
    }

    override fun filter(exchange: ServerWebExchange, chain: WebFilterChain): Mono<Void> {
        return if (isIgnoredPath(exchange.request.path.pathWithinApplication().value())) {
            chain.filter(exchange)
        } else {
            chain.filter(CachingWebExchangeDecorator(exchange, this))
        }
    }

    override fun complete(exchange: CachingWebExchangeDecorator) {
        try {
            val request = MetloTraceRequest(
                request = createMetloRequest(exchange.request),
                response = createMetloResponse(exchange.response),
                meta = createMetloMetadata(exchange)
            )

            client.sendAsync(request)

            if (doLogRequests) {
                logRequest(request)
            }
        } catch (t: Throwable) {
            logger.error(t) { "Exception occurred logging Metlo trace request data" }
        }
    }

    private fun logRequest(request: MetloTraceRequest) {
        try {
            logger.debug {
                gson.toJson(request)
            }
        } catch (_: Throwable) {
        }
    }

    private fun createMetloRequest(request: CachingServerRequestDecorator): MetloServerRequestTrace {
        val params = MetloServerRequestParameters(
            host = request.getHostString(),
            path = request.path.pathWithinApplication().value().trim().ifBlank { "/" },
            parameters = filterKeys(protectedKeys, request.queryParams.toNameValuePairs())
        )

        return MetloServerRequestTrace(
            url = params,
            method = request.method?.name?.uppercase() ?: "GET",
            headers = filterKeys(protectedKeys, request.headers.toNameValuePairs()),
            body = request.getCachedBody().toJsonString()
        )
    }

    private fun createMetloResponse(response: CachingServerResponseDecorator): MetloServerResponseTrace {
        return MetloServerResponseTrace(
            status = response.rawStatusCode,
            headers = filterKeys(protectedKeys, response.headers.toNameValuePairs()),
            body = response.getCachedBody().toJsonString()
        )
    }

    private fun CachingServerRequestDecorator.getHostString(): String {
        return configuredHostname ?: headers.host?.hostString ?: localAddress?.hostString ?: "UNKNOWN"
    }

    private fun String.toJsonString(): String {
        return if (this.startsWith("[") || this.startsWith("{")) {
            try {
                val map = filterKeys(protectedKeys, gson.fromJson(this, object : TypeToken<Map<String, Any>>() {}))
                gson.toJson(map)
            } catch (_: Throwable) {
                this
            }
        } else {
            this
        }
    }

    private fun createMetloMetadata(exchange: ServerWebExchange): Map<String, Any> {
        return with(exchange) {
            val meta = mutableMapOf<String, Any>()
            meta["incoming"] = true

            (request.remoteAddress?.hostString)?.let {
                meta["source"] = it
            }

            (request.remoteAddress?.port)?.let {
                meta["sourcePort"] = it
            }

            (request.headers.host?.hostString ?: request.localAddress?.hostString ?: configuredHostname)?.let {
                meta["destination"] = it
            }

            (request.headers.host?.port ?: request.localAddress?.port)?.let {
                meta["destinationPort"] = it
            }

            meta
        }
    }

    private fun isIgnoredPath(path: String): Boolean {
        val cleanedPath = path.dropWhile { it == '/' }
        return ignoredPaths.any { ignoredPath ->
            if (ignoredPath.equals(path, true)) {
                true
            } else if (pathMatcher.isPattern(ignoredPath)) {
                pathMatcher.match(ignoredPath, cleanedPath)
            } else {
                false
            }
        }
    }

    companion object {
        @JvmStatic
        private fun normalizeString(value: String): String {
            return value.trim().uppercase().replace(" ", "_").replace("-", "_")
        }

        @JvmStatic
        private fun generateProtectedKeys(keys: Collection<String>): Set<String> {
            return keys.flatMap {
                setOf(it.uppercase(), normalizeString(it))
            }.toSet()
        }

        @JvmStatic
        private fun filterKeys(protectedKeys: Set<String>, entries: List<NameValuePair>): List<NameValuePair> {
            return entries.filter {
                !(protectedKeys.contains(it.name.uppercase()) || protectedKeys.contains(normalizeString(it.name)))
            }
        }

        @JvmStatic
        private fun filterKeys(protectedKeys: Set<String>, map: Map<String, Any>): Map<String, Any> {
            return map.keys.filter { key ->
                !protectedKeys.contains(key.uppercase()) && !protectedKeys.contains(normalizeString(key))
            }.associateWith { key ->
                map[key]!!
            }.toSortedMap()
        }
    }
}
