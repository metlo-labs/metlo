use jsonschema::ValidationError;
use jsonschema::{Draft, JSONSchema};
use serde_json::Value;
use std::collections::HashMap;

use crate::metlo_config::{MetloEndpoint, MetloSpec};
use crate::trace::ApiTrace;
use crate::METLO_CONFIG;

pub type CompiledSpecs =
    HashMap<String, HashMap<String, HashMap<String, HashMap<String, HashMap<String, JSONSchema>>>>>;
pub type CompiledSpecsSingle =
    HashMap<String, HashMap<String, HashMap<String, HashMap<String, JSONSchema>>>>;

fn get_validation_error_msg(error: ValidationError) -> String {
    match error.kind {
        _ => error.to_string(),
    }
}

pub fn compile_specs(specs: Vec<MetloSpec>) -> CompiledSpecs {
    let mut compiled_specs: CompiledSpecs = HashMap::new();
    for e in specs.iter() {
        match serde_json::from_str::<Value>(&e.spec) {
            Ok(v) => {
                if v.is_object() {
                    let components = v
                        .get("components")
                        .unwrap_or(&serde_json::Value::default())
                        .to_owned();
                    let paths = v
                        .get("paths")
                        .unwrap_or(&serde_json::Value::default())
                        .as_object()
                        .unwrap_or(&serde_json::Map::default())
                        .to_owned();
                    let mut path_specs = HashMap::new();
                    for (path, nested_value) in paths.iter() {
                        let mut method_specs = HashMap::new();
                        for (method, method_value) in nested_value
                            .as_object()
                            .unwrap_or(&serde_json::Map::default())
                            .iter()
                        {
                            let mut status_code_specs = HashMap::new();
                            for (status_code, status_code_value) in method_value
                                .get("responses")
                                .unwrap_or(&serde_json::Value::default())
                                .as_object()
                                .unwrap_or(&serde_json::Map::default())
                                .iter()
                            {
                                let mut content_type_specs = HashMap::new();
                                for (content_type, content_type_value) in status_code_value
                                    .get("content")
                                    .unwrap_or(&serde_json::Value::default())
                                    .as_object()
                                    .unwrap_or(&serde_json::Map::default())
                                    .iter()
                                {
                                    let content_type_tmp = match content_type.parse::<mime::Mime>()
                                    {
                                        Ok(m) => m.essence_str().to_owned(),
                                        Err(_) => continue,
                                    };
                                    let schema = content_type_value.get("schema");
                                    if schema.is_some() {
                                        let mut unwrapped_schema = schema.unwrap().clone();
                                        unwrapped_schema["components"] = components.clone();
                                        let compiled_schema = JSONSchema::options()
                                            .with_draft(Draft::Draft7)
                                            .compile(&unwrapped_schema)
                                            .expect("A valid schema");
                                        content_type_specs
                                            .insert(content_type_tmp, compiled_schema);
                                    }
                                }
                                status_code_specs
                                    .insert(status_code.to_owned(), content_type_specs);
                            }
                            method_specs.insert(method.to_owned(), status_code_specs);
                        }
                        path_specs.insert(path.to_owned(), method_specs);
                    }
                    compiled_specs.insert(e.name.to_owned(), path_specs);
                }
            }
            Err(_) => (),
        }
    }
    return compiled_specs;
}

fn is_endpoint_match(trace_tokens: &Vec<&str>, endpoint_path: String) -> bool {
    let endpoint_tokens = get_split_path(&endpoint_path);
    if trace_tokens.len() != endpoint_tokens.len() {
        return false;
    }
    let mut i = 0;

    for endpoint_token in endpoint_tokens {
        let trace_token = trace_tokens[i];
        if endpoint_token != trace_token
            && (!endpoint_token.starts_with('{') && !endpoint_token.ends_with('}'))
        {
            return false;
        }
        i += 1;
    }
    true
}

fn get_split_path(path: &String) -> Vec<&str> {
    path.split('/')
        .filter(|token| token.len() > 0)
        .collect::<Vec<&str>>()
}

fn get_spec_path_map<'a>(
    trace_tokens: Vec<&'a str>,
    compiled_specs: Option<&'a CompiledSpecsSingle>,
) -> Option<&'a HashMap<String, HashMap<String, HashMap<String, JSONSchema>>>> {
    match compiled_specs {
        Some(s) => {
            let len = trace_tokens.len();
            for n in 0..len {
                let mut curr_path = trace_tokens[n..len].join("/");
                if curr_path != "/" {
                    curr_path.insert_str(0, "/");
                }
                if s.contains_key(&curr_path) {
                    return s.get(&curr_path);
                }
                curr_path.push_str("/");
                if s.contains_key(&curr_path) {
                    return s.get(&curr_path);
                }
            }
            None
        }
        None => None,
    }
}

