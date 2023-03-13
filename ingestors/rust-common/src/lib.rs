use crate::metlo_config::*;
use lazy_static::lazy_static;
use send_trace::send_api_trace;

use crate::metloingest::metlo_ingest_server::{MetloIngest, MetloIngestServer};
use mappers::{map_ingest_api_trace, map_process_trace_res};
use process_trace::process_api_trace;
use std::path::Path;
use std::sync::Arc;
use tokio::net::UnixListener;
use tokio::sync::{RwLock, Semaphore, TryAcquireError};
use tokio_stream::wrappers::{TcpListenerStream, UnixListenerStream};
use tonic::{transport::Server, Code, Request, Response, Status};

mod mappers;
mod metlo_config;
mod open_api;
mod process_graphql;
mod process_trace;
mod send_trace;
mod sensitive_data;
mod trace;
pub mod metloingest {
    tonic::include_proto!("metloingest");
}

lazy_static! {
    pub static ref TASK_RUN_SEMAPHORE: std::sync::Arc<Semaphore> = Arc::new(Semaphore::new(100));
    pub static ref METLO_CONFIG: RwLock<GlobalConfig> = RwLock::new(GlobalConfig {
        creds: None,
        collector_url: None,
        backend_url: None,
        metlo_config: None,
        sensitive_data: None,
        endpoints: None,
        specs: None,
        global_full_trace_capture: false,
    });
}

pub struct InitializeMetloResp {
    pub ok: bool,
    pub msg: Option<String>,
}

pub async fn initialize_metlo(
    metlo_host: String,
    api_key: String,
    collector_port: Option<u16>,
    backend_port: Option<u16>,
) -> Result<InitializeMetloResp, Box<dyn std::error::Error>> {
    let backend_url = {
        match backend_port {
            Some(p) => format!("{}:{}", metlo_host.clone(), p),
            None => metlo_host.clone(),
        }
    };
    let collector_url = {
        match collector_port {
            Some(p) => format!("{}:{}", metlo_host.clone(), p),
            None => metlo_host.clone(),
        }
    };
    let backend_validation_endpoint = format!("{}/api/v1", backend_url);
    let backend_valid =
        validate_connection(backend_validation_endpoint.as_str(), api_key.as_str()).await;
    if !backend_valid.ok {
        return Ok(InitializeMetloResp {
            ok: false,
            msg: Some(format!(
                "Invalid Backend URL: \"{}\" {}",
                backend_url,
                backend_valid.msg.unwrap_or_default()
            )),
        });
    }

    let collector_validation_endpoint = format!("{}/api/v1/verify", collector_url);
    let collector_valid =
        validate_connection(collector_validation_endpoint.as_str(), api_key.as_str()).await;
    if !collector_valid.ok {
        return Ok(InitializeMetloResp {
            ok: false,
            msg: Some(format!(
                "Invalid Collector URL: \"{}\" {}",
                collector_url,
                collector_valid.msg.unwrap_or_default()
            )),
        });
    }

    let mut conf_write = METLO_CONFIG.write().await;
    conf_write.creds = Some(MetloCreds {
        metlo_host,
        api_key,
        backend_port,
        collector_port,
    });
    conf_write.backend_url = Some(backend_url);
    conf_write.collector_url = Some(collector_url);

    Ok(InitializeMetloResp {
        ok: true,
        msg: None,
    })
}

#[derive(Default)]
pub struct MIngestServer {}

#[tonic::async_trait]
impl MetloIngest for MIngestServer {
    async fn process_trace_async(
        &self,
        request: Request<metloingest::ApiTrace>,
    ) -> Result<Response<metloingest::ProcessTraceAsyncRes>, Status> {
        let map_req = map_ingest_api_trace(request.into_inner());
        if let Some(mapped_api_trace) = map_req {
            match TASK_RUN_SEMAPHORE.try_acquire() {
                Ok(permit) => {
                    tokio::spawn(async move {
                        let res = process_api_trace(&mapped_api_trace);
                        send_api_trace(mapped_api_trace, res).await;
                        drop(permit);
                    });
                }
                Err(TryAcquireError::NoPermits) => {
                    log::debug!("no permits avaiable");
                    return Err(Status::new(Code::InvalidArgument, "Invalid API Trace"));
                }
                Err(TryAcquireError::Closed) => {
                    log::debug!("semaphore closed");
                    return Err(Status::new(Code::InvalidArgument, "Invalid API Trace"));
                }
            }
            return Ok(Response::new(metloingest::ProcessTraceAsyncRes {
                ok: true,
            }));
        } else {
            return Err(Status::new(Code::InvalidArgument, "Invalid API Trace"));
        };
    }
    async fn process_trace(
        &self,
        request: Request<metloingest::ApiTrace>,
    ) -> Result<Response<metloingest::ProcessTraceRes>, Status> {
        let map_req = map_ingest_api_trace(request.into_inner());
        if let Some(mapped_api_trace) = map_req {
            match TASK_RUN_SEMAPHORE.try_acquire() {
                Ok(permit) => {
                    let res = process_api_trace(&mapped_api_trace);
                    drop(permit);
                    return Ok(Response::new(map_process_trace_res(res.0)));
                }
                Err(TryAcquireError::NoPermits) => {
                    log::debug!("no permits avaiable");
                    return Err(Status::new(Code::InvalidArgument, "Invalid API Trace"));
                }
                Err(TryAcquireError::Closed) => {
                    log::debug!("semaphore closed");
                    return Err(Status::new(Code::InvalidArgument, "Invalid API Trace"));
                }
            }
        } else {
            return Err(Status::new(Code::InvalidArgument, "Invalid API Trace"));
        };
    }
}

pub async fn server(listen_socket: &str) -> Result<(), Box<dyn std::error::Error>> {
    let path = Path::new(listen_socket);
    if std::fs::metadata(path).is_ok() {
        std::fs::remove_file(path)?;
    }

    let s = MIngestServer::default();
    let uds = UnixListener::bind(listen_socket)?;
    let uds_stream = UnixListenerStream::new(uds);

    Server::builder()
        .add_service(MetloIngestServer::new(s))
        .serve_with_incoming(uds_stream)
        .await?;

    Ok(())
}

pub async fn server_port(port: &str) -> Result<(), Box<dyn std::error::Error>> {
    let addr = format!("0.0.0.0:{}", port);
    let listener = std::net::TcpListener::bind(addr)?;
    let listener = tokio::net::TcpListener::from_std(listener)?;

    let s = MIngestServer::default();

    Server::builder()
        .add_service(MetloIngestServer::new(s))
        .serve_with_incoming(TcpListenerStream::new(listener))
        .await?;

    Ok(())
}

pub async fn refresh_config() -> Result<(), Box<dyn std::error::Error>> {
    pull_metlo_config().await
}
