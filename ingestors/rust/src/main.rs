use crate::metlo_config::*;
use crate::sensitive_data::*;
use crate::trace::*;
use antidote::Mutex;
use lazy_static::lazy_static;
use std::time::SystemTime;

mod metlo_config;
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

fn process_trace_blocking(trace: ApiTrace) -> ProcessTraceRes {
    todo!()
}

fn process_trace(trace: ApiTrace) {}

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
