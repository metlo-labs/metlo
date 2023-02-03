use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Deserialize, Serialize)]
pub struct KeyVal {
    pub name: String,
    pub value: String,
}

#[derive(Deserialize, Serialize)]
pub struct ApiUrl {
    pub host: String,
    pub path: String,
    pub parameters: Vec<KeyVal>,
}

#[derive(Deserialize, Serialize)]
pub struct ApiRequest {
    pub method: String,
    pub url: ApiUrl,
    pub headers: Vec<KeyVal>,
    pub body: Option<String>,
}

#[derive(Deserialize, Serialize)]
pub struct ApiResponse {
    pub status: u16,
    pub headers: Vec<KeyVal>,
    pub body: Option<String>,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Meta {
    pub environment: String,
    pub incoming: bool,
    pub source: String,
    pub source_port: u16,
    pub destination: String,
    pub destination_port: u16,
}

#[derive(Deserialize, Serialize)]
pub struct ApiTrace {
    pub request: ApiRequest,
    pub response: Option<ApiResponse>,
    pub meta: Option<Meta>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessTraceRes {
    pub block: bool,
    pub xss_detected: Option<HashMap<String, String>>,
    pub sqli_detected: Option<HashMap<String, (String, String)>>,
    pub sensitive_data_detected: Option<HashMap<String, Vec<String>>>,
}
