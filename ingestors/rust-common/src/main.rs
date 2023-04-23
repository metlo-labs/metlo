use clap::Parser;
use lazy_static::lazy_static;
use metlo_agent::{
    initialize_metlo,
    metlo_pcap::tcp_assembly::{clean_map, process_packet, InterfaceType},
    refresh_config, send_batched_traces, server, server_port, METLO_CONFIG,
};
use pcap::{Capture, Device};
use reqwest::Url;
use ring::hmac;
use std::{
    collections::HashSet,
    env,
    time::{Duration, Instant},
};
use tokio::time;

lazy_static! {
    static ref LOG_LEVELS: HashSet<&'static str> = {
        let mut s = HashSet::new();
        s.extend(["trace", "debug", "info", "warn", "error"].iter());
        s
    };
}

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Your Metlo URL
    #[arg(short, long)]
    metlo_host: Option<String>,

    /// Your Metlo Collector Port
    #[arg(short, long)]
    collector_port: Option<u16>,

    /// Your Metlo Backend Port
    #[arg(short, long)]
    backend_port: Option<u16>,

    /// Your Metlo API Key
    #[arg(short, long)]
    api_key: Option<String>,

    /// Socket to listen to
    #[arg(short = 's', long)]
    listen_socket: Option<String>,

    /// Log level [trace, debug, info, warn, error]
    #[arg(short, long)]
    log_level: Option<String>,

    /// Open port for connection
    #[arg(short, long)]
    port: Option<String>,

    /// Encryption Key
    #[arg(short, long)]
    encryption_key: Option<String>,

    #[arg(short, long)]
    interface: Option<String>,

    #[arg(short, long)]
    enable_grpc: Option<bool>,
}

