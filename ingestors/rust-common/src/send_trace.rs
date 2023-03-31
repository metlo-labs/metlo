use base64::{engine::general_purpose, Engine as _};
use ring::hmac;
use std::collections::HashMap;

use aes_gcm::{
    aead::{
        consts::{B0, B1},
        Aead, KeyInit, OsRng,
    },
    aes::{
        cipher::typenum::{UInt, UTerm},
        Aes256,
    },
    AeadCore, Aes256Gcm, AesGcm,
};
use lazy_static::lazy_static;

use reqwest::{Client, Url};
use rsa::{pkcs8::DecodePublicKey, Oaep, PublicKey, RsaPublicKey};

use crate::{
    metlo_config::Authentication,
    trace::{
        ApiRequest, ApiResponse, ApiTrace, ApiUrl, Encryption, KeyVal, ProcessTraceRes,
        ProcessedApiTrace, SessionMeta,
    },
    METLO_CONFIG,
};

pub struct LogTraceResp {
    pub ok: bool,
    pub msg: Option<String>,
}

lazy_static! {
    pub static ref CLIENT: Client = reqwest::Client::new();
}

fn handle_basic_auth(header: &KeyVal, hmac_key: &hmac::Key, session_meta: &mut SessionMeta) {
    let auth_header_basic = header.name.to_lowercase();
    let is_auth_header_value = header.value.to_lowercase().contains("basic");
    if auth_header_basic == "authorization" && is_auth_header_value {
        let encoded_value = header.value.split_once("Basic");
        if let Some(val) = encoded_value {
            let tag = hmac::sign(hmac_key, val.1.as_bytes());
            session_meta.authentication_provided = Some(true);
            session_meta.unique_session_key = Some(general_purpose::STANDARD.encode(tag.as_ref()));
        }
    }
}

fn handle_header_key(
    header: &KeyVal,
    hmac_key: &hmac::Key,
    session_meta: &mut SessionMeta,
    authentication: &Authentication,
) {
    if let Some(header_key) = &authentication.header_key {
        if header_key.to_lowercase() == header.name.to_lowercase() {
            let tag = hmac::sign(hmac_key, header.value.as_bytes());
            session_meta.authentication_provided = Some(true);
            session_meta.unique_session_key = Some(general_purpose::STANDARD.encode(tag.as_ref()));
        }
    }
}

fn handle_jwt_key(
    header: &KeyVal,
    hmac_key: &hmac::Key,
    session_meta: &mut SessionMeta,
    authentication: &Authentication,
) {
    if let Some(header_key) = &authentication.header_key {
        if header_key.to_lowercase() == header.name.to_lowercase() {
            let tag = hmac::sign(hmac_key, header.value.as_bytes());
            session_meta.authentication_provided = Some(true);
            session_meta.unique_session_key = Some(general_purpose::STANDARD.encode(tag.as_ref()));
        }
    }
}

fn handle_session_cookie(
    header: &KeyVal,
    hmac_key: &hmac::Key,
    session_meta: &mut SessionMeta,
    authentication: &Authentication,
) {
    if let Some(cookie_name) = &authentication.cookie_name {
        if cookie_name.to_lowercase() == header.name.to_lowercase() {
            let tag = hmac::sign(hmac_key, header.value.as_bytes());
            session_meta.authentication_provided = Some(true);
            session_meta.unique_session_key = Some(general_purpose::STANDARD.encode(tag.as_ref()));
        }
    }
}

fn get_session_metadata(
    authentication: Option<&Authentication>,
    hmac_key: &Option<hmac::Key>,
    trace: &ApiTrace,
) -> SessionMeta {
    let mut session_meta: SessionMeta = SessionMeta {
        authentication_provided: None,
        authentication_successful: None,
        auth_type: None,
        unique_session_key: None,
        user: None,
    };
    if let Some(key) = hmac_key {
        if let Some(auth) = authentication {
            session_meta.authentication_provided = Some(false);
            session_meta.auth_type = Some(auth.auth_type.clone());
            session_meta.authentication_successful = trace
                .response
                .as_ref()
                .map_or(Some(false), |f| Some(f.status != 401 && f.status != 403));
            for header in trace.request.headers.iter() {
                match auth.auth_type.as_str() {
                    "basic" => handle_basic_auth(header, key, &mut session_meta),
                    "header" => handle_header_key(header, key, &mut session_meta, auth),
                    "session_cookie" => handle_session_cookie(header, key, &mut session_meta, auth),
                    "jwt" => handle_jwt_key(header, key, &mut session_meta, auth),
                    _ => (),
                }
            }
            session_meta
        } else if let Some(meta) = &trace.meta {
            if !meta.source.is_empty() {
                let tag = hmac::sign(key, meta.source.as_bytes());
                session_meta.unique_session_key =
                    Some(general_purpose::STANDARD.encode(tag.as_ref()));
            }
            session_meta
        } else {
            session_meta
        }
    } else {
        session_meta
    }
}