fn get_spec_content_type_schema<'a>(
    trace_content_type: &String,
    spec_status_code_map: &'a HashMap<String, JSONSchema>,
) -> Result<Option<&'a JSONSchema>, String> {
    let content_type = match trace_content_type.parse::<mime::Mime>() {
        Ok(m) => m.essence_str().to_owned(),
        Err(_) => {
            return Err(format!(
                "Invalid Content-Type '{}' is used for the response body.",
                trace_content_type
            ))
        }
    };
    let sub_type_wildcard_points: u8 = 2;
    let wildcard_match_points: u8 = 1;
    let mut match_points = 0;
    let mut matched_schema: Option<&JSONSchema> = None;
    for (media_type_key, value) in spec_status_code_map.iter() {
        if media_type_key.to_owned() == content_type {
            return Ok(Some(value));
        } else if media_type_key == "*/*" && wildcard_match_points > match_points {
            matched_schema = Some(value);
            match_points = wildcard_match_points;
        }
        let content_type_parts: Vec<&str> = content_type.split('/').collect();
        let media_type_key_parts: Vec<&str> = media_type_key.split('/').collect();
        if media_type_key_parts[1] != "*" {
            continue;
        } else if content_type_parts[0] == media_type_key_parts[0]
            && sub_type_wildcard_points > match_points
        {
            matched_schema = Some(value);
            match_points = sub_type_wildcard_points;
        }
    }

    match matched_schema {
        Some(_) => Ok(matched_schema),
        None => Err(format!(
            "Unsupported Content-Type '{}' is used for the response body.",
            trace_content_type
        )),
    }
}

fn get_compiled_schema<'a>(
    trace_tokens: Vec<&'a str>,
    trace_method: &String,
    trace_status_code: &String,
    trace_content_type: &String,
    compiled_specs: Option<&'a CompiledSpecsSingle>,
) -> Result<Option<&'a JSONSchema>, String> {
    let spec_path_map = get_spec_path_map(trace_tokens, compiled_specs);
    let spec_method_map = match spec_path_map {
        Some(method_map) => method_map.get(&trace_method.to_lowercase()),
        None => None,
    };
    let spec_status_code_map = match spec_method_map {
        Some(status_code_map) => {
            if status_code_map.contains_key(trace_status_code) {
                status_code_map.get(trace_status_code)
            } else if status_code_map.contains_key("default") {
                status_code_map.get("default")
            } else {
                return Err(format!(
                    "An unknown status code '{}' is used and no default is provided.",
                    trace_status_code
                ));
            }
        }
        None => None,
    };
    match spec_status_code_map {
        Some(m) => get_spec_content_type_schema(trace_content_type, m),
        None => Ok(None),
    }
}

pub fn find_open_api_diff(trace: &ApiTrace, response_body: &Value) -> Vec<String> {
    if let Some(resp) = &trace.response {
        let trace_path = &trace.request.url.path;
        let trace_host = &trace.request.url.host;
        let trace_method = &trace.request.method;
        let trace_status_code = &resp.status.to_string();
        let trace_content_type = &resp
            .headers
            .iter()
            .find(|e| e.name.to_lowercase() == "content-type")
            .map(|e| e.value.to_owned())
            .unwrap_or_default();
        let split_path: Vec<&str> = get_split_path(trace_path);
        let mut endpoint_match: Option<&MetloEndpoint> = None;

        let conf_read = METLO_CONFIG.try_read();
        match conf_read {
            Ok(ref conf) => match &conf.endpoints {
                Some(endpoints) => {
                    for endpoint in endpoints.iter() {
                        if endpoint.host != trace_host.to_string()
                            || endpoint.method != trace_method.to_string()
                        {
                            continue;
                        }
                        if is_endpoint_match(&split_path, endpoint.path.clone()) {
                            endpoint_match = Some(endpoint);
                        }
                    }
                }
                None => (),
            },
            Err(_) => (),
        };
        let compiled_specs = match endpoint_match {
            Some(e) => match &e.openapi_spec_name {
                Some(s) => match conf_read {
                    Ok(ref conf) => match &conf.specs {
                        Some(specs) => specs.get(s),
                        None => None,
                    },
                    Err(_) => None,
                },
                None => None,
            },
            None => None,
        };
        let compiled_schema = get_compiled_schema(
            split_path,
            trace_method,
            trace_status_code,
            trace_content_type,
            compiled_specs,
        );
        match compiled_schema {
            Ok(r) => {
                let mut validation_errors: Vec<String> = vec![];
                if let Some(schema) = r {
                    let result = schema.validate(&response_body);
                    if let Err(errors) = result {
                        for error in errors {
                            validation_errors.push(get_validation_error_msg(error))
                        }
                    }
                }
                drop(conf_read);
                return validation_errors;
            }
            Err(e) => {
                drop(conf_read);
                return vec![e];
            }
        }
    } else {
        vec![]
    }
}
