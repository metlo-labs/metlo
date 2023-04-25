use super::{
    graphql::{
        get_graphql_paths_body, get_graphql_paths_query, process_graphql_body,
        process_graphql_query,
    },
    process_components,
};
use crate::{
    open_api::{find_open_api_diff, EndpointInfo},
    sensitive_data::detect_sensitive_data,
    trace::{ApiResponse, ApiTrace, GraphQlData, KeyVal, ProcessTraceRes, ProcessTraceResInner},
    BufferItem, TraceInfo,
};
use libinjection::{sqli, xss};
use multipart::server::Multipart;
use serde_json::{json, Value};
use std::{
    collections::{HashMap, HashSet},
    io::BufRead,
};

fn process_json_string(
    prefix: String,
    body: &str,
    trace: &ApiTrace,
    endpoint_info: EndpointInfo,
    response_alias_map: Option<&HashMap<String, String>>,
) -> Option<ProcessTraceResInner> {
    match serde_json::from_str(body) {
        Ok(value) => process_components::process_json(
            prefix,
            value,
            trace,
            endpoint_info,
            response_alias_map,
        ),
        Err(_) => {
            log::debug!("Invalid JSON");
            None
        }
    }
}

fn process_form_data(
    prefix: String,
    body: &str,
    mut mime_params: mime::Params,
    trace: &ApiTrace,
    endpoint_info: EndpointInfo,
) -> Option<ProcessTraceResInner> {
    let boundary = mime_params.find(|e| e.0 == "boundary");
    if let Some(b) = boundary {
        let mut mp = Multipart::with_body(body.as_bytes(), b.1.as_str());
        let mut form_json = json!({});
        while let Some(mut field) = mp.read_entry().unwrap() {
            let data = field.data.fill_buf().unwrap_or(b"");
            let s = String::from_utf8_lossy(data);
            form_json[field.headers.name.to_string()] = serde_json::Value::String(s.to_string());
        }
        process_components::process_json(prefix, form_json, trace, endpoint_info, None)
    } else {
        None
    }
}

fn process_url_encoded(
    prefix: String,
    body: &str,
    trace: &ApiTrace,
    endpoint_info: EndpointInfo,
) -> Option<ProcessTraceResInner> {
    match serde_urlencoded::from_str::<Value>(body) {
        Ok(value) => process_components::process_json(prefix, value, trace, endpoint_info, None),
        Err(_) => {
            log::debug!("Invalid URL Encoded string");
            None
        }
    }
}

fn process_text_plain(
    prefix: String,
    body: &str,
    trace: &ApiTrace,
    endpoint_info: EndpointInfo,
) -> Option<ProcessTraceResInner> {
    let is_xss = xss(body).unwrap_or(false);
    let is_sqli = sqli(body).unwrap_or((false, "".to_string()));
    let sensitive_data = detect_sensitive_data(body);

    let mut process_trace_res = ProcessTraceResInner {
        block: false,
        xss_detected: None,
        sqli_detected: None,
        sensitive_data_detected: None,
        data_types: Some(HashMap::from([(
            prefix.clone(),
            HashSet::from(["string".to_string()]),
        )])),
        validation_errors: if prefix.starts_with("resBody") {
            find_open_api_diff(trace, &Value::String(body.to_owned()), endpoint_info)
        } else {
            None
        },
    };

    if is_xss {
        process_trace_res.block = true;
        process_trace_res.xss_detected = Some(HashMap::from([(prefix.clone(), body.to_string())]))
    }
    if is_sqli.0 {
        process_trace_res.block = true;
        process_trace_res.sqli_detected = Some(HashMap::from([(
            prefix.clone(),
            (body.to_string(), is_sqli.1),
        )]))
    }
    if !sensitive_data.is_empty() {
        process_trace_res.block = true;
        process_trace_res.sensitive_data_detected = Some(HashMap::from([(prefix, sensitive_data)]))
    }

    Some(process_trace_res)
}

fn process_body(
    prefix: String,
    body: &str,
    m: mime::Mime,
    trace: &ApiTrace,
    endpoint_info: EndpointInfo,
    response_alias_map: Option<&HashMap<String, String>>,
) -> Option<ProcessTraceResInner> {
    let essence = m.essence_str();
    if essence == mime::APPLICATION_JSON {
        process_json_string(prefix, body, trace, endpoint_info, response_alias_map)
    } else if essence == mime::TEXT_PLAIN {
        process_text_plain(prefix, body, trace, endpoint_info)
    } else if essence == mime::MULTIPART_FORM_DATA {
        process_form_data(prefix, body, m.params(), trace, endpoint_info)
    } else if essence == mime::APPLICATION_WWW_FORM_URLENCODED {
        process_url_encoded(prefix, body, trace, endpoint_info)
    } else {
        process_text_plain(prefix, body, trace, endpoint_info)
    }
}

fn get_content_type(headers: &[KeyVal]) -> Option<&String> {
    headers
        .iter()
        .find(|e| e.name.to_lowercase() == "content-type")
        .map(|e| &e.value)
}

fn get_mime_type(content_type_header: Option<&String>) -> mime::Mime {
    content_type_header.map_or(mime::TEXT_PLAIN, |e| {
        e.trim().parse().unwrap_or(mime::TEXT_PLAIN)
    })
}

