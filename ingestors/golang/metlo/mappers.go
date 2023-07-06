package metlo

/*
  #include "go_interface.h"
*/
import "C"

func MapMetloTraceToCStruct(trace MetloTrace) C.Metlo_ApiTrace {
	return C.Metlo_ApiTrace{
		Req:  MapMetloRequestToCStruct(trace.Request),
		Res:  MapMetloResponseToCStruct(trace.Response),
		Meta: MapMetloMetadataToCStruct(trace.Meta),
	}
}

func MapMetloRequestToCStruct(request TraceReq) C.Metlo_Request {
	reqURLParams := make([]C.Metlo_NVPair, 0)
	for _, k := range request.Url.Parameters {
		reqURLParams = append(reqURLParams, C.Metlo_NVPair{Name: C.CString(k.Name), Value: C.CString(k.Value)})
	}
	reqHeaders := make([]C.Metlo_NVPair, 0)
	for _, k := range request.Headers {
		reqHeaders = append(reqHeaders, C.Metlo_NVPair{Name: C.CString(k.Name), Value: C.CString(k.Value)})
	}

	var reqURLParamsPtr *C.Metlo_NVPair = nil
	if len(request.Url.Parameters) > 0 {
		reqURLParamsPtr = &reqURLParams[0]
	}

	var reqHeadersPtr *C.Metlo_NVPair = nil
	if len(request.Headers) > 0 {
		reqHeadersPtr = &reqHeaders[0]
	}

	return C.Metlo_Request{
		Method: C.CString(request.Method),
		Url: C.Metlo_ApiUrl{
			Host:            C.CString(request.Url.Host),
			Path:            C.CString(request.Url.Path),
			Parameters:      reqURLParamsPtr,
			Parameters_size: C.uint(len(reqURLParams)),
		},
		Headers:      reqHeadersPtr,
		Headers_size: C.uint(len(reqHeaders)),
		Body:         C.CString(request.Body),
	}
}

func MapMetloResponseToCStruct(response TraceRes) C.Metlo_Response {
	respHeaders := make([]C.Metlo_NVPair, 0)
	for _, k := range response.Headers {
		respHeaders = append(respHeaders, C.Metlo_NVPair{Name: C.CString(k.Name), Value: C.CString(k.Value)})
	}

	var resHeadersPtr *C.Metlo_NVPair = nil
	if len(response.Headers) > 0 {
		resHeadersPtr = &respHeaders[0]
	}

	return C.Metlo_Response{
		Status:       C.ushort(response.Status),
		Headers:      resHeadersPtr,
		Headers_size: C.uint(len(respHeaders)),
		Body:         C.CString(response.Body),
	}
}

func MapMetloMetadataToCStruct(metadata TraceMeta) C.Metlo_Metadata {
	return C.Metlo_Metadata{
		Environment:      C.CString(metadata.Environment),
		Incoming:         C.int(1),
		Source:           C.CString(metadata.Source),
		Source_port:      C.ushort(metadata.SourcePort),
		Destination:      C.CString(metadata.Destination),
		Destination_port: C.ushort(metadata.DestinationPort),
	}
}
