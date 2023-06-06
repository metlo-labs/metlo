package parsers

import (
	"bufio"
	"io"
	"net/http"

	"github.com/google/gopacket"
	"github.com/metlo-labs/metlo/ingestors/govxlan/assemblers"
	"github.com/metlo-labs/metlo/ingestors/govxlan/tcputils"
)

type HttpReqStreamFactory struct {
	Assembler *assemblers.HttpAssembler
}
type HttpReqStream struct {
	vid            uint32
	net, transport gopacket.Flow
	r              tcputils.ReaderStream
	assembler      *assemblers.HttpAssembler
}

func (h *HttpReqStreamFactory) New(vid uint32, net gopacket.Flow, transport gopacket.Flow) assemblers.Stream {
	hstream := &HttpReqStream{
		vid:       vid,
		net:       net,
		transport: transport,
		r:         tcputils.NewReaderStream(),
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
			h.assembler.AddRequest(req, h.vid, h.net, h.transport)
		}
	}
}
