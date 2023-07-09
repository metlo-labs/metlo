package metlo

/*
  #include <stdlib.h>
  #include "go_interface.h"
*/
import "C"
import (
	"strings"
	"syscall"
	"unsafe"
)

type Metlo struct {
	disable       bool
	metloHost     string
	metloKey      string
	backendPort   int
	collectorPort int
	encryptionKey *string
	logLevel      LogLevel
}

func InitMetlo(metloHost string, metloKey string) *Metlo {
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

func InitMetloCustom(metloHost string, metloKey string, backendPort int, collectorPort int, encryptionKey *string, logLevel LogLevel, disable bool) *Metlo {
	inst := &Metlo{
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

func (m *Metlo) BootstrapInstance() {

	var metloHost = C.CString(m.metloHost)
	defer C.free(unsafe.Pointer(metloHost))
	var metloKey = C.CString(m.metloKey)
	defer C.free(unsafe.Pointer(metloKey))
	var metloBackendPort = C.ushort(m.backendPort)
	var metloCollectorPort = C.ushort(m.collectorPort)
	var metloLogLevel = C.CString(MapLogLevelToString(m.logLevel))
	defer C.free(unsafe.Pointer(metloLogLevel))
	if m.encryptionKey != nil {
		var metloEncryptionKey = C.CString(*m.encryptionKey)
		defer C.free(unsafe.Pointer(&metloEncryptionKey))
		_, err := C.Metlo_startup(
			metloHost,
			metloKey,
			metloBackendPort,
			metloCollectorPort,
			metloLogLevel,
			metloEncryptionKey,
		)
		if err != nil && err != syscall.EINPROGRESS {
			logger.Print(err)
		}
	} else {
		_, err := C.Metlo_startup(
			metloHost,
			metloKey,
			metloBackendPort,
			metloCollectorPort,
			metloLogLevel,
			nil,
		)
		if err != nil && err != syscall.EINPROGRESS {
			logger.Print(err)
		}
	}
}

func (m *Metlo) Send(data MetloTrace) {
	mapped_data := MapMetloTraceToCStruct(data)
	C.Metlo_ingest_trace(mapped_data)
	FreeMetloTrace(mapped_data)
}

func (m *Metlo) Allow() bool {
	return !m.disable
}

func (m *Metlo) Block(req TraceReq, meta TraceMeta) bool {
	block_struct := C.Metlo_ExchangeStruct{
		Req:  MapMetloRequestToCStruct(req),
		Meta: MapMetloMetadataToCStruct(meta),
	}
	resp := C.Metlo_block_trace(block_struct)
	FreeMetloRequest(block_struct.Req)
	FreeMetloMetadata(block_struct.Meta)
	if resp == 1 {
		return true
	} else {
		return false
	}
}
