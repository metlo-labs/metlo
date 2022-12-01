package com.metlo.model

import org.springframework.util.MultiValueMap
import java.io.Serializable

data class NameValuePair(
    val name: String,
    val value: String
) : Serializable {
    companion object {
        @JvmStatic
        fun fromMultiValueMap(map: MultiValueMap<String, String>): List<NameValuePair> {
            return map.map { (key, values) ->
                NameValuePair(key, values.joinToString(","))
            }
        }

        @JvmStatic
        fun fromMap(map: Map<String, List<String>>): List<NameValuePair> {
            return map.map { (key, values) ->
                NameValuePair(key, values.joinToString(","))
            }
        }
    }
}

@Suppress("NOTHING_TO_INLINE", "RedundantVisibilityModifier")
public inline fun Map<String, List<String>>.toNameValuePairs(): List<NameValuePair> {
    return NameValuePair.fromMap(this)
}

@Suppress("NOTHING_TO_INLINE", "RedundantVisibilityModifier")
public inline fun MultiValueMap<String, String>.toNameValuePairs(): List<NameValuePair> {
    return NameValuePair.fromMultiValueMap(this)
}
