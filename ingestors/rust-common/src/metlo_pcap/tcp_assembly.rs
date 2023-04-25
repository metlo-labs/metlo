use std::collections::HashMap;
use std::sync::Mutex;

use lazy_static::lazy_static;
use nom::{bytes, IResult};
use pcap::Packet;
use pktparse::ip::IPProtocol;
use pktparse::ipv4;
use pktparse::ipv6;
use pktparse::tcp::{parse_tcp_header, TcpHeader};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::net::{Ipv4Addr, Ipv6Addr};
use std::time::{Duration, Instant};

use super::http_assembly::run_payload;

const MAX_HTTP_SIZE: usize = 1024 * 10;

pub enum InterfaceType {
    Ethernet,
    Loopback,
    Other,
}

pub enum LoProtocolFamily {
    IPV4,
    Other(u32),
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
    pub body_content_len: Option<usize>,
    pub next_seq: u32,
    pub is_dead: bool,
    pub last_seen: Instant,
    pub source_addr: IpAddrContainer,
    pub source_port: u16,
    pub dest_addr: IpAddrContainer,
    pub dest_port: u16,
}

#[derive(Hash)]
pub struct MapKey {
    pub src_ip: IpAddrContainer,
    pub src_port: u16,
    pub dest_ip: IpAddrContainer,
    pub dest_port: u16,
}

pub struct MapPayload {
    pub buffer: Vec<u8>,
    pub body_buffer: Vec<u8>,
    pub last_seen: Instant,
}

lazy_static! {
    static ref CONNECTION_MAP: Mutex<HashMap<u64, TcpConnection>> = {
        let m = HashMap::new();
        Mutex::new(m)
    };
    pub static ref REQUEST_MAP: Mutex<HashMap<u64, MapPayload>> = {
        let m = HashMap::new();
        Mutex::new(m)
    };
}

#[derive(Debug, Clone, Copy)]
pub struct IpAddrContainer {
    pub ipv4_addr: Option<Ipv4Addr>,
    pub ipv6_addr: Option<Ipv6Addr>,
}

impl Hash for IpAddrContainer {
    fn hash<H: Hasher>(&self, state: &mut H) {
        if let Some(ipv4_inner) = self.ipv4_addr {
            ipv4_inner.hash(state);
        }
        if let Some(ipv6_inner) = self.ipv6_addr {
            ipv6_inner.hash(state);
        }
    }
}

impl IpAddrContainer {
    pub fn new_ipv4(ipv4_addr: Ipv4Addr) -> Self {
        IpAddrContainer {
            ipv4_addr: Some(ipv4_addr),
            ipv6_addr: None,
        }
    }

    pub fn new_ipv6(ipv6_addr: Ipv6Addr) -> Self {
        IpAddrContainer {
            ipv4_addr: None,
            ipv6_addr: Some(ipv6_addr),
        }
    }

