use std::cmp::Ordering;

use serde_json::json;
use tokio_postgres::Row;

use crate::{state::AppState, types::TreeApiEndpoint, ENDPOINT_TREE};

use futures_util::{pin_mut, TryStreamExt};

fn get_endpoint_from_row(row: Row) -> Result<TreeApiEndpoint, Box<dyn std::error::Error>> {
    Ok(TreeApiEndpoint {
        uuid: row.try_get("uuid")?,
        organization_uuid: row.try_get("organizationUuid")?,
        path: row.try_get("path")?,
        path_regex: row.try_get("pathRegex")?,
        host: row.try_get("host")?,
        number_params: row.try_get("numberParams")?,
        method: row.try_get("method")?,
        risk_score: row.try_get("riskScore")?,
        is_graph_ql: row.try_get("isGraphQl")?,
        user_set: row.try_get("userSet")?,
    })
}

fn is_parameter(token: &String) -> bool {
    if token.is_empty() {
        false
    } else {
        token.starts_with('{') && token.ends_with('}')
    }
}

fn add_path_tokens(
    idx: usize,
    path_tokens: Vec<String>,
    map: &mut serde_json::Map<String, serde_json::Value>,
    endpoint: TreeApiEndpoint,
) {
    if idx > path_tokens.len() {
        return;
    };
    let item = &path_tokens[idx];
    let token = if is_parameter(item) {
        "{param}".to_owned()
    } else {
        item.to_string()
    };
    match idx.cmp(&(path_tokens.len() - 1)) {
        Ordering::Equal => {
            map.insert(token.to_owned(), json!({ "endpoint": endpoint, "children": map.get(&token).and_then(|e| e.get("children"))}));
        }
        Ordering::Less => {
            if map
                .get_mut(&token)
                .and_then(|e| e.get_mut("children"))
                .is_none()
            {
                map.insert(token.to_owned(), json!({ "endpoint": map.get(&token).and_then(|e| e.get("endpoint")), "children": {}}));
            }
            if let Some(serde_json::Value::Object(e)) =
                map.get_mut(&token).and_then(|e| e.get_mut("children"))
            {
                add_path_tokens(idx + 1, path_tokens, e, endpoint);
            }
        }
        Ordering::Greater => (),
    }
}

async fn build_endpoint_tree(
    state: AppState,
) -> Result<serde_json::Value, Box<dyn std::error::Error + Send + Sync>> {
    let mut tree = json!({
      "children": {}
    });

    let db_conn = state.db_pool.get().await?;
    let params: Vec<String> = vec![];
    let stream = db_conn
        .query_raw("SELECT * FROM api_endpoint", params)
        .await?;

    pin_mut!(stream);

    while let Some(row) = stream.try_next().await? {
        match get_endpoint_from_row(row) {
            Ok(endpoint) => {
                if let Some(serde_json::Value::Object(ptr)) = tree.get_mut("children") {
                    if ptr
                        .get_mut(&endpoint.organization_uuid.to_string())
                        .is_none()
                    {
                        ptr.insert(
                            endpoint.organization_uuid.to_string(),
                            json!({ "children": {}}),
                        );
                    }
                    if let Some(serde_json::Value::Object(ptr_o)) = ptr
                        .get_mut(&endpoint.organization_uuid.to_string())
                        .and_then(|e| e.get_mut("children"))
                    {
                        if ptr_o.get_mut(&endpoint.host).is_none() {
                            ptr_o.insert(endpoint.host.to_owned(), json!({ "children": {}}));
                        }
                        if let Some(serde_json::Value::Object(ptr_h)) = ptr_o
                            .get_mut(&endpoint.host)
                            .and_then(|e| e.get_mut("children"))
                        {
                            if ptr_h.get_mut(&endpoint.method.to_string()).is_none() {
                                ptr_h.insert(endpoint.method.to_string(), json!({ "children": {}}));
                            }
                            if let Some(serde_json::Value::Object(ptr_m)) = ptr_h
                                .get_mut(&endpoint.method.to_string())
                                .and_then(|e| e.get_mut("children"))
                            {
                                let path_tokens: Vec<String> = endpoint
                                    .path
                                    .to_owned()
                                    .split('/')
                                    .map(String::from)
                                    .collect();
                                let mut start: usize = 0;
                                if !path_tokens.is_empty() && path_tokens[0].is_empty() {
                                    start = 1
                                }
                                add_path_tokens(start, path_tokens, ptr_m, endpoint);
                            }
                        }
                    }
                }
            }
            Err(e) => println!("Error parsing endpoint row {:?}", e),
        }
    }

    Ok(tree)
}

pub async fn refresh_endpoint_tree(state: AppState) {
    let res = build_endpoint_tree(state).await;
    match res {
        Ok(tree) => {
            let mut tree_write = ENDPOINT_TREE.write().await;
            *tree_write = tree;
            drop(tree_write);
        }
        Err(e) => println!("Error building endpoint tree: {:?}", e),
    }
}
