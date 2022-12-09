package metloapi

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/google/gopacket"
)

func MapHttpToMetloTrace(
	req *http.Request,
	resp *http.Response,
	reqBody string,
	respBody string,
	netFlow gopacket.Flow,
	transferFlow gopacket.Flow,
) (*MetloTrace, error) {
	resHeaders := make([]NV, len(resp.Header))
	for k := range resp.Header {
		if k == "" {
			continue
		}
		resHeaders = append(resHeaders, NV{Name: k, Value: strings.Join(resp.Header[k], ",")})
	}
	reqHeaders := make([]NV, len(req.Header))
	for k := range req.Header {
		if k == "" {
			continue
		}
		reqHeaders = append(reqHeaders, NV{Name: k, Value: strings.Join(resp.Header[k], ",")})
	}

	reqURLParams := make([]NV, 0)
	queryMap := req.URL.Query()
	for k := range queryMap {
		reqURLParams = append(reqURLParams, NV{Name: k, Value: strings.Join(queryMap[k], ",")})
	}

	host := ""
	absRequestURI := strings.HasPrefix(req.RequestURI, "http://") || strings.HasPrefix(req.RequestURI, "https://")
	if !absRequestURI {
		if host == "" && req.Host != "" {
			host = req.Host
		}
		if host == "" && req.URL != nil {
			host = req.URL.Host
		}
	}
	if host == "" {
		host = fmt.Sprintf("%s:%s", netFlow.Src().String(), transferFlow.Src().String())
	}

	sourcePort, srcPortErr := strconv.Atoi(transferFlow.Dst().String())
	if srcPortErr != nil {
		return nil, srcPortErr
	}
	destinationPort, dstPortErr := strconv.Atoi(transferFlow.Src().String())
	if dstPortErr != nil {
		return nil, dstPortErr
	}

	return &MetloTrace{
		Response: TraceRes{
			Status:  resp.StatusCode,
			Headers: resHeaders,
			Body:    respBody,
		},
		Request: TraceReq{
			Method: req.Method,
			Url: TraceUrl{
				Host:       host,
				Path:       req.URL.Path,
				Parameters: reqURLParams,
			},
			Headers: reqHeaders,
			Body:    reqBody,
		},
		Meta: TraceMeta{
			Incoming:        true,
			Environment:     "production",
			MetloSource:     "govxlan",
			Source:          netFlow.Dst().String(),
			Destination:     netFlow.Src().String(),
			SourcePort:      sourcePort,
			DestinationPort: destinationPort,
		},
	}, nil
}
