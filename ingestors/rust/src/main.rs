use clap::Parser;
use metlo_ingestor::start;

mod trace;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Your Metlo Collector URL
    #[arg(short, long)]
    metlo_host: String,

    /// Your Metlo API Key
    #[arg(short, long)]
    api_key: String,
}

fn main() {
    let args = Args::parse();
    start(args.metlo_host, args.api_key)
}
