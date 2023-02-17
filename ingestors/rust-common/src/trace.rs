use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

#[derive(Deserialize, Debug, Serialize)]
pub struct KeyVal {
    pub name: String,
    pub value: String,
}

#[derive(Deserialize, Debug, Serialize)]
pub struct ApiUrl {
    pub host: String,
    pub path: String,
    pub parameters: Vec<KeyVal>,
}

#[derive(Deserialize, Debug, Serialize)]
pub struct ApiRequest {
    pub method: String,
    pub url: ApiUrl,
    pub headers: Vec<KeyVal>,
    pub body: String,
}

#[derive(Deserialize, Debug, Serialize)]
pub struct ApiResponse {
    pub status: u16,
    pub headers: Vec<KeyVal>,
    pub body: String,
}

#[derive(Deserialize, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiMeta {
    pub environment: String,
    pub incoming: bool,
    pub source: String,
    pub source_port: u16,
    pub destination: String,
    pub destination_port: u16,
}

#[derive(Deserialize, Debug, Serialize)]
pub struct ApiTrace {
    pub request: ApiRequest,
    pub response: Option<ApiResponse>,
    pub meta: Option<ApiMeta>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessTraceRes {
    pub block: bool,
    pub xss_detected: Option<HashMap<String, String>>,
    pub sqli_detected: Option<HashMap<String, (String, String)>>,
    pub sensitive_data_detected: Option<HashMap<String, HashSet<String>>>,
    pub data_types: Option<HashMap<String, HashSet<String>>>,
    pub validation_errors: Option<HashMap<String, Vec<String>>>,
    pub request_content_type: String,
    pub response_content_type: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessedApiTrace {
    pub request: ApiRequest,
    pub response: Option<ApiResponse>,
    pub meta: Option<ApiMeta>,
    pub processed_trace_data: ProcessTraceRes,
    pub redacted: bool,
}
