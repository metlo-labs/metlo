use crate::metlo_config::*;
use antidote::RwLock;
use lazy_static::lazy_static;

use crate::metloingest::metlo_ingest_server::{MetloIngest, MetloIngestServer};
use mappers::{map_ingest_api_trace, map_process_trace_res};
use process_trace::process_api_trace;
use std::path::Path;
use std::sync::Arc;
use tokio::net::UnixListener;
use tokio::sync::{Semaphore, TryAcquireError};
use tokio_stream::wrappers::UnixListenerStream;
use tonic::{transport::Server, Code, Request, Response, Status};
use trace::ProcessTraceRes;

mod mappers;
mod metlo_config;
mod process_trace;
mod sensitive_data;
mod trace;
pub mod metloingest {
    tonic::include_proto!("metloingest");
}

lazy_static! {
    pub static ref TASK_RUN_SEMAPHORE: std::sync::Arc<Semaphore> = Arc::new(Semaphore::new(100));
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
            match TASK_RUN_SEMAPHORE.try_acquire() {
                Ok(permit) => {
                    tokio::spawn(async move {
                        process_api_trace(&mapped_api_trace);
                        drop(permit);
                    });
                }
                Err(TryAcquireError::NoPermits) => {
                    println!("no permits avaiable")
                }
                Err(TryAcquireError::Closed) => {
                    println!("semaphore closed")
                }
            }
            return Ok(Response::new(map_process_trace_res(ProcessTraceRes {
                block: false,
                xss_detected: None,
                sqli_detected: None,
                sensitive_data_detected: None,
                data_types: None,
            })));
        } else {
            return Err(Status::new(Code::InvalidArgument, "Invalid API Trace"));
        };
    }
}

pub async fn server(listen_socket: &str) -> Result<(), Box<dyn std::error::Error>> {
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
