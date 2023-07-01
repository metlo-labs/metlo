package metlo

/*
  #cgo darwin LDFLAGS: /opt/metlo/libmetlo_golang_linuxj.a -lm
  #cgo linux LDFLAGS: /opt/metlo/libmetlo_golang_linuxj.a -lm
  #include "interface.h"
*/
import "C"
import (
	"strings"
)

type metlo struct {
	disable       bool
	metloHost     string
	metloKey      string
	backendPort   int
	collectorPort int
	encryptionKey *string
	logLevel      LogLevel
}

func InitMetlo(metloHost string, metloKey string) *metlo {
	var collector_port *int = nil
	var backend_port *int = nil
	if strings.Contains(metloHost, "app.metlo.com") {
		default_backend_port := 443
		backend_port = &default_backend_port
	} else {
		default_backend_port := 8080
		backend_port = &default_backend_port
	}
	default_collector_port := 8081
	collector_port = &default_collector_port
	return InitMetloCustom(metloHost, metloKey, *backend_port, *collector_port, nil, Info, false)
}

func InitMetloCustom(metloHost string, metloKey string, backendPort int, collectorPort int, encryptionKey *string, logLevel LogLevel, disable bool) *metlo {
	inst := &metlo{
		metloHost:     metloHost,
		metloKey:      metloKey,
		disable:       disable,
		backendPort:   backendPort,
		collectorPort: collectorPort,
		encryptionKey: encryptionKey,
		logLevel:      logLevel,
	}
	go inst.BootstrapInstance()
	return inst
}

func (m *metlo) BootstrapInstance() {
	res, err := C.Metlo_startup(
		C.CString(m.metloHost),
		C.CString(m.metloKey),
		C.ushort(m.backendPort),
		C.ushort(m.collectorPort),
		nil,
	)
	println("Done with startup")
	print(res, err)
	if err != nil {
		print(err)
	}

}

func (m *metlo) Send(data MetloTrace) {
	C.Metlo_ingest_trace(MapMetloTraceToCStruct(data))
}

func (m *metlo) Allow() bool {
	return !m.disable
}

func (m *metlo) Block(req TraceReq, meta TraceMeta) bool {
	resp := C.Metlo_block_trace(C.Metlo_ExchangeStruct{
		Req:  MapMetloRequestToCStruct(req),
		Meta: MapMetloMetadataToCStruct(meta),
	})
	if resp == 1 {
		return true
	} else {
		return false
	}
}
