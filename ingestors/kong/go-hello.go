package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/Kong/go-pdk"
	"github.com/Kong/go-pdk/server"
)

func main() {
	server.StartServer(New, Version, Priority)
}

var Version = "0.2"
var Priority = 1

type Config struct {
	ApiKey   string `json:"api_key"`
	MetloURL string `json:"metlo_collector_url"`
}

type KVPair struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type URLStruct struct {
	Host       string   `json:"host"`
	Path       string   `json:"path"`
	Parameters []KVPair `json:"parameters"`
}

type RequestStruct struct {
	Url     URLStruct
	Headers []KVPair `json:"headers"`
	Body    string   `json:"body"`
	Method  string   `json:"method"`
}

type ResponseStruct struct {
	Url     string   `json:"url"`
	Status  int      `json:"status"`
	Headers []KVPair `json:"headers"`
	Body    string   `json:"body"`
}

type MetaStruct struct {
	Environment     string `json:"environment"`
	Incoming        bool   `json:"incoming"`
	Source          string `json:"source"`
	SourcePort      int    `json:"sourcePort"`
	Destination     string `json:"destination"`
	DestinationPort int    `json:"destinationPort"`
}

type Response struct {
	request  RequestStruct
	response ResponseStruct
	meta     MetaStruct
}

func New() interface{} {
	return &Config{}
}

func (conf Config) Response(kong *pdk.PDK) {
	// host, err = kong.Request.GetHeader("host")
	// if err != nil {
	// 	log.Printf("Error reading 'host' header %s", err.Error())
	// }
	api_key := conf.ApiKey
	metlo_url := conf.MetloURL
	if metlo_url != "" && api_key != "" {
		req_headers_raw, _ := kong.Request.GetHeaders(-1)
		req_headers := []KVPair{}
		for k, v := range req_headers_raw {
			pair := KVPair{Name: k, Value: strings.Join(v, ",")}

			req_headers = append(req_headers, pair)
		}

		resp_headers_raw, _ := kong.Request.GetHeaders(-1)
		resp_headers := []KVPair{}
		for k, v := range resp_headers_raw {
			pair := KVPair{Name: k, Value: strings.Join(v, ",")}

			resp_headers = append(resp_headers, pair)
		}

		req_query_raw, _ := kong.Request.GetQuery(-1)
		req_query := []KVPair{}
		for k, v := range req_query_raw {
			pair := KVPair{Name: k, Value: strings.Join(v, ",")}

			req_query = append(req_query, pair)
		}

		req_ip, _ := kong.Client.GetIp()
		req_path, _ := kong.Request.GetPath()
		req_body, _ := kong.Request.GetRawBody()
		req_method, _ := kong.Request.GetMethod()
		req_port, _ := kong.Request.GetPort()

		resp_ip, _ := kong.Nginx.GetVar("server_addr")
		resp_status, _ := kong.ServiceResponse.GetStatus()
		resp_body, _ := kong.ServiceResponse.GetRawBody()
		resp_port_str, _ := (kong.Nginx.GetVar("server_port"))
		resp_port, _ := strconv.Atoi(resp_port_str)

		req_url_struct := URLStruct{
			Host:       req_ip,
			Path:       req_path,
			Parameters: req_headers,
		}

		req_struct := RequestStruct{
			Url:     req_url_struct,
			Headers: req_headers,
			Body:    string(req_body[:]),
			Method:  req_method,
		}

		res_struct := ResponseStruct{
			Url:     resp_ip,
			Status:  resp_status,
			Headers: resp_headers,
			Body:    string(resp_body[:]),
		}

		meta_struct := MetaStruct{
			Environment:     "production",
			Incoming:        true,
			Source:          req_ip,
			SourcePort:      req_port,
			Destination:     resp_ip,
			DestinationPort: resp_port,
		}

		resp := &Response{
			request:  req_struct,
			response: res_struct,
			meta:     meta_struct,
		}
		packaged, _ := json.Marshal(resp)

		client := &http.Client{}
		req, _ := http.NewRequest(http.MethodPost, metlo_url, bytes.NewBuffer(packaged)) // URL-encoded payload
		req.Header.Add("Authorization", api_key)

		_, err := client.Do(req)
		if err != nil {
			log.Fatalln(err)
		}
	} else {
		if metlo_url == "" {
			log.Print("Couldn't find metlo collector url")
		}
		if api_key == "" {
			log.Print("Couldn't find api key for metlo collector")
		}
	}
}
