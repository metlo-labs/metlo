package metloapi

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/google/gopacket"
)

func MapHttpToMetloTrace(
	req *http.Request,
	resp *http.Response,
	netFlow gopacket.Flow,
	transferFlow gopacket.Flow,
) MetloTrace {
	resHeaders := make([]NV, len(resp.Header))
	for k := range resp.Header {
		resHeaders = append(resHeaders, NV{Name: k, Value: strings.Join(resp.Header[k], ",")})
	}
	reqHeaders := make([]NV, len(req.Header))
	for k := range req.Header {
		reqHeaders = append(reqHeaders, NV{Name: k, Value: strings.Join(resp.Header[k], ",")})
	}

	reqURLParams := make([]NV, 0)

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

	return MetloTrace{
		Response: TraceRes{
			Status:  resp.StatusCode,
			Headers: resHeaders,
			Body:    "",
		},
		Request: TraceReq{
			Method: req.Method,
			Url: TraceUrl{
				Host:       host,
				Path:       req.URL.Path,
				Parameters: reqURLParams,
			},
			Headers: reqHeaders,
			Body:    "",
		},
		Meta: TraceMeta{
			Incoming:        true,
			Environment:     "production",
			MetloSource:     "govxlan",
			Source:          netFlow.Dst().String(),
			Destination:     netFlow.Src().String(),
			SourcePort:      123,
			DestinationPort: 123,
		},
	}
}