fn encrypt_body(
    cipher: &AesGcm<Aes256, UInt<UInt<UInt<UInt<UTerm, B1>, B1>, B0>, B0>>,
    body: &str,
    name: &str,
    generated_ivs: &mut HashMap<String, Vec<u8>>,
) -> Result<String, Box<dyn std::error::Error>> {
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    match cipher.encrypt(&nonce, body.as_bytes()) {
        Ok(t) => {
            generated_ivs.insert(name.to_owned(), nonce.to_vec());
            Ok(general_purpose::STANDARD.encode(t))
        }
        Err(e) => Err(format!("Error encrypting body: {:?}", e).into()),
    }
}

fn encrypt_key_val(
    cipher: &AesGcm<Aes256, UInt<UInt<UInt<UInt<UTerm, B1>, B1>, B0>, B0>>,
    items: Vec<KeyVal>,
    name: String,
    generated_ivs: &mut HashMap<String, Vec<u8>>,
) -> Result<Vec<KeyVal>, Box<dyn std::error::Error>> {
    items
        .iter()
        .map(|e| {
            let nonce_key = Aes256Gcm::generate_nonce(&mut OsRng);
            let nonce_val = Aes256Gcm::generate_nonce(&mut OsRng);
            match (
                cipher.encrypt(&nonce_key, e.name.as_bytes()),
                cipher.encrypt(&nonce_val, e.value.as_bytes()),
            ) {
                (Ok(k), Ok(v)) => {
                    let encrypted_key = general_purpose::STANDARD.encode(k);
                    let encrypted_val = general_purpose::STANDARD.encode(v);
                    generated_ivs.insert(name.clone() + "." + &encrypted_key, nonce_key.to_vec());
                    generated_ivs.insert(name.clone() + "." + &encrypted_val, nonce_val.to_vec());
                    Ok(KeyVal {
                        name: encrypted_key,
                        value: encrypted_val,
                    })
                }
                (Err(e_1), Err(e_2)) => {
                    Err(format!("Error encrypting KeyVal: {:?}, {:?}", e_1, e_2).into())
                }
                (Err(e), _) => Err(format!("Error encrypting Key of KeyVal: {:?}", e).into()),
                (_, Err(e)) => Err(format!("Error encrypting Value of KeyVal: {:?}", e).into()),
            }
        })
        .collect()
}

fn encrypt_xss(
    cipher: &AesGcm<Aes256, UInt<UInt<UInt<UInt<UTerm, B1>, B1>, B0>, B0>>,
    xss_detected: Option<&HashMap<String, String>>,
    generated_ivs: &mut HashMap<String, Vec<u8>>,
) -> Result<Option<HashMap<String, String>>, Box<dyn std::error::Error>> {
    let mut encrypted_xss: Option<HashMap<String, String>> = None;
    if let Some(m) = xss_detected {
        let mut encrypted_xss_inner: HashMap<String, String> = HashMap::new();
        let res: Result<(), aes_gcm::Error> = m.iter().try_for_each(|e| {
            let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
            let encrypted = cipher.encrypt(&nonce, e.1.as_bytes())?;
            generated_ivs.insert("xss.".to_owned() + e.0, nonce.to_vec());
            encrypted_xss_inner.insert(e.0.clone(), general_purpose::STANDARD.encode(encrypted));
            Ok(())
        });
        if res.is_err() {
            return Err(
                format!("Error encrypting XSS detections: {:?}", res.err().unwrap()).into(),
            );
        } else {
            encrypted_xss = Some(encrypted_xss_inner);
        }
    }
    Ok(encrypted_xss)
}

