use jsonschema::{error::ValidationErrorKind, Draft, JSONSchema, ValidationError};
use lazy_static::lazy_static;
use regex::Regex;
use serde_json::{json, Value};
use std::collections::HashMap;

use crate::metlo_config::MetloSpec;
use crate::trace::ApiTrace;
use crate::METLO_CONFIG;

#[derive(Debug)]
pub struct CompiledSchema {
    path_pointer: Vec<String>,
    schema: JSONSchema,
}

pub struct EndpointInfo {
    pub openapi_spec_name: Option<String>,
    pub endpoint_path: String,
}

pub type CompiledSpecs = HashMap<
    String,
    HashMap<String, HashMap<String, HashMap<String, HashMap<String, CompiledSchema>>>>,
>;
pub type CompiledSpecsSingle =
    HashMap<String, HashMap<String, HashMap<String, HashMap<String, CompiledSchema>>>>;

lazy_static! {
    pub static ref INVALID_REF_REGEX: Regex = Regex::new(r#""\$ref":\s*(""|"/?\#"|"/+")"#).unwrap();
}

fn get_validation_error_msg(error: &ValidationError) -> Option<String> {
    let path_vec = error.instance_path.to_owned().into_vec();
    let prefix = match path_vec.len() > 0 {
        true => format!("Response body property {:?}", path_vec.join(".")),
        false => format!("Response body"),
    };
    match &error.kind {
        ValidationErrorKind::AdditionalItems { limit } => {
            Some(format!("{} contains more than {} items.", prefix, limit))
        }
        ValidationErrorKind::AdditionalProperties { unexpected } => Some(format!(
            "{} has unallowed additional properties {:?}.",
            prefix,
            unexpected.join(", ")
        )),
        ValidationErrorKind::AnyOf => Some(format!(
            "{} is not valid under any of the given schemas.",
            prefix
        )),
        ValidationErrorKind::BacktrackLimitExceeded { error: _ } => None,
        ValidationErrorKind::Constant { expected_value } => Some(format!(
            "{} is not expected constant value of {:?}.",
            prefix, expected_value
        )),
        ValidationErrorKind::Contains => Some(format!(
            "{} doesn't contain items conforming to the specified schema.",
            prefix
        )),
        ValidationErrorKind::ContentEncoding { content_encoding } => Some(format!(
            "{} does not respect the defined contentEncoding of {}.",
            prefix, content_encoding
        )),
        ValidationErrorKind::ContentMediaType { content_media_type } => Some(format!(
            "{} does not respect the defined contentMediaType of {}.",
            prefix, content_media_type
        )),
        ValidationErrorKind::Enum { options } => Some(format!(
            "{} is not equal to one of the allowed values {:?}.",
            prefix,
            options.as_array().map_or("".to_string(), |v| v
                .into_iter()
                .map(|i| i.as_str().unwrap_or(""))
                .collect::<Vec<&str>>()
                .join(", "))
        )),
        ValidationErrorKind::ExclusiveMaximum { limit } => Some(format!(
            "{} is value larger than or equal to {}.",
            prefix, limit
        )),
        ValidationErrorKind::ExclusiveMinimum { limit } => Some(format!(
            "{} is value smaller than or equal to {}.",
            prefix, limit
        )),
        ValidationErrorKind::FalseSchema => None,
        ValidationErrorKind::FileNotFound { error: _ } => None,
        ValidationErrorKind::Format { format } => {
            Some(format!("{} is not of format {:?}.", prefix, format))
        }
        ValidationErrorKind::FromUtf8 { error: _ } => None,
        ValidationErrorKind::Utf8 { error: _ } => None,
        ValidationErrorKind::JSONParse { error: _ } => None,
        ValidationErrorKind::InvalidReference { reference: _ } => None,
        ValidationErrorKind::InvalidURL { error: _ } => None,
        ValidationErrorKind::MaxItems { limit } => Some(format!(
            "{} is array with more than {} items.",
            prefix, limit
        )),
        ValidationErrorKind::Maximum { limit } => {
            Some(format!("{} is value larger than {}.", prefix, limit))
        }
        ValidationErrorKind::MaxLength { limit } => Some(format!(
            "{} is string longer than {} characters.",
            prefix, limit
        )),
        ValidationErrorKind::MaxProperties { limit } => Some(format!(
            "{} is object with more than {} properties.",
            prefix, limit
        )),
        ValidationErrorKind::MinItems { limit } => Some(format!(
            "{} is array with less than {} items.",
            prefix, limit
        )),
        ValidationErrorKind::Minimum { limit } => {
            Some(format!("{} is value smaller than {}.", prefix, limit))
        }
        ValidationErrorKind::MinLength { limit } => Some(format!(
            "{} is string shorter than {} characters.",
            prefix, limit
        )),
        ValidationErrorKind::MinProperties { limit } => Some(format!(
            "{} is object with less than {} properties.",
            prefix, limit
        )),
        ValidationErrorKind::MultipleOf { multiple_of } => {
            Some(format!("{} is not a multiple of {}.", prefix, multiple_of))
        }
        ValidationErrorKind::Not { schema: _ } => Some(format!(
            "{} is not valid for the given negated schema.",
            prefix
        )),
        ValidationErrorKind::OneOfMultipleValid => Some(format!(
            "{} is valid for more than one of the given schemas.",
            prefix
        )),
        ValidationErrorKind::OneOfNotValid => Some(format!(
            "{} is not valid for any one of the given schemas.",
            prefix
        )),
        ValidationErrorKind::Pattern { pattern } => {
            Some(format!("{} does not match pattern {:?}.", prefix, pattern))
        }
        ValidationErrorKind::PropertyNames { error: _ } => {
            Some(format!("{} has invalid property names.", prefix))
        }
        ValidationErrorKind::Required { property } => Some(format!(
            "{} is missing required property {}.",
            prefix,
            property.to_string(),
        )),
        ValidationErrorKind::Schema => None,
        ValidationErrorKind::Type { kind } => {
            let types = match kind {
                jsonschema::error::TypeKind::Single(s) => s.to_string(),
                jsonschema::error::TypeKind::Multiple(m) => m
                    .into_iter()
                    .map(|e| e.to_string())
                    .collect::<Vec<String>>()
                    .join(" or "),
            };
            Some(format!("{} is not of type {:?}.", prefix, types))
        }
        ValidationErrorKind::UniqueItems => Some(format!("{} has non unique items.", prefix)),
        ValidationErrorKind::UnknownReferenceScheme { scheme: _ } => None,
        ValidationErrorKind::Resolver { url: _, error: _ } => None,
    }
}

pub fn compile_specs(specs: Vec<MetloSpec>) -> CompiledSpecs {
    let mut compiled_specs: CompiledSpecs = HashMap::new();
    for e in specs.iter() {
        if INVALID_REF_REGEX.is_match(&e.spec) {
            log::debug!("{} has invalid $ref value", &e.name);
            continue;
        }
        if let Ok(Value::Object(v)) = serde_json::from_str::<Value>(&e.spec) {
            if let Some(Value::Object(paths)) = v.get("paths") {
                let default = json!({});
                let components = match v.get("components") {
                    Some(c) => c,
                    None => &default,
                };
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
                            let (status_code_val, in_responses_schema) =
                                match status_code_value.get("$ref") {
                                    Some(Value::String(ref_string)) => (
                                        components.pointer(&format!(
                                            "/responses/{}/content",
                                            ref_string.rsplit_once('/').unwrap_or_default().1
                                        )),
                                        true,
                                    ),
                                    _ => (status_code_value.get("content"), false),
                                };
                            let mut content_type_specs = HashMap::new();
                            for (content_type, content_type_value) in status_code_val
                                .unwrap_or(&serde_json::Value::default())
                                .as_object()
                                .unwrap_or(&serde_json::Map::default())
                                .iter()
                            {
                                let content_type_tmp = match content_type.parse::<mime::Mime>() {
                                    Ok(m) => m.essence_str().to_owned(),
                                    Err(_) => continue,
                                };
                                if let Some(s) = content_type_value.get("schema") {
                                    let mut schema = s.clone();
                                    schema["components"] = components.clone();
                                    let compiled_schema = match JSONSchema::options()
                                        .with_draft(Draft::Draft7)
                                        .compile(&schema)
                                    {
                                        Ok(s) => s,
                                        Err(err) => {
                                            log::debug!(
                                                "Failed to compile spec {}: {}",
                                                e.name,
                                                err
                                            );
                                            continue;
                                        }
                                    };
                                    let mut path_pointer = vec![
                                        "paths".to_owned(),
                                        path.to_owned(),
                                        method.to_owned(),
                                        "responses".to_owned(),
                                        status_code.to_owned(),
                                    ];
                                    content_type_specs.insert(
                                        content_type_tmp,
                                        CompiledSchema {
                                            path_pointer: if in_responses_schema {
                                                path_pointer
                                            } else {
                                                path_pointer.append(&mut vec![
                                                    "content".to_owned(),
                                                    content_type.to_owned(),
                                                ]);
                                                path_pointer
                                            },
                                            schema: compiled_schema,
                                        },
                                    );
                                }
                            }
                            if content_type_specs.len() > 0 {
                                status_code_specs
                                    .insert(status_code.to_owned(), content_type_specs);
                            }
                        }
                        if status_code_specs.len() > 0 {
                            method_specs.insert(method.to_owned(), status_code_specs);
                        }
                    }
                    if method_specs.len() > 0 {
                        path_specs.insert(path.to_owned(), method_specs);
                    }
                }
                if path_specs.len() > 0 {
                    compiled_specs.insert(e.name.to_owned(), path_specs);
                }
            }
        }
    }
    return compiled_specs;
}