#[tokio::main(flavor = "multi_thread")]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let home_path = dirs::home_dir().unwrap_or_default().display().to_string();
    dotenv::from_path("/opt/metlo/credentials")
        .map_err(|_| {
            dotenv::from_path(format!("{}/.metlo/credentials", home_path))
                .map_err(|_| dotenv::dotenv())
        })
        .ok();
    let args = Args::parse();

    let log_level = match args.log_level {
        Some(level) => level,
        None => match env::var("LOG_LEVEL") {
            Ok(s) => s,
            Err(_) => "info".to_owned(),
        },
    };
    if !LOG_LEVELS.contains(&log_level.as_str()) {
        println!("INVALID LOG LEVEL: {}", log_level);
        return Ok(());
    }
    env::set_var("RUST_LOG", format!("metlo_agent={}", log_level));
    env_logger::init();

    let metlo_host = match args.metlo_host {
        Some(host) => host,
        None => match env::var("METLO_HOST") {
            Ok(s) => s,
            Err(_) => {
                log::error!(
                    "No value passed for METLO_HOST, Set it via -m param or METLO_HOST in the environment"
                );
                return Ok(());
            }
        },
    };

    let valid_host = match Url::parse(&metlo_host) {
        Ok(url) => (
            format!("{}://{}", url.scheme(), url.host_str().unwrap_or_default()),
            url.host_str().unwrap_or_default().to_string(),
        ),
        Err(_) => {
            log::error!("{} is not a valid host", metlo_host);
            return Ok(());
        }
    };

    let api_key = match args.api_key {
        Some(key) => Some(key),
        None => match env::var("METLO_KEY") {
            Ok(s) => Some(s),
            Err(_) => None,
        },
    };
    if api_key.is_none() {
        log::error!(
            "No value passed for METLO_KEY. Set it via -a param or METLO_KEY in the environment"
        );
        return Ok(());
    }

    let listen_socket = match args.listen_socket {
        Some(socket) => socket,
        None => match env::var("LISTEN_SOCKET") {
            Ok(s) => s,
            Err(_) => "/tmp/metlo.sock".to_owned(),
        },
    };
    let port = match args.port {
        Some(p) => Some(p),
        None => match env::var("PORT") {
            Ok(s) => Some(s),
            Err(_) => None,
        },
    };

    let collector_port = match args.collector_port {
        Some(port) => Some(port),
        None => match env::var("COLLECTOR_PORT") {
            Ok(s) => Some(s.parse().unwrap()),
            Err(_) => Some(8081),
        },
    };
    let backend_port = match args.backend_port {
        Some(port) => Some(port),
        None => match env::var("BACKEND_PORT") {
            Ok(s) => Some(s.parse().unwrap()),
            Err(_) => None,
        },
    };

    let encryption_key = match args.encryption_key {
        Some(e) => Ok(hmac::Key::new(hmac::HMAC_SHA256, e.as_bytes())),
        None => match env::var("ENCRYPTION_KEY") {
            Ok(s) => Ok(hmac::Key::new(hmac::HMAC_SHA256, s.as_bytes())),
            Err(_) => {
                let rng = ring::rand::SystemRandom::new();
                hmac::Key::generate(hmac::HMAC_SHA256, &rng)
            }
        },
    };

    if let Ok(e) = encryption_key {
        let mut conf_write = METLO_CONFIG.write().await;
        conf_write.hmac_key = Some(e);
    } else {
        log::error!("Failed to generate hmac encryption key.")
    }

    let init_res =
        initialize_metlo(valid_host.0, api_key.unwrap(), collector_port, backend_port).await?;
    if !init_res.ok {
        let msg = init_res.msg.unwrap_or_default();
        log::error!("Failed to initialize Metlo:\n{}", msg);
        return Ok(());
    }
    log::info!("Initialized Metlo");

    tokio::task::spawn(async {
        let mut interval = time::interval(Duration::from_secs(300));
        loop {
            interval.tick().await;
            log::trace!("Pulling Metlo Config");
            let res = refresh_config().await;
            if let Err(e) = res {
                log::warn!("Error pulling metlo config: \n{}", e.to_string());
            }
            log::trace!("Done Pulling Metlo Config");
        }
    });

    tokio::task::spawn(async {
        let mut interval = time::interval(Duration::from_secs(1));
        loop {
            interval.tick().await;
            let res = send_batched_traces().await;
            if let Err(e) = res {
                log::debug!("Error sending batched traces: \n{}", e.to_string())
            }
        }
    });

    let grpc_mode = match args.enable_grpc {
        Some(enable) => enable,
        None => match env::var("ENABLE_GRPC") {
            Ok(e) => match e.trim().parse::<bool>() {
                Ok(parsed) => parsed,
                Err(_) => false,
            },
            Err(_) => false,
        },
    };

    if grpc_mode {
        if let Some(p) = port {
            server_port(&p).await?;
        } else {
            server(&listen_socket).await?;
        }
    } else {
        let interface_arg = match args.interface {
            Some(e) => Some(e),
            None => match env::var("INTERFACE") {
                Ok(s) => Some(s),
                Err(_) => None,
            },
        };
        let interface_opt = match Device::list() {
            Ok(interfaces) => {
                log::info!(
                    "Found Interfaces {:?}",
                    interfaces.iter().map(|f| &f.name).collect::<Vec<&String>>()
                );
                match interface_arg {
                    Some(i) => Some(i),
                    None => {
                        log::info!("Didn't find any passed arg or env param for interface. Trying to find one matching required specs");
                        let device = interfaces
                            .iter()
                            .find(|&i| i.name.starts_with("eth") || i.name.starts_with("ens"));
                        if let Some(d) = device {
                            log::info!("Found match on interface {} which matches expected pattern. Binding to it.", d.name);
                            Some(d.name.clone())
                        } else {
                            None
                        }
                    }
                }
            }
            Err(e) => {
                log::error!("Error finding interfaces {:?}", e);
                None
            }
        };

        if let Some(interface) = interface_opt {
            let interface_type = if interface.starts_with("eth") || interface.starts_with("ens") {
                InterfaceType::Ethernet
            } else if interface.starts_with("lo") {
                InterfaceType::Loopback
            } else {
                InterfaceType::Other
            };
            let mut cap = Capture::from_device(interface.as_str())
                .unwrap()
                .immediate_mode(true)
                .open()
                .unwrap();
            let host_str = valid_host.1.as_str();
            let mut last_check = Instant::now();
            loop {
                while let Ok(packet) = cap.next_packet() {
                    if last_check.elapsed() > Duration::from_secs(30) {
                        clean_map();
                        last_check = Instant::now();
                    }
                    process_packet(packet, &interface_type, host_str);
                }
            }
        } else {
            log::error!("Packet capture in live mode must provide interface.");
        }
    }

    Ok(())
}
