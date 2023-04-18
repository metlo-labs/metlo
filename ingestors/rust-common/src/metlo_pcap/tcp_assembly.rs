use std::collections::{BinaryHeap, HashMap};
use std::sync::Mutex;

use lazy_static::lazy_static;
use nom::{bytes, IResult};
use pcap::{Capture, Packet};
use pktparse::ethernet::{self, EtherType};
use pktparse::ip::IPProtocol;
use pktparse::ipv4::{self, IPv4Header};
use pktparse::tcp::{parse_tcp_header, TcpHeader};

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
}

lazy_static! {
    static ref MAP: Mutex<HashMap<String, TcpConnection>> = {
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

pub fn parse_tcp_data(ip_header: IPv4Header, tcp_header: TcpHeader, data: &[u8]) {
    let byte_len: u32 = data.to_vec().len().try_into().unwrap();
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
    let key = format!(
        "{}:{}->{}:{}",
        ip_header.source_addr, tcp_header.source_port, ip_header.dest_addr, tcp_header.dest_port
    );
    let val = map.get_mut(&key);
    let mut finished = false;
    if let Some(v) = val {
        if curr_seq_no == v.next_seq {
            // run packet on this one
            println!(
                "{}:{}->{}:{}; Seq {}; Next Seq {}; Data - {:?}\n",
                ip_header.source_addr,
                tcp_header.source_port,
                ip_header.dest_addr,
                tcp_header.dest_port,
                tcp_header.sequence_no,
                if tcp_header.flag_syn {
                    tcp_header.sequence_no + byte_len + 1
                } else {
                    tcp_header.sequence_no + byte_len
                },
                String::from_utf8(data.to_vec())
            );
            finished = tcp_header.flag_fin || tcp_header.flag_rst;
            // try to find next one in buffer
            for _i in 0..v.buffer.len() {
                println!("inside buffer {:?}", v.buffer);
                if let Some(item) = v.buffer.get(&next_seq_no) {
                    // run packet on this data with same header stuff
                    println!(
                        "{}:{}->{}:{}; Seq {}; Next Seq {}; Data - {:?}\n",
                        ip_header.source_addr,
                        tcp_header.source_port,
                        ip_header.dest_addr,
                        tcp_header.dest_port,
                        tcp_header.sequence_no,
                        if tcp_header.flag_syn {
                            tcp_header.sequence_no + byte_len + 1
                        } else {
                            tcp_header.sequence_no + byte_len
                        },
                        String::from_utf8(data.to_vec())
                    );
                    finished = item.is_fin;
                    next_seq_no = next_seq_no.wrapping_add(item.data.len().try_into().unwrap());
                } else {
                    break;
                }
                v.buffer.remove(&next_seq_no);
            }
        } else {
            println!(
                "out of order, looking for {}, got {}",
                curr_seq_no, v.next_seq
            );
            v.buffer.insert(
                curr_seq_no,
                TcpPacket {
                    data: data.to_vec(),
                    is_fin: tcp_header.flag_fin || tcp_header.flag_rst,
                },
            );
        }
        v.next_seq = next_seq_no;
        if finished {
            map.remove(&key);
        }
    } else if tcp_header.flag_syn {
        // first packet for key
        // run packet on this one
        println!(
            "{}:{}->{}:{}; Seq {}; Next Seq {}; Data - {:?}\n",
            ip_header.source_addr,
            tcp_header.source_port,
            ip_header.dest_addr,
            tcp_header.dest_port,
            tcp_header.sequence_no,
            if tcp_header.flag_syn {
                tcp_header.sequence_no + byte_len + 1
            } else {
                tcp_header.sequence_no + byte_len
            },
            String::from_utf8(data.to_vec())
        );

        // insert into map
        map.insert(
            key,
            TcpConnection {
                buffer: HashMap::new(),
                next_seq: next_seq_no,
            },
        );
    } else {
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
                next_seq: next_seq_no,
            },
        );
    }

    /*println!(
        "{}:{}->{}:{}; Seq {}; Next Seq {}; Data - {:?}\n",
        ip_header.source_addr,
        tcp_header.source_port,
        ip_header.dest_addr,
        tcp_header.dest_port,
        tcp_header.sequence_no,
        if tcp_header.flag_syn {
            tcp_header.sequence_no + byte_len + 1
        } else {
            tcp_header.sequence_no + byte_len
        },
        String::from_utf8(data.to_vec())
    );*/
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

fn main() {
    let mut cap = Capture::from_device("lo0")
        .unwrap()
        .immediate_mode(true)
        .open()
        .unwrap();
    while let Ok(packet) = cap.next_packet() {
        process_packet(packet, true);
    }
}
