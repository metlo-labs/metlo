use crate::{
    sensitive_data::detect_sensitive_data,
    trace::{ApiTrace, KeyVal, ProcessTraceRes},
};
use libinjection::{sqli, xss};
use mime;
use serde_json::Value;
use std::collections::HashMap;

fn process_json_val(
    path: String,
    xss_detected: &mut HashMap<String, String>,
    sqli_detected: &mut HashMap<String, (String, String)>,
    sensitive_data_detected: &mut HashMap<String, Vec<String>>,
    total_runs: &mut i32,
    v: &Value,
) {
    *total_runs += 1;
    if *total_runs > 200 {
        return;
    }
    match v {
        serde_json::Value::String(e) => {
            let mut sensitive_data = detect_sensitive_data(e.as_str());
            let is_xss = xss(e).unwrap_or(false);
            let is_sqli = sqli(e).unwrap_or((false, "".to_string()));

            if is_xss {
                xss_detected.insert(path.clone(), e.to_string());
            }
            if is_sqli.0 {
                sqli_detected.insert(path.clone(), (e.to_string(), is_sqli.1));
            }

            let old_sensitive_data = sensitive_data_detected.get_mut(&path);
            match old_sensitive_data {
                None => {
                    sensitive_data_detected.insert(path, sensitive_data);
                }
                Some(old) => old.append(&mut sensitive_data),
            }
        }
        serde_json::Value::Array(ls) => {
            for e in ls {
                process_json_val(
                    path.clone() + ".[]",
                    xss_detected,
                    sqli_detected,
                    sensitive_data_detected,
                    total_runs,
                    e,
                )
            }
        }
        serde_json::Value::Object(m) => {
            for (k, nested_val) in m.iter() {
                process_json_val(
                    path.clone() + "." + k,
                    xss_detected,
                    sqli_detected,
                    sensitive_data_detected,
                    total_runs,
                    nested_val,
                )
            }
        }
        _ => {}
    }
}

fn process_json(prefix: String, body: &str) -> Option<ProcessTraceRes> {
    let v: serde_json::Result<Value> = serde_json::from_str(body);

    let mut xss_detected: HashMap<String, String> = HashMap::new();
    let mut sqli_detected: HashMap<String, (String, String)> = HashMap::new();
    let mut sensitive_data_detected: HashMap<String, Vec<String>> = HashMap::new();
    let mut total_runs = 0;

    if v.is_err() {
        println!("Invalid JSON");
        return None;
    } else if v.is_ok() {
        process_json_val(
            prefix,
            &mut xss_detected,
            &mut sqli_detected,
            &mut sensitive_data_detected,
            &mut total_runs,
            &v.unwrap(),
        );
    }

    let mut processTraceRes = ProcessTraceRes {
        block: false,
        xss_detected: None,
        sqli_detected: None,
        sensitive_data_detected: None,
    };

    if !sensitive_data_detected.is_empty() {
        processTraceRes.sensitive_data_detected = Some(sensitive_data_detected);
    }
    if !xss_detected.is_empty() {
        processTraceRes.xss_detected = Some(xss_detected);
    }
    if !sqli_detected.is_empty() {
        processTraceRes.sqli_detected = Some(sqli_detected);
    }

    println!("{:?}", processTraceRes);

    return None;
}

fn process_body(prefix: String, body: &str, m: mime::Mime) -> Option<ProcessTraceRes> {
    if m == mime::APPLICATION_JSON {
        return process_json(prefix, body);
    }
    None
}

fn get_mime_type(headers: &Vec<KeyVal>) -> mime::Mime {
    let req_content_type_header = headers
        .iter()
        .find(|e| e.name.to_lowercase() == "content-type")
        .map(|e| &e.value);
    req_content_type_header.map_or(mime::TEXT_PLAIN, |e| {
        e.split(";")
            .next()
            .unwrap_or("text/plain")
            .parse()
            .unwrap_or(mime::TEXT_PLAIN)
    })
}

fn combine_process_trace_res(results: Vec<&Option<ProcessTraceRes>>) -> ProcessTraceRes {
    return ProcessTraceRes {
        block: false,
        xss_detected: None,
        sqli_detected: None,
        sensitive_data_detected: None,
    };
}

pub fn process_trace(trace: &ApiTrace) -> ProcessTraceRes {
    let req_mime_type = get_mime_type(&trace.request.headers);
    let proc_req_body = &trace
        .request
        .body
        .as_ref()
        .map(|e| process_body("req.body".to_string(), e, req_mime_type.clone()))
        .flatten();
    let proc_resp_body = &trace
        .response
        .as_ref()
        .map(|e| e.body.as_ref())
        .flatten()
        .map(|e| process_body("resp.body".to_string(), e, req_mime_type.clone()))
        .flatten();
    combine_process_trace_res([proc_req_body, proc_resp_body].to_vec())
}
