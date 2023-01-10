package metloapi

import (
	"net/http"
	"strings"
)

func GetHost(req *http.Request) string {
	host := ""
	if req == nil {
		return host
	}
	absRequestURI := strings.HasPrefix(req.RequestURI, "http://") || strings.HasPrefix(req.RequestURI, "https://")
	if !absRequestURI {
		if host == "" && req.Host != "" {
			host = req.Host
		}
		if host == "" && req.URL != nil {
			host = req.URL.Host
		}
	}
	return host
}

func GetPath(req *http.Request) string {
	if req == nil {
		return ""
	}
	if req.URL == nil {
		return ""
	}
	return req.URL.Path
}
