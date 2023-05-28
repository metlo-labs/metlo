package metlo

import (
	"context"
	"errors"
	"sync"
	"time"

	pb "github.com/metlo-labs/metlo/ingestors/golang/metlo/proto"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type metlo struct {
	mu             sync.Mutex
	ts             []int64
	disable        bool
	stream         pb.MetloIngest_ProcessTraceAsyncClient
	rps            int
	metloHost      string
	metloKey       string
	backendPort    int
	collectorPort  int
	encryption_key *string
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
	return InitMetloCustom(metloHost, metloKey, MetloDefaultRPS, 8000, 8081, nil, false)
}

func InitMetloCustom(metloHost string, metloKey string, rps int, backendPort int, collectorPort int, encryption_key *string, disable bool) *metlo {
	inst := &metlo{
		ts:             make([]int64, 0, rps),
		rps:            rps,
		metloHost:      metloHost,
		metloKey:       metloKey,
		disable:        disable,
		backendPort:    backendPort,
		collectorPort:  collectorPort,
		encryption_key: encryption_key,
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
