package assemblers

import (
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/google/gopacket"
	"github.com/metlo-labs/metlo/ingestors/govxlan/metloapi"
	"github.com/metlo-labs/metlo/ingestors/govxlan/utils"
	"github.com/sirupsen/logrus"
)

type key [2]gopacket.Flow

type pendingRequest struct {
	req     *http.Request
	body    string
	created time.Time
}

type HttpAssembler struct {
	mu                    sync.Mutex
	metloAPI              *metloapi.Metlo
	totalRequestCount     uint64
	totalResponseCount    uint64
	totalMatchedResponses uint64
	requestMap            map[key]pendingRequest
}

func NewHttpAssembler(metloAPI *metloapi.Metlo) *HttpAssembler {
	return &HttpAssembler{
		metloAPI:              metloAPI,
		totalRequestCount:     0,
		totalResponseCount:    0,
		totalMatchedResponses: 0,
		requestMap:            make(map[key]pendingRequest, 4096),
	}
}

func (h *HttpAssembler) AddResponse(resp *http.Response, netFlow gopacket.Flow, transferFlow gopacket.Flow) {
	defer resp.Body.Close()
	h.totalResponseCount += 1
	respBody, _ := io.ReadAll(resp.Body)
	respBodyLen := len(respBody)
	if respBodyLen > utils.MAX_BODY_SIZE {
		key := key{netFlow, transferFlow}
		utils.Log.WithFields(logrus.Fields{
			"key":     key,
			"size":    respBodyLen,
			"maxSize": utils.MAX_BODY_SIZE,
		}).Debug("Skipped Large Response.")
		return
	}
	reverseKey := key{netFlow.Reverse(), transferFlow.Reverse()}
	h.mu.Lock()
	matchedReq, found := h.requestMap[reverseKey]
	if found {
		delete(h.requestMap, reverseKey)
	}
	h.mu.Unlock()
	if found {
		req := matchedReq.req
		h.totalMatchedResponses += 1
		if h.metloAPI.Allow() {
			trace, err := metloapi.MapHttpToMetloTrace(
				req, resp, matchedReq.body, string(respBody), netFlow, transferFlow,
			)
			if err == nil {
				h.metloAPI.Send(*trace)
			} else {
				utils.Log.WithError(err).Warn("Unable To Create Metlo Trace")
			}
		} else {
			utils.Log.Trace("Request Rate Limited On Client Side")
		}
	}
}

func (h *HttpAssembler) AddRequest(req *http.Request, netFlow gopacket.Flow, transferFlow gopacket.Flow) {
	defer req.Body.Close()
	reqBody, _ := io.ReadAll(req.Body)
	h.totalRequestCount += 1
	key := key{netFlow, transferFlow}
	reqBodyLen := len(reqBody)
	if reqBodyLen > utils.MAX_BODY_SIZE {
		utils.Log.WithFields(logrus.Fields{
			"path":    req.URL.Path,
			"key":     key,
			"size":    reqBodyLen,
			"maxSize": utils.MAX_BODY_SIZE,
		}).Debug("Skipped Large Request.")
		return
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	h.requestMap[key] = pendingRequest{
		req:     req,
		body:    string(reqBody),
		created: time.Now(),
	}
}

func (h *HttpAssembler) Tick(now time.Time) {
	// Cleanup old unmatched requests
	numCleaned := 0
	h.mu.Lock()
	defer h.mu.Unlock()
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
