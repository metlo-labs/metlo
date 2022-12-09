package main

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
	"github.com/metlo-labs/metlo/ingestors/govxlan/metloapi"
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
	apiKey    string
	metloHost string
	maxRps    int
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
			Name:        "metlo-host, u",
			Usage:       "Your Metlo Collector URL",
			Destination: &args.metloHost,
		},
		cli.IntFlag{
			Name:        "max-rps, r",
			Usage:       "Your Metlo Collector URL",
			Destination: &args.maxRps,
		},
	}

	app.Action = func(c *cli.Context) error {
		level, ok := logLevelMap[logLevel]
		if !ok {
			return fmt.Errorf("INVALID LOG LEVEL: %s", logLevel)
		}
		utils.Log.SetLevel(level)

		godotenv.Load(".env", "/opt/metlo/credentials", "~/.metlo/credentials")
		if args.apiKey == "" {
			args.apiKey = os.Getenv("API_KEY")
		}
		if args.metloHost == "" {
			args.metloHost = os.Getenv("METLO_HOST")
		}
		if args.maxRps == 0 {
			args.maxRps = metloapi.MetloDefaultRPS
		}

		if args.maxRps < 0 || args.maxRps > 300 {
			return fmt.Errorf("INVALID MAX RPS: %d", args.maxRps)
		}

		utils.Log.WithFields(logrus.Fields{
			"logLevel":  logLevel,
			"apiKey":    args.apiKey[:10] + "...",
			"metloHost": args.metloHost,
		}).Info("Configuration")

		metloAPI := metloapi.InitMetlo(args.metloHost, args.apiKey, args.maxRps)
		proc, err := vxcap.NewPacketProcessor(metloAPI)
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
