use crate::{metlo_config::*, sensitive_data::*, trace::*};
use antidote::Mutex;
use lazy_static::lazy_static;
use std::time::SystemTime;
use tokio::sync::mpsc::error::{SendError, TrySendError};

mod metlo_config;
mod net_thread;
mod sensitive_data;
mod trace;

lazy_static! {
    pub static ref METLO_CONFIG: Mutex<MetloConfig> = Mutex::new(MetloConfig {
        api_key: None,
        metlo_host: None,
        initialized: false,
    });
}

fn initialize(metlo_host: String, api_key: String) {}

fn process(trace: &ApiTrace) -> ProcessTraceRes {
    todo!()
}

fn process_trace_blocking(trace: ApiTrace) -> ProcessTraceRes {
    let process_results = process(&trace);
    match net_thread::SEND_CHANNEL.blocking_send((trace, Some(process_results))) {
        Ok(()) => {}
        Err(SendError(_)) => panic!("The networking thread crashed, despite its panic handler"),
    }
    process_results
}

fn process_trace(trace: ApiTrace) {
    match net_thread::SEND_CHANNEL.try_send((trace, None)) {
        Ok(()) => {}
        Err(TrySendError::Full(_trace)) => {
            // TODO: Do we wanna log this? Maybe try to estimate what proportion of traces we're
            // dropping and start shouting once it gets high enough?
        }
        Err(TrySendError::Closed(_trace)) => {
            panic!("The networking thread crashed, despite its panic handler");
        }
    }
}

fn main() {
    initialize("http://localhost:8000".to_string(), "".to_string());
    let test_strings = [
        "akshay@metlo.com",
        "123412341234",
        "asdfaefawefawefhaiowehfual a@b.com iwehfuaiwehfawhefaulwehfliuwhefiluawgefiuawgefiuahweiughaweliguagweiufhawiufhw",
        "aakshay@metlo.com .awefa32**",
        "asdfaefawefawefhaiowehfuala@!!1b.comiwehfuaiwehfawhefaulwehfliuwhefiluawgefiuawgefiuahweiughaweliguagweiufhawiufhw",
        "aw3fauwheg83ah892h3fiawlfhuawlhf8a9h3fluaiwhfuahw3fah3f98hf8alhg3fl8agf8ahl8fha89w3hasdfaefawefawefhaiowehfuala@!!1b.comiwehfuaiwehfawhefaulwehfliuwhefiluawgefiuawgefiuahweiughaweliguagweiufhawiufhw",
    ];
    let start = SystemTime::now();
    let mut total: u32 = 0;
    for _ in 1..10 {
        for t in test_strings {
            total += detect_sensitive_data(t).len() as u32;
        }
    }
    println!("{}", total);
    println!("{}", METLO_CONFIG.lock().initialized);
    println!("{:?}", SystemTime::now().duration_since(start))
}
