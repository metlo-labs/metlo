use crate::metlo_config::*;
use lazy_static::lazy_static;
use open_api::get_split_path;
use send_trace::send_buffer_items;
use trace::{ApiTrace, ProcessTraceRes};

use crate::metloingest::metlo_ingest_server::{MetloIngest, MetloIngestServer};
use mappers::{map_ingest_api_trace, map_process_trace_res};
use process_trace::{get_partial_trace_item, process_api_trace};
use std::path::Path;
use std::sync::Arc;
use tokio::net::UnixListener;
use tokio::sync::{RwLock, Semaphore, TryAcquireError};
use tokio_stream::wrappers::{TcpListenerStream, UnixListenerStream};
use tonic::{transport::Server, Code, Request, Response, Status};

mod mappers;
mod metlo_config;
mod metlo_pcap;
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
        encryption_public_key: None,
        authentication_config: vec![],
        hmac_key: None,
        host_map: vec![],
        host_block_list: vec![],
        path_block_list: vec![],
    });
    pub static ref REQUEST_BUFFER: RwLock<RequestBuffer> = RwLock::new(RequestBuffer {
        partial_analysis: vec![],
        full_analysis: vec![]
    });
}

pub struct InitializeMetloResp {
    pub ok: bool,
    pub msg: Option<String>,
}

#[derive(Debug, Clone)]
pub struct TraceInfo {
    pub openapi_spec_name: Option<String>,
    pub full_trace_capture_enabled: bool,
    pub is_graph_ql: bool,
    pub endpoint_path: String,
    pub current_host: String,
    pub block: bool,
    pub authentication: Option<Authentication>,
}

#[derive(Debug, Clone)]
pub struct BufferItem {
    pub trace: ApiTrace,
    pub processed_trace: Option<ProcessTraceRes>,
    pub trace_info: TraceInfo,
    pub analysis_type: String,
    pub graphql_paths: Option<Vec<String>>,
}

#[derive(Debug, Clone)]
pub struct RequestBuffer {
    pub partial_analysis: Vec<BufferItem>,
    pub full_analysis: Vec<BufferItem>,
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

fn is_endpoint_match(trace_tokens: &Vec<&str>, endpoint_path: String) -> bool {
    let endpoint_tokens = get_split_path(&endpoint_path);
    if trace_tokens.len() != endpoint_tokens.len() {
        return false;
    }

    for (i, endpoint_token) in endpoint_tokens.into_iter().enumerate() {
        let trace_token = trace_tokens[i];
        if endpoint_token != trace_token
            && (!endpoint_token.starts_with('{') && !endpoint_token.ends_with('}'))
        {
            return false;
        }
    }
    true
}

fn get_trace_info(trace: &ApiTrace) -> TraceInfo {
    let mut openapi_spec_name: Option<String> = None;
    let mut full_trace_capture_enabled: bool = false;
    let mut is_graph_ql: bool = trace.request.url.path.ends_with("/graphql");
    let mut endpoint_path: String = trace.request.url.path.clone();
    let mut current_host: String = trace.request.url.host.clone();
    let mut block: bool = false;
    let mut authentication: Option<Authentication> = None;
    let split_path: Vec<&str> = get_split_path(&trace.request.url.path);
    let conf_read = METLO_CONFIG.try_read();
    if let Ok(ref conf) = conf_read {
        if let Some(e) = conf
            .host_map
            .iter()
            .find(|&h| h.pattern.is_match(&trace.request.url.host))
        {
            current_host = e.host.clone();
        }
        if !conf.host_block_list.is_empty() {
            for host in conf.host_block_list.iter() {
                if host.is_match(&current_host) {
                    block = true;
                    break;
                }
            }
        }
        if !block && !conf.path_block_list.is_empty() {
            for item in conf.path_block_list.iter() {
                if item.host.is_match(&current_host) {
                    for path in item.paths.iter() {
                        if path.is_match(&trace.request.url.path) {
                            block = true;
                            break;
                        }
                    }
                }
            }
        }

        if let (false, Some(endpoints)) = (block, &conf.endpoints) {
            let key = format!("{}-{}", current_host, trace.request.method.to_lowercase());
            if let Some(matched_endpoints) = endpoints.get(&key) {
                for endpoint in matched_endpoints.iter() {
                    if is_endpoint_match(&split_path, endpoint.path.clone()) {
                        openapi_spec_name = endpoint.openapi_spec_name.to_owned();
                        full_trace_capture_enabled = endpoint.full_trace_capture_enabled;
                        endpoint_path = endpoint.path.clone();
                        is_graph_ql = endpoint.is_graph_ql;
                        break;
                    }
                }
            }
            authentication = conf
                .authentication_config
                .iter()
                .find(|&e| e.host == current_host)
                .cloned();
        }
    }
    drop(conf_read);

    TraceInfo {
        openapi_spec_name,
        full_trace_capture_enabled,
        is_graph_ql,
        endpoint_path,
        current_host,
        block,
        authentication,
    }
}

fn get_analysis_type() -> Option<&'static str> {
    let buffer_read = REQUEST_BUFFER.try_read();
    let res = if let Ok(ref buf) = buffer_read {
        if buf.full_analysis.len() < 5 {
            Some("full")
        } else if buf.partial_analysis.len() < 100 {
            Some("partial")
        } else {
            None
        }
    } else {
        None
    };
    drop(buffer_read);
    res
}

