use crate::{
    open_api::{find_open_api_diff, EndpointInfo},
    sensitive_data::{detect_sensitive_data, detect_sensitive_in_path_data},
    trace::{ApiTrace, KeyVal, ProcessTraceResInner},
};
use libinjection::{sqli, xss};
use serde_json::Value;
use std::collections::{HashMap, HashSet};

use super::graphql::fix_graphql_path;

pub fn insert_data_type(
    data_types: &mut HashMap<String, HashSet<String>>,
    path: &str,
    d_type: String,
) {
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

pub fn process_path(
    path: &String,
    resolved_path: String,
    sensitive_data_detected: &mut HashMap<String, HashSet<String>>,
) {
    let sensitive_data_path = detect_sensitive_in_path_data(path.as_str());
    if !sensitive_data_path.is_empty() {
        let old_sensitive_data = sensitive_data_detected.get_mut(&resolved_path);
        match old_sensitive_data {
            None => {
                sensitive_data_detected.insert(resolved_path.clone(), sensitive_data_path);
            }
            Some(old) => {
                for e in sensitive_data_path {
                    old.insert(e);
                }
            }
        }
    }
}

pub fn process_key_val(prefix: String, vals: &Vec<KeyVal>) -> Option<ProcessTraceResInner> {
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
                    sensitive_data_detected.insert(path.clone(), sensitive_data);
                }
                Some(old) => {
                    for e in sensitive_data {
                        old.insert(e);
                    }
                }
            }
        }
        process_path(&path, path.clone(), &mut sensitive_data_detected);
    }

    Some(ProcessTraceResInner {
        block: !(xss_detected.is_empty() && sqli_detected.is_empty()),
        xss_detected: (!xss_detected.is_empty()).then_some(xss_detected),
        sqli_detected: (!sqli_detected.is_empty()).then_some(sqli_detected),
        sensitive_data_detected: (!sensitive_data_detected.is_empty())
            .then_some(sensitive_data_detected),
        data_types: (!data_types.is_empty()).then_some(data_types),
        validation_errors: None,
    })
}

pub fn process_json_val(
    path: &mut String,
    data_types: &mut HashMap<String, HashSet<String>>,
    xss_detected: &mut HashMap<String, String>,
    sqli_detected: &mut HashMap<String, (String, String)>,
    sensitive_data_detected: &mut HashMap<String, HashSet<String>>,
    total_runs: &mut i32,
    v: &Value,
    response_alias_map: Option<&HashMap<String, String>>,
) {
    *total_runs += 1;
    if *total_runs > 500 {
        return;
    }
    match v {
        serde_json::Value::Null => {
            let resolved_path = fix_graphql_path(path, response_alias_map);
            insert_data_type(data_types, resolved_path.as_str(), "null".to_string());
            process_path(path, resolved_path, sensitive_data_detected)
        }
        serde_json::Value::Bool(_) => {
            let resolved_path = fix_graphql_path(path, response_alias_map);
            insert_data_type(data_types, resolved_path.as_str(), "boolean".to_string());
            process_path(path, resolved_path, sensitive_data_detected)
        }
        serde_json::Value::Number(_) => {
            let resolved_path = fix_graphql_path(path, response_alias_map);
            insert_data_type(data_types, resolved_path.as_str(), "number".to_string());
            process_path(path, resolved_path, sensitive_data_detected)
        }
        serde_json::Value::String(e) => {
            let resolved_path = fix_graphql_path(path, response_alias_map);
            insert_data_type(data_types, resolved_path.as_str(), "string".to_string());

            if !path.starts_with("res") {
                if xss(e).unwrap_or(false) {
                    xss_detected.insert(resolved_path.clone(), e.to_string());
                }

                let is_sqli = sqli(e).unwrap_or((false, "".to_string()));
                if is_sqli.0 {
                    sqli_detected.insert(resolved_path.clone(), (e.to_string(), is_sqli.1));
                }
            }
            let sensitive_data = detect_sensitive_data(e.as_str());
            if !sensitive_data.is_empty() {
                let old_sensitive_data = sensitive_data_detected.get_mut(&resolved_path);
                match old_sensitive_data {
                    None => {
                        sensitive_data_detected.insert(resolved_path.clone(), sensitive_data);
                    }
                    Some(old) => {
                        for e in sensitive_data {
                            old.insert(e);
                        }
                    }
                }
            }
            process_path(path, resolved_path, sensitive_data_detected)
        }
        serde_json::Value::Array(ls) => {
            let limit = std::cmp::min(ls.len(), 10);
            let old_len = path.len();
            path.push_str(".[]");

            for e in &ls[..limit] {
                process_json_val(
                    path,
                    data_types,
                    xss_detected,
                    sqli_detected,
                    sensitive_data_detected,
                    total_runs,
                    e,
                    response_alias_map,
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
                    response_alias_map,
                );

                path.truncate(old_len);
            }
        }
    }
}

pub fn process_json(
    prefix: String,
    value: Value,
    trace: &ApiTrace,
    endpoint_info: EndpointInfo,
    response_alias_map: Option<&HashMap<String, String>>,
) -> Option<ProcessTraceResInner> {
    let mut data_types: HashMap<String, HashSet<String>> = HashMap::new();
    let mut xss_detected: HashMap<String, String> = HashMap::new();
    let mut sqli_detected: HashMap<String, (String, String)> = HashMap::new();
    let mut sensitive_data_detected: HashMap<String, HashSet<String>> = HashMap::new();
    let mut total_runs = 0;

    let mut path = prefix.clone();
    process_json_val(
        &mut path,
        &mut data_types,
        &mut xss_detected,
        &mut sqli_detected,
        &mut sensitive_data_detected,
        &mut total_runs,
        &value,
        response_alias_map,
    );

    Some(ProcessTraceResInner {
        block: !(xss_detected.is_empty() && sqli_detected.is_empty()),
        xss_detected: (!xss_detected.is_empty()).then_some(xss_detected),
        sqli_detected: (!sqli_detected.is_empty()).then_some(sqli_detected),
        sensitive_data_detected: (!sensitive_data_detected.is_empty())
            .then_some(sensitive_data_detected),
        data_types: (!data_types.is_empty()).then_some(data_types),
        validation_errors: if prefix.starts_with("resBody") {
            find_open_api_diff(trace, &value, endpoint_info)
        } else {
            None
        },
    })
}