fn combine_process_trace_res(
    results: &[Option<ProcessTraceResInner>],
    request_content_type: Option<&String>,
    response_content_type: Option<&String>,
    proc_graph_ql: Option<Vec<GraphQlData>>,
) -> ProcessTraceRes {
    let mut block = false;
    let mut xss_detected: HashMap<String, String> = HashMap::new();
    let mut sqli_detected: HashMap<String, (String, String)> = HashMap::new();
    let mut sensitive_data_detected: HashMap<String, HashSet<String>> = HashMap::new();
    let mut data_types: HashMap<String, HashSet<String>> = HashMap::new();
    let mut validation_errors: HashMap<String, Vec<String>> = HashMap::new();

    for res in results.iter().flatten() {
        block |= res.block;
        if let Some(e_xss) = &res.xss_detected {
            xss_detected.extend(e_xss.clone());
        }
        if let Some(e_sqli) = &res.sqli_detected {
            sqli_detected.extend(e_sqli.clone());
        }
        if let Some(e_sensitive_data) = &res.sensitive_data_detected {
            sensitive_data_detected.extend(e_sensitive_data.clone());
        }
        if let Some(e_data_types) = &res.data_types {
            data_types.extend(e_data_types.clone());
        }
        if let Some(e_validation_errors) = &res.validation_errors {
            validation_errors.extend(e_validation_errors.clone())
        }
    }

    ProcessTraceRes {
        block,
        xss_detected: (!xss_detected.is_empty()).then_some(xss_detected),
        sqli_detected: (!sqli_detected.is_empty()).then_some(sqli_detected),
        sensitive_data_detected: (!sensitive_data_detected.is_empty())
            .then_some(sensitive_data_detected),
        data_types: (!data_types.is_empty()).then_some(data_types),
        validation_errors: (!validation_errors.is_empty()).then_some(validation_errors),
        request_content_type: request_content_type.unwrap_or(&"".to_owned()).to_owned(),
        response_content_type: response_content_type.unwrap_or(&"".to_owned()).to_owned(),
        graph_ql_data: proc_graph_ql.unwrap_or_default(),
    }
}

pub fn process_api_trace(trace: &ApiTrace, trace_info: &TraceInfo) -> ProcessTraceRes {
    let req_content_type = get_content_type(&trace.request.headers);
    let req_mime_type = get_mime_type(req_content_type);

    let non_error_status_code = match &trace.response {
        Some(ApiResponse {
            status,
            headers: _,
            body: _,
        }) => *status < 400,
        _ => false,
    };

    let proc_graph_ql = match (
        non_error_status_code,
        trace_info.is_graph_ql,
        trace.request.method.to_lowercase().as_str(),
    ) {
        (true, true, "post") => process_graphql_body(&trace.request.body),
        (true, true, "get") => process_graphql_query(&trace.request.url.parameters),
        _ => None,
    };
    let proc_req_body = match (
        non_error_status_code,
        !trace.request.body.is_empty(),
        !trace_info.is_graph_ql,
    ) {
        (true, true, true) => process_body(
            "reqBody".to_string(),
            trace.request.body.as_str(),
            req_mime_type,
            trace,
            EndpointInfo {
                openapi_spec_name: None,
                endpoint_path: "".to_owned(),
            },
            None,
        ),
        _ => None,
    };
    let proc_req_params = match (non_error_status_code, !trace_info.is_graph_ql) {
        (true, true) => process_components::process_key_val(
            "reqQuery".to_string(),
            &trace.request.url.parameters,
        ),
        _ => None,
    };
    let proc_req_headers = match non_error_status_code {
        true => {
            process_components::process_key_val("reqHeaders".to_string(), &trace.request.headers)
        }
        false => None,
    };

    let mut proc_resp_headers: Option<ProcessTraceResInner> = None;
    let mut resp_content_type: Option<&String> = None;
    let proc_resp_body: Option<ProcessTraceResInner> = {
        if let Some(resp) = &trace.response {
            proc_resp_headers =
                process_components::process_key_val("resHeaders".to_string(), &resp.headers);
            resp_content_type = get_content_type(&resp.headers);
            let resp_mime_type = get_mime_type(resp_content_type);
            process_body(
                "resBody".to_string(),
                &resp.body,
                resp_mime_type,
                trace,
                EndpointInfo {
                    openapi_spec_name: trace_info.openapi_spec_name.clone(),
                    endpoint_path: trace_info.endpoint_path.clone(),
                },
                proc_graph_ql.as_ref().map(|f| &f.response_alias_map),
            )
        } else {
            process_body(
                "resBody".to_string(),
                "",
                mime::TEXT_PLAIN,
                trace,
                EndpointInfo {
                    openapi_spec_name: trace_info.openapi_spec_name.clone(),
                    endpoint_path: trace_info.endpoint_path.clone(),
                },
                proc_graph_ql.as_ref().map(|f| &f.response_alias_map),
            )
        }
    };

    combine_process_trace_res(
        &[
            proc_req_body,
            proc_req_params,
            proc_req_headers,
            proc_resp_body,
            proc_resp_headers,
            proc_graph_ql.as_ref().map(|f| f.proc_trace_res.to_owned()),
        ],
        req_content_type,
        resp_content_type,
        proc_graph_ql.as_ref().map(|f| f.graph_ql_data.to_owned()),
    )
}

pub fn get_partial_trace_item(api_trace: ApiTrace, trace_info: TraceInfo) -> BufferItem {
    if trace_info.is_graph_ql {
        let paths = match api_trace.request.method.as_str() {
            "GET" => get_graphql_paths_query(&api_trace.request.url.parameters),
            "POST" => get_graphql_paths_body(&api_trace.request.body),
            _ => get_graphql_paths_body(&api_trace.request.body),
        };
        BufferItem {
            trace: api_trace,
            processed_trace: None,
            trace_info,
            analysis_type: "partial".to_owned(),
            graphql_paths: Some(Vec::from_iter(paths)),
        }
    } else {
        BufferItem {
            trace: api_trace,
            processed_trace: None,
            trace_info,
            analysis_type: "partial".to_owned(),
            graphql_paths: None,
        }
    }
}
