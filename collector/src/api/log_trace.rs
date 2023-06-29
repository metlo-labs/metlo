use std::collections::{HashMap, HashSet};

use axum::{
    extract::{self, Extension, State},
    http::StatusCode,
};

use deadpool_redis::redis::cmd;

use crate::{
    endpoint_tree::get_endpoint_from_tree,
    state::AppState,
    types::{
        ApiRequest, ApiUrl, CurrentUser, MetloContext, ProcessTraceRes, ProcessedApiTrace,
        QueuedApiTrace, QueuedApiTraceItem, TreeApiEndpoint,
    },
    utils::{
        get_valid_path, increment_endpoint_seen_usage_bulk, internal_error, is_graphql_endpoint,
        ENDPOINT_CALL_COUNT_HASH, GRAPHQL_SECTIONS, ORG_ENDPOINT_CALL_COUNT, TRACES_QUEUE,
    },
};

fn get_content_type(content_type: String) -> String {
    match content_type.trim().parse::<mime::Mime>() {
        Ok(m) => m.essence_str().to_owned(),
        Err(_) => "*/*".to_owned(),
    }
}

fn get_trace_obj_partial(trace: ProcessedApiTrace, valid_path: String) -> ProcessedApiTrace {
    ProcessedApiTrace {
        request: ApiRequest {
            method: trace.request.method,
            url: ApiUrl {
                host: trace.request.url.host,
                path: valid_path,
                parameters: trace.request.url.parameters,
            },
            headers: trace.request.headers,
            body: trace.request.body,
            user: trace.request.user,
        },
        response: trace.response,
        meta: trace.meta,
        processed_trace_data: trace.processed_trace_data.map(|e| ProcessTraceRes {
            block: e.block,
            attack_detections: e.attack_detections,
            sensitive_data_detected: e.sensitive_data_detected,
            data_types: e.data_types,
            graphql_paths: e.graphql_paths,
            request_content_type: get_content_type(e.request_content_type),
            response_content_type: get_content_type(e.response_content_type),
            request_tags: e.request_tags,
        }),
        redacted: trace.redacted,
        encryption: trace.encryption,
        session_meta: trace.session_meta,
        analysis_type: trace.analysis_type,
    }
}

fn get_trace_obj_full(
    trace: ProcessedApiTrace,
    valid_path: String,
    status_code: u16,
) -> QueuedApiTrace {
    QueuedApiTrace {
        path: valid_path,
        created_at: chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true),
        host: trace.request.url.host,
        method: trace.request.method,
        request_parameters: trace.request.url.parameters,
        request_headers: trace.request.headers,
        request_body: trace.request.body,
        response_status: status_code,
        response_headers: trace
            .response
            .as_ref()
            .map_or(vec![], |e| e.headers.to_owned()),
        response_body: trace.response.map(|e| e.body),
        meta: trace.meta,
        session_meta: trace.session_meta,
        processed_trace_data: trace.processed_trace_data.map(|e| ProcessTraceRes {
            block: e.block,
            attack_detections: e.attack_detections,
            sensitive_data_detected: e.sensitive_data_detected,
            data_types: e.data_types,
            graphql_paths: e.graphql_paths,
            request_content_type: get_content_type(e.request_content_type),
            response_content_type: get_content_type(e.response_content_type),
            request_tags: e.request_tags,
        }),
        redacted: trace.redacted,
        original_host: None,
        encryption: trace.encryption,
        analysis_type: trace.analysis_type,
    }
}

fn filter_proccessed_data(
    attack_detections: HashMap<String, HashSet<String>>,
    filter: String,
) -> HashMap<String, HashSet<String>> {
    let mut entry = HashMap::new();
    for item in attack_detections {
        let mut split_path = item.0.split('.');
        let token_0 = split_path.next();
        if let Some(token) = token_0 {
            let is_graphql_section = GRAPHQL_SECTIONS.contains(&token);
            let mut filter_one = filter.to_owned();
            filter_one.push('.');
            let filter_two = token.to_owned() + "." + &filter;
            if (is_graphql_section && (item.0.contains(&filter_one) || item.0 == filter_two))
                || !is_graphql_section
            {
                entry.insert(item.0, item.1);
            }
        }
    }
    entry
}

fn get_endpoints(
    user: &CurrentUser,
    traces: &Vec<ProcessedApiTrace>,
) -> Vec<Option<TreeApiEndpoint>> {
    let mut endpoints: Vec<Option<TreeApiEndpoint>> = vec![];
    for trace in traces {
        endpoints.push(get_endpoint_from_tree(user, trace));
    }
    endpoints
}

