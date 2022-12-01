package com.metlo.client.reactive

import com.google.gson.GsonBuilder
import com.metlo.model.MetloTraceRequest
import mu.KotlinLogging
import java.io.Closeable
import java.net.HttpURLConnection
import java.net.URL
import java.time.Instant
import java.util.Collections
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.ThreadPoolExecutor
import java.util.concurrent.TimeUnit

interface ReactiveMetloRequestClient : Closeable {
    fun sendAsync(trace: MetloTraceRequest)
    override fun close() {
    }
}

/**
 * No-Op request client that can optionally log requests.
 */
class NoOpReactiveMetloRequestClient : ReactiveMetloRequestClient {
    override fun sendAsync(trace: MetloTraceRequest) {
    }
}

class ReactiveHttpMetloRequestClient(
    metloAddress: String,
    private val apiKey: String,
    maxPoolSize: Int = 2,
    private val requestsPerSecond: Int = -1
) : ReactiveMetloRequestClient {
    private val pool = ThreadPoolExecutor(0, maxPoolSize, 60, TimeUnit.SECONDS, LinkedBlockingQueue())
    private var timestamps = Collections.synchronizedList(ArrayList<Long>())
    private val metloBulkURL: String
    private val metloSingleURL: String
    init {
        val trimmed = metloAddress.dropLastWhile {
            it == '/'
        }
        metloBulkURL = "${trimmed}$BULK_ENDPOINT"
        metloSingleURL = "${trimmed}$SINGLE_ENDPOINT"
    }

    override fun sendAsync(trace: MetloTraceRequest) {
        if (this.allow()) {
            this.pool.submit {
                try {
                    sendRequest(trace)
                } catch (t: Throwable) {
                    LOGGER.error(t) {
                        "Exception occurred submitting Metlo trace request"
                    }
                }
            }
        }
    }

    private fun prepareRequest(traces: List<MetloTraceRequest>): String {
        return when (traces.size) {
            0 -> ""
            1 -> GSON.toJson(traces.first())
            else -> GSON.toJson(traces)
        }
    }

    private fun sendRequest(vararg traces: MetloTraceRequest) {
        val (body, bodyLength, isSingle) = try {
            prepareRequest(traces.toList()).let {
                Triple(it, it.length, traces.size == 1)
            }
        } catch (t: Throwable) {
            LOGGER.error(t) { "Error serializing traces to JSON" }
            return
        }

        val url = if (isSingle) {
            URL(metloSingleURL)
        } else {
            URL(metloBulkURL)
        }

        val http = (url.openConnection() as HttpURLConnection)
        http.requestMethod = "POST"
        http.setRequestProperty("Authorization", apiKey)
        http.doOutput = true
        http.setFixedLengthStreamingMode(bodyLength)
        http.setRequestProperty("Content-Type", CONTENT_TYPE_HEADER)

        try {
            http.connect()
            http.outputStream.use { os ->
                os.write(body.toByteArray())
            }
            val responseCode = http.responseCode
            if (responseCode < 200 || responseCode > 399) {
                LOGGER.error { "Error sending trace to Metlo API: $responseCode - ${http.responseMessage}" }
            }
        } catch (t: Throwable) {
            LOGGER.error(t) { "Exception occurred sending trace to Metlo API: ${t.localizedMessage}" }
        } finally {
            try {
                http.disconnect()
            } catch (_: Throwable) {
            }
        }
    }

    @Synchronized
    private fun allow(): Boolean {
        if (this.requestsPerSecond < 1) {
            return true
        }

        val now = Instant.now().toEpochMilli()
        val newCopy = Collections.synchronizedList(ArrayList<Long>())
        newCopy.addAll(
            timestamps.filter { x ->
                ((now - x) <= 1000)
            }
        )

        this.timestamps = newCopy

        return if (this.timestamps.size < this.requestsPerSecond) {
            this.timestamps.add(now)
            true
        } else {
            false
        }
    }

    override fun close() {
        try {
            pool.shutdown()
        } catch (_: Throwable) {
        }
    }

    companion object {
        const val SINGLE_ENDPOINT = "/api/v1/log-request/single"
        const val BULK_ENDPOINT = "/api/v1/log-request/bulk"
        private const val CONTENT_TYPE_HEADER = "application/json; charset=UTF-8"

        @JvmStatic
        private val LOGGER = KotlinLogging.logger { }

        @JvmStatic
        private val GSON = GsonBuilder().setPrettyPrinting().create()
    }
}
