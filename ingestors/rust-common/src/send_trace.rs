use reqwest::Url;

use crate::{
    trace::{ApiRequest, ApiResponse, ApiTrace, ProcessTraceRes, ProcessedApiTrace},
    METLO_CONFIG,
};

pub struct LogTraceResp {
    pub ok: bool,
    pub msg: Option<String>,
}

async fn send_trace_inner(
    collector_log_url: &str,
    api_key: &str,
    trace: ApiTrace,
    processed_trace: ProcessTraceRes,
    trace_capture_enabled: bool,
) -> Result<LogTraceResp, Box<dyn std::error::Error>> {
    let url_res = Url::parse(collector_log_url);
    match url_res {
        Ok(url) => {
            let req_body: &ProcessedApiTrace = &ProcessedApiTrace {
                request: if trace_capture_enabled {
                    trace.request
                } else {
                    ApiRequest {
                        method: trace.request.method,
                        url: trace.request.url,
                        headers: vec![],
                        body: "".to_string(),
                    }
                },
                response: match trace.response {
                    Some(r) => {
                        if trace_capture_enabled {
                            Some(r)
                        } else {
                            Some(ApiResponse {
                                status: r.status,
                                headers: vec![],
                                body: "".to_string(),
                            })
                        }
                    }
                    None => None,
                },
                meta: trace.meta,
                redacted: !trace_capture_enabled,
                processed_trace_data: processed_trace,
            };
            let client = reqwest::Client::new();
            let resp = client
                .post(url)
                .header("authorization", api_key)
                .json(req_body)
                .send()
                .await?;
            if resp.status() == reqwest::StatusCode::OK {
                return Ok(LogTraceResp {
                    ok: true,
                    msg: None,
                });
            }
            let text = resp.text().await?;
            return Ok(LogTraceResp {
                ok: false,
                msg: Some(text),
            });
        }
        Err(e) => {
            return Ok(LogTraceResp {
                ok: false,
                msg: Some(format!("Couldn't parse url: {}", e.to_string())),
            })
        }
    }
}

pub async fn send_api_trace(trace: ApiTrace, processed_trace: (ProcessTraceRes, bool)) {
    let conf_read = METLO_CONFIG.try_read();
    match conf_read {
        Ok(ref conf) => {
            let collector_log_endpoint = format!(
                "{}/api/v2/log-request/single",
                conf.collector_url.clone().unwrap_or_default()
            );
            let path = trace.request.url.path.clone();
            let host = trace.request.url.host.clone();
            let method = trace.request.method.clone();
            let global_full_trace_capture = conf.global_full_trace_capture || processed_trace.1;
            let resp = send_trace_inner(
                &collector_log_endpoint.as_str(),
                &conf.creds.clone().unwrap_or_default().api_key,
                trace,
                processed_trace.0,
                global_full_trace_capture,
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
        _ => (),
    }
    drop(conf_read)
}
