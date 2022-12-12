package pcap

import (
	"time"

	"github.com/google/gopacket"
	"github.com/google/gopacket/layers"
	"github.com/google/gopacket/pcap"
	"github.com/pkg/errors"
)

type udpQueue struct {
	Pkt *packetData
	Err error
}

func listenPCAP(queueSize int, captureInterface string) chan *udpQueue {
	ch := make(chan *udpQueue, queueSize)

	go func() {
		defer close(ch)

		handle, err := pcap.OpenLive(captureInterface, 65535, true, pcap.BlockForever)
		if err != nil {
			ch <- &udpQueue{Err: errors.Wrapf(err, "Fail to bind to interface %s", captureInterface)}
			return
		}
		defer handle.Close()

		// Read in packets, pass to assembler.
		packetSource := gopacket.NewPacketSource(handle, handle.LinkType())
		for packet := range packetSource.Packets() {
			if packet == nil {
				return
			}
			tmpPacket := gopacket.NewPacket(packet.Data(), packet.Layers()[0].LayerType(), gopacket.Lazy)

			if tmpPacket.NetworkLayer() == nil || tmpPacket.TransportLayer() == nil || tmpPacket.TransportLayer().LayerType() != layers.LayerTypeTCP {
				continue
			}
			q := new(udpQueue)

			pkt := new(packetData)
			pkt.Timestamp = time.Now()
			pkt.Packet = &tmpPacket
			pkt.VNI = 0
			pkt.Data = (*pkt.Packet).Data()
			q.Pkt = pkt
			ch <- q

		}

	}()

	return ch
}
