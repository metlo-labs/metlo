use serde::Deserialize;

pub struct MappedHost {
    pub mapped_host: String,
    pub is_blocked: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HostMapping {
    pub host: String,
    pub pattern: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetloConfigType {
    pub host_map: Option<Vec<HostMapping>>,
    pub host_block_list: Option<Vec<String>>,
}
