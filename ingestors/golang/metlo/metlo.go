package metlo

import (
	"context"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"sync"
	"time"

	pb "github.com/metlo-labs/metlo/ingestors/golang/metlo/proto"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type metlo struct {
	disable        bool
	processStream  pb.MetloIngest_ProcessTraceAsyncClient
	rps            int
	metloHost      string
	metloKey       string
	backendPort    int
	collectorPort  int
	encryptionKey  *string
	logLevel       LogLevel
	reconnectMutex sync.Mutex
	restartCount   int
	spawnedTask    bool
}

const MetloDefaultRPS int = 100
const MaxConnectTries int = 10

func (m *metlo) ConnectLocalProcessAgent() (pb.MetloIngest_ProcessTraceAsyncClient, error) {
	var connectErr error = nil
	for i := 0; i < MaxConnectTries; i++ {
		conn, err := grpc.Dial("unix:///tmp/metlo.sock", grpc.WithTransportCredentials(insecure.NewCredentials()))
		if err == nil {
			metloConn := pb.NewMetloIngestClient(conn)
			stream_process_trace, err := metloConn.ProcessTraceAsync(context.Background())
			if err == nil {
				return stream_process_trace, err
			} else {
				connectErr = err
			}
		} else {
			if m.logLevel <= Debug {
				logger.Println("Couldn't connect to metlo agent over socket. Try ", i, err)
			}
			connectErr = err
		}
		time.Sleep(time.Second)
	}
	return nil, connectErr
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
	return InitMetloCustom(metloHost, metloKey, MetloDefaultRPS, *backend_port, *collector_port, nil, Info, false)
}

func InitMetloCustom(metloHost string, metloKey string, rps int, backendPort int, collectorPort int, encryptionKey *string, logLevel LogLevel, disable bool) *metlo {
	inst := &metlo{
		rps:            rps,
		metloHost:      metloHost,
		metloKey:       metloKey,
		disable:        disable,
		backendPort:    backendPort,
		collectorPort:  collectorPort,
		encryptionKey:  encryptionKey,
		logLevel:       logLevel,
		reconnectMutex: sync.Mutex{},
		restartCount:   0,
		spawnedTask:    false,
		processStream:  nil,
	}
	go inst.BootstrapInstance()
	return inst
}

func (m *metlo) BootstrapInstance() {
	agentStartErr := m.StartLocalAgent()
	if agentStartErr != nil {
		if m.logLevel <= Error {
			logger.Println("Couldn't start metlo agent", agentStartErr)
		}
		m.disable = true
	} else {
		m.spawnedTask = true
	}
	conn, err := m.ConnectLocalProcessAgent()
	if err != nil {
		if m.logLevel <= Error {
			logger.Println("Couldn't connect to metlo agent", err)
		}
		m.disable = true
	} else {
		m.processStream = conn
		// go connStateWatcher(conn, m)
	}
}

func (m *metlo) StartLocalAgent() error {
	args := make([]string, 0)
	args = append(args, "-m", m.metloHost, "-a", m.metloKey, "--enable-grpc", "true", "--log-level", MapLogLevelToString(m.logLevel))
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
	if m.logLevel <= Debug {
		logger.Println("Spawned Metlo agent")
	}
	go func() {
		err := cmd.Wait()
		logger.Println("Spawned task crashed")
		m.spawnedTask = false
		m.processStream = nil
		if m.logLevel <= Error {
			logger.Println("Metlo Agent Exited", err)
		}
		m.restartMetlo(true)
	}()
	return nil
}

func (m *metlo) Send(data MetloTrace) {
	if m.processStream == nil {
		if m.logLevel <= Trace {
			logger.Println("Metlo GRPC stream not setup")
		}
		m.restartMetlo(!m.spawnedTask)
		return
	}
	miTrace := MapMetloTraceToMetloIngestRPC(data)
	if m.processStream != nil {
		err := m.processStream.Send(&miTrace)
		if err != nil {
			if m.logLevel <= Error {
				logger.Println("Encountered an error while sending message to GRPC for Process Trace", err)
			}
		}
	}
}

func (m *metlo) Allow() bool {
	return !m.disable
}

func (m *metlo) restartMetlo(shouldSpawnTask bool) bool {
	if m.reconnectMutex.TryLock() {
		defer m.reconnectMutex.Unlock()
		if m.restartCount < MaxConnectTries {
			m.restartCount++
			if shouldSpawnTask {
				err := m.StartLocalAgent()
				if err != nil {
					if m.logLevel <= Error {
						logger.Println("Couldn't spawn local Metlo Agent")
					}
					return false
				} else {
					m.spawnedTask = true
				}
			}
			conn, err := m.ConnectLocalProcessAgent()
			if err != nil {
				if m.logLevel <= Error {
					logger.Println("Couldn't connect to metlo agent when restarting")
				}
				return false
			} else {
				m.processStream = conn
				return true
			}
		} else {
			m.disable = true
		}
	}
	return false
}

// func connStateWatcher(conn *grpc.ClientConn, m *metlo) {
// 	ticker := time.NewTicker(time.Millisecond * 200)
// 	for {
// 		select {
// 		case <-ticker.C:
// 			if m.disable {
// 				break
// 			}
// 			conn.Connect()
// 			if conn.GetState() == connectivity.Shutdown {
// 				m.processStream = nil
// 				m.restartMetlo(false)
// 			}

// 		}
// 	}
// }
