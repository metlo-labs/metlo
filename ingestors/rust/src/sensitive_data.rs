use lazy_static::lazy_static;
use regex::Regex;

pub struct SensitiveData {
    pub sensitive_data_type: String,
    pub regex: Regex,
}

lazy_static! {
pub static ref SENSITIVE_DATA_LS: [SensitiveData; 3] = [
    SensitiveData {
        sensitive_data_type: "aadhar".to_string(),
        regex: Regex::new(r#"(^|\s)(([0-9]{12})|([0-9]{4} [0-9]{4} [0-9]{4}))(\s|$)"#).unwrap(),
    },
    SensitiveData {
        sensitive_data_type: "email".to_string(),
        regex: Regex::new(r#"(^|\s)(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])(\s|$)"#).unwrap(),
    },
    SensitiveData {
        sensitive_data_type: "ipv4".to_string(),
        regex: Regex::new(r#"(^|\s)(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\s|$)"#).unwrap(),
    },
];
}

pub fn detect_sensitive_data(txt: &str) -> Vec<String> {
    SENSITIVE_DATA_LS
        .iter()
        .filter(|e| e.regex.is_match(txt))
        .map(|e| e.sensitive_data_type.clone())
        .collect()
}
