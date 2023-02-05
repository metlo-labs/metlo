use crate::{
    sensitive_data::detect_sensitive_data,
    trace::{ApiTrace, KeyVal, ProcessTraceRes},
};
use libinjection::{sqli, xss};
use serde_json::Value;
use std::collections::{HashMap, HashSet};

fn insert_data_type(data_types: &mut HashMap<String, HashSet<String>>, path: &str, d_type: String) {
    let old_data_types = data_types.get_mut(path);
    match old_data_types {
        None => {
            data_types.insert(path.to_string(), HashSet::from([d_type]));
        }
        Some(old) => {
            old.insert(d_type);
        }
    }
}

fn process_json_val(
    path: &mut String,
    data_types: &mut HashMap<String, HashSet<String>>,
    xss_detected: &mut HashMap<String, String>,
    sqli_detected: &mut HashMap<String, (String, String)>,
    sensitive_data_detected: &mut HashMap<String, HashSet<String>>,
    total_runs: &mut i32,
    v: &Value,
) {
    *total_runs += 1;
    if *total_runs > 500 {
        return;
    }
    match v {
        serde_json::Value::Null => {
            insert_data_type(data_types, path, "null".to_string());
        }
        serde_json::Value::Bool(_) => {
            insert_data_type(data_types, path, "bool".to_string());
        }
        serde_json::Value::Number(_) => {
            insert_data_type(data_types, path, "number".to_string());
        }
        serde_json::Value::String(e) => {
            insert_data_type(data_types, path, "string".to_string());

            if xss(e).unwrap_or(false) {
                xss_detected.insert(path.clone(), e.to_string());
            }

            let is_sqli = sqli(e).unwrap_or((false, "".to_string()));
            if is_sqli.0 {
                sqli_detected.insert(path.clone(), (e.to_string(), is_sqli.1));
            }

            let sensitive_data = detect_sensitive_data(e.as_str());
            if !sensitive_data.is_empty() {
                let old_sensitive_data = sensitive_data_detected.get_mut(path);
                match old_sensitive_data {
                    None => {
                        sensitive_data_detected.insert(path.to_string(), sensitive_data);
                    }
                    Some(old) => {
                        for e in sensitive_data {
                            old.insert(e);
                        }
                    }
                }
            }
        }
        serde_json::Value::Array(ls) => {
            let old_len = path.len();
            path.push_str(".[]");

            for e in ls {
                process_json_val(
                    path,
                    data_types,
                    xss_detected,
                    sqli_detected,
                    sensitive_data_detected,
                    total_runs,
                    e,
                )
            }

            path.truncate(old_len);
        }
        serde_json::Value::Object(m) => {
            for (k, nested_val) in m.iter() {
                let old_len = path.len();
                path.push('.');
                path.push_str(k);

                process_json_val(
                    path,
                    data_types,
                    xss_detected,
                    sqli_detected,
                    sensitive_data_detected,
                    total_runs,
                    nested_val,
                );

                path.truncate(old_len);
            }
        }
    }
}

fn process_json(prefix: String, body: &str) -> Option<ProcessTraceRes> {
    let mut data_types: HashMap<String, HashSet<String>> = HashMap::new();
    let mut xss_detected: HashMap<String, String> = HashMap::new();
    let mut sqli_detected: HashMap<String, (String, String)> = HashMap::new();
    let mut sensitive_data_detected: HashMap<String, HashSet<String>> = HashMap::new();
    let mut total_runs = 0;

    match serde_json::from_str(body) {
        Ok(value) => {
            let mut path = prefix;
            process_json_val(
                &mut path,
                &mut data_types,
                &mut xss_detected,
                &mut sqli_detected,
                &mut sensitive_data_detected,
                &mut total_runs,
                &value,
            );
        }
        Err(_) => {
            println!("Invalid JSON");
            return None;
        }
    }

    Some(ProcessTraceRes {
        block: !(xss_detected.is_empty() && sqli_detected.is_empty()),
        xss_detected: (!xss_detected.is_empty()).then_some(xss_detected),
        sqli_detected: (!sqli_detected.is_empty()).then_some(sqli_detected),
        sensitive_data_detected: (!sensitive_data_detected.is_empty())
            .then_some(sensitive_data_detected),
        data_types: (!data_types.is_empty()).then_some(data_types),
    })
}

