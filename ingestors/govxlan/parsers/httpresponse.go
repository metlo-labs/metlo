package parsers

import (
	"bufio"
	"io"
	"net/http"

	"github.com/google/gopacket"
	"github.com/metlo-labs/metlo/ingestors/govxlan/assemblers"
	"github.com/metlo-labs/metlo/ingestors/govxlan/tcputils"
)

type HttpRespStreamFactory struct {
	Assembler *assemblers.HttpAssembler
}
type HttpRespStream struct {
	vid            uint32
	net, transport gopacket.Flow
	r              tcputils.ReaderStream
	assembler      *assemblers.HttpAssembler
	totalRespCount uint
}

func (h *HttpRespStreamFactory) New(vid uint32, net gopacket.Flow, transport gopacket.Flow) assemblers.Stream {
	hstream := &HttpRespStream{
		vid:            vid,
		net:            net,
		transport:      transport,
		r:              tcputils.NewReaderStream(),
		assembler:      h.Assembler,
		totalRespCount: 0,
	}
	go hstream.run() // Important... we must guarantee that data from the reader stream is read.

	// ReaderStream implements tcpassembly.Stream, so we can return a pointer to it.
	return &hstream.r
}

func (h *HttpRespStream) run() {
	buf := bufio.NewReader(&h.r)
	for {
		resp, err := http.ReadResponse(buf, nil)
		if err == io.EOF || err == io.ErrUnexpectedEOF {
			// We must read until we see an EOF... very important!
			return
		} else if err != nil {
			// log.Println("Error reading stream", h.net, h.transport, ":", err)
		} else {
			h.assembler.AddResponse(resp, h.totalRespCount, h.vid, h.net, h.transport)
			h.totalRespCount += 1
		}
	}
}
