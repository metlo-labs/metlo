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
	requestMap            map[string]pendingRequest
}

func NewHttpAssembler(metloAPI *metloapi.Metlo) *HttpAssembler {
	return &HttpAssembler{
		metloAPI:              metloAPI,
		totalRequestCount:     0,
		totalResponseCount:    0,
		totalMatchedResponses: 0,
		requestMap:            make(map[string]pendingRequest, 4096),
	}
}

func (h *HttpAssembler) AddResponse(resp *http.Response, vid uint32, netFlow gopacket.Flow, transferFlow gopacket.Flow) {
	defer resp.Body.Close()
	h.totalResponseCount += 1

	respBody, _ := io.ReadAll(resp.Body)
	respBodyLen := len(respBody)
	respKey := key{vid, netFlow, transferFlow}
	reverseKey := key{vid, netFlow.Reverse(), transferFlow.Reverse()}

	h.mu.Lock()
	matchedReq, found := h.requestMap[reverseKey.String()]
	if found {
		delete(h.requestMap, reverseKey.String())
	}
	h.mu.Unlock()

	if respBodyLen > utils.MAX_BODY_SIZE {
		if found {
			utils.Log.WithFields(logrus.Fields{
				"Method":   matchedReq.req.Method,
				"Host":     metloapi.GetHost(matchedReq.req),
				"Path":     metloapi.GetPath(matchedReq.req),
				"reqKey":   reverseKey.String(),
				"respKey":  respKey.String(),
				"size":     respBodyLen,
				"maxSize":  utils.MAX_BODY_SIZE,
				"reqFound": found,
			}).Debug("Skipped Large Response.")
		} else {
			utils.Log.WithFields(logrus.Fields{
				"reqKey":   reverseKey.String(),
				"respKey":  respKey.String(),
				"size":     respBodyLen,
				"maxSize":  utils.MAX_BODY_SIZE,
				"reqFound": found,
			}).Debug("Skipped Large Response.")
		}
		return
	}

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
	} else {
		utils.Log.WithFields(logrus.Fields{
			"respKey": respKey.String(),
		}).Trace("Unable to find request for response.")
	}
}

func (h *HttpAssembler) AddRequest(req *http.Request, vid uint32, netFlow gopacket.Flow, transferFlow gopacket.Flow) {
	defer req.Body.Close()
	reqBody, _ := io.ReadAll(req.Body)
	h.totalRequestCount += 1
	key := key{vid, netFlow, transferFlow}
	reqBodyLen := len(reqBody)
	if reqBodyLen > utils.MAX_BODY_SIZE {
		utils.Log.WithFields(logrus.Fields{
			"Method":  req.Method,
			"Host":    metloapi.GetHost(req),
			"Path":    metloapi.GetPath(req),
			"key":     key.String(),
			"size":    reqBodyLen,
			"maxSize": utils.MAX_BODY_SIZE,
		}).Debug("Skipped Large Request.")
		return
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	h.requestMap[key.String()] = pendingRequest{
		req:     req,
		body:    string(reqBody),
		created: time.Now(),
	}
}

func (h *HttpAssembler) Tick(now time.Time, captureInterface string) {
	// Cleanup old unmatched requests
	numCleaned := 0
	h.mu.Lock()
	defer h.mu.Unlock()
	for key, pendingReq := range h.requestMap {
		if pendingReq.created.Before(now.Add(-1 * time.Minute)) {
			numCleaned += 1
			utils.Log.WithFields(logrus.Fields{
				"Method": h.requestMap[key].req.Method,
				"Host":   metloapi.GetHost(h.requestMap[key].req),
				"Path":   metloapi.GetPath(h.requestMap[key].req),
			}).Trace("Cleaned Up Request")
			delete(h.requestMap, key)
		}
	}
	if numCleaned > 0 {
		utils.Log.WithFields(logrus.Fields{
			"numCleaned": numCleaned,
		}).Debug("Cleaned Up Requests")
	}
	utils.Log.WithFields(logrus.Fields{
		"pendingReqs":           len(h.requestMap),
		"totalRequestCount":     h.totalRequestCount,
		"totalResponseCount":    h.totalResponseCount,
		"totalMatchedResponses": h.totalMatchedResponses,
	}).Debugf("Http Assembler Stats %s", captureInterface)
}
