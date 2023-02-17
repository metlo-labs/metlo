use clap::Parser;
use lazy_static::lazy_static;
use metlo_agent::{initialize_metlo, refresh_config, server};
use std::{collections::HashSet, env, time::Duration};
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
    env::set_var("RUST_LOG", log_level);
    env_logger::init();

    let metlo_host = match args.metlo_host {
        Some(host) => Some(host),
        None => match env::var("METLO_HOST") {
            Ok(s) => Some(s),
            Err(_) => None,
        },
    };
    if metlo_host.is_none() {
        println!(
            "No value passed for METLO_HOST, Set it via -m param or METLO_HOST in the environment"
        );
        return Ok(());
    }

    let api_key = match args.api_key {
        Some(key) => Some(key),
        None => match env::var("METLO_API_KEY") {
            Ok(s) => Some(s),
            Err(_) => None,
        },
    };
    if api_key.is_none() {
        println!(
            "No value passed for METLO_API_KEY. Set it via -a param or METLO_API_KEY in the environment"
        );
        return Ok(());
    }

    let listen_socket = match args.listen_socket {
        Some(socket) => Some(socket),
        None => match env::var("LISTEN_SOCKET") {
            Ok(s) => Some(s),
            Err(_) => None,
        },
    };
    if listen_socket.is_none() {
        println!("No value passed for LISTEN_SOCKET. Set it via -s param or LISTEN_SOCKET in the environment");
        return Ok(());
    }

    let collector_port = match args.collector_port {
        Some(port) => Some(port),
        None => match env::var("COLLECTOR_PORT") {
            Ok(s) => Some(s.parse().unwrap()),
            Err(_) => None,
        },
    };
    let backend_port = match args.backend_port {
        Some(port) => Some(port),
        None => match env::var("BACKEND_PORT") {
            Ok(s) => Some(s.parse().unwrap()),
            Err(_) => None,
        },
    };

    let init_res = initialize_metlo(
        metlo_host.unwrap(),
        api_key.unwrap(),
        collector_port,
        backend_port,
    )
    .await?;
    if !init_res.ok {
        let msg = init_res.msg.unwrap_or_default();
        println!("Failed to initialize Metlo:\n{}", msg);
        return Ok(());
    }
    println!("Initialized Metlo");

    tokio::task::spawn(async {
        let mut interval = time::interval(Duration::from_secs(60));
        loop {
            interval.tick().await;
            println!("Pulling Metlo Config");
            let res = refresh_config().await;
            if let Err(e) = res {
                println!("Error pulling metlo config: \n{}", e.to_string());
            }
            println!("Done Pulling Metlo Config");
        }
    });
    server(&listen_socket.unwrap()).await?;

    Ok(())
}
