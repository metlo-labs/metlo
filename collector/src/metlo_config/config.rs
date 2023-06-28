use std::collections::HashMap;

use deadpool_postgres::Object;
use deadpool_redis::Connection;
use redis::cmd;

use crate::types::CurrentUser;

use super::types::{MappedHost, MetloConfigType};

async fn get_metlo_config_processed(user: &CurrentUser, db_conn: Object) -> String {
    let default = MetloConfigType {
        host_map: None,
        host_block_list: None,
    };
    let res = db_conn
        .query_one(
            "SELECT * FROM metlo_config WHERE \"organizationUuid\" = $1",
            &[&user.organization_uuid],
        )
        .await;
    /*match res {
        Ok(row) => {
            serde_yaml::from_str::<MetloConfigType>(row.get("configString")).unwrap_or(default)
        }
        Err(_) => default,
    }*/
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

fn get_mapped_host(
    user: &CurrentUser,
    host_map: &mut HashMap<String, MappedHost>,
    host: String,
    trace_path: String,
    db_conn: Object,
    redis_conn: &mut Connection,
) {
}