fn process_text_plain(prefix: String, body: &str) -> Option<ProcessTraceRes> {
    let is_xss = xss(body).unwrap_or(false);
    let is_sqli = sqli(body).unwrap_or((false, "".to_string()));
    let sensitive_data = detect_sensitive_data(body);

    let mut process_trace_res = ProcessTraceRes {
        block: false,
        xss_detected: None,
        sqli_detected: None,
        sensitive_data_detected: None,
        data_types: Some(HashMap::from([(
            prefix.clone(),
            HashSet::from(["string".to_string()]),
        )])),
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

fn process_body(prefix: String, body: &str, m: mime::Mime) -> Option<ProcessTraceRes> {
    if m == mime::APPLICATION_JSON {
        process_json(prefix, body)
    } else if m == mime::TEXT_PLAIN {
        process_text_plain(prefix, body)
    } else {
        None
    }
}

fn process_key_val(prefix: String, vals: &Vec<KeyVal>) -> Option<ProcessTraceRes> {
    let mut data_types: HashMap<String, HashSet<String>> = HashMap::new();
    let mut xss_detected: HashMap<String, String> = HashMap::new();
    let mut sqli_detected: HashMap<String, (String, String)> = HashMap::new();
    let mut sensitive_data_detected: HashMap<String, HashSet<String>> = HashMap::new();

    for e in vals {
        let is_xss = xss(&e.value).unwrap_or(false);
        let is_sqli = sqli(&e.value).unwrap_or((false, "".to_string()));
        let sensitive_data = detect_sensitive_data(&e.value);

        let path = format!("{}.{}", prefix, e.name);
        insert_data_type(&mut data_types, &path, "string".to_string());
        if is_xss {
            xss_detected.insert(path.clone(), e.value.clone());
        }
        if is_sqli.0 {
            sqli_detected.insert(path.clone(), (e.value.clone(), is_sqli.1));
        }
        if !sensitive_data.is_empty() {
            let old_sensitive_data = sensitive_data_detected.get_mut(&path);
            match old_sensitive_data {
                None => {
                    sensitive_data_detected.insert(path, sensitive_data);
                }
                Some(old) => {
                    for e in sensitive_data {
                        old.insert(e);
                    }
                }
            }
        }
    }

    Some(ProcessTraceRes {
        block: !(xss_detected.is_empty() && sqli_detected.is_empty()),
        xss_detected: (!xss_detected.is_empty()).then_some(xss_detected),
        sqli_detected: (!sqli_detected.is_empty()).then_some(sqli_detected),
        sensitive_data_detected: (!sensitive_data_detected.is_empty())
            .then_some(sensitive_data_detected),
        data_types: (!data_types.is_empty()).then_some(data_types),
    })
}

fn get_mime_type(headers: &[KeyVal]) -> mime::Mime {
    let req_content_type_header = headers
        .iter()
        .find(|e| e.name.to_lowercase() == "content-type")
        .map(|e| &e.value);
    req_content_type_header.map_or(mime::TEXT_PLAIN, |e| {
        e.split(';')
            .next()
            .unwrap_or("text/plain")
            .parse()
            .unwrap_or(mime::TEXT_PLAIN)
    })
}

fn combine_process_trace_res(results: &[Option<ProcessTraceRes>]) -> ProcessTraceRes {
    let mut block = false;
    let mut xss_detected: HashMap<String, String> = HashMap::new();
    let mut sqli_detected: HashMap<String, (String, String)> = HashMap::new();
    let mut sensitive_data_detected: HashMap<String, HashSet<String>> = HashMap::new();
    let mut data_types: HashMap<String, HashSet<String>> = HashMap::new();

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
    }

    ProcessTraceRes {
        block,
        xss_detected: (!xss_detected.is_empty()).then_some(xss_detected),
        sqli_detected: (!sqli_detected.is_empty()).then_some(sqli_detected),
        sensitive_data_detected: (!sensitive_data_detected.is_empty())
            .then_some(sensitive_data_detected),
        data_types: (!data_types.is_empty()).then_some(data_types),
    }
}

pub fn process_api_trace(trace: &ApiTrace) -> ProcessTraceRes {
    let req_mime_type = get_mime_type(&trace.request.headers);
    let proc_req_body = trace
        .request
        .body
        .as_ref()
        .and_then(|e| process_body("reqBody".to_string(), e, req_mime_type.clone()));
    let proc_req_params = process_key_val("reqQuery".to_string(), &trace.request.url.parameters);
    let proc_req_headers = process_key_val("reqHeaders".to_string(), &trace.request.headers);

    let mut proc_resp_body: Option<ProcessTraceRes> = None;
    let mut proc_resp_headers: Option<ProcessTraceRes> = None;
    if let Some(resp) = &trace.response {
        proc_resp_headers = process_key_val("resHeaders".to_string(), &resp.headers);
        let resp_mime_type = get_mime_type(&resp.headers);
        if let Some(resp_body) = &resp.body {
            proc_resp_body = process_body("resBody".to_string(), resp_body, resp_mime_type);
        }
    }

    combine_process_trace_res(&[
        proc_req_body,
        proc_req_params,
        proc_req_headers,
        proc_resp_body,
        proc_resp_headers,
    ])
}
