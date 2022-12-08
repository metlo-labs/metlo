package vxcap

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"net"

	"github.com/metlo-labs/metlo/ingestors/govxlan/utils"
	"github.com/pkg/errors"
)

type udpQueue struct {
	Pkt *packetData
	Err error
}

const (
	// DefaultReceiverQueueSize is default queue size of channel from UDP server to packet processor.
	DefaultReceiverQueueSize = 1024
	// DefaultVxlanPort is port number of UDP server to receive VXLAN datagram.
	DefaultVxlanPort = 4789

	vxlanHeaderLength = 8
)

func parseVXLAN(raw []byte, length int) (*packetData, error) {
	if length < vxlanHeaderLength {
		return nil, fmt.Errorf("Too short data for VXLAN header: %d", length)
	}

	pkt := newPacketData(raw[vxlanHeaderLength:length])

	buffer := bytes.NewBuffer(raw)
	if err := binary.Read(buffer, binary.BigEndian, &pkt.Header); err != nil {
		return nil, errors.Wrap(err, "Fail to parse VXLAN header")
	}

	return pkt, nil
}

func listenVXLAN(port, queueSize int) chan *udpQueue {
	ch := make(chan *udpQueue, queueSize)

	go func() {
		defer close(ch)

		sock, err := net.ListenPacket("udp", fmt.Sprintf(":%d", port))
		if err != nil {
			ch <- &udpQueue{Err: errors.Wrap(err, "Fail to create UDP socket")}
			return
		}
		defer sock.Close()

		buf := make([]byte, 32768)

		for {
			n, _, err := sock.ReadFrom(buf)
			if err != nil {
				ch <- &udpQueue{Err: errors.Wrap(err, "Fail to read UDP data")}
				return
			}

			pkt, err := parseVXLAN(buf, n)
			if err != nil {
				utils.Log.WithError(err).Warn("Fail to parse VXLAN data")
				continue
			}

			q := new(udpQueue)
			q.Pkt = pkt
			ch <- q
		}
	}()

	return ch
}
