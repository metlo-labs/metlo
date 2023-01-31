package main

import (
	"fmt"
	"log"
	"net"
	"os"
	"strconv"
	"strings"
	"sync"

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
	apiKey              string
	metloHost           string
	maxRps              int
	runAsVxlan          bool
	captureInterfaceRaw string
}

var captureInterfaces []string

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
			Usage:       "Comma separated list of interface(s) for Metlo to listen on",
			Destination: &args.captureInterfaceRaw,
		},
	}

	app.Action = func(c *cli.Context) error {
		godotenv.Load("/opt/metlo/credentials", "~/.metlo/credentials", ".env")
		if logLevel == "" {
			level := os.Getenv("LOG_LEVEL")
			if level != "" {
				logLevel = level
			} else {
				logLevel = "info"
			}
		}

		level, ok := logLevelMap[logLevel]
		if !ok {
			return fmt.Errorf("INVALID LOG LEVEL: %s", logLevel)
		}
		utils.Log.SetLevel(level)

		if args.apiKey == "" {
			key := os.Getenv("METLO_KEY")
			if key != "" {
				args.apiKey = key
			} else {
				return fmt.Errorf("No value passed for METLO_KEY. Set it via -k param or METLO_KEY in the environment")
			}
		}

		if args.metloHost == "" {
			host := os.Getenv("METLO_HOST")
			if host != "" {
				args.metloHost = host
			} else {
				return fmt.Errorf("No value passed for METL_HOST. Set it via -u param or METLO_HOST in the environment")
			}
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
		if !args.runAsVxlan {
			if args.captureInterfaceRaw == "" {
				if envInterface != "" {
					captureInterfaces = strings.Split(envInterface, ",")
				} else {
					ifaces, err := net.Interfaces()
					if err != nil {
						log.Println(err)
					}
					for _, i := range ifaces {
						if strings.HasPrefix(i.Name, "eth") || strings.HasPrefix(i.Name, "ens") {
							log.Printf("Found match on interface %s which matches expected pattern. Binding to it", i.Name)
							captureInterfaces = append(captureInterfaces, i.Name)
						}
					}
				}
			} else {
				captureInterfaces = strings.Split(args.captureInterfaceRaw, ",")
			}
			if captureInterfaces != nil && len(captureInterfaces) == 0 {
				log.Fatalln("Packet capture in live mode must provide an interface(s)")
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
			"interface": captureInterfaces,
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
			runLive(metloAPI, captureInterfaces)
		} else {
			runVXLAN(metloAPI)
		}
		return nil
	}

	if err := app.Run(os.Args); err != nil {
		utils.Log.WithError(err).Fatal("Fatal Error")
	}
}

func runLive(metloAPI *metloapi.Metlo, captureInterface []string) error {
	if len(captureInterface) > 1 {
		utils.Log.Infof("Listening to multiple interfaces: %p", captureInterface)
	}
	var wg sync.WaitGroup
	for _, _interface := range captureInterface {
		cap := pcap.New(_interface)
		proc, err := pcap.NewPacketProcessor(metloAPI, _interface)
		if err != nil {
			fmt.Println(err)
			fmt.Errorf("Metlo live capture encountered an error")
			return err
		}
		wg.Add(1)
		go (func(proc *pcap.PacketProcessor) {
			defer wg.Done()
			if err := cap.Start(proc); err != nil {
				fmt.Println(err)
				fmt.Errorf("Metlo live capture encountered an error")
				return
			}
		})(proc)
	}
	wg.Wait()
	return nil
}

func runVXLAN(metloAPI *metloapi.Metlo) error {
	cap := vxcap.New()
	proc, err := vxcap.NewPacketProcessor(metloAPI)
	if err != nil {
		fmt.Println(err)
		fmt.Errorf("Metlo VXLAN capture encountered an error")
		return err
	}

	if err := cap.Start(proc); err != nil {
		fmt.Println(err)
		fmt.Errorf("Metlo VXLAN capture encountered an error")
		return err
	}
	return nil
}
