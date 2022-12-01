package com.metlo.model

import java.io.Serializable

data class MetloTraceRequest(
    val request: MetloServerRequestTrace,
    val response: MetloServerResponseTrace,
    val meta: Map<String, Any> = emptyMap()
) : Serializable

data class MetloServerRequestTrace(
    val url: MetloServerRequestParameters,
    val method: String,
    val headers: List<NameValuePair>,
    val body: String?
) : Serializable

data class MetloServerResponseTrace(
    val status: Int,
    val headers: List<NameValuePair>,
    val body: String?
)

data class MetloServerRequestParameters(
    val host: String,
    val path: String,
    val parameters: List<NameValuePair> = emptyList()
) : Serializable
