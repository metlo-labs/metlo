use clap::Parser;
use metlo_common_ingestor::{initialize_metlo, refresh_config, server};
use std::time::Duration;
use tokio::time;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Your Metlo URL
    #[arg(short, long)]
    metlo_host: String,

    /// Your Metlo Collector Port
    #[arg(short, long)]
    collector_port: Option<u16>,

    /// Your Metlo Backend Port
    #[arg(short, long)]
    backend_port: Option<u16>,

    /// Your Metlo API Key
    #[arg(short, long)]
    api_key: String,

    /// Socket to listen to
    #[arg(short, long)]
    listen_socket: String,
}

#[tokio::main(flavor = "multi_thread")]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();

    let init_res = initialize_metlo(
        args.metlo_host,
        args.api_key,
        args.collector_port,
        args.backend_port,
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
    server(&args.listen_socket).await?;

    Ok(())
}
