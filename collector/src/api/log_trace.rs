use axum::extract::{self, Extension};
use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;
use std::collections::{HashMap, HashSet};

use crate::types::CurrentUser;

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct KeyVal {
    pub name: String,
    pub value: String,
}

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct ApiUrl {
    pub host: String,
    pub path: String,
    pub parameters: Vec<KeyVal>,
}

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct ApiRequest {
    pub method: String,
    pub url: ApiUrl,
    pub headers: Vec<KeyVal>,
    pub body: String,
    pub user: Option<String>,
}

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct ApiResponse {
    pub status: u16,
    pub headers: Vec<KeyVal>,
    pub body: String,
}

#[derive(Deserialize, Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiMeta {
    pub environment: String,
    pub incoming: bool,
    pub source: String,
    pub source_port: u16,
    pub destination: String,
    pub destination_port: u16,
    pub original_source: Option<String>,
}

#[skip_serializing_none]
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessTraceRes {
    pub block: bool,
    pub attack_detections: Option<HashMap<String, HashSet<String>>>,
    pub sensitive_data_detected: Option<HashMap<String, HashSet<String>>>,
    pub data_types: Option<HashMap<String, HashSet<String>>>,
    pub graphql_paths: Option<HashSet<String>>,
    pub request_content_type: String,
    pub response_content_type: String,
    pub request_tags: Option<Vec<String>>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionMeta {
    pub authentication_provided: Option<bool>,
    pub authentication_successful: Option<bool>,
    pub auth_type: Option<String>,
    pub unique_session_key: Option<String>,
    pub user: Option<String>,
    pub user_agent: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Encryption {
    pub key: String,
    pub generated_ivs: HashMap<String, Vec<u8>>,
}

#[skip_serializing_none]
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessedApiTrace {
    pub request: ApiRequest,
    pub response: Option<ApiResponse>,
    pub meta: Option<ApiMeta>,
    pub processed_trace_data: Option<ProcessTraceRes>,
    pub redacted: bool,
    pub encryption: Option<Encryption>,
    pub session_meta: Option<SessionMeta>,
    pub analysis_type: String,
}

pub async fn log_trace_batch(
    Extension(current_user): Extension<CurrentUser>,
    extract::Json(traces): extract::Json<Vec<ProcessedApiTrace>>,
) -> &'static str {
    println!("{:?}", traces);
    println!("{:?}", current_user);
    "OK"
}
