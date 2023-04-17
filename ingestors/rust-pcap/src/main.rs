use std::collections::HashMap;

use nom::{bytes, IResult};
use pcap::{Capture, Packet};
use pktparse::ethernet::{self, EtherType};
use pktparse::ip::IPProtocol;
use pktparse::ipv4::{self};
use pktparse::tcp::{parse_tcp_header, TcpHeader};
use sorted_list::SortedList;

pub enum LoProtocolFamily {
    IPV4,
    Other(u32),
}

pub struct LoopbackFrame {
    pub protocol_family: LoProtocolFamily,
}

// #[derive(PartialEq)]
// pub struct TcpPacket<'a> {
//     pub sequence_number: u32,
//     pub data: &'a [u8],
// }

// pub struct TcpConnection<'a> {
//     pub buffer: SortedList<u32, TcpPacket<'a>>,
//     pub src_ip: &'a str,
//     pub dst_ip: &'a str,
//     pub src_port: u16,
//     pub dst_port: u16,
// }

// pub struct ConnectionPool {
//     pub conn_map: HashMap<String, TcpConnection>>,
// }

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

pub fn parse_tcp_data(headers: TcpHeader, data: &[u8]) {
    let byte_len: u32 = data.to_vec().len().try_into().unwrap();
    println!(
        "{:?}, Next Seq: {:?}\n",
        headers,
        if headers.flag_syn {
            headers.sequence_no + byte_len + 1
        } else {
            headers.sequence_no + byte_len
        }
    );
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
                Ok((content, headers)) => match headers.protocol {
                    IPProtocol::TCP => match parse_tcp_header(content) {
                        Ok((content, headers)) => parse_tcp_data(headers, content),
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