    pub fn to_string(&self) -> String {
        if let Some(ipv4_inner) = self.ipv4_addr {
            ipv4_inner.to_string()
        } else if let Some(ipv6_inner) = self.ipv6_addr {
            ipv6_inner.to_string()
        } else {
            "".to_string()
        }
    }
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

pub fn calculate_hash<T: Hash>(t: &T) -> u64 {
    let mut s = DefaultHasher::new();
    t.hash(&mut s);
    s.finish()
}

pub fn reset_connection(conn: &mut TcpConnection, bytes_parsed: usize, remaining: usize) {
    conn.is_dead = false;
    conn.body_content_len = None;
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
        (None, Some(e)) => conn.buffer.get(&e).map(|f| &f.data),
        (_, _) => None,
    };
    if let Some(payload) = payload_opt {
        let payload_len = payload.len();
        if conn.payload_buffer_len + payload_len > MAX_HTTP_SIZE {
            log::trace!(
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

fn parse_tcp_data(
    src_ip: IpAddrContainer,
    dst_ip: IpAddrContainer,
    tcp_header: TcpHeader,
    data: &[u8],
    metlo_host: &str,
) {
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
    let mut conn_map = CONNECTION_MAP.lock().unwrap();

    let key = calculate_hash(&MapKey {
        src_ip: src_ip,
        src_port: tcp_header.source_port,
        dest_ip: dst_ip,
        dest_port: tcp_header.dest_port,
    });
    let val = conn_map.get_mut(&key);
    let mut finished = false;
    if let Some(v) = val {
        if v.is_dead && (tcp_header.flag_fin || tcp_header.flag_rst) {
            conn_map.remove(&key);
            return;
        }
        if curr_seq_no == v.next_seq {
            // run packet on this one
            analyze_data(Some(&data.to_vec()), None, v);
            run_payload(key, v, metlo_host);
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
                run_payload(key, v, metlo_host);
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
                        is_fin: tcp_header.flag_fin || tcp_header.flag_rst,
                    },
                );
            }
        }
        v.last_seen = Instant::now();
        run_payload(key, v, metlo_host);
        if finished {
            conn_map.remove(&key);
        }
    } else {
        let mut conn = TcpConnection {
            buffer: HashMap::new(),
            payload_buffer: vec![],
            payload_buffer_len: 0,
            body_content_len: None,
            next_seq: next_seq_no,
            last_seen: Instant::now(),
            is_dead: false,
            source_addr: src_ip,
            source_port: tcp_header.source_port,
            dest_addr: dst_ip,
            dest_port: tcp_header.dest_port,
        };

        analyze_data(Some(&data.to_vec()), None, &mut conn);
        run_payload(key, &mut conn, metlo_host);
        // insert into map
        conn_map.insert(key, conn);
    }
}

pub fn process_packet(packet: Packet, interface_type: &InterfaceType, metlo_host: &str) {
    match interface_type {
        InterfaceType::Ethernet => match pktparse::ethernet::parse_ethernet_frame(packet.data) {
            Ok((content, headers)) => match headers.ethertype {
                pktparse::ethernet::EtherType::IPv4 => match ipv4::parse_ipv4_header(content) {
                    Ok((content, ip_headers)) => {
                        if ip_headers.protocol == IPProtocol::TCP {
                            match parse_tcp_header(content) {
                                Ok((content, headers)) => parse_tcp_data(
                                    IpAddrContainer::new_ipv4(ip_headers.source_addr),
                                    IpAddrContainer::new_ipv4(ip_headers.dest_addr),
                                    headers,
                                    content,
                                    metlo_host,
                                ),
                                Err(_err) => {
                                    log::trace!("Invalid tcp contents")
                                }
                            }
                        }
                    }
                    Err(_err) => {
                        log::trace!("Invalid IPV4 header")
                    }
                },
                pktparse::ethernet::EtherType::IPv6 => match ipv6::parse_ipv6_header(content) {
                    Ok((content, ip_headers)) => {
                        if ip_headers.next_header == IPProtocol::TCP {
                            match parse_tcp_header(content) {
                                Ok((content, headers)) => parse_tcp_data(
                                    IpAddrContainer::new_ipv6(ip_headers.source_addr),
                                    IpAddrContainer::new_ipv6(ip_headers.dest_addr),
                                    headers,
                                    content,
                                    metlo_host,
                                ),
                                Err(_err) => {
                                    log::trace!("Invalid tcp contents")
                                }
                            }
                        }
                    }
                    Err(_err) => {
                        log::trace!("Invalid IPV4 header")
                    }
                },
                _ => log::trace!("Other EtherType"),
            },
            Err(_) => log::debug!("Error parsing ethernet frame"),
        },
        InterfaceType::Loopback => match parse_loopback_frame(packet.data) {
            Ok((content, loopback_frame)) => match loopback_frame.protocol_family {
                LoProtocolFamily::IPV4 => match ipv4::parse_ipv4_header(content) {
                    Ok((content, ip_headers)) => {
                        if ip_headers.protocol == IPProtocol::TCP {
                            match parse_tcp_header(content) {
                                Ok((content, headers)) => parse_tcp_data(
                                    IpAddrContainer::new_ipv4(ip_headers.source_addr),
                                    IpAddrContainer::new_ipv4(ip_headers.dest_addr),
                                    headers,
                                    content,
                                    metlo_host,
                                ),
                                Err(_err) => {
                                    log::trace!("Invalid tcp contents")
                                }
                            }
                        }
                    }
                    Err(_err) => {
                        log::trace!("Invalid IPV4 header")
                    }
                },
                LoProtocolFamily::Other(other_proto) => {
                    log::trace!("Invalid Loopback Type {:?}", other_proto)
                }
            },
            Err(_) => {
                log::debug!("Loopback parse error")
            }
        },
        InterfaceType::Other => (),
    }
}

pub fn clean_map() {
    let mut conn_map = CONNECTION_MAP.lock().unwrap();
    log::trace!("Before cleaning connection map {}", conn_map.len());
    conn_map.retain(|_k, v| v.last_seen.elapsed() <= Duration::from_secs(10));
    log::trace!("After cleaning connection map {}", conn_map.len());
    let mut request_map = REQUEST_MAP.lock().unwrap();
    log::trace!("Before cleaning request map {}", request_map.len());
    request_map.retain(|_k, v| v.last_seen.elapsed() <= Duration::from_secs(10));
    log::trace!("After cleaning request map {}", request_map.len());
}
