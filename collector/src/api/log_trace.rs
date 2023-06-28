use std::collections::{HashMap, HashSet};

use axum::{
    extract::{self, Extension, State},
    http::StatusCode,
};

use crate::{
    endpoint_tree::get_endpoint_from_tree,
    state::AppState,
    types::{ApiRequest, ApiUrl, CurrentUser, ProcessTraceRes, ProcessedApiTrace, TreeApiEndpoint},
    utils::{get_valid_path, internal_error, is_graphql_endpoint, GRAPHQL_SECTIONS},
};

fn get_content_type(content_type: String) -> String {
    match content_type.trim().parse::<mime::Mime>() {
        Ok(m) => m.essence_str().to_owned(),
        Err(_) => "*/*".to_owned(),
    }
}

fn get_trace_obj(
    trace: ProcessedApiTrace,
) -> Result<ProcessedApiTrace, Box<dyn std::error::Error>> {
    let valid_path = get_valid_path(&trace.request.url.path)?;
    Ok(ProcessedApiTrace {
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
    })
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

pub async fn log_trace_batch(
    Extension(current_user): Extension<CurrentUser>,
    State(state): State<AppState>,
    extract::Json(traces): extract::Json<Vec<ProcessedApiTrace>>,
) -> Result<&'static str, (StatusCode, String)> {
    let mut partial_traces: Vec<ProcessedApiTrace> = vec![];

    // let db_conn = state.db_pool.get().await.map_err(internal_error)?;

    for trace in traces {
        if let Ok(obj) = get_trace_obj(trace) {
            match obj.analysis_type.as_str() {
                "partial" => partial_traces.push(obj),
                _ => (),
            }
        }
    }

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

    let endpoints = get_endpoints(&current_user, &graphql_split_traces);

    Ok("OK")
}
