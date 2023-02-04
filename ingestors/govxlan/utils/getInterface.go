package utils

import (
	"log"
	"net"
	"strings"
)

func GetInterfaces(rawParam string, envParam string) []string {
	log.Println(rawParam, envParam)
	var interfaces []string
	if rawParam != "" {
		interfaces = strings.Split(rawParam, ",")
	} else if envParam != "" {
		interfaces = strings.Split(envParam, ",")
	} else {
		ifaces, err := net.Interfaces()
		if err != nil {
			Log.Println(err)
		}
		for _, i := range ifaces {
			if strings.HasPrefix(i.Name, "eth") || strings.HasPrefix(i.Name, "ens") {
				Log.Infof("Found match on interface %s which matches expected pattern. Binding to it", i.Name)
				interfaces = append(interfaces, i.Name)
			}
		}
	}
	log.Println(interfaces)
	if interfaces == nil || len(interfaces) == 0 {
		Log.Fatalln("Packet capture in live mode must provide interface(s)")
	}
	return interfaces
}
