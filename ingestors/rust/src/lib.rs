use std::time::SystemTime;

use crate::{metlo_config::*, process_trace::*, trace::*};
use antidote::RwLock;
use lazy_static::lazy_static;
use tokio::sync::mpsc::error::{SendError, TrySendError};

mod metlo_config;
mod process_thread;
mod process_trace;
mod sensitive_data;
mod trace;

lazy_static! {
    pub static ref METLO_CONFIG: RwLock<MetloConfig> = RwLock::new(MetloConfig {
        api_key: None,
        metlo_host: None,
        initialized: false,
    });
}

pub fn initialize_metlo(metlo_host: String, api_key: String) {
    METLO_CONFIG.write().metlo_host = Some(metlo_host);
    METLO_CONFIG.write().api_key = Some(api_key);
    METLO_CONFIG.write().initialized = true;
}

pub fn process_trace_blocking(trace: ApiTrace) -> Result<ProcessTraceRes, String> {
    if !METLO_CONFIG.read().initialized {
        return Err("Metlo not initialized".to_string());
    }
    let process_res = process_trace(&trace);
    match process_thread::SEND_CHANNEL.blocking_send((trace, Some(process_res.clone()))) {
        Ok(()) => {}
        Err(SendError(_)) => panic!("The networking thread crashed, despite its panic handler"),
    }
    Ok(process_res)
}

pub fn process_trace_async(trace: ApiTrace) {
    match process_thread::SEND_CHANNEL.try_send((trace, None)) {
        Ok(()) => {}
        Err(TrySendError::Full(_trace)) => {
            println!("Channel Full")
        }
        Err(TrySendError::Closed(_trace)) => {
            panic!("The networking thread crashed, despite its panic handler");
        }
    }
}

pub fn start(metlo_host: String, api_key: String) {
    initialize_metlo(metlo_host, api_key);
    let start = SystemTime::now();
    for _ in 1..100000 {
        let _ = process_trace_blocking(ApiTrace {
            request: ApiRequest {
                method: "POST".to_string(),
                body: Some("{
                    \"somekey\": [\"foo\", \"bar\", \"akshay@metlo.com\", \"asdf\", \"<script></script>\"],
                    \"foo\": {\"bar\": \"-1' and 1=1 union/* foo */select load_file('/etc/passwd')--\"},
                    \"baz\": {\"bar\": \"-1' and 1=1 union/* foo */select load_file('/etc/passwd')--\"},
                    \"blam\": {\"bar\": \"-1' and 1=1 union/* foo */select load_file('/etc/passwd')--\"},
                    \"asdfasdf\": {\"bar\": \"-1' and 1=1 union/* foo */select load_file('/etc/passwd')--\"}
                }".to_string()),
                url: ApiUrl {
                    host: "http://asdf.com".to_string(),
                    path: "/asdfawef/foo/bar".to_string(),
                    parameters: vec![],
                },
                headers: vec![KeyVal {
                    name: "content-type".to_string(),
                    value: "application/json; charset=utf-8".to_string(),
                }],
            },
            response: None,
            meta: None,
        });
    }
    println!("{:?}", SystemTime::now().duration_since(start))
}
