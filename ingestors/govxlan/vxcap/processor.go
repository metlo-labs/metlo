package vxcap

import (
	"fmt"
	"time"

	"github.com/google/gopacket/layers"
	"github.com/google/gopacket/tcpassembly"
	"github.com/metlo-labs/metlo/ingestors/govxlan/assemblers"
	"github.com/metlo-labs/metlo/ingestors/govxlan/parsers"
)

type Processor interface {
	Setup() error
	Put(pkt *packetData) error
	Tick(now time.Time) error
	Shutdown() error
}

type PacketProcessor struct {
	httpAssembler *assemblers.HttpAssembler
	reqAssembler  *tcpassembly.Assembler
	respAssembler *tcpassembly.Assembler
	ready         bool
}

func NewPacketProcessor() (*PacketProcessor, error) {
	proc := PacketProcessor{}
	return &proc, nil
}

func (x *PacketProcessor) Setup() error {
	httpAssembler := assemblers.NewHttpAssembler()

	reqStreamFac := &parsers.HttpReqStreamFactory{
		Assembler: httpAssembler,
	}
	respStreamFac := &parsers.HttpRespStreamFactory{
		Assembler: httpAssembler,
	}

	reqStreamPool := tcpassembly.NewStreamPool(reqStreamFac)
	respStreamPool := tcpassembly.NewStreamPool(respStreamFac)

	x.reqAssembler = tcpassembly.NewAssembler(reqStreamPool)
	x.respAssembler = tcpassembly.NewAssembler(respStreamPool)
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
	x.reqAssembler.AssembleWithTimestamp(networkFlow, tcp, timestamp)
	x.respAssembler.AssembleWithTimestamp(networkFlow, tcp, timestamp)
	return nil
}

func (x *PacketProcessor) Tick(now time.Time) error {
	x.reqAssembler.FlushOlderThan(now.Add(time.Minute * -2))
	x.respAssembler.FlushOlderThan(now.Add(time.Minute * -2))
	x.httpAssembler.Tick(now)
	return nil
}

func (x *PacketProcessor) Shutdown() error {
	x.reqAssembler.FlushAll()
	x.respAssembler.FlushAll()
	return nil
}
