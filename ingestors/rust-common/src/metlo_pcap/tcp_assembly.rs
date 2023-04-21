use std::cmp::min;
use std::collections::HashMap;
use std::sync::Mutex;

use httparse::Header;
use lazy_static::lazy_static;
use nom::{bytes, IResult};
use pcap::{Capture, Packet};
use pktparse::ip::IPProtocol;
use pktparse::ipv4::{self, IPv4Header};
use pktparse::tcp::{parse_tcp_header, TcpHeader};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::net::Ipv4Addr;
use std::time::{Duration, Instant};

const MAX_HTTP_SIZE: usize = 1024 * 100;
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

pub enum LoProtocolFamily {
    IPV4,
    Other(u32),
}

#[derive(Debug)]
pub enum PayloadType {
    REQUEST,
    RESPONSE,
}

pub struct LoopbackFrame {
    pub protocol_family: LoProtocolFamily,
}

#[derive(Debug)]
pub struct TcpPacket {
    pub data: Vec<u8>,
    pub is_fin: bool,
}

#[derive(Debug)]
pub struct TcpConnection {
    pub buffer: HashMap<u32, TcpPacket>,
    pub payload_buffer: Vec<u8>,
    pub payload_buffer_len: usize,
    pub next_seq: u32,
    pub is_dead: bool,
    pub last_seen: Instant,
    pub source_addr: Ipv4Addr,
    pub source_port: u16,
    pub dest_addr: Ipv4Addr,
    pub dest_port: u16,
}

#[derive(Hash)]
pub struct MapKey {
    src_ip: Ipv4Addr,
    src_port: u16,
    dest_ip: Ipv4Addr,
    dest_port: u16,
}

lazy_static! {
    static ref MAP: Mutex<HashMap<u64, TcpConnection>> = {
        let m = HashMap::new();
        Mutex::new(m)
    };
}

pub fn parse_protocol_family(input: &[u8]) -> IResult<&[u8], LoProtocolFamily> {
    let (input, proto_bytes) = bytes::streaming::take(4u8)(input)?;
    let mut proto_bytes_ls: [u8; 4] = [0; 4];
    proto_bytes_ls.copy_from_slice(proto_bytes);
    let protocol_family_uint: u32 = if proto_bytes[0] == 0 && proto_bytes[1] == 0 {
        u32::from_be_bytes(proto_bytes_ls)
    } else {
        u32::from_le_bytes(proto_bytes_ls)
    };

    let protocol_family = match protocol_family_uint {
        2 => LoProtocolFamily::IPV4,
        _ => LoProtocolFamily::Other(protocol_family_uint),
    };

    Ok((input, protocol_family))
}

pub fn parse_loopback_frame(input: &[u8]) -> IResult<&[u8], LoopbackFrame> {
    let (input, protocol_family) = parse_protocol_family(input)?;
    Ok((input, LoopbackFrame { protocol_family }))
}

fn calculate_hash<T: Hash>(t: &T) -> u64 {
    let mut s = DefaultHasher::new();
    t.hash(&mut s);
    s.finish()
}

