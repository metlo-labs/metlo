package utils

import (
	"net"
	"strings"
)

func GetInterfaces(rawParam string, envParam string) []string {
	var interfaces []string
	if rawParam != "" {
		interfaces = strings.Split(rawParam, ",")
	} else if envParam != "" {
		interfaces = strings.Split(envParam, ",")
	} else {
		Log.Info("Didn't find any passed arg or env param for interface. Trying to find one matching required specs")
		ifaces, err := net.Interfaces()
		if err != nil {
			Log.Fatal(err)
		}
		for _, i := range ifaces {
			if strings.HasPrefix(i.Name, "eth") || strings.HasPrefix(i.Name, "ens") {
				Log.Infof("Found match on interface %s which matches expected pattern. Binding to it", i.Name)
				interfaces = append(interfaces, i.Name)
			}
		}
	}
	if interfaces == nil || len(interfaces) == 0 {
		Log.Fatalln("Packet capture in live mode must provide interface(s)")
	}
	return interfaces
}
