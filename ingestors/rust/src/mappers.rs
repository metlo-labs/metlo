use std::collections::HashMap;

use crate::metloingest;
use crate::trace::{ApiMeta, ApiRequest, ApiResponse, ApiTrace, ApiUrl, KeyVal, ProcessTraceRes};

fn map_ingest_api_meta(m: metloingest::ApiMeta) -> Option<ApiMeta> {
    Some(ApiMeta {
        environment: m.environment,
        incoming: m.incoming,
        source: m.source,
        source_port: m.source_port as u16,
        destination: m.destination,
        destination_port: m.destination_port as u16,
    })
}

fn map_ingest_url(u: metloingest::ApiUrl) -> ApiUrl {
    ApiUrl {
        host: u.host,
        path: u.path,
        parameters: u
            .parameters
            .iter()
            .map(|e| KeyVal {
                name: e.name.clone(),
                value: e.value.clone(),
            })
            .collect(),
    }
}

fn map_ingest_api_request(r: metloingest::ApiRequest) -> Option<ApiRequest> {
    Some(ApiRequest {
        method: r.method,
        url: map_ingest_url(r.url?),
        headers: r
            .headers
            .iter()
            .map(|e| KeyVal {
                name: e.name.clone(),
                value: e.value.clone(),
            })
            .collect(),
        body: r.body,
    })
}

fn map_ingest_api_response(r: metloingest::ApiResponse) -> Option<ApiResponse> {
    Some(ApiResponse {
        status: r.status as u16,
        headers: r
            .headers
            .iter()
            .map(|e| KeyVal {
                name: e.name.clone(),
                value: e.value.clone(),
            })
            .collect(),
        body: r.body,
    })
}

pub fn map_ingest_api_trace(t: metloingest::ApiTrace) -> Option<ApiTrace> {
    Some(ApiTrace {
        request: map_ingest_api_request(t.request?)?,
        response: t.response.and_then(map_ingest_api_response),
        meta: t.meta.and_then(map_ingest_api_meta),
    })
}

pub fn map_process_trace_res(r: ProcessTraceRes) -> metloingest::ProcessTraceRes {
    let mapped_sensitive_data: HashMap<String, metloingest::RepeatedString> = r
        .sensitive_data_detected
        .unwrap_or_default()
        .iter()
        .map(|(k, v)| {
            (
                k.clone(),
                metloingest::RepeatedString {
                    rep_string: v.into_iter().map(|e| e.clone()).collect(),
                },
            )
        })
        .collect();

    let mapped_sqli_detected: HashMap<String, metloingest::SqliRes> = r
        .sqli_detected
        .unwrap_or_default()
        .iter()
        .map(|(k, v)| {
            (
                k.clone(),
                metloingest::SqliRes {
                    data: v.0.clone(),
                    fingerprint: v.1.clone(),
                },
            )
        })
        .collect();

    let mapped_data_types: HashMap<String, metloingest::RepeatedString> = r
        .data_types
        .unwrap_or_default()
        .iter()
        .map(|(k, v)| {
            (
                k.clone(),
                metloingest::RepeatedString {
                    rep_string: v.into_iter().map(|e| e.clone()).collect(),
                },
            )
        })
        .collect();

    metloingest::ProcessTraceRes {
        block: r.block,
        xss_detected: r.xss_detected.unwrap_or_default(),
        sensitive_data_detected: mapped_sensitive_data,
        sqli_detected: mapped_sqli_detected,
        data_types: mapped_data_types,
    }
}
