package metloapi

import (
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
	reqURLParams := make([]NV, 0)
	reqHeaders := make([]NV, len(req.Header))
	for k := range req.Header {
		reqHeaders = append(reqHeaders, NV{Name: k, Value: strings.Join(resp.Header[k], ",")})
	}
	return MetloTrace{
		Response: TraceRes{
			Status:  resp.StatusCode,
			Headers: resHeaders,
			Body:    "",
		},
		Request: TraceReq{
			Url: TraceUrl{
				Host:       req.URL.Host,
				Path:       req.URL.Path,
				Parameters: reqURLParams,
			},
			Headers: reqHeaders,
			Body:    "",
		},
		Meta: TraceMeta{
			Incoming:    true,
			Environment: "production",
			MetloSource: "govxlan",
			Source:      netFlow.Dst().String(),
			Destination: netFlow.Src().String(),
		},
	}
}
