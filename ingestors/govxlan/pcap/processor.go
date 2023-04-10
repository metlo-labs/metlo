package pcap

import (
	"fmt"
	"time"

	"github.com/google/gopacket/layers"
	"github.com/metlo-labs/metlo/ingestors/govxlan/assemblers"
	"github.com/metlo-labs/metlo/ingestors/govxlan/metloapi"
	"github.com/metlo-labs/metlo/ingestors/govxlan/parsers"
)

type Processor interface {
	Setup() error
	Put(pkt *packetData) error
	Tick(now time.Time) error
	Shutdown() error
}

type PacketProcessor struct {
	iFace         string
	metloAPI      *metloapi.Metlo
	httpAssembler *assemblers.HttpAssembler
	tcpAssembler  *assemblers.Assembler
	respAssembler *assemblers.Assembler
	ready         bool
}

func NewPacketProcessor(metloAPI *metloapi.Metlo, interfaceName string) (*PacketProcessor, error) {
	proc := PacketProcessor{
		iFace:    interfaceName,
		metloAPI: metloAPI,
	}
	return &proc, nil
}

func (x *PacketProcessor) Setup() error {
	httpAssembler := assemblers.NewHttpAssembler(x.metloAPI)
	httpStreamFact := &parsers.HttpParserStreamFactory{
		Assembler: httpAssembler,
	}
	httpParsePool := assemblers.NewStreamPool(httpStreamFact)
	x.tcpAssembler = assemblers.NewAssembler(httpParsePool)
	x.httpAssembler = httpAssembler
	x.ready = true
	return nil
}

func (x *PacketProcessor) Put(pkt *packetData) error {
	if !x.ready {
		return fmt.Errorf("PacketProcessor is not ready, run Setup() at first")
	}
	packet := *pkt.Packet
	networkFlow := packet.NetworkLayer().NetworkFlow()
	tcp := packet.TransportLayer().(*layers.TCP)
	timestamp := packet.Metadata().Timestamp
	x.tcpAssembler.AssembleWithTimestamp(pkt.VNI, networkFlow, tcp, timestamp)
	return nil
}

func (x *PacketProcessor) Tick(now time.Time) error {
	x.tcpAssembler.FlushOlderThan(now.Add(time.Minute * -2))
	x.httpAssembler.Tick(now, x.iFace)
	return nil
}

func (x *PacketProcessor) Shutdown() error {
	x.tcpAssembler.FlushAll()
	return nil
}
