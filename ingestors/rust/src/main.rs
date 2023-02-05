use crate::metloingest::metlo_ingest_server::{MetloIngest, MetloIngestServer};
use clap::Parser;
use mappers::{map_ingest_api_trace, map_process_trace_res};
use process_trace::process_api_trace;
use std::path::Path;
use tokio::net::UnixListener;
use tokio_stream::wrappers::UnixListenerStream;
use tonic::{transport::Server, Code, Request, Response, Status};

mod mappers;
mod process_trace;
mod sensitive_data;
mod trace;
pub mod metloingest {
    tonic::include_proto!("metloingest");
}

#[derive(Default)]
pub struct MIngestServer {}

#[tonic::async_trait]
impl MetloIngest for MIngestServer {
    async fn process_trace(
        &self,
        request: Request<metloingest::ApiTrace>,
    ) -> Result<Response<metloingest::ProcessTraceRes>, Status> {
        let map_res = map_ingest_api_trace(request.into_inner());
        if let Some(mapped_api_trace) = map_res {
            let processed_trace = process_api_trace(&mapped_api_trace);
            return Ok(Response::new(map_process_trace_res(processed_trace)));
        } else {
            return Err(Status::new(Code::InvalidArgument, "Invalid API Trace"));
        };
    }
}

async fn server(listen_socket: &str) -> Result<(), Box<dyn std::error::Error>> {
    std::fs::create_dir_all(Path::new(listen_socket).parent().unwrap())
        .expect("Failed to create socket directory.");
    let s = MIngestServer::default();
    let uds = UnixListener::bind(listen_socket).expect("Failed to bind to unix socket.");
    let uds_stream = UnixListenerStream::new(uds);
    Server::builder()
        .add_service(MetloIngestServer::new(s))
        .serve_with_incoming(uds_stream)
        .await?;
    Ok(())
}

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
    server(&args.listen_socket).await
}