fn encrypt_sqli(
    cipher: &AesGcm<Aes256, UInt<UInt<UInt<UInt<UTerm, B1>, B1>, B0>, B0>>,
    sqli_detected: Option<&HashMap<String, (String, String)>>,
    generated_ivs: &mut HashMap<String, Vec<u8>>,
) -> Result<Option<HashMap<String, (String, String)>>, Box<dyn std::error::Error>> {
    let mut encrypted_sqli: Option<HashMap<String, (String, String)>> = None;
    if let Some(m) = sqli_detected {
        let mut encrypted_sqli_inner: HashMap<String, (String, String)> = HashMap::new();
        let res: Result<(), aes_gcm::Error> = m.iter().try_for_each(|e| {
            let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
            let encrypted = cipher.encrypt(&nonce, e.1 .0.as_bytes())?;
            generated_ivs.insert("sqli.".to_owned() + e.0, nonce.to_vec());
            encrypted_sqli_inner.insert(
                e.0.clone(),
                (general_purpose::STANDARD.encode(encrypted), e.1 .1.clone()),
            );
            Ok(())
        });
        if res.is_err() {
            return Err(
                format!("Error encrypting SQLI detections: {:?}", res.err().unwrap()).into(),
            );
        } else {
            encrypted_sqli = Some(encrypted_sqli_inner)
        }
    }
    Ok(encrypted_sqli)
}

fn encrypt_trace(
    trace: ApiTrace,
    processed_trace: ProcessTraceRes,
    trace_capture_enabled: bool,
    encryption_public_key: Option<String>,
    session_meta: SessionMeta,
) -> Result<ProcessedApiTrace, Box<dyn std::error::Error>> {
    if let Some(public_key) = encryption_public_key {
        match RsaPublicKey::from_public_key_pem(&public_key) {
            Ok(rsa) => {
                let key = Aes256Gcm::generate_key(&mut OsRng);
                let cipher = Aes256Gcm::new(&key);
                let padding = Oaep::new::<sha2::Sha256>();
                let encrypted_key = rsa.encrypt(&mut OsRng, padding, &key[..])?;
                let mut generated_ivs: HashMap<String, Vec<u8>> = HashMap::new();
                Ok(ProcessedApiTrace {
                    request: ApiRequest {
                        method: trace.request.method,
                        url: ApiUrl {
                            host: trace.request.url.host,
                            path: trace.request.url.path,
                            parameters: encrypt_key_val(
                                &cipher,
                                trace.request.url.parameters,
                                "reqQuery".to_owned(),
                                &mut generated_ivs,
                            )?,
                        },
                        headers: encrypt_key_val(
                            &cipher,
                            trace.request.headers,
                            "reqHeaders".to_owned(),
                            &mut generated_ivs,
                        )?,
                        body: encrypt_body(
                            &cipher,
                            &trace.request.body,
                            "reqBody",
                            &mut generated_ivs,
                        )?,
                    },
                    response: match trace.response {
                        Some(r) => Some(ApiResponse {
                            status: r.status,
                            headers: encrypt_key_val(
                                &cipher,
                                r.headers,
                                "resHeaders".to_owned(),
                                &mut generated_ivs,
                            )?,
                            body: encrypt_body(&cipher, &r.body, "resBody", &mut generated_ivs)?,
                        }),
                        None => None,
                    },
                    meta: trace.meta,
                    redacted: !trace_capture_enabled,
                    processed_trace_data: ProcessTraceRes {
                        block: processed_trace.block,
                        xss_detected: encrypt_xss(
                            &cipher,
                            processed_trace.xss_detected.as_ref(),
                            &mut generated_ivs,
                        )?,
                        sqli_detected: encrypt_sqli(
                            &cipher,
                            processed_trace.sqli_detected.as_ref(),
                            &mut generated_ivs,
                        )?,
                        sensitive_data_detected: processed_trace.sensitive_data_detected,
                        data_types: processed_trace.data_types,
                        validation_errors: processed_trace.validation_errors,
                        request_content_type: processed_trace.request_content_type,
                        response_content_type: processed_trace.response_content_type,
                        graph_ql_data: processed_trace.graph_ql_data,
                    },
                    encryption: Some(Encryption {
                        key: general_purpose::STANDARD.encode(encrypted_key),
                        generated_ivs,
                    }),
                    session_meta: Some(session_meta),
                })
            }
            Err(e) => Err(format!("Error reading encryption key: {:?}", e).into()),
        }
    } else {
        Ok(ProcessedApiTrace {
            request: trace.request,
            response: trace.response,
            meta: trace.meta,
            redacted: !trace_capture_enabled,
            processed_trace_data: processed_trace,
            encryption: None,
            session_meta: Some(session_meta),
        })
    }
}

