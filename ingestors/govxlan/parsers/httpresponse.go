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

type HttpRespStreamFactory struct {
	Assembler *assemblers.HttpAssembler
}
type HttpRespStream struct {
	net, transport gopacket.Flow
	r              tcpreader.ReaderStream
	assembler      *assemblers.HttpAssembler
}

func (h *HttpRespStreamFactory) New(net, transport gopacket.Flow) tcpassembly.Stream {
	hstream := &HttpRespStream{
		net:       net,
		transport: transport,
		r:         tcpreader.NewReaderStream(),
		assembler: h.Assembler,
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
			h.assembler.AddResponse(resp, h.net, h.transport)
		}
	}
}
