use lazy_static::lazy_static;
use regex::Regex;
use std::collections::HashSet;

use crate::METLO_CONFIG;

#[derive(Debug, Clone)]
pub struct SensitiveData {
    pub sensitive_data_type: String,
    pub regex: Option<Regex>,
    pub key_regex: Option<Regex>,
}

lazy_static! {
pub static ref DEFAULT_SENSITIVE_DATA_LS: Vec<SensitiveData> = vec![
    SensitiveData {
        sensitive_data_type: "Email".to_string(),
        regex: Some(Regex::new(r#"(^|\s)(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])(\s|$)"#).unwrap()),
        key_regex: None
    },
    SensitiveData {
        sensitive_data_type: "IP Address".to_string(),
        regex: Some(Regex::new(r#"(^|\s)(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\s|$)"#).unwrap()),
        key_regex: None
    },
];
static ref AADHAR_MULT: Vec<Vec<u8>> = vec![
    vec![0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    vec![1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    vec![2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    vec![3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    vec![4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    vec![5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    vec![6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    vec![7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    vec![8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    vec![9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
static ref AADHAR_PERM: Vec<Vec<u8>> = vec![
    vec![0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    vec![1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    vec![5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    vec![8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    vec![9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    vec![4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    vec![2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    vec![7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];
static ref AADHAR_INV: Vec<u8> = vec![0, 4, 3, 2, 1, 5, 6, 7, 8, 9];
}

fn validate_aadhar(e: &str) -> bool {
    let re = Regex::new(r#"[^0-9]"#).unwrap();
    let sanitized_text = re.replace_all(e, "");
    if sanitized_text.len() != 12 {
        false
    } else {
        let mut arr = sanitized_text
            .chars()
            .map(|c| c.to_string().parse::<u8>().unwrap())
            .collect::<Vec<u8>>();
        let check_sum = arr.pop().unwrap();
        let mut c: u8 = 0;
        arr.reverse();
        for i in 0..arr.len() {
            c = AADHAR_MULT[usize::from(c)]
                [usize::from(AADHAR_PERM[(i + 1) % 8][usize::from(arr[i])])];
        }
        AADHAR_INV[usize::from(c)] == check_sum
    }
}

fn cpf_verifier_digit(ls: &Vec<u8>) -> u8 {
    let modulus = ls.len() + 1;
    let multiplied = ls
        .iter()
        .enumerate()
        .map(|(idx, number)| usize::from(number.to_owned()) * (modulus - idx));
    let res = multiplied
        .reduce(|buffer, number| buffer + number)
        .unwrap_or_default()
        % 11;
    if res < 2 {
        0
    } else {
        11 - res as u8
    }
}

fn validate_brazil_cpf(e: &str) -> bool {
    let re = Regex::new(r#"[^0-9]"#).unwrap();
    let sanitized_text = re.replace_all(e, "");
    if sanitized_text.len() != 11 {
        false
    } else {
        let mut ls = sanitized_text
            .chars()
            .map(|c| c.to_string().parse::<u8>().unwrap())
            .collect::<Vec<u8>>();
        let check_sum_digit_2 = ls.pop().unwrap();
        let check_sum_digit_1 = ls.pop().unwrap();

        let real_check_sum_digit_1 = cpf_verifier_digit(&ls);
        ls.push(real_check_sum_digit_1);
        let real_check_sum_digit_2 = cpf_verifier_digit(&ls);

        real_check_sum_digit_1 == check_sum_digit_1 && real_check_sum_digit_2 == check_sum_digit_2
    }
}

fn validate(sensitive_data_type: String, text: &str) -> bool {
    match sensitive_data_type.as_str() {
        "Aadhar Number" => validate_aadhar(text),
        "Brazil CPF" => validate_brazil_cpf(text),
        _ => true,
    }
}

fn detect_sensitive_data_inner(txt: &str, sensitive_data: &[SensitiveData]) -> HashSet<String> {
    sensitive_data
        .iter()
        .filter(|e| match &e.regex {
            Some(regex) => regex.is_match(txt) && validate(e.sensitive_data_type.clone(), txt),
            None => false,
        })
        .map(|e| e.sensitive_data_type.clone())
        .collect()
}

pub fn detect_sensitive_data(txt: &str) -> HashSet<String> {
    let conf_read = METLO_CONFIG.try_read();
    match conf_read {
        Ok(conf) => match &conf.sensitive_data {
            Some(s) => detect_sensitive_data_inner(txt, s),
            None => detect_sensitive_data_inner(txt, &DEFAULT_SENSITIVE_DATA_LS),
        },
        Err(_err) => detect_sensitive_data_inner(txt, &DEFAULT_SENSITIVE_DATA_LS),
    }
}

fn detect_sensitive_data_in_path_inner(
    txt: &str,
    sensitive_data: &[SensitiveData],
) -> HashSet<String> {
    sensitive_data
        .iter()
        .filter(|e| match &e.key_regex {
            Some(regex) => regex.is_match(txt) && validate(e.sensitive_data_type.clone(), txt),
            None => false,
        })
        .map(|e| e.sensitive_data_type.clone())
        .collect()
}

pub fn detect_sensitive_in_path_data(txt: &str) -> HashSet<String> {
    let conf_read = METLO_CONFIG.try_read();
    match conf_read {
        Ok(conf) => match &conf.sensitive_data {
            Some(s) => detect_sensitive_data_in_path_inner(txt, s),
            None => HashSet::new(),
        },
        Err(_err) => HashSet::new(),
    }
}
