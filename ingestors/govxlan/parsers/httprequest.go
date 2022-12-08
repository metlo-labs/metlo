package parsers

import (
	"bufio"
	"io"
	"net/http"

	"github.com/google/gopacket"
	"github.com/google/gopacket/tcpassembly"
	"github.com/google/gopacket/tcpassembly/tcpreader"
	"github.com/metlo-labs/metlo/ingestors/govxlan/assemblers"
)

type HttpReqStreamFactory struct {
	Assembler *assemblers.HttpAssembler
}
type HttpReqStream struct {
	net, transport gopacket.Flow
	r              tcpreader.ReaderStream
	assembler      *assemblers.HttpAssembler
}

func (h *HttpReqStreamFactory) New(net, transport gopacket.Flow) tcpassembly.Stream {
	hstream := &HttpReqStream{
		net:       net,
		transport: transport,
		r:         tcpreader.NewReaderStream(),
		assembler: h.Assembler,
	}
	go hstream.run() // Important... we must guarantee that data from the reader stream is read.

	return &hstream.r
}

func (h *HttpReqStream) run() {
	buf := bufio.NewReader(&h.r)
	for {
		req, err := http.ReadRequest(buf)
		if err == io.EOF || err == io.ErrUnexpectedEOF {
			// We must read until we see an EOF... very important!
			return
		} else if err != nil {
			// log.Println("Error reading stream", h.net, h.transport, ":", err)
		} else {
			h.assembler.AddRequest(req, h.net, h.transport)
		}
	}
}
