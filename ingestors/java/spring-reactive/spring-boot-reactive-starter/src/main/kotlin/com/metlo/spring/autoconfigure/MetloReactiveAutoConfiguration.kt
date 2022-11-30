package com.metlo.spring.autoconfigure

import com.metlo.client.reactive.NoOpReactiveMetloRequestClient
import com.metlo.client.reactive.ReactiveHttpMetloRequestClient
import com.metlo.client.reactive.ReactiveMetloRequestClient
import com.metlo.configuration.MetloConfigurationProperties
import com.metlo.spring.MetloReactiveWebFilter
import mu.KotlinLogging
import org.springframework.boot.autoconfigure.AutoConfigureBefore
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication
import org.springframework.boot.autoconfigure.web.reactive.ReactiveWebServerFactoryAutoConfiguration
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.server.ServerWebExchange
import org.springframework.web.server.WebFilter

@Configuration
@EnableConfigurationProperties(MetloConfigurationProperties::class)
@ConditionalOnClass(ServerWebExchange::class)
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.REACTIVE)
@ConditionalOnProperty("metlo.enabled", havingValue = "true", matchIfMissing = true)
@AutoConfigureBefore(ReactiveWebServerFactoryAutoConfiguration::class)
open class MetloReactiveAutoConfiguration {
    private val logger = KotlinLogging.logger { }

    @ConditionalOnMissingBean(ReactiveMetloRequestClient::class)
    @Bean(destroyMethod = "close")
    open fun reactiveMetloRequestClient(configuration: MetloConfigurationProperties): ReactiveMetloRequestClient {
        return if (configuration.apiKey.isBlank()) {
            logger.warn { "No Metlo API key was provided, no traces will be sent." }
            NoOpReactiveMetloRequestClient()
        } else if (configuration.host.isBlank()) {
            logger.warn { "No Metlo host URL was provided, no traces will be sent." }
            NoOpReactiveMetloRequestClient()
        } else {
            buildHttpClient(configuration)
        }
    }

    @Bean
    open fun reactiveMetloWebFilter(
        configuration: MetloConfigurationProperties,
        client: ReactiveMetloRequestClient
    ): WebFilter {
        return MetloReactiveWebFilter(configuration, client)
    }

    private fun buildHttpClient(configuration: MetloConfigurationProperties): ReactiveHttpMetloRequestClient {
        logger.trace { "Initializing ReactiveHttpMetloRequestClient for Metlo host ${configuration.host}" }
        return ReactiveHttpMetloRequestClient(
            metloAddress = configuration.host.trim(),
            apiKey = configuration.apiKey.trim(),
            maxPoolSize = configuration.threadPoolSize,
            requestsPerSecond = configuration.requestsPerSecond
        )
    }
}
