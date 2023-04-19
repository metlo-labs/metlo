use std::collections::{BinaryHeap, HashMap};
use std::sync::Mutex;

use lazy_static::lazy_static;
use nom::{bytes, IResult};
use pcap::{Capture, Packet};
use pktparse::ethernet::{self, EtherType};
use pktparse::ip::IPProtocol;
use pktparse::ipv4::{self, IPv4Header};
use pktparse::tcp::{parse_tcp_header, TcpHeader};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::net::Ipv4Addr;
use std::time::{Duration, Instant};

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
    pub next_seq: u32,
    pub is_dead: bool,
    pub last_seen: Instant,
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

pub fn run_tcp_packet(
    headers: TcpHeader,
    src_ip: &str,
    dst_ip: &str,
    src_port: u16,
    dst_port: u16,
    data: &[u8],
) {
}

fn calculate_hash<T: Hash>(t: &T) -> u64 {
    let mut s = DefaultHasher::new();
    t.hash(&mut s);
    s.finish()
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
            // run packet on sequential packet

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

                v.buffer.remove(&remove_seq_no);
            }
            v.next_seq = next_seq_no;
        } else if tcp_header.flag_syn {
            // run packet on start packet

            v.next_seq = next_seq_no;
        } else if !v.is_dead {
            // Add to buffer if less than 101 items
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
        if finished {
            map.remove(&key);
        }
    } else if tcp_header.flag_syn {
        // first packet for key
        // run packet on this one

        // insert into map
        map.insert(
            key,
            TcpConnection {
                buffer: HashMap::new(),
                next_seq: next_seq_no,
                last_seen: Instant::now(),
                is_dead: false,
            },
        );
    } else {
        // connection doesnt exist in map and current packet isn't first one
        map.insert(
            key,
            TcpConnection {
                buffer: HashMap::from([(
                    curr_seq_no,
                    TcpPacket {
                        data: data.to_vec(),
                        is_fin: tcp_header.flag_fin || tcp_header.flag_rst,
                    },
                )]),
                next_seq: 0,
                last_seen: Instant::now(),
                is_dead: false,
            },
        );
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
    map.retain(|_k, v| v.last_seen.elapsed() <= Duration::from_secs(10));
}

fn main() {
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
        process_packet(packet, true);
    }
}
