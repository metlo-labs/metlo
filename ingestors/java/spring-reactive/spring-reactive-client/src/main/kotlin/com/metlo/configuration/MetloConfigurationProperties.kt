package com.metlo.configuration

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.ConstructorBinding

@ConstructorBinding
@ConfigurationProperties("metlo", ignoreUnknownFields = true)
data class MetloConfigurationProperties(
    /**
     * Enable Metlo request and response tracing.
     */
    val enabled: Boolean = true,
    /**
     * The maximum number of threads to use for asynchronous communication.
     */
    val threadPoolSize: Int = 2,
    /**
     * The maximum number of trace requests per second to capture, -1 means unlimited.
     */
    val requestsPerSecond: Int = -1,
    /**
     * The Metlo connection API key to use for authorization.
     */
    val apiKey: String = "",
    /**
     * The Metlo API host URL to send traces to.
     */
    val host: String = "https://app.metlo.com:8081",
    /**
     * Case-insensitive collection of field names to omit from headers, bodies, and query arguments.
     */
    val protectedKeys: List<String> = emptyList(),
    /**
     * Collection of paths (ant-path style accepted) to ignore for trace requests.
     */
    val ignoredPaths: List<String> = emptyList(),
    /**
     * Log trace requests to application logs.
     */
    val logRequests: Boolean = false,
    /**
     * Manually set the instance hostname for tracing.
     */
    val hostname: String? = null
)
