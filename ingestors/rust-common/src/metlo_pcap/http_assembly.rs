use std::{cmp::min, net::Ipv4Addr};

use httparse::Header;

use std::time::Instant;

use crate::{
    process_trace,
    trace::{ApiMeta, ApiRequest, ApiResponse, ApiTrace, ApiUrl, KeyVal},
};

use super::tcp_assembly::{
    calculate_hash, reset_connection, MapKey, MapPayload, TcpConnection, REQUEST_MAP,
};

#[derive(Debug)]
pub enum PayloadType {
    Request,
    Response,
}

const SPACE: u8 = b' ';
const GET: [u8; 4] = *b"GET ";
const POST: [u8; 4] = *b"POST";
const HEAD: [u8; 4] = *b"HEAD";
const PUT: [u8; 4] = *b"PUT ";
const TRACE: [u8; 5] = *b"TRACE";
const PATCH: [u8; 5] = *b"PATCH";
const DELETE: [u8; 7] = *b"DELETE ";
const CONNECT: [u8; 7] = *b"CONNECT";
const OPTIONS: [u8; 7] = *b"OPTIONS";
const RESP: [u8; 7] = *b"HTTP/1.";

fn get_payload_type(data: &Vec<u8>) -> Option<PayloadType> {
    if data.len() < 4 {
        None
    } else {
        let space_idx_opt = data.iter().position(|x| x == &SPACE);

        if let Some(space_idx) = space_idx_opt {
            if space_idx == 3 || space_idx == 4 {
                match data[0..4].try_into().unwrap() {
                    GET | POST | HEAD | PUT => Some(PayloadType::Request),
                    _ => None,
                }
            } else if space_idx == 5 {
                match data[0..5].try_into().unwrap() {
                    TRACE | PATCH => Some(PayloadType::Request),
                    _ => None,
                }
            } else if space_idx == 6 || space_idx == 7 {
                match data[0..7].try_into().unwrap() {
                    DELETE | CONNECT | OPTIONS => Some(PayloadType::Request),
                    _ => None,
                }
            } else if data.len() >= 7 {
                match data[0..7].try_into().unwrap() {
                    RESP => Some(PayloadType::Response),
                    _ => None,
                }
            } else {
                None
            }
        } else {
            None
        }
    }
}

fn generate_api_trace(
    request: httparse::Request,
    response: httparse::Response,
    req_body: &[u8],
    resp_body: &[u8],
    source_addr: Ipv4Addr,
    source_port: u16,
    dest_addr: Ipv4Addr,
    dest_port: u16,
) -> Option<ApiTrace> {
    if let (Some(method), Some(path), Some(code)) = (request.method, request.path, response.code) {
        let mut host = "".to_owned();
        let req_headers = request
            .headers
            .iter()
            .map(|e| {
                let val = String::from_utf8(e.value.to_vec()).unwrap_or_default();
                if e.name == "Host" || e.name == "host" {
                    host = val.clone();
                }
                KeyVal {
                    name: e.name.to_owned(),
                    value: val,
                }
            })
            .collect();

        let split_path = path.split_once('?');
        let url_info: (&str, Vec<KeyVal>) = match split_path {
            Some((path_str, url_encoded_str)) => (
                path_str,
                url::form_urlencoded::parse(url_encoded_str.as_bytes())
                    .map(|e| KeyVal {
                        name: e.0.to_string(),
                        value: e.1.to_string(),
                    })
                    .collect(),
            ),
            _ => (path, vec![]),
        };

        log::trace!(
            "Matched Request and Response;\nRequest: Method {}; Path {}; Version: {:?}; Headers: {}; Body: {};\nResponse Status {}; Headers {}; Body: {}",
            method,
            url_info.0,
            request.version,
            request.headers.len(),
            req_body.len(),
            code,
            response.headers.len(),
            resp_body.len()
        );

        Some(ApiTrace {
            request: ApiRequest {
                method: method.to_string(),
                url: ApiUrl {
                    host,
                    path: url_info.0.to_string(),
                    parameters: url_info.1,
                },
                headers: req_headers,
                body: String::from_utf8(req_body.to_vec()).unwrap_or_default(),
            },
            response: Some(ApiResponse {
                status: code,
                headers: response
                    .headers
                    .iter()
                    .map(|e| KeyVal {
                        name: e.name.to_owned(),
                        value: String::from_utf8(e.value.to_vec()).unwrap_or_default(),
                    })
                    .collect(),
                body: String::from_utf8(resp_body.to_vec()).unwrap_or_default(),
            }),
            meta: Some(ApiMeta {
                environment: String::from("production"),
                incoming: true,
                source: source_addr.to_string(),
                source_port,
                destination: dest_addr.to_string(),
                destination_port: dest_port,
                original_source: None,
            }),
        })
    } else {
        None
    }
}

fn process_trace_from_request(
    request: httparse::Request,
    request_body: &[u8],
    resp_buffer: &[u8],
    resp_body_buffer: &[u8],
    source_addr: Ipv4Addr,
    source_port: u16,
    dest_addr: Ipv4Addr,
    dest_port: u16,
) {
    let mut resp_headers = [httparse::EMPTY_HEADER; 64];
    let mut resp = httparse::Response::new(&mut resp_headers);
    let res = resp.parse(resp_buffer);
    match res {
        Ok(status) if status.is_complete() => {
            if let Some(trace) = generate_api_trace(
                request,
                resp,
                request_body,
                resp_body_buffer,
                source_addr,
                source_port,
                dest_addr,
                dest_port,
            ) {
                process_trace(trace);
            }
        }
        // Couldn't parse response
        _ => (),
    }
}