async fn send_trace_inner(
    collector_log_url: &str,
    api_key: &str,
    trace: ApiTrace,
    processed_trace: ProcessTraceRes,
    trace_capture_enabled: bool,
    encryption_public_key: Option<String>,
    authentication: Option<&Authentication>,
    hmac_key: &Option<hmac::Key>,
) -> Result<LogTraceResp, Box<dyn std::error::Error>> {
    let url_res = Url::parse(collector_log_url);
    let session_meta = get_session_metadata(authentication, hmac_key, &trace);
    match url_res {
        Ok(url) => {
            let req_body: ProcessedApiTrace = match trace_capture_enabled {
                true => encrypt_trace(
                    trace,
                    processed_trace,
                    trace_capture_enabled,
                    encryption_public_key,
                    session_meta,
                )?,
                false => ProcessedApiTrace {
                    request: ApiRequest {
                        method: trace.request.method,
                        url: ApiUrl {
                            host: trace.request.url.host,
                            path: trace.request.url.path,
                            parameters: vec![],
                        },
                        headers: vec![],
                        body: "".to_string(),
                    },
                    response: match trace.response {
                        Some(r) => Some(ApiResponse {
                            status: r.status,
                            headers: vec![],
                            body: "".to_string(),
                        }),
                        None => None,
                    },
                    meta: trace.meta,
                    redacted: !trace_capture_enabled,
                    processed_trace_data: processed_trace,
                    encryption: None,
                    session_meta: Some(session_meta),
                },
            };
            let resp = CLIENT
                .post(url)
                .header("authorization", api_key)
                .json(&req_body)
                .send()
                .await?;
            if resp.status() == reqwest::StatusCode::OK {
                return Ok(LogTraceResp {
                    ok: true,
                    msg: None,
                });
            }
            let text = resp.text().await?;
            Ok(LogTraceResp {
                ok: false,
                msg: Some(text),
            })
        }
        Err(e) => Ok(LogTraceResp {
            ok: false,
            msg: Some(format!("Couldn't parse url: {}", e)),
        }),
    }
}

pub async fn send_api_trace(trace: ApiTrace, processed_trace: (ProcessTraceRes, bool)) {
    let conf_read = METLO_CONFIG.try_read();
    if let Ok(ref conf) = conf_read {
        let collector_log_endpoint = format!(
            "{}/api/v2/log-request/single",
            conf.collector_url.clone().unwrap_or_default()
        );
        let path = trace.request.url.path.clone();
        let host = trace.request.url.host.clone();
        let method = trace.request.method.clone();
        let global_full_trace_capture = conf.global_full_trace_capture || processed_trace.1;
        let mapped_host = conf
            .host_mapping
            .iter()
            .find(|&h| h.pattern.is_match(&trace.request.url.host));
        let curr_host = match mapped_host {
            Some(h) => &h.host,
            None => &trace.request.url.host,
        };
        let authentication = conf
            .authentication_config
            .iter()
            .find(|e| e.host.as_str() == curr_host);
        let resp = send_trace_inner(
            collector_log_endpoint.as_str(),
            &conf.creds.clone().unwrap_or_default().api_key,
            trace,
            processed_trace.0,
            global_full_trace_capture,
            conf.encryption_public_key.clone(),
            authentication,
            &conf.hmac_key,
        )
        .await;
        match resp {
            Ok(LogTraceResp { ok, msg }) => {
                if ok {
                    log::trace!(
                        "Successfully sent trace: \nMethod{}\nHost{}\nPath{}",
                        method,
                        host,
                        path,
                    )
                } else {
                    log::debug!("Failed to send trace: {}", msg.unwrap_or_default())
                }
            }
            Err(err) => log::debug!("{}", err.to_string()),
        }
    }
    drop(conf_read)
}
