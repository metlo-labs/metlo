use base64::{engine::general_purpose, Engine as _};
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
    trace::{
        ApiRequest, ApiResponse, ApiTrace, ApiUrl, Encryption, KeyVal, ProcessTraceRes,
        ProcessedApiTrace,
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

fn encode_body(
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
        Err(e) => Err(format!("Error encoding body: {:?}", e).into()),
    }
}

fn encode_key_val(
    cipher: &AesGcm<Aes256, UInt<UInt<UInt<UInt<UTerm, B1>, B1>, B0>, B0>>,
    items: Vec<KeyVal>,
    name: String,
    generated_ivs: &mut HashMap<String, Vec<u8>>,
) -> Result<Vec<KeyVal>, Box<dyn std::error::Error>> {
    items
        .iter()
        .map(|e| {
            let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
            match cipher.encrypt(&nonce, e.value.as_bytes()) {
                Ok(t) => {
                    generated_ivs.insert(name.clone() + "." + &e.name, nonce.to_vec());
                    Ok(KeyVal {
                        name: e.name.clone(),
                        value: general_purpose::STANDARD.encode(t),
                    })
                }
                Err(e) => Err(format!("Error encoding KeyVal: {:?}", e).into()),
            }
        })
        .collect()
}

fn encoded_trace(
    trace: ApiTrace,
    processed_trace: ProcessTraceRes,
    trace_capture_enabled: bool,
    encryption_public_key: Option<String>,
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
                            parameters: encode_key_val(
                                &cipher,
                                trace.request.url.parameters,
                                "reqQuery".to_owned(),
                                &mut generated_ivs,
                            )?,
                        },
                        headers: encode_key_val(
                            &cipher,
                            trace.request.headers,
                            "reqHeaders".to_owned(),
                            &mut generated_ivs,
                        )?,
                        body: encode_body(
                            &cipher,
                            &trace.request.body,
                            "reqBody",
                            &mut generated_ivs,
                        )?,
                    },
                    response: match trace.response {
                        Some(r) => Some(ApiResponse {
                            status: r.status,
                            headers: encode_key_val(
                                &cipher,
                                r.headers,
                                "resHeaders".to_owned(),
                                &mut generated_ivs,
                            )?,
                            body: encode_body(&cipher, &r.body, "resBody", &mut generated_ivs)?,
                        }),
                        None => None,
                    },
                    meta: trace.meta,
                    redacted: !trace_capture_enabled,
                    processed_trace_data: processed_trace,
                    encryption: Some(Encryption {
                        key: general_purpose::STANDARD.encode(encrypted_key),
                        generated_ivs,
                    }),
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
) -> Result<LogTraceResp, Box<dyn std::error::Error>> {
    let url_res = Url::parse(collector_log_url);
    match url_res {
        Ok(url) => {
            let req_body: ProcessedApiTrace = match trace_capture_enabled {
                true => encoded_trace(
                    trace,
                    processed_trace,
                    trace_capture_enabled,
                    encryption_public_key,
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
        let resp = send_trace_inner(
            collector_log_endpoint.as_str(),
            &conf.creds.clone().unwrap_or_default().api_key,
            trace,
            processed_trace.0,
            global_full_trace_capture,
            conf.encryption_public_key.clone(),
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
                    log::warn!("Failed to send trace: {}", msg.unwrap_or_default())
                }
            }
            Err(err) => log::warn!("{}", err.to_string()),
        }
    }
    drop(conf_read)
}
