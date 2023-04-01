use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

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

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct ApiTrace {
    pub request: ApiRequest,
    pub response: Option<ApiResponse>,
    pub meta: Option<ApiMeta>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessTraceResInner {
    pub block: bool,
    pub xss_detected: Option<HashMap<String, String>>,
    pub sqli_detected: Option<HashMap<String, (String, String)>>,
    pub sensitive_data_detected: Option<HashMap<String, HashSet<String>>>,
    pub data_types: Option<HashMap<String, HashSet<String>>>,
    pub validation_errors: Option<HashMap<String, Vec<String>>>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Encryption {
    pub key: String,
    pub generated_ivs: HashMap<String, Vec<u8>>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OperationItem {
    pub name: Option<String>,
    pub alias: Option<String>,
    pub arguments: Vec<String>,
    pub items: Vec<OperationItem>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Variable {
    pub name: String,
    pub var_type: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Operation {
    pub operation_name: Option<String>,
    pub operation_type: String,
    pub items: Vec<OperationItem>,
    pub variables: Vec<Variable>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphQlData {
    pub operation_name: Option<String>,
    pub operations: Vec<Operation>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphQlRes {
    pub graph_ql_data: Vec<GraphQlData>,
    pub proc_trace_res: ProcessTraceResInner,
    pub response_alias_map: HashMap<String, String>,
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
    pub graph_ql_data: Vec<GraphQlData>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionMeta {
    pub authentication_provided: Option<bool>,
    pub authentication_successful: Option<bool>,
    pub auth_type: Option<String>,
    pub unique_session_key: Option<String>,
    pub user: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessedApiTrace {
    pub request: ApiRequest,
    pub response: Option<ApiResponse>,
    pub meta: Option<ApiMeta>,
    pub processed_trace_data: ProcessTraceRes,
    pub redacted: bool,
    pub encryption: Option<Encryption>,
    pub session_meta: Option<SessionMeta>,
    pub analysis_type: String,
}