fn process_trace_from_response(
    response: httparse::Response,
    response_body: &[u8],
    req_buffer: &[u8],
    req_body_buffer: &[u8],
    source_addr: Ipv4Addr,
    source_port: u16,
    dest_addr: Ipv4Addr,
    dest_port: u16,
) {
    let mut req_headers = [httparse::EMPTY_HEADER; 64];
    let mut req = httparse::Request::new(&mut req_headers);
    let res = req.parse(req_buffer);
    match res {
        Ok(status) if status.is_complete() => {
            if let Some(trace) = generate_api_trace(
                req,
                response,
                req_body_buffer,
                response_body,
                dest_addr,
                dest_port,
                source_addr,
                source_port,
            ) {
                process_trace(trace);
            }
        }
        // Couldn't parse request
        _ => (),
    }
}

pub fn run_payload(key_hash: u64, conn: &mut TcpConnection) {
    let payload_type = get_payload_type(&conn.payload_buffer);
    if let Some(e) = payload_type {
        let mut req_headers = [httparse::EMPTY_HEADER; 64];
        let mut resp_headers = [httparse::EMPTY_HEADER; 64];
        let mut req = httparse::Request::new(&mut req_headers);
        let mut resp = httparse::Response::new(&mut resp_headers);
        let res = match e {
            PayloadType::Request => req.parse(&conn.payload_buffer[0..conn.payload_buffer_len]),
            PayloadType::Response => resp.parse(&conn.payload_buffer[0..conn.payload_buffer_len]),
        };
        match res {
            Ok(status) if status.is_complete() => {
                let body_offset = status.unwrap();
                let mut bytes_parsed = body_offset;
                if req.method.is_some() {
                    // HTTP Request
                    if conn.body_content_len.is_none() {
                        let content_header = req
                            .headers
                            .iter()
                            .find(|&e| e.name.to_lowercase() == "content-length");
                        conn.body_content_len = match content_header {
                            Some(&Header { name: _, value }) => {
                                match String::from_utf8(value.to_vec()) {
                                    Ok(val) => match val.parse::<usize>() {
                                        Ok(len) => Some(len),
                                        Err(_) => None,
                                    },
                                    Err(_) => None,
                                }
                            }
                            None => None,
                        };
                    }

                    let body = match conn.body_content_len {
                        Some(len) => {
                            if conn.payload_buffer_len - body_offset < len {
                                return;
                            }
                            bytes_parsed = min(body_offset + len, conn.payload_buffer_len);
                            &conn.payload_buffer[body_offset..bytes_parsed]
                        }
                        None => [].as_slice(),
                    };

                    let mut req_map = REQUEST_MAP.lock().unwrap();
                    let resp_key_hash = calculate_hash(&MapKey {
                        src_ip: conn.dest_addr,
                        src_port: conn.dest_port,
                        dest_ip: conn.source_addr,
                        dest_port: conn.source_port,
                    });
                    if let Some(resp_entry) = req_map.get(&resp_key_hash) {
                        process_trace_from_request(
                            req,
                            body,
                            &resp_entry.buffer,
                            &resp_entry.body_buffer,
                            conn.source_addr,
                            conn.source_port,
                            conn.dest_addr,
                            conn.dest_port,
                        );
                        req_map.remove(&resp_key_hash);
                        req_map.remove(&key_hash);
                    } else {
                        req_map.insert(
                            key_hash,
                            MapPayload {
                                buffer: conn.payload_buffer[0..body_offset].to_vec(),
                                body_buffer: body.to_vec(),
                                last_seen: Instant::now(),
                            },
                        );
                    }
                } else {
                    //HTTP Response
                    if conn.body_content_len.is_none() {
                        let content_header = resp
                            .headers
                            .iter()
                            .find(|&e| e.name.to_lowercase() == "content-length");
                        conn.body_content_len = match content_header {
                            Some(&Header { name: _, value }) => {
                                match String::from_utf8(value.to_vec()) {
                                    Ok(val) => match val.parse::<usize>() {
                                        Ok(len) => Some(len),
                                        Err(_) => None,
                                    },
                                    Err(_) => None,
                                }
                            }
                            None => None,
                        };
                    }

                    let body = match conn.body_content_len {
                        Some(len) => {
                            if conn.payload_buffer_len - body_offset < len {
                                return;
                            }
                            bytes_parsed = min(body_offset + len, conn.payload_buffer_len);
                            &conn.payload_buffer[body_offset..bytes_parsed]
                        }
                        None => [].as_slice(),
                    };

                    let mut req_map = REQUEST_MAP.lock().unwrap();
                    let req_key_hash = calculate_hash(&MapKey {
                        src_ip: conn.dest_addr,
                        src_port: conn.dest_port,
                        dest_ip: conn.source_addr,
                        dest_port: conn.source_port,
                    });
                    if let Some(req_entry) = req_map.get(&req_key_hash) {
                        process_trace_from_response(
                            resp,
                            body,
                            &req_entry.buffer,
                            &req_entry.body_buffer,
                            conn.source_addr,
                            conn.source_port,
                            conn.dest_addr,
                            conn.dest_port,
                        );
                        req_map.remove(&req_key_hash);
                        req_map.remove(&key_hash);
                    } else {
                        req_map.insert(
                            key_hash,
                            MapPayload {
                                buffer: conn.payload_buffer[0..body_offset].to_vec(),
                                body_buffer: body.to_vec(),
                                last_seen: Instant::now(),
                            },
                        );
                    }
                }
                let remaining = conn.payload_buffer_len - bytes_parsed;
                reset_connection(conn, bytes_parsed, remaining);
            }
            Ok(status) if status.is_partial() => (),
            Ok(_) => reset_connection(conn, 0, 0),
            Err(_) => reset_connection(conn, 0, 0),
        }
    }
}
