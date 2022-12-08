package main

import (
	"fmt"
	"os"

	"github.com/metlo-labs/metlo/ingestors/govxlan/utils"
	"github.com/metlo-labs/metlo/ingestors/govxlan/vxcap"
	"github.com/sirupsen/logrus"
	"github.com/urfave/cli"
)

const version = "0.0.1"

var logLevelMap = map[string]logrus.Level{
	"trace": logrus.TraceLevel,
	"debug": logrus.DebugLevel,
	"info":  logrus.InfoLevel,
	"warn":  logrus.WarnLevel,
	"error": logrus.ErrorLevel,
}

type MetloArgs struct {
	apiKey   string
	metloUrl string
}

func main() {
	cap := vxcap.New()
	var args MetloArgs
	var logLevel string

	app := cli.NewApp()
	app.Name = "Metlo VXLAN"
	app.Usage = "Metlo's VXLAN Ingestor for Traffic Mirroring"
	app.Version = version

	app.Flags = []cli.Flag{
		cli.StringFlag{
			Name: "log-level, l", Value: "info",
			Usage:       "Log level [trace,debug,info,warn,error]",
			Destination: &logLevel,
		},
		cli.StringFlag{
			Name:        "api-key, k",
			Usage:       "Your Metlo API Key",
			Destination: &args.apiKey,
		},
		cli.StringFlag{
			Name:        "metlo-url, u",
			Usage:       "Your Metlo Collector URL",
			Destination: &args.metloUrl,
		},
	}

	app.Action = func(c *cli.Context) error {
		level, ok := logLevelMap[logLevel]
		if !ok {
			return fmt.Errorf("Invalid log level: %s", logLevel)
		}
		utils.Log.SetLevel(level)

		utils.Log.WithFields(logrus.Fields{
			"PacketProcessorArgument": args,
			"logLevel":                logLevel,
		}).Debug("Given options")

		proc, err := vxcap.NewPacketProcessor()
		if err != nil {
			return err
		}

		if err := cap.Start(proc); err != nil {
			return err
		}
		return nil
	}

	if err := app.Run(os.Args); err != nil {
		utils.Log.WithError(err).Fatal("Fatal Error")
	}
}
