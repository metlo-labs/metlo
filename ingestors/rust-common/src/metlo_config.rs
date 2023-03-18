use std::collections::HashMap;

use regex::Regex;
use reqwest::Url;
use serde::{Deserialize, Serialize};

use crate::{
    open_api::{compile_specs, CompiledSpecs},
    sensitive_data::SensitiveData,
    METLO_CONFIG,
};

#[derive(Debug, Default, Clone)]
pub struct MetloCreds {
    pub api_key: String,
    pub metlo_host: String,
    pub backend_port: Option<u16>,
    pub collector_port: Option<u16>,
}

#[derive(Debug, Default, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MetloSensitiveData {
    class_name: String,
    severity: String,
    regex: Option<String>,
}

#[derive(Debug, Default, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MetloEndpoint {
    pub path: String,
    pub openapi_spec_name: Option<String>,
    pub host: String,
    pub method: String,
    pub full_trace_capture_enabled: bool,
    pub number_params: u8,
    pub is_graph_ql: bool,
}

#[derive(Debug, Default, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MetloSpec {
    pub name: String,
    pub spec: String,
}

#[derive(Debug, Default, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MetloConfig {
    pub sensitive_data_list: Vec<MetloSensitiveData>,
    pub endpoints: Vec<MetloEndpoint>,
    pub specs: Vec<MetloSpec>,
    pub global_full_trace_capture: bool,
    pub encryption_public_key: Option<String>,
}

#[derive(Debug)]
pub struct GlobalConfig {
    pub creds: Option<MetloCreds>,
    pub collector_url: Option<String>,
    pub backend_url: Option<String>,
    pub metlo_config: Option<MetloConfig>,
    pub sensitive_data: Option<Vec<SensitiveData>>,
    pub endpoints: Option<HashMap<String, Vec<MetloEndpoint>>>,
    pub specs: Option<CompiledSpecs>,
    pub global_full_trace_capture: bool,
    pub encryption_public_key: Option<String>,
}

pub struct ValidateRequestConnResp {
    pub ok: bool,
    pub msg: Option<String>,
}

async fn validate_connection_inner(
    endpoint_url: &str,
    api_key: &str,
) -> Result<ValidateRequestConnResp, Box<dyn std::error::Error>> {
    let url_res = Url::parse(endpoint_url);
    match url_res {
        Ok(url) => {
            let client = reqwest::Client::new();
            let resp = client
                .get(url)
                .header("authorization", api_key)
                .send()
                .await?;
            if resp.status() == reqwest::StatusCode::OK {
                return Ok(ValidateRequestConnResp {
                    ok: true,
                    msg: None,
                });
            }
            let text = resp.text().await?;
            Ok(ValidateRequestConnResp {
                ok: false,
                msg: Some(text),
            })
        }
        Err(e) => Ok(ValidateRequestConnResp {
            ok: false,
            msg: Some(format!("Couldn't parse url: {}", e)),
        }),
    }
}

pub async fn validate_connection(endpoint_url: &str, api_key: &str) -> ValidateRequestConnResp {
    let resp = validate_connection_inner(endpoint_url, api_key).await;
    match resp {
        Ok(r) => r,
        Err(err) => ValidateRequestConnResp {
            ok: false,
            msg: Some(err.to_string()),
        },
    }
}

fn get_endpoints_map(mut endpoints: Vec<MetloEndpoint>) -> HashMap<String, Vec<MetloEndpoint>> {
    endpoints.sort_by(|a, b| a.number_params.cmp(&b.number_params));
    let mut endpoints_map: HashMap<String, Vec<MetloEndpoint>> = HashMap::new();
    for endpoint in endpoints {
        let key = format!("{}-{}", endpoint.host, endpoint.method.to_lowercase());
        let curr_endpoints = endpoints_map.get_mut(&key);
        match curr_endpoints {
            Some(old) => {
                old.push(endpoint);
            }
            None => {
                endpoints_map.insert(key, vec![endpoint]);
            }
        }
    }
    endpoints_map
}

pub async fn pull_metlo_config() -> Result<(), Box<dyn std::error::Error>> {
    let conf_read = METLO_CONFIG.read().await;
    let backend_url = conf_read.backend_url.clone().unwrap_or_default();
    let api_key = conf_read.creds.clone().unwrap_or_default().api_key;
    drop(conf_read); // Drop read lock so we can get write lock later

    if backend_url.is_empty() || api_key.is_empty() {
        log::info!("Metlo Not Initialized");
        return Ok(());
    }

    let agent_config_url = backend_url + "/api/v1/agent-config";
    let url = Url::parse(&agent_config_url)?;
    let client = reqwest::Client::new();
    let resp = client
        .get(url)
        .header("authorization", api_key)
        .send()
        .await?
        .json::<MetloConfig>()
        .await?;

    let new_sensitive_data: Vec<SensitiveData> = resp
        .sensitive_data_list
        .iter()
        .map(|e| match &e.regex {
            Some(unwrapped_regex) => {
                let regex = Regex::new(unwrapped_regex);
                match regex {
                    Ok(r) => Some(SensitiveData {
                        sensitive_data_type: e.class_name.clone(),
                        regex: r,
                    }),
                    Err(err) => {
                        log::info!(
                            "Failed to Compile Regex \"{}\" - {}\n",
                            e.class_name,
                            err.to_string()
                        );
                        None
                    }
                }
            }
            None => None,
        })
        .flatten()
        .collect();
    let compiled_specs = compile_specs(resp.specs);
    let endpoints_map = get_endpoints_map(resp.endpoints);

    let mut conf_write = METLO_CONFIG.write().await;
    conf_write.sensitive_data = Some(new_sensitive_data);
    conf_write.endpoints = Some(endpoints_map);
    conf_write.specs = Some(compiled_specs);
    conf_write.global_full_trace_capture = resp.global_full_trace_capture;
    conf_write.encryption_public_key = resp.encryption_public_key;

    Ok(())
}
