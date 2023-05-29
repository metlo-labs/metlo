package metlo

import (
	"context"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"

	pb "github.com/metlo-labs/metlo/ingestors/golang/metlo/proto"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type metlo struct {
	disable       bool
	stream        pb.MetloIngest_ProcessTraceAsyncClient
	streamSetup   bool
	rps           int
	metloHost     string
	metloKey      string
	backendPort   int
	collectorPort int
	encryptionKey *string
}

const MetloDefaultRPS int = 100
const MaxConnectTries int = 10

func ConnectLocalProcessAgent() (pb.MetloIngest_ProcessTraceAsyncClient, error) {
	var connectErr error = nil
	for i := 0; i < MaxConnectTries; i++ {
		conn, err := grpc.Dial("unix:///tmp/metlo.sock", grpc.WithTransportCredentials(insecure.NewCredentials()))
		if err == nil {
			metloConn := pb.NewMetloIngestClient(conn)
			stream, err_stream := metloConn.ProcessTraceAsync(context.Background())
			if err_stream == nil {
				return stream, err_stream
			} else {
				connectErr = err_stream
			}
		} else {
			connectErr = err
		}
		time.Sleep(time.Second)
	}
	return nil, connectErr
}

func ReconnectLocalProcessAgent() (pb.MetloIngest_ProcessTraceAsyncClient, error) {
	for {
		conn, err := grpc.Dial("unix:///tmp/metlo.sock", grpc.WithTransportCredentials(insecure.NewCredentials()))
		if err == nil {
			metloConn := pb.NewMetloIngestClient(conn)
			stream, err_stream := metloConn.ProcessTraceAsync(context.Background())
			if err_stream == nil {
				return stream, err_stream
			}
		}
		logger.Println("Couldn't connect to metlo agent", err)
		time.Sleep(time.Second)
	}
}

func InitMetlo(metloHost string, metloKey string) *metlo {
	var collector_port *int = nil
	var backend_port *int = nil
	if strings.Contains(metloHost, "app.metlo.com") {
		*backend_port = 443
	} else {
		*backend_port = 8080
	}
	*collector_port = 8081
	return InitMetloCustom(metloHost, metloKey, MetloDefaultRPS, *backend_port, *collector_port, nil, false)
}

func InitMetloCustom(metloHost string, metloKey string, rps int, backendPort int, collectorPort int, encryptionKey *string, disable bool) *metlo {
	inst := &metlo{
		rps:           rps,
		metloHost:     metloHost,
		metloKey:      metloKey,
		disable:       disable,
		backendPort:   backendPort,
		collectorPort: collectorPort,
		encryptionKey: encryptionKey,
		streamSetup:   false,
	}
	go inst.BootstrapInstance()
	return inst
}

func (m *metlo) BootstrapInstance() {
	agentStartErr := m.StartLocalAgent()
	if agentStartErr != nil {
		logger.Println("Couldn't start metlo agent", agentStartErr)
		m.disable = true
	}
	conn, err := ConnectLocalProcessAgent()
	if err != nil {
		logger.Println("Couldn't connect to metlo agent", err)
		m.disable = true
	} else {
		m.stream = conn
		m.streamSetup = true
	}
}

func (m *metlo) StartLocalAgent() error {
	args := make([]string, 0)
	args = append(args, "-m", m.metloHost, "-a", m.metloKey, "--enable-grpc", "true")
	if m.backendPort != 0 {
		args = append(args, "-b", strconv.Itoa(m.backendPort))
	}
	if m.collectorPort != 0 {
		args = append(args, "-c", strconv.Itoa(m.collectorPort))
	}
	if m.encryptionKey != nil {
		args = append(args, "-e", *m.encryptionKey)
	}
	cmd := exec.Command("metlo-agent", args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err := cmd.Start()
	if err != nil {
		return err
	}
	go func() {
		err := cmd.Wait()
		logger.Println("Metlo Agent Exited", err)
	}()
	return nil
}

func (m *metlo) Send(data MetloTrace) {
	if !m.streamSetup {
		return
	}
	miTrace := MapMetloTraceToMetloIngestRPC(data)
	err := m.stream.SendMsg(&miTrace)
	if err != nil {
		stream, err_inner := ReconnectLocalProcessAgent()
		if err_inner == nil {
			m.stream = stream
		}
	}
}

func (m *metlo) Allow() bool {
	return !m.disable
}
