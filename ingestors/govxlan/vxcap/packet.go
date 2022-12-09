package vxcap

import (
	"time"

	"github.com/google/gopacket"
	"github.com/google/gopacket/layers"
)

type vxlanHeader struct {
	Flag               uint16
	GroupPolicyID      uint16
	NetworkIndentifier [3]byte
	Reserved           [1]byte
}

type packetData struct {
	Data      []byte
	Packet    *gopacket.Packet
	Header    vxlanHeader
	VNI       uint32
	Timestamp time.Time
}

func newPacketData(buf []byte, VNI uint32) *packetData {
	pkt := new(packetData)
	pkt.Timestamp = time.Now()

	gopkt := gopacket.NewPacket(buf, layers.LayerTypeEthernet, gopacket.Lazy)
	pkt.Packet = &gopkt
	pkt.VNI = VNI
	pkt.Data = (*pkt.Packet).Data()

	return pkt
}