fn get_traces(partial_traces: Vec<ProcessedApiTrace>) -> Vec<ProcessedApiTrace> {
    let mut graphql_split_traces: Vec<ProcessedApiTrace> = vec![];
    for trace in partial_traces {
        let is_graphql = is_graphql_endpoint(&trace.request.url.path);
        if let Some(Some(graphql_paths)) = trace
            .processed_trace_data
            .as_ref()
            .map(|e| &e.graphql_paths)
        {
            for graphql_path in graphql_paths {
                let mut split_path = graphql_path.split('.');
                let _token_0 = split_path.next();
                let token_1 = split_path.next();
                let token_2 = split_path.next();

                if let (Some(tok_1), Some(tok_2)) = (token_1, token_2) {
                    if tok_1 == "query" || tok_1 == "mutation" || tok_1 == "subscription" {
                        let filter = tok_1.to_owned() + "." + tok_2;
                        graphql_split_traces.push(ProcessedApiTrace {
                            request: ApiRequest {
                                method: trace.request.method.to_owned(),
                                url: ApiUrl {
                                    host: trace.request.url.host.to_owned(),
                                    path: trace.request.url.path.to_owned() + "." + &filter,
                                    parameters: trace.request.url.parameters.to_owned(),
                                },
                                headers: trace.request.headers.to_owned(),
                                body: trace.request.body.to_owned(),
                                user: trace.request.user.to_owned(),
                            },
                            response: trace.response.to_owned(),
                            meta: trace.meta.to_owned(),
                            processed_trace_data: trace.processed_trace_data.to_owned().map(|e| {
                                ProcessTraceRes {
                                    block: e.block,
                                    attack_detections: e
                                        .attack_detections
                                        .and_then(|f| Some(filter_proccessed_data(f, filter))),
                                    sensitive_data_detected: e.sensitive_data_detected,
                                    data_types: e.data_types,
                                    graphql_paths: e.graphql_paths,
                                    request_content_type: e.request_content_type,
                                    response_content_type: e.response_content_type,
                                    request_tags: e.request_tags,
                                }
                            }),
                            redacted: trace.redacted,
                            encryption: trace.encryption.to_owned(),
                            session_meta: trace.session_meta.to_owned(),
                            analysis_type: trace.analysis_type.to_owned(),
                        })
                    }
                }
            }
        } else {
            graphql_split_traces.push(trace);
        }
    }
    graphql_split_traces
}

pub async fn log_trace_batch(
    Extension(current_user): Extension<CurrentUser>,
    State(state): State<AppState>,
    extract::Json(traces): extract::Json<Vec<ProcessedApiTrace>>,
) -> Result<&'static str, (StatusCode, String)> {
    let mut redis_conn = state.redis_pool.get().await.map_err(internal_error)?;

    let redis_queue_length: Result<Option<u16>, redis::RedisError> = cmd("LLEN")
        .arg(&[TRACES_QUEUE])
        .query_async(&mut redis_conn)
        .await;

    let queue_full = match redis_queue_length {
        Ok(Some(queue_length)) => queue_length > 1000,
        Err(e) => {
            println!("Encountered error while checking queue length: {}", e);
            true
        }
        _ => true,
    };

    let mut partial_traces: Vec<ProcessedApiTrace> = vec![];
    let mut full_traces: Vec<QueuedApiTrace> = vec![];

    // let db_conn = state.db_pool.get().await.map_err(internal_error)?;

    for trace in traces {
        if let Ok(valid_path) = get_valid_path(&trace.request.url.path) {
            match trace.analysis_type.as_str() {
                "partial" => partial_traces.push(get_trace_obj_partial(trace, valid_path)),
                _ if !queue_full => {
                    if let Some(status_code) = trace.response.as_ref().map(|e| e.status) {
                        full_traces.push(get_trace_obj_full(trace, valid_path, status_code));
                    }
                }
                _ => (),
            }
        }
    }

    let org_uuid = if current_user.organization_uuid.is_nil() {
        None
    } else {
        Some(current_user.organization_uuid.to_string())
    };
    let mut pipe = redis::pipe();
    for trace in full_traces {
        if let Ok(json_str) = serde_json::to_string(&QueuedApiTraceItem {
            ctx: MetloContext {
                organization_uuid: org_uuid.as_ref().map(|f| f.to_owned()),
            },
            version: 2,
            trace,
        }) {
            pipe.cmd("RPUSH").arg(&[TRACES_QUEUE, &json_str]).ignore();
        }
    }
    if let Err(e) = pipe.query_async::<_, ()>(&mut redis_conn).await {
        println!("Encountered error while adding full traces to queue: {}", e);
    }

    let graphql_split_traces = get_traces(partial_traces);
    let endpoints = get_endpoints(&current_user, &graphql_split_traces);

    increment_endpoint_seen_usage_bulk(
        &current_user,
        &endpoints,
        ENDPOINT_CALL_COUNT_HASH,
        ORG_ENDPOINT_CALL_COUNT,
        &mut redis_conn,
    )
    .await;
    Ok("OK")
}
