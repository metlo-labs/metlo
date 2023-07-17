package metlo

import (
	mi "github.com/metlo-labs/metlo/ingestors/golang/metlo/proto"
)

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
	user := ""
	if trace.Request.User != nil {
		user = *trace.Request.User
	}
	return mi.ApiTrace{
		Response: &mi.ApiResponse{
			Status:  int32(trace.Response.Status),
			Headers: respHeaders,
			Body:    trace.Response.Body,
		},
		Request: &mi.ApiRequest{
			Method: trace.Request.Method,
			Url: &mi.ApiUrl{
				Host:       trace.Request.Url.Host,
				Path:       trace.Request.Url.Path,
				Parameters: reqURLParams,
			},
			Headers: reqHeaders,
			Body:    trace.Request.Body,
			User:    user,
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
