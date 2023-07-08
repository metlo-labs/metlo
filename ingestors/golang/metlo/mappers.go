package metlo

/*
  #include "go_interface.h"
*/
import "C"
import "unsafe"

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

func FreeMetloTrace(trace C.Metlo_ApiTrace) {
	FreeMetloRequest(trace.Req)
	FreeMetloRequest(trace.Res)
	FreeMetloRequest(trace.Meta)
}

func FreeMetloRequest(request C.Metlo_Request) {
	C.free(unsafe.Pointer(request.Body))
	C.free(unsafe.Pointer(request.Method))
	C.free(unsafe.Pointer(request.Url.Host))
	C.free(unsafe.Pointer(request.Url.Path))
	for i := 0; i < request.Url.Parameters_size; i++ {
		C.free(unsafe.Pointer(request.Url.Parameters[i].Name))
		C.free(unsafe.Pointer(request.Url.Parameters[i].Value))
	}
}
func FreeMetloResponse(response C.Metlo_Response) {
	C.free(unsafe.Pointer(response.Body))
	for i := 0; i < response.Headers_size; i++ {
		C.free(unsafe.Pointer(response.Headers[i].Name))
		C.free(unsafe.Pointer(response.Headers[i].Value))
	}
}
func FreeMetloMetadata(meta C.Metlo_Metadata) {
	C.free(unsafe.Pointer(meta.Environment))
	C.free(unsafe.Pointer(meta.Source))
	C.free(unsafe.Pointer(meta.Destination))
}
