package parsers

import (
	"bufio"
	"bytes"
	"io"
	"net/http"
	"sync"

	"github.com/google/gopacket"
	assemblers "github.com/metlo-labs/metlo/ingestors/govxlan/assemblers"
	"github.com/metlo-labs/metlo/ingestors/govxlan/utils"
)

const DEFAULT_BUFFER_SIZE int = 4096
const SPACE_BYTE byte = 32
const NL_BYTE byte = 10
const CR_BYTE byte = 13

type ParseStep string
type StepRes string

const (
	MethodOrProto   ParseStep = "MethodOrProto"
	ReqPathProtocol           = "ReqPathProtocol"
	RespStatusCode            = "RespStatusCode"
	ReqHeaderStep             = "ReqHeaderStep"
	RespHeaderStep            = "RespHeaderStep"
	BodyStep                  = "BodyStep"
)

const (
	StepWait      StepRes = "StepWait"
	StepSuccess           = "StepSuccess"
	StepParseDone         = "StepParseDone"
	StepFail              = "StepFail"
)

type HttpParserStreamFactory struct {
	Assembler *assemblers.HttpAssembler
}

func (h *HttpParserStreamFactory) New(vid uint32, net gopacket.Flow, transport gopacket.Flow) assemblers.Stream {
	return &HttpParserStream{
		vid:             vid,
		net:             net,
		transport:       transport,
		assembler:       h.Assembler,
		currentStep:     MethodOrProto,
		parsedReq:       nil,
		parsedResp:      nil,
		contentLength:   0,
		startParsePos:   0,
		currentParsePos: 0,
		bodyStartPos:    0,
		dataBuffer:      make([]byte, DEFAULT_BUFFER_SIZE),
	}
}

type HttpParserStream struct {
	mu                     sync.Mutex
	vid                    uint32
	net, transport         gopacket.Flow
	assembler              *assemblers.HttpAssembler
	currentStep            ParseStep
	parsedReq              *http.Request
	parsedResp             *http.Response
	contentLength          int
	startParsePos          int
	currentParsePos        int
	bodyStartPos           int
	parseBufferDataWritten int
	dataBuffer             []byte
}

func (r *HttpParserStream) ResetParseState() {
	r.currentStep = MethodOrProto
	r.parsedReq = nil
	r.parsedResp = nil
	r.contentLength = 0
	r.startParsePos = 0
	r.currentParsePos = 0
	r.bodyStartPos = 0
	r.parseBufferDataWritten = 0
	if len(r.dataBuffer) > DEFAULT_BUFFER_SIZE {
		r.dataBuffer = make([]byte, DEFAULT_BUFFER_SIZE)
	}
}

func (r *HttpParserStream) TotalParseData() int {
	return r.parseBufferDataWritten - r.startParsePos
}

func (r *HttpParserStream) BufferedParseData() int {
	return r.parseBufferDataWritten - r.currentParsePos
}

func (r *HttpParserStream) Discard(numBytes int) {
	if numBytes > r.TotalParseData() {
		panic("discarding more bytes than buffered")
	}
	r.startParsePos += numBytes
	r.currentParsePos = r.startParsePos
}

func (r *HttpParserStream) GetBufferedData() []byte {
	return r.dataBuffer[r.currentParsePos:r.parseBufferDataWritten]
}

func (r *HttpParserStream) GetParsedData() []byte {
	return r.dataBuffer[r.startParsePos:r.currentParsePos]
}

func (r *HttpParserStream) GetParsedBodyData() []byte {
	return r.dataBuffer[r.bodyStartPos:r.currentParsePos]
}

