use clap::Parser;
use metlo_common_ingestor::{initialize_metlo, server};
use std::time::Duration;
use tokio::time;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Your Metlo Collector URL
    #[arg(short, long)]
    metlo_host: String,

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
    initialize_metlo(args.metlo_host, args.api_key);
    tokio::task::spawn(async {
        let mut interval = time::interval(Duration::from_secs(60));
        loop {
            interval.tick().await;
            println!("Pulling Metlo Config");
        }
    });
    server(&args.listen_socket).await
}
