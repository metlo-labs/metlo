use deadpool_postgres::Object;
use deadpool_redis::Connection;
use redis::cmd;
use regex::Regex;

use crate::types::CurrentUser;

use super::types::{
    ConfigInfo, HostMappingCompiled, MappedHost, MetloConfigType, PathIgnoreListCompiled,
};

async fn get_metlo_config_processed(user: &CurrentUser, db_conn: Object) -> String {
    let res = db_conn
        .query_one(
            "SELECT * FROM metlo_config WHERE \"organizationUuid\" = $1",
            &[&user.organization_uuid],
        )
        .await;
    match res {
        Ok(row) => row.get("configString"),
        Err(_) => "".to_owned(),
    }
}

async fn get_metlo_config_processed_cached(
    user: &CurrentUser,
    db_conn: Object,
    redis_conn: &mut Connection,
) -> MetloConfigType {
    let default = MetloConfigType {
        host_map: None,
        host_block_list: None,
        path_block_list: None,
        ignored_detections: None,
    };
    let mut redis_key = "_cachedMetloConfig".to_owned();
    if !&user.organization_uuid.is_nil() {
        redis_key.insert_str(0, user.organization_uuid.to_string().as_str());
    }
    let redis_key_str = redis_key.as_str();
    let redis_metlo_config_str: Option<String> = cmd("GET")
        .arg(&[redis_key_str])
        .query_async(redis_conn)
        .await
        .ok();

    match redis_metlo_config_str {
        Some(config) => serde_yaml::from_str::<MetloConfigType>(&config).unwrap_or(default),
        None => {
            let config_string = get_metlo_config_processed(user, db_conn).await;
            if let Err(e) = redis::pipe()
                .cmd("SET")
                .arg(&[redis_key_str, &config_string])
                .ignore()
                .cmd("EXPIRE")
                .arg(&[redis_key_str, "60"])
                .ignore()
                .query_async::<_, ()>(redis_conn)
                .await
            {
                println!(
                    "Encountered error while saving Metlo Config in cache: {}",
                    e
                );
            }
            serde_yaml::from_str::<MetloConfigType>(&config_string).unwrap_or(default)
        }
    }
}

pub async fn get_config_info(
    user: &CurrentUser,
    db_conn: Object,
    redis_conn: &mut Connection,
) -> ConfigInfo {
    let res = get_metlo_config_processed_cached(user, db_conn, redis_conn).await;
    ConfigInfo {
        compiled_host_map: res.host_map.map(|e| {
            e.iter()
                .filter_map(|h| match Regex::new(&h.pattern) {
                    Ok(r) => Some(HostMappingCompiled {
                        host: h.host.to_owned(),
                        pattern: r,
                    }),
                    Err(_) => None,
                })
                .collect()
        }),
        compiled_host_ignore_list: res.host_block_list.map(|e| {
            e.iter()
                .filter_map(|h| match Regex::new(h) {
                    Ok(r) => Some(r),
                    Err(_) => None,
                })
                .collect()
        }),
        compiled_path_ignore_list: res.path_block_list.map(|e| {
            e.iter()
                .filter_map(|h| match Regex::new(&h.host) {
                    Ok(r) => Some(PathIgnoreListCompiled {
                        host: r,
                        paths: h
                            .paths
                            .iter()
                            .filter_map(|p| match Regex::new(p) {
                                Ok(reg) => Some(reg),
                                Err(_) => None,
                            })
                            .collect(),
                    }),
                    Err(_) => None,
                })
                .collect()
        }),
        ignored_detections: res.ignored_detections,
    }
}

pub fn get_mapped_host(config_info: &ConfigInfo, trace_host: &str, trace_path: &str) -> MappedHost {
    let mut res = MappedHost {
        mapped_host: None,
        is_ignored: false,
    };

    if let Some(map) = config_info
        .compiled_host_map
        .as_ref()
        .and_then(|e| e.iter().find(|&h| h.pattern.is_match(trace_host)))
    {
        res.mapped_host = Some(map.host.to_owned());
    }

    if let Some(host_ignore_list) = &config_info.compiled_host_ignore_list {
        if !host_ignore_list.is_empty() {
            for ignored_host in host_ignore_list {
                if ignored_host.is_match(trace_host) {
                    res.is_ignored = true;
                    break;
                }
            }
        }
    }

    if !res.is_ignored {
        if let Some(path_ignore_list) = &config_info.compiled_path_ignore_list {
            for item in path_ignore_list {
                if item.host.is_match(trace_host) {
                    for ignored_path in &item.paths {
                        if ignored_path.is_match(trace_path) {
                            res.is_ignored = true;
                            break;
                        }
                    }
                }
            }
        }
    }
    res
}