func (r *HttpParserStream) RunMethodOrProtoStep() (res StepRes, nextStep ParseStep) {
	// Find first space
	spaceIdx := bytes.Index(r.GetBufferedData(), []byte{SPACE_BYTE})

	// To small to be a method or proto
	if spaceIdx <= 2 {
		r.Discard(spaceIdx + 1)
		return StepWait, MethodOrProto
	}

	// No space found get rid of all but 8 bytes
	if spaceIdx <= -1 {
		totalBufferedBytes := r.TotalParseData()
		if totalBufferedBytes > 8 {
			r.Discard(totalBufferedBytes - 8)
		}
		return
	}

	// To long to be anything
	if spaceIdx > 8 {
		r.Discard(spaceIdx + 1)
		return
	}

	preSpaceStr := string(r.GetBufferedData()[:spaceIdx])

	// We have a http req method
	if IsValidMethod(preSpaceStr) {
		r.currentParsePos += (spaceIdx + 1)
		return StepSuccess, ReqPathProtocol
	}

	// We have a http req method
	if _, _, protoOk := http.ParseHTTPVersion(preSpaceStr); protoOk {
		r.currentParsePos += (spaceIdx + 1)
		return StepSuccess, RespStatusCode
	}

	// We have nothing, discard everything before and including space, wait for more bytes
	r.Discard(spaceIdx + 1)
	return StepWait, MethodOrProto
}

func (r *HttpParserStream) RunRespStatusCodeStep() (res StepRes, nextStep ParseStep) {
	// Find first NL
	nlIdx := bytes.Index(r.GetBufferedData(), []byte{CR_BYTE, NL_BYTE})

	// No NL found
	if nlIdx <= -1 {
		return StepWait, RespStatusCode
	}

	// TODO validate
	r.currentParsePos += (nlIdx + 2)
	return StepSuccess, RespHeaderStep
}

func (r *HttpParserStream) RunReqPathProtocolStep() (res StepRes, nextStep ParseStep) {
	// Find first NL
	nlIdx := bytes.Index(r.GetBufferedData(), []byte{CR_BYTE, NL_BYTE})

	// No NL found
	if nlIdx <= -1 {
		return StepWait, ReqPathProtocol
	}

	// TODO validate
	r.currentParsePos += (nlIdx + 2)
	return StepSuccess, ReqHeaderStep
}

func (r *HttpParserStream) RunRespHeaderStep() (res StepRes, nextStep ParseStep) {
	// Find first double NL
	nlIdx := bytes.Index(r.GetBufferedData(), []byte{CR_BYTE, NL_BYTE, CR_BYTE, NL_BYTE})

	// No NL found
	if nlIdx <= -1 {
		return StepWait, RespHeaderStep
	}

	r.currentParsePos += (nlIdx + 4)
	r.bodyStartPos = r.currentParsePos

	resp, err := http.ReadResponse(bufio.NewReader(bytes.NewReader(r.GetParsedData())), nil)
	if err != nil {
		return StepFail, MethodOrProto
	}
	r.parsedResp = resp
	if resp.ContentLength <= 0 {
		return StepParseDone, MethodOrProto
	}
	r.contentLength = int(resp.ContentLength)

	return StepSuccess, BodyStep
}

func (r *HttpParserStream) RunReqHeaderStep() (res StepRes, nextStep ParseStep) {
	// Find first double NL
	nlIdx := bytes.Index(r.GetBufferedData(), []byte{CR_BYTE, NL_BYTE, CR_BYTE, NL_BYTE})

	// No NL found
	if nlIdx <= -1 {
		return StepWait, ReqHeaderStep
	}

	r.currentParsePos += (nlIdx + 4)
	r.bodyStartPos = r.currentParsePos

	req, err := http.ReadRequest(bufio.NewReader(bytes.NewReader(r.GetParsedData())))
	if err != nil {
		return StepFail, MethodOrProto
	}
	r.parsedReq = req
	if req.ContentLength <= 0 {
		return StepParseDone, MethodOrProto
	}
	r.contentLength = int(req.ContentLength)

	return StepSuccess, BodyStep
}

func (r *HttpParserStream) RunBodyStep() (res StepRes, nextStep ParseStep) {
	bufferedBytes := r.BufferedParseData()
	bodyBytes := min(r.contentLength, bufferedBytes)

	r.currentParsePos += bodyBytes
	r.contentLength -= bodyBytes

	if r.contentLength <= 0 {
		return StepParseDone, MethodOrProto
	}

	return StepWait, BodyStep
}

