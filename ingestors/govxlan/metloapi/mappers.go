package metloapi

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/google/gopacket"
	mi "github.com/metlo-labs/metlo/ingestors/govxlan/proto"
)

func MapHttpToMetloTrace(
	req *http.Request,
	resp *http.Response,
	reqBody string,
	respBody string,
	netFlow gopacket.Flow,
	transferFlow gopacket.Flow,
) (*MetloTrace, error) {
	resHeaders := make([]NV, 0)
	for k := range resp.Header {
		if k == "" {
			continue
		}
		resHeaders = append(resHeaders, NV{Name: k, Value: strings.Join(resp.Header[k], ",")})
	}
	reqHeaders := make([]NV, 0)
	for k := range req.Header {
		if k == "" {
			continue
		}
		reqHeaders = append(reqHeaders, NV{Name: k, Value: strings.Join(resp.Header[k], ",")})
	}

	reqURLParams := make([]NV, 0)

	if req.URL != nil {
		queryMap := req.URL.Query()
		for k := range queryMap {
			reqURLParams = append(reqURLParams, NV{Name: k, Value: strings.Join(queryMap[k], ",")})
		}
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
				Path:       GetPath(req),
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

func MapMetloTraceToMetloIngestRPC(trace MetloTrace) mi.ApiTrace {
	reqURLParams := make([]*mi.KeyVal, 0)
	for _, k := range trace.Request.Url.Parameters {
		reqURLParams = append(reqURLParams, &mi.KeyVal{Name: k.Name, Value: k.Value})
	}
	reqHeaders := make([]*mi.KeyVal, 0)
	for _, k := range trace.Request.Headers {
		reqHeaders = append(reqHeaders, &mi.KeyVal{Name: k.Name, Value: k.Value})
	}
	respHeaders := make([]*mi.KeyVal, 0)
	for _, k := range trace.Response.Headers {
		respHeaders = append(respHeaders, &mi.KeyVal{Name: k.Name, Value: k.Value})
	}
	return mi.ApiTrace{
		Response: &mi.ApiResponse{
			Status:  int32(trace.Response.Status),
			Headers: respHeaders,
			Body:    &trace.Response.Body,
		},
		Request: &mi.ApiRequest{
			Method: trace.Request.Method,
			Url: &mi.ApiUrl{
				Host:       trace.Request.Url.Host,
				Path:       trace.Request.Url.Path,
				Parameters: reqURLParams,
			},
			Headers: reqHeaders,
			Body:    &trace.Request.Body,
		},
		Meta: &mi.ApiMeta{
			Environment:     trace.Meta.Environment,
			Incoming:        trace.Meta.Incoming,
			Source:          trace.Meta.Source,
			SourcePort:      int32(trace.Meta.SourcePort),
			Destination:     trace.Meta.Destination,
			DestinationPort: int32(trace.Meta.DestinationPort),
		},
	}
}
