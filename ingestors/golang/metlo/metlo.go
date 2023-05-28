package metlo

import (
	"context"
	"errors"
	"sync"
	"time"

	mi "github.com/metlo-labs/metlo/ingestors/golang/metlo/proto"
	pb "github.com/metlo-labs/metlo/ingestors/golang/metlo/proto"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type metlo struct {
	mu      sync.Mutex
	ts      []int64
	disable bool
	stream  pb.MetloIngest_ProcessTraceAsyncClient
}

const MetloDefaultRPS int = 100
const MaxConnectTries int = 10

func ConnectLocalProcessAgent() (pb.MetloIngest_ProcessTraceAsyncClient, error) {
	for i := 0; i < MaxConnectTries; i++ {
		// utils.Log.Info("Trying to connect to local metlo processor")
		conn, err := grpc.Dial("unix:///tmp/metlo.sock", grpc.WithTransportCredentials(insecure.NewCredentials()))
		if err == nil {
			metloConn := pb.NewMetloIngestClient(conn)
			stream, err_stream := metloConn.ProcessTraceAsync(context.Background())
			if err_stream == nil {
				return stream, err_stream
			}
		}
		// utils.Log.WithError(err).Info("Couldn't connect to local metlo processor")
		time.Sleep(time.Second)
	}
	return nil, errors.New("COULD NOT CONNECT TO LOCAL METLO PROCESSOR")
}

func ReconnectLocalProcessAgent() (pb.MetloIngest_ProcessTraceAsyncClient, error) {
	for {
		// utils.Log.Info("Trying to connect to local metlo processor")
		conn, err := grpc.Dial("unix:///tmp/metlo.sock", grpc.WithTransportCredentials(insecure.NewCredentials()))
		if err == nil {
			metloConn := pb.NewMetloIngestClient(conn)
			stream, err_stream := metloConn.ProcessTraceAsync(context.Background())
			if err_stream == nil {
				return stream, err_stream
			}
		}
		// utils.Log.WithError(err).Info("Couldn't connect to local metlo processor")
		time.Sleep(time.Second)
	}
}

func InitMetlo(metloHost string, metloKey string) *metlo {
	return InitMetloCustom(metloHost, metloKey, MetloDefaultRPS, false)
}

func InitMetloCustom(metloHost string, metloKey string, rps int, disable bool) *metlo {
	inst := &metlo{
		ts:      make([]int64, 0, rps),
		disable: disable,
		stream:  nil,
	}
	conn, err := ConnectLocalProcessAgent()
	inst.stream = conn
	if err != nil {
		// utils.Log.WithError(err).Fatal()
	}
	return inst
}

func (m *metlo) Send(data MetloTrace) {
	miTrace := MapMetloTraceToMetloIngestRPC(data)
	err := m.stream.SendMsg(&miTrace)
	if err != nil {
		// utils.Log.WithError(err).Debug("Failed sending trace to rust-common")
		stream, err_inner := ReconnectLocalProcessAgent()
		if err_inner == nil {
			m.stream = stream
		}
	}
}

func (m *metlo) Allow() bool {
	if !m.disable {
		m.mu.Lock()
		tmp_ts := make([]int64, 0, 10)
		now := time.Now()
		curr := now.UTC().UnixMilli()
		if len(m.ts) == 0 {

		} else {
			for x := 0; x < len(m.ts); x++ {
				if (curr - m.ts[x]) <= 1000 {
					tmp_ts = append(tmp_ts, m.ts[x])
				}
			}
		}
		m.ts = tmp_ts
		if len(m.ts) < MetloDefaultRPS {
			m.ts = append(m.ts, curr)
			m.mu.Unlock()
			return true
		}
		m.mu.Unlock()
	}
	return false
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