func (r *HttpParserStream) RunStep() (res StepRes, nextStep ParseStep) {
	if r.currentStep == MethodOrProto {
		return r.RunMethodOrProtoStep()
	} else if r.currentStep == ReqPathProtocol {
		return r.RunReqPathProtocolStep()
	} else if r.currentStep == RespStatusCode {
		return r.RunRespStatusCodeStep()
	} else if r.currentStep == ReqHeaderStep {
		return r.RunReqHeaderStep()
	} else if r.currentStep == RespHeaderStep {
		return r.RunRespHeaderStep()
	} else if r.currentStep == BodyStep {
		return r.RunBodyStep()
	}
	return "", ""
}

func (r *HttpParserStream) WriteDataBuffer(data []byte) {
	dataLen := len(data)
	bufferValidData := r.parseBufferDataWritten - r.startParsePos
	bufferEndLeft := len(r.dataBuffer) - r.parseBufferDataWritten
	bufferStartEmpty := r.startParsePos

	// There is room in the buffer
	if dataLen < bufferEndLeft {
		copy(r.dataBuffer[r.parseBufferDataWritten:], data)
		r.parseBufferDataWritten += dataLen
		return
	}

	// There isn't room in the buffer but we can slide everything back
	if bufferStartEmpty > dataLen {
		copy(r.dataBuffer, r.dataBuffer[r.startParsePos:r.startParsePos+bufferValidData])
		oldStartParsePos := r.startParsePos
		r.startParsePos = 0
		r.currentParsePos -= oldStartParsePos
		r.bodyStartPos -= oldStartParsePos
		copy(r.dataBuffer[bufferValidData:], data)
		r.parseBufferDataWritten = bufferValidData + dataLen
		return
	}

	// There isn't room in the buffer at all, make a new one
	buf := make([]byte, 2*len(r.dataBuffer)+dataLen)

	// Copy old data
	copy(buf, r.dataBuffer[r.startParsePos:r.startParsePos+bufferValidData])
	oldStartParsePos := r.startParsePos
	r.startParsePos = 0
	r.currentParsePos -= oldStartParsePos
	r.bodyStartPos -= oldStartParsePos

	// Copy new data
	copy(buf[bufferValidData:], data)
	r.dataBuffer = buf
	r.parseBufferDataWritten = bufferValidData + dataLen
}

func (r *HttpParserStream) Reassembled(reassembly []assemblers.Reassembly) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if len(reassembly) == 0 {
		return
	}
	for _, dat := range reassembly {
		if len(dat.Bytes) > 0 {
			r.WriteDataBuffer(dat.Bytes)
		}
	}

	for {
		if r.BufferedParseData() == 0 {
			break
		}
		if r.BufferedParseData() < 0 {
			utils.Log.Error("Buffered Parse Data < 0")
			r.ResetParseState()
			break
		}
		res, next := r.RunStep()
		if res == StepSuccess {
			r.currentStep = next
		} else if res == StepParseDone {
			bodyLen := len(r.GetParsedBodyData())
			var body []byte = nil
			if bodyLen > 0 {
				body = make([]byte, bodyLen)
				copy(body, r.GetParsedBodyData())
			}
			if r.parsedReq != nil {
				req := r.parsedReq
				if bodyLen > 0 {
					req.Body = io.NopCloser(bytes.NewReader(body))
				}
				r.assembler.AddRequest(req, r.vid, r.net, r.transport)
			} else if r.parsedResp != nil {
				resp := r.parsedResp
				if bodyLen > 0 {
					resp.Body = io.NopCloser(bytes.NewReader(body))
				}
				r.assembler.AddResponse(resp, r.vid, r.net, r.transport)
			}
			r.ResetParseState()
			break
		} else if res == StepWait {
			break
		} else {
			r.ResetParseState()
			break
		}
	}
}

func (r *HttpParserStream) ReassemblyComplete() {
	r.ResetParseState()
}

func IsValidMethod(method string) bool {
	switch method {
	case
		"OPTIONS",
		"GET",
		"HEAD",
		"POST",
		"PUT",
		"PATCH",
		"DELETE",
		"TRACE",
		"CONNECT":
		return true
	}
	return false
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
