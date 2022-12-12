package pcap

import (
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/metlo-labs/metlo/ingestors/govxlan/utils"
	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
)

func init() {
	utils.Log.SetLevel(logrus.FatalLevel)
}

// VXCap is one of main components of the package
type Pcap struct {
	QueueSize        int
	captureInterface string
}

const (
	// DefaultReceiverQueueSize is default queue size of channel from UDP server to packet processor.
	DefaultReceiverQueueSize = 1024
)

// New is constructor of VXCap
func New(captureInterface string) *Pcap {
	cap := Pcap{
		QueueSize:        DefaultReceiverQueueSize,
		captureInterface: captureInterface,
	}
	return &cap
}

// Start invokes UDP listener for VXLAN and forward captured packets to processor.
func (x *Pcap) Start(proc Processor) error {
	utils.Log.Trace("Setting up processor...")
	if err := proc.Setup(); err != nil {
		return err
	}

	// Setup channels
	utils.Log.WithFields(logrus.Fields{
		"queueSize": x.QueueSize,
	}).Trace("Opening UDP port...")
	queueCh := listenPCAP(x.QueueSize, x.captureInterface)

	utils.Log.Trace("Setting up channels")
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()
	tickerCh := ticker.C

	signalCh := make(chan os.Signal, 1)
	signal.Notify(signalCh, syscall.SIGTERM)
	signal.Notify(signalCh, syscall.SIGINT)
	defer signal.Stop(signalCh)
	utils.Log.Infof("Starting loop, listening on interface %s", x.captureInterface)

MainLoop:
	for {
		select {
		case q := <-queueCh:
			if q.Err != nil {
				return errors.Wrap(q.Err, "Fail to receive UDP")
			}
			if err := proc.Put(q.Pkt); err != nil {
				return errors.Wrap(err, "Fail to handle packet")
			}

		case t := <-tickerCh:
			if err := proc.Tick(t); err != nil {
				return errors.Wrap(err, "Fail in tick process")
			}

		case s := <-signalCh:
			utils.Log.WithField("signal", s).Warn("Caught signal, Shutting down...")
			if err := proc.Shutdown(); err != nil {
				return errors.Wrap(err, "Fail in shutdown process")
			}
			break MainLoop
		}
	}

	utils.Log.Info("Exit normally")

	return nil
}