#[derive(Default)]
pub struct MIngestServer {}

#[tonic::async_trait]
impl MetloIngest for MIngestServer {
    async fn process_trace_async(
        &self,
        request: Request<tonic::Streaming<metloingest::ApiTrace>>,
    ) -> Result<Response<metloingest::ProcessTraceAsyncRes>, Status> {
        let mut stream = request.into_inner();
        while let Some(req) = stream.message().await? {
            let map_req = map_ingest_api_trace(req);
            if let Some(mapped_api_trace) = map_req {
                match TASK_RUN_SEMAPHORE.try_acquire() {
                    Ok(permit) => {
                        tokio::spawn(async move {
                            let analysis_type = get_analysis_type();
                            if let Some(analysis_type_unwrap) = analysis_type {
                                let trace_info = get_trace_info(&mapped_api_trace);
                                if !trace_info.block {
                                    let buf_item = match analysis_type_unwrap {
                                        "partial" => Some(get_partial_trace_item(
                                            mapped_api_trace,
                                            trace_info,
                                        )),
                                        "full" => {
                                            let res =
                                                process_api_trace(&mapped_api_trace, &trace_info);
                                            Some(BufferItem {
                                                trace: mapped_api_trace,
                                                processed_trace: Some(res),
                                                trace_info,
                                                analysis_type: "full".to_string(),
                                                graphql_paths: None,
                                            })
                                        }
                                        _ => None,
                                    };
                                    let mut req_buffer_write = REQUEST_BUFFER.try_write();
                                    if let Ok(ref mut buf) = req_buffer_write {
                                        match (analysis_type_unwrap, buf_item) {
                                            ("partial", Some(item)) => {
                                                buf.partial_analysis.push(item);
                                            }
                                            ("full", Some(item)) => {
                                                buf.full_analysis.push(item);
                                            }
                                            _ => (),
                                        }
                                    }
                                    drop(req_buffer_write);
                                }
                            }
                            drop(permit);
                        });
                    }
                    Err(TryAcquireError::NoPermits) => {
                        log::debug!("no permits avaiable");
                    }
                    Err(TryAcquireError::Closed) => {
                        log::debug!("semaphore closed");
                    }
                }
            }
        }
        return Ok(Response::new(metloingest::ProcessTraceAsyncRes {
            ok: true,
        }));
    }
    async fn process_trace(
        &self,
        request: Request<metloingest::ApiTrace>,
    ) -> Result<Response<metloingest::ProcessTraceRes>, Status> {
        let map_req = map_ingest_api_trace(request.into_inner());
        if let Some(mapped_api_trace) = map_req {
            match TASK_RUN_SEMAPHORE.try_acquire() {
                Ok(permit) => {
                    let trace_info = get_trace_info(&mapped_api_trace);
                    let res = process_api_trace(&mapped_api_trace, &trace_info);
                    drop(permit);
                    return Ok(Response::new(map_process_trace_res(res)));
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
    listener.set_nonblocking(true)?;
    let tokio_listener = tokio::net::TcpListener::from_std(listener)?;

    let s = MIngestServer::default();

    Server::builder()
        .add_service(MetloIngestServer::new(s))
        .serve_with_incoming(TcpListenerStream::new(tokio_listener))
        .await?;

    Ok(())
}

pub async fn refresh_config() -> Result<(), Box<dyn std::error::Error>> {
    pull_metlo_config().await
}

pub async fn send_batched_traces() -> Result<(), Box<dyn std::error::Error>> {
    send_buffer_items().await
}
