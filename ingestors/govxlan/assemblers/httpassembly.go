package assemblers

import (
	"net/http"
	"time"

	"github.com/google/gopacket"
	"github.com/metlo-labs/metlo/ingestors/govxlan/utils"
	"github.com/sirupsen/logrus"
)

type key [2]gopacket.Flow

type pendingRequest struct {
	req     *http.Request
	created time.Time
}

type HttpAssembler struct {
	totalRequestCount     uint64
	totalResponseCount    uint64
	totalMatchedResponses uint64
	requestMap            map[key]pendingRequest
}

func NewHttpAssembler() *HttpAssembler {
	return &HttpAssembler{
		totalRequestCount:     0,
		totalResponseCount:    0,
		totalMatchedResponses: 0,
		requestMap:            make(map[key]pendingRequest, 4096),
	}
}

func (h *HttpAssembler) AddResponse(resp *http.Response, netFlow gopacket.Flow, transferFlow gopacket.Flow) {
	defer resp.Body.Close()
	h.totalResponseCount += 1
	reverseKey := key{netFlow.Reverse(), transferFlow.Reverse()}
	if matchedReq, found := h.requestMap[reverseKey]; found {
		req := matchedReq.req
		delete(h.requestMap, reverseKey)
		h.totalMatchedResponses += 1
		defer req.Body.Close()
		// TODO send to metlo
	}
}

func (h *HttpAssembler) AddRequest(req *http.Request, netFlow gopacket.Flow, transferFlow gopacket.Flow) {
	defer req.Body.Close()
	h.totalRequestCount += 1
	key := key{netFlow, transferFlow}
	h.requestMap[key] = pendingRequest{
		req:     req,
		created: time.Now(),
	}
}

func (h *HttpAssembler) Tick(now time.Time) {
	// Cleanup old unmatched requests
	numCleaned := 0
	for key, pendingReq := range h.requestMap {
		if pendingReq.created.Before(now.Add(-1 * time.Minute)) {
			numCleaned += 1
			delete(h.requestMap, key)
		}
	}
	if numCleaned > 0 {
		utils.Log.WithFields(logrus.Fields{
			"numCleaned": numCleaned,
		}).Info("Cleaned Up Requests")
	}
	utils.Log.WithFields(logrus.Fields{
		"totalRequestCount":     h.totalRequestCount,
		"totalResponseCount":    h.totalResponseCount,
		"totalMatchedResponses": h.totalMatchedResponses,
	}).Debug("Http Assembler Stats")
}
