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
pub struct ProcessTraceResInner {
    pub block: bool,
    pub xss_detected: Option<HashMap<String, String>>,
    pub sqli_detected: Option<HashMap<String, (String, String)>>,
    pub sensitive_data_detected: Option<HashMap<String, HashSet<String>>>,
    pub data_types: Option<HashMap<String, HashSet<String>>>,
    pub validation_errors: Option<HashMap<String, Vec<String>>>,
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
    pub graph_ql_data: Option<GraphQlData>,
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
    pub graph_ql_data: Option<GraphQlData>,
    pub proc_trace_res: Option<ProcessTraceResInner>,
    pub response_alias_map: HashMap<String, String>,
}