pub fn get_split_path(path: &String) -> Vec<&str> {
    path.split('/')
        .filter(|token| token.len() > 0)
        .collect::<Vec<&str>>()
}

fn get_spec_path_map<'a>(
    trace_tokens: Vec<&'a str>,
    compiled_specs: Option<&'a CompiledSpecsSingle>,
) -> Option<&'a HashMap<String, HashMap<String, HashMap<String, CompiledSchema>>>> {
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
    spec_status_code_map: &'a HashMap<String, CompiledSchema>,
) -> Result<Option<&'a CompiledSchema>, String> {
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
    let mut matched_schema: Option<&CompiledSchema> = None;
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
) -> Result<Option<&'a CompiledSchema>, String> {
    let spec_path_map = get_spec_path_map(trace_tokens, compiled_specs);
    let spec_method_map = match spec_path_map {
        Some(method_map) => method_map.get(&trace_method.to_lowercase()),
        None => None,
    };
    let spec_status_code_map = match spec_method_map {
        Some(status_code_map) => {
            let first_char = trace_status_code.chars().next().unwrap_or_default();
            let status_code_range = format!("{}XX", first_char);
            if status_code_map.contains_key(trace_status_code) {
                status_code_map.get(trace_status_code)
            } else if status_code_map.contains_key(&status_code_range) {
                status_code_map.get(&status_code_range)
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

pub fn find_open_api_diff(
    trace: &ApiTrace,
    response_body: &Value,
    endpoint_info: EndpointInfo,
) -> Option<HashMap<String, Vec<String>>> {
    let mut validation_errors: HashMap<String, Vec<String>> = HashMap::new();
    if let (Some(resp), Some(s)) = (&trace.response, endpoint_info.openapi_spec_name) {
        let trace_method = &trace.request.method;
        let trace_status_code = &resp.status.to_string();
        let trace_content_type = &resp
            .headers
            .iter()
            .find(|e| e.name.to_lowercase() == "content-type")
            .map(|e| e.value.to_owned())
            .unwrap_or_default();
        let split_path: Vec<&str> = get_split_path(&endpoint_info.endpoint_path);

        let conf_read = METLO_CONFIG.try_read();
        let compiled_specs = match conf_read {
            Ok(ref conf) => match &conf.specs {
                Some(specs) => specs.get(&s),
                None => None,
            },
            Err(_) => None,
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
                if let Some(schema) = r {
                    let result = schema.schema.validate(&response_body);
                    if let Err(errors) = result {
                        for error in errors {
                            match get_validation_error_msg(&error) {
                                Some(msg) => {
                                    validation_errors.insert(msg, schema.path_pointer.clone());
                                }
                                None => (),
                            }
                        }
                    }
                }
                drop(conf_read);
                return Some(validation_errors);
            }
            Err(e) => {
                drop(conf_read);
                validation_errors.insert(e, vec![]);
                return Some(validation_errors);
            }
        }
    } else {
        None
    }
}
