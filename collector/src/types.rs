use std::{
    collections::{HashMap, HashSet},
    error::Error,
    fmt,
};

use postgres_types::Type;
use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;
use tokio_postgres::types::FromSql;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum RestMethod {
    Get,
    Head,
    Post,
    Put,
    Patch,
    Delete,
    Connect,
    Options,
    Trace,
}

impl FromSql<'_> for RestMethod {
    fn from_sql(_sql_type: &Type, value: &[u8]) -> Result<Self, Box<dyn Error + Sync + Send>> {
        match value {
            b"GET" => Ok(RestMethod::Get),
            b"HEAD" => Ok(RestMethod::Head),
            b"POST" => Ok(RestMethod::Post),
            b"PUT" => Ok(RestMethod::Put),
            b"PATCH" => Ok(RestMethod::Patch),
            b"DELETE" => Ok(RestMethod::Delete),
            b"CONNECT" => Ok(RestMethod::Connect),
            b"OPTIONS" => Ok(RestMethod::Options),
            b"TRACE" => Ok(RestMethod::Trace),
            _ => Err("Couldn't parse rest method from query result".into()),
        }
    }

    fn accepts(sql_type: &Type) -> bool {
        sql_type.name() == "rest_method_enum"
    }
}

impl Serialize for RestMethod {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(match self {
            RestMethod::Get => "GET",
            RestMethod::Head => "HEAD",
            RestMethod::Post => "POST",
            RestMethod::Put => "PUT",
            RestMethod::Patch => "PATCH",
            RestMethod::Delete => "DELETE",
            RestMethod::Connect => "CONNECT",
            RestMethod::Options => "OPTIONS",
            RestMethod::Trace => "TRACE",
        })
    }
}

impl<'de> Deserialize<'de> for RestMethod {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        Ok(match s.as_str() {
            "GET" => RestMethod::Get,
            "HEAD" => RestMethod::Head,
            "POST" => RestMethod::Post,
            "PUT" => RestMethod::Put,
            "PATCH" => RestMethod::Patch,
            "DELETE" => RestMethod::Delete,
            "CONNECT" => RestMethod::Connect,
            "OPTIONS" => RestMethod::Options,
            "TRACE" => RestMethod::Trace,
            _ => RestMethod::Get,
        })
    }
}

impl fmt::Display for RestMethod {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            RestMethod::Get => write!(f, "GET"),
            RestMethod::Head => write!(f, "HEAD"),
            RestMethod::Post => write!(f, "POST"),
            RestMethod::Put => write!(f, "PUT"),
            RestMethod::Patch => write!(f, "PATCH"),
            RestMethod::Delete => write!(f, "DELETE"),
            RestMethod::Connect => write!(f, "CONNECT"),
            RestMethod::Options => write!(f, "OPTIONS"),
            RestMethod::Trace => write!(f, "TRACE"),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum RiskScore {
    High,
    Medium,
    Low,
    None,
}

impl FromSql<'_> for RiskScore {
    fn from_sql(_sql_type: &Type, value: &[u8]) -> Result<Self, Box<dyn Error + Sync + Send>> {
        match value {
            b"high" => Ok(RiskScore::High),
            b"medium" => Ok(RiskScore::Medium),
            b"low" => Ok(RiskScore::Low),
            b"none" => Ok(RiskScore::None),
            _ => Err("Couldn't parse risk score from query result".into()),
        }
    }

    fn accepts(sql_type: &Type) -> bool {
        sql_type.name() == "riskscore_enum"
    }
}

impl Serialize for RiskScore {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(match self {
            RiskScore::High => "high",
            RiskScore::Medium => "medium",
            RiskScore::Low => "low",
            RiskScore::None => "none",
        })
    }
}

impl<'de> Deserialize<'de> for RiskScore {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        Ok(match s.as_str() {
            "high" => RiskScore::High,
            "medium" => RiskScore::Medium,
            "low" => RiskScore::Low,
            "none" => RiskScore::None,
            _ => RiskScore::None,
        })
    }
}

#[derive(Clone, Debug)]
pub struct CurrentUser {
    pub user_uuid: Option<uuid::Uuid>,
    pub organization_uuid: uuid::Uuid,
}

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

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SessionMeta {
    pub authentication_provided: Option<bool>,
    pub authentication_successful: Option<bool>,
    pub auth_type: Option<String>,
    pub unique_session_key: Option<String>,
    pub user: Option<String>,
    pub user_agent: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TreeApiEndpoint {
    pub uuid: uuid::Uuid,
    pub organization_uuid: uuid::Uuid,
    pub path: String,
    pub path_regex: String,
    pub host: String,
    pub number_params: i32,
    pub method: RestMethod,
    pub risk_score: RiskScore,
    pub is_graph_ql: bool,
    pub user_set: bool,
}
