package pcap

import (
	"log"
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

func listenPCAP(queueSize int) chan *udpQueue {
	ch := make(chan *udpQueue, queueSize)

	go func() {
		defer close(ch)

		// sock, err := net.ListenPacket("udp", fmt.Sprintf(":%d", port))
		handle, err := pcap.OpenLive("en0", 65535, true, pcap.BlockForever)
		if err != nil {
			ch <- &udpQueue{Err: errors.Wrap(err, "Fail to create UDP socket")}
			return
		}
		defer handle.Close()

		// Read in packets, pass to assembler.
		packetSource := gopacket.NewPacketSource(handle, handle.LinkType())
		for packet := range packetSource.Packets() {
			if packet == nil {
				return
			}

			if packet.NetworkLayer() == nil || packet.TransportLayer() == nil || packet.TransportLayer().LayerType() != layers.LayerTypeTCP {
				if packet.NetworkLayer() == nil {
					log.Println("Network layer nil")
				} else if packet.TransportLayer() == nil {
					log.Println("Transport layer nil")
				} else if packet.TransportLayer().LayerType() != layers.LayerTypeTCP {
					log.Println("No TCP Data found")
				}
				log.Println("Unusable packet")
				continue
			}
			// tcp := packet.TransportLayer().(*layers.TCP)
			// log.Println("Acceptable packet found")
			q := new(udpQueue)

			pkt := new(packetData)
			pkt.Timestamp = time.Now()
			pkt.Packet = &packet
			pkt.VNI = 0
			pkt.Data = (*pkt.Packet).Data()
			// eth := packet.Layer(layers.LayerTypeEthernet)

			q.Pkt = pkt
			ch <- q
			// q.Pkt = newPacketData(tcp.LayerContents(), 0)
			// if q.Pkt.Packet != nil {
			// 	ch <- q
			// }

		}

	}()

	return ch
}
