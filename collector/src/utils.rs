use std::time::{SystemTime, UNIX_EPOCH};

use axum::http::StatusCode;
use deadpool_redis::Connection;

use crate::types::{CurrentUser, TreeApiEndpoint};
pub fn internal_error<E>(err: E) -> (StatusCode, String)
where
    E: std::error::Error,
{
    (StatusCode::INTERNAL_SERVER_ERROR, err.to_string())
}

pub const GRAPHQL_SECTIONS: [&str; 3] = ["reqBody", "reqQuery", "resBody"];
pub const TRACES_QUEUE: &str = "traces_queue";
pub const ENDPOINT_CALL_COUNT_HASH: &str = "endpoints_call_count";
pub const ORG_ENDPOINT_CALL_COUNT: &str = "org_endpoints_call_count";
const GRAPHQL_PATHS: [&str; 1] = ["/graphql"];
const USAGE_GRANULARITY: u128 = 1000 * 60;

pub fn get_valid_path(path: &str) -> Result<String, Box<dyn std::error::Error>> {
    if path.is_empty() {
        return Err("No path provided".into());
    }
    if !path.starts_with('/') {
        return Err("Path does not start with a leading slash.".into());
    }

    if path == "/" {
        return Ok("/".to_owned());
    }

    let tokens = path.split('/');
    let mut empty_tokens: u16 = 0;
    let mut valid_path_tokens: Vec<&str> = vec![];

    for token in tokens {
        if token.is_empty() {
            empty_tokens += 1;
        } else {
            valid_path_tokens.push(token)
        }
    }

    if empty_tokens > 2 {
        return Err("Too many trailing or leading slashes in path.".into());
    }

    let mut valid_path = valid_path_tokens.join("/");
    valid_path.insert(0, '/');

    Ok(valid_path)
}

pub fn is_graphql_endpoint(path: &str) -> bool {
    let trimmed = path.trim_end_matches('/');
    GRAPHQL_PATHS.iter().any(|e| trimmed.ends_with(e))
}

pub async fn increment_endpoint_seen_usage_bulk(
    user: &CurrentUser,
    endpoints: &[Option<TreeApiEndpoint>],
    endpoint_call_count_key: &str,
    org_call_count_key: &str,
    redis_conn: &mut Connection,
) {
    let mut endpoint_call_key = "_".to_owned() + endpoint_call_count_key;
    let mut org_call_key = "_".to_owned() + org_call_count_key;
    if !user.organization_uuid.is_nil() {
        let org_str = user.organization_uuid.to_string();
        endpoint_call_key.insert_str(0, org_str.as_str());
        org_call_key.insert_str(0, org_str.as_str());
    }
    let curr_time = SystemTime::now().duration_since(UNIX_EPOCH);
    if let Ok(duration) = curr_time {
        let curr_time_millis = duration.as_millis();
        let time_slot = curr_time_millis - (curr_time_millis % USAGE_GRANULARITY);
        org_call_key.push('_');
        org_call_key.push_str(time_slot.to_string().as_str());
        let org_call_key_str = org_call_key.as_str();
        let endpoint_call_key_str = endpoint_call_key.as_str();
        let mut pipe = redis::pipe();
        let mut endpoint_count = 0;
        for endpoint in endpoints.iter().flatten() {
            endpoint_count += 1;
            pipe.cmd("HINCRBY")
                .arg(&[
                    endpoint_call_key_str,
                    endpoint.uuid.to_string().as_str(),
                    "1",
                ])
                .ignore();
        }
        let pipe = pipe
            .cmd("INCRBY")
            .arg(&[org_call_key_str, endpoint_count.to_string().as_str()])
            .ignore()
            .cmd("EXPIRE")
            .arg(&[org_call_key_str, "120"])
            .ignore();
        if let Err(e) = pipe.query_async::<_, ()>(redis_conn).await {
            println!("Encountered error while incrementing endpoint usage: {}", e);
        }
    }
}