fn get_payload_type(data: &Vec<u8>) -> Option<PayloadType> {
    if data.len() < 4 {
        None
    } else {
        let space_idx_opt = data.iter().position(|x| x == &SPACE);

        if let Some(space_idx) = space_idx_opt {
            if space_idx == 3 || space_idx == 4 {
                match data[0..4].try_into().unwrap() {
                    GET | POST | HEAD | PUT => Some(PayloadType::REQUEST),
                    _ => None,
                }
            } else if space_idx == 5 {
                match data[0..5].try_into().unwrap() {
                    TRACE | PATCH => Some(PayloadType::REQUEST),
                    _ => None,
                }
            } else if space_idx == 6 || space_idx == 7 {
                match data[0..7].try_into().unwrap() {
                    DELETE | CONNECT | OPTIONS => Some(PayloadType::REQUEST),
                    _ => None,
                }
            } else if data.len() >= 7 {
                match data[0..7].try_into().unwrap() {
                    RESP => Some(PayloadType::RESPONSE),
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

fn reset_connection(conn: &mut TcpConnection, bytes_parsed: usize, remaining: usize) {
    conn.is_dead = false;
    if remaining > 0 {
        conn.payload_buffer = conn.payload_buffer[bytes_parsed..conn.payload_buffer_len].to_vec();
        conn.payload_buffer_len = remaining;
    } else {
        conn.payload_buffer = vec![];
        conn.payload_buffer_len = 0;
    }
}

fn analyze_data(data: Option<&Vec<u8>>, seq_no: Option<u32>, conn: &mut TcpConnection) {
    if conn.is_dead {
        return;
    }
    let payload_opt = match (data, seq_no) {
        (Some(d), _) => Some(d),
        (None, Some(e)) => conn.buffer.get(&e).and_then(|f| Some(&f.data)),
        (_, _) => None,
    };
    if let Some(payload) = payload_opt {
        let payload_len = payload.len();
        if conn.payload_buffer_len + payload_len > MAX_HTTP_SIZE {
            println!(
                "Data size too large; Current Payload Buffer Size {}; Incoming Paylod Buffer Size {}",
                conn.payload_buffer_len, payload_len
            );
            conn.is_dead = true;
            conn.payload_buffer = vec![];
            conn.payload_buffer_len = 0;
            return;
        }
        conn.payload_buffer.extend(payload);
        conn.payload_buffer_len += payload_len;
    }
}

fn run_payload(conn: &mut TcpConnection) {
    let payload_type = get_payload_type(&conn.payload_buffer);
    if let Some(e) = payload_type {
        let mut req_headers = [httparse::EMPTY_HEADER; 64];
        let mut resp_headers = [httparse::EMPTY_HEADER; 64];
        let mut req = httparse::Request::new(&mut req_headers);
        let mut resp = httparse::Response::new(&mut resp_headers);
        let res = match e {
            PayloadType::REQUEST => req.parse(&conn.payload_buffer[0..conn.payload_buffer_len]),
            PayloadType::RESPONSE => resp.parse(&conn.payload_buffer[0..conn.payload_buffer_len]),
        };
        match res {
            Ok(status) if status.is_complete() => {
                let body_offset = status.unwrap();
                let mut bytes_parsed = body_offset;
                if req.method.is_some() {
                    // HTTP Request
                    let method = req.method;
                    let path = req.path;
                    let version = req.version;
                    let headers = req.headers;
                    let content_header = headers
                        .iter()
                        .find(|&e| e.name.to_lowercase() == "content-length");
                    let content_len: Option<usize> = match content_header {
                        Some(&Header { name: _, value }) => match String::from_utf8(value.to_vec())
                        {
                            Ok(val) => match val.parse::<usize>() {
                                Ok(len) => Some(len),
                                Err(_) => None,
                            },
                            Err(_) => None,
                        },
                        None => None,
                    };
                    let body = match content_len {
                        Some(len) => {
                            if conn.payload_buffer_len - body_offset < len {
                                return;
                            }
                            bytes_parsed = min(body_offset + len, conn.payload_buffer_len);
                            conn.payload_buffer[body_offset..bytes_parsed].to_vec()
                        }
                        None => vec![],
                    };

                    // DO something with request
                } else {
                    //HTTP Response
                    let status_code = resp.code;
                    let headers = resp.headers;
                    let content_header = headers
                        .iter()
                        .find(|&e| e.name.to_lowercase() == "content-length");
                    let content_len: Option<usize> = match content_header {
                        Some(&Header { name: _, value }) => match String::from_utf8(value.to_vec())
                        {
                            Ok(val) => match val.parse::<usize>() {
                                Ok(len) => Some(len),
                                Err(_) => None,
                            },
                            Err(_) => None,
                        },
                        None => None,
                    };

                    let body = match content_len {
                        Some(len) => {
                            if conn.payload_buffer_len - body_offset < len {
                                return;
                            }
                            bytes_parsed = min(body_offset + len, conn.payload_buffer_len);
                            conn.payload_buffer[body_offset..bytes_parsed].to_vec()
                        }
                        None => vec![],
                    };

                    // DO something with response
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

pub fn parse_tcp_data(ip_header: IPv4Header, tcp_header: TcpHeader, data: &[u8]) {
    let byte_len: u32 = data.len().try_into().unwrap();
    if byte_len == 0 && !tcp_header.flag_fin && !tcp_header.flag_rst && !tcp_header.flag_syn {
        return;
    }
    let curr_seq_no = tcp_header.sequence_no;
    let mut next_seq_no = if tcp_header.flag_syn {
        tcp_header
            .sequence_no
            .wrapping_add(byte_len)
            .wrapping_add(1)
    } else {
        tcp_header.sequence_no.wrapping_add(byte_len)
    };
    let mut map = MAP.lock().unwrap();

    let key = calculate_hash(&MapKey {
        src_ip: ip_header.source_addr,
        src_port: tcp_header.source_port,
        dest_ip: ip_header.dest_addr,
        dest_port: tcp_header.dest_port,
    });
    let val = map.get_mut(&key);
    let mut finished = false;
    if let Some(v) = val {
        if v.is_dead && (tcp_header.flag_fin || tcp_header.flag_rst) {
            map.remove(&key);
            return;
        }
        if curr_seq_no == v.next_seq {
            // run packet on this one
            analyze_data(Some(&data.to_vec()), None, v);
            run_payload(v);
            finished = tcp_header.flag_fin || tcp_header.flag_rst;
            // try to find next one in buffer
            for _i in 0..v.buffer.len() {
                let remove_seq_no = next_seq_no;
                if let Some(item) = v.buffer.get(&next_seq_no) {
                    // run packet on this data with same header stuff
                    finished = item.is_fin;
                    next_seq_no = next_seq_no.wrapping_add(item.data.len().try_into().unwrap());
                } else {
                    break;
                }
                analyze_data(None, Some(remove_seq_no), v);
                run_payload(v);
                v.buffer.remove(&remove_seq_no);
            }
            v.next_seq = next_seq_no;
        } else if tcp_header.flag_syn {
            // run packet
            reset_connection(v, 0, 0);
            analyze_data(Some(&data.to_vec()), None, v);
            v.next_seq = next_seq_no;
        } else if !v.is_dead {
            if v.buffer.len() > 100 {
                v.buffer = HashMap::new();
                v.is_dead = true;
            } else {
                v.buffer.insert(
                    curr_seq_no,
                    TcpPacket {
                        data: data.to_vec(),
                        is_fin: finished,
                    },
                );
            }
        }
        v.last_seen = Instant::now();
        run_payload(v);
        if finished {
            map.remove(&key);
        }
    } else {
        let mut conn = TcpConnection {
            buffer: HashMap::new(),
            payload_buffer: vec![],
            payload_buffer_len: 0,
            next_seq: next_seq_no,
            last_seen: Instant::now(),
            is_dead: false,
            source_addr: ip_header.source_addr,
            source_port: tcp_header.source_port,
            dest_addr: ip_header.dest_addr,
            dest_port: tcp_header.dest_port,
        };

        analyze_data(Some(&data.to_vec()), None, &mut conn);
        run_payload(&mut conn);
        // insert into map
        map.insert(key, conn);
    }
}

fn process_packet(packet: Packet, loopback: bool) {
    // println!("{:?}", packet.data);
    // match ethernet::parse_ethernet_frame(packet.data) {
    //     Ok((content, headers)) => match headers.ethertype {
    //         EtherType::IPv4 => {
    //             println!("IPV4 {:?}", headers)
    //         }
    //         EtherType::IPv6 => {
    //             println!("IPV6 {:?}", headers)
    //         }
    //         _ => {}
    //     },
    //     Err(_) => {
    //         println!("link parse error")
    //     }
    // }
    match parse_loopback_frame(packet.data) {
        Ok((content, loopback_frame)) => match loopback_frame.protocol_family {
            LoProtocolFamily::IPV4 => match ipv4::parse_ipv4_header(content) {
                Ok((content, ip_headers)) => match ip_headers.protocol {
                    IPProtocol::TCP => match parse_tcp_header(content) {
                        Ok((content, headers)) => parse_tcp_data(ip_headers, headers, content),
                        Err(_err) => {
                            println!("Invalid tcp contents")
                        }
                    },
                    _ => {}
                },
                Err(_err) => {
                    println!("Invalid IPV4 header")
                }
            },
            LoProtocolFamily::Other(other_proto) => {
                println!("Invalid Loopback Type {:?}", other_proto)
            }
        },
        Err(_) => {
            println!("lo parse error")
        }
    }
}

fn clean_map() {
    let mut map = MAP.lock().unwrap();
    println!("before cleaning {}", map.len());
    map.retain(|_k, v| v.last_seen.elapsed() <= Duration::from_secs(10));
    println!("after cleaning {}", map.len());
}

fn main() {
    let mut total_time: u128 = 0;
    let mut counter = 0;
    let mut cap = Capture::from_device("lo0")
        .unwrap()
        .immediate_mode(true)
        .open()
        .unwrap();
    let mut last_check = Instant::now();
    while let Ok(packet) = cap.next_packet() {
        if last_check.elapsed() > Duration::from_secs(30) {
            clean_map();
            last_check = Instant::now();
        }
        let start_time = std::time::Instant::now();
        process_packet(packet, true);
        total_time += start_time.elapsed().as_nanos();
        counter += 1;
        if counter % 100000 == 0 {
            println!("avg time {:?}", total_time / counter);
        }
    }
}
