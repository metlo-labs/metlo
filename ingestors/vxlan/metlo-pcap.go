package main

import (
	"fmt"
	"log"
	"net"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
	"github.com/metlo-labs/metlo/ingestors/govxlan/metloapi"
	pcap "github.com/metlo-labs/metlo/ingestors/govxlan/pcap"
	"github.com/metlo-labs/metlo/ingestors/govxlan/utils"
	"github.com/metlo-labs/metlo/ingestors/govxlan/vxcap"
	"github.com/sirupsen/logrus"
	"github.com/urfave/cli"
)

const version = "0.0.5"

var logLevelMap = map[string]logrus.Level{
	"trace": logrus.TraceLevel,
	"debug": logrus.DebugLevel,
	"info":  logrus.InfoLevel,
	"warn":  logrus.WarnLevel,
	"error": logrus.ErrorLevel,
}

type MetloArgs struct {
	apiKey           string
	metloHost        string
	maxRps           int
	runAsVxlan       bool
	captureInterface string
}

func main() {

	var args MetloArgs
	var logLevel string

	app := cli.NewApp()
	app.Name = "Metlo VXLAN"
	app.Usage = "Metlo's VXLAN Ingestor for Traffic Mirroring"
	app.Version = version

	app.Flags = []cli.Flag{
		cli.StringFlag{
			Name:        "log-level, l",
			Value:       "info",
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
		}, cli.BoolFlag{
			Name:        "vxlan",
			Usage:       "Capture vxlan data. Default false",
			Required:    false,
			Destination: &args.runAsVxlan,
		}, cli.IntFlag{
			Name:        "max-rps, r",
			Usage:       "Your Metlo Collector URL",
			Destination: &args.maxRps,
		}, cli.StringFlag{
			Name:        "interface, i",
			Usage:       "Interface for Metlo to listen on",
			Destination: &args.captureInterface,
		},
	}

	app.Action = func(c *cli.Context) error {
		level, ok := logLevelMap[logLevel]
		if !ok {
			return fmt.Errorf("INVALID LOG LEVEL: %s", logLevel)
		}
		utils.Log.SetLevel(level)

		godotenv.Load("/opt/metlo/credentials", "~/.metlo/credentials", ".env")
		if args.apiKey == "" {
			args.apiKey = os.Getenv("METLO_KEY")
		}
		if args.metloHost == "" {
			args.metloHost = os.Getenv("METLO_HOST")
		}
		envRps := os.Getenv("MAX_RPS")
		if args.maxRps == 0 && envRps != "" {
			intEnvRps, err := strconv.Atoi(envRps)
			if err != nil {
				return fmt.Errorf("INVALID MAX RPS: %s", &envRps)
			}
			args.maxRps = intEnvRps
		}
		if args.maxRps == 0 {
			args.maxRps = metloapi.MetloDefaultRPS
		}
		envVXLANEnabled := os.Getenv("VXLAN_ENABLED")
		if !args.runAsVxlan {
			if envVXLANEnabled != "" {
				vxlan_enabled, err := strconv.ParseBool(envVXLANEnabled)
				if err != nil {
					vxlan_enabled = false
				}
				args.runAsVxlan = vxlan_enabled
			} else {
				args.runAsVxlan = false
			}
		}
		envInterface := os.Getenv("INTERFACE")
		if !args.runAsVxlan && args.captureInterface == "" {
			if envInterface != "" {
				args.captureInterface = envInterface
			} else {
				ifaces, err := net.Interfaces()
				if err != nil {
					log.Println(err)
				}
				for _, i := range ifaces {
					if strings.HasPrefix(i.Name, "eth") || strings.HasPrefix(i.Name, "ens") {
						log.Printf("Found match on interface %s which matches expected pattern. Binding to it", i.Name)
						args.captureInterface = i.Name
						break
					}
				}
			}
			if args.captureInterface == "" {
				log.Fatalln("Packet capture in live mode must provide an interface")
			}
		}

		truncatedAPIKey := ""
		if len(args.apiKey) >= 10 {
			truncatedAPIKey = args.apiKey[:10] + "..."
		} else {
			truncatedAPIKey = args.apiKey
		}

		utils.Log.WithFields(logrus.Fields{
			"logLevel":  logLevel,
			"apiKey":    truncatedAPIKey,
			"metloHost": args.metloHost,
			"maxRps":    args.maxRps,
			"vxlan":     args.runAsVxlan,
			"interface": args.captureInterface,
		}).Info("Configuration")

		if args.metloHost == "" {
			return fmt.Errorf("INVALID METLO HOST: %s", args.metloHost)
		}
		if args.apiKey == "" {
			return fmt.Errorf("INVALID API KEY: %s", truncatedAPIKey)
		}
		if args.maxRps < 0 || args.maxRps > 300 {
			return fmt.Errorf("INVALID MAX RPS: %d. MUST BE BETWEEN 0 AND 300", args.maxRps)
		}

		metloAPI := metloapi.InitMetlo(args.metloHost, args.apiKey, args.maxRps)

		if !args.runAsVxlan {
			runLive(metloAPI, args.captureInterface)
		} else {
			runVXLAN(metloAPI)
		}
		return nil
	}

	if err := app.Run(os.Args); err != nil {
		utils.Log.WithError(err).Fatal("Fatal Error")
	}
}

func runLive(metloAPI *metloapi.Metlo, captureInterface string) error {
	cap := pcap.New(captureInterface)
	proc, err := pcap.NewPacketProcessor(metloAPI)
	if err != nil {
		return err
	}

	if err := cap.Start(proc); err != nil {
		return err
	}
	return nil
}

func runVXLAN(metloAPI *metloapi.Metlo) error {
	cap := vxcap.New()
	proc, err := vxcap.NewPacketProcessor(metloAPI)
	if err != nil {
		return err
	}

	if err := cap.Start(proc); err != nil {
		return err
	}
	return nil
}
