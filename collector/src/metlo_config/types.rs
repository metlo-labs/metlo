use std::collections::HashMap;

use regex::Regex;
use serde::Deserialize;

pub struct MappedHost {
    pub mapped_host: Option<String>,
    pub is_ignored: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HostMapping {
    pub host: String,
    pub pattern: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PathIgnoreList {
    pub host: String,
    pub paths: Vec<String>,
}

pub struct HostMappingCompiled {
    pub host: String,
    pub pattern: Regex,
}

pub struct PathIgnoreListCompiled {
    pub host: Regex,
    pub paths: Vec<Regex>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IgnoredDetection {
    pub id: Option<String>,
    pub host: Option<String>,
    pub path: Option<String>,
    pub method: Option<String>,
    pub ignored_paths: HashMap<String, Vec<String>>,
}

pub struct ConfigInfo {
    pub compiled_host_map: Option<Vec<HostMappingCompiled>>,
    pub compiled_host_ignore_list: Option<Vec<Regex>>,
    pub compiled_path_ignore_list: Option<Vec<PathIgnoreListCompiled>>,
    pub ignored_detections: Option<Vec<IgnoredDetection>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetloConfigType {
    pub host_map: Option<Vec<HostMapping>>,
    pub host_block_list: Option<Vec<String>>,
    pub path_block_list: Option<Vec<PathIgnoreList>>,
    pub ignored_detections: Option<Vec<IgnoredDetection>>,
}
