package metlo_gin

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type nv struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type metlo struct {
	mu        sync.Mutex
	ts        []int64
	rps       int
	metloHost string
	metloKey  string
	host      string
	hostPort  int
	disable   bool
}

type url struct {
	Host       string `json:"host"`
	Path       string `json:"http_uri"`
	Parameters []nv
}

type req struct {
	Url     url
	Headers []nv
	Body    string `json:"body"`
	Method  string `json:"method"`
}

type res struct {
	Url     string `json:"url"`
	Status  int    `json:"status"`
	Headers []nv
	Body    string `json:"body"`
}

type meta struct {
	Environment     string `json:"environment"`
	Incoming        bool   `json:"incoming"`
	Source          string `json:"source"`
	SourcePort      int    `json:"sourcePort"`
	Destination     string `json:"destination"`
	DestinationPort int    `json:"destinationPort"`
	MetloSource     string `json:"metloSource"`
}

type trace struct {
	Request  req
	Response res
	Meta     meta
}

const MetloDefaultRPS int = 10

func (m *metlo) allow() bool {

	tmp_ts := make([]int64, 0, 10)
	now := time.Now()
	curr := now.UTC().UnixMilli()
	if len(m.ts) == 0 {

	} else {
		for x := 0; x < len(m.ts); x++ {
			if (curr - m.ts[x]) <= 1000 {
				tmp_ts = append(tmp_ts, m.ts[x])
			}
		}
	}
	m.ts = tmp_ts
	if len(m.ts) < m.rps {
		m.ts = append(m.ts, curr)
		return true
	}
	return false
}

func InitMetlo(metloHost string, metloKey string) *metlo {
	return InitMetloCustom(metloHost, metloKey, MetloDefaultRPS, "", 0, false)
}

func InitMetloCustom(metloHost string, metloKey string, rps int, serverHost string, serverPort int, disable bool) *metlo {
	inst := &metlo{
		ts:        make([]int64, 0, rps),
		rps:       rps,
		metloHost: metloHost,
		metloKey:  metloKey,
		host:      serverHost,
		hostPort:  serverPort,
		disable:   disable,
	}
	return inst
}

type bodyLogWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w bodyLogWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func send(m *metlo, tr *trace) {
	json, err := json.Marshal(tr)
	if err != nil {
		log.Fatal(err)
	}
	http.Post(m.metloHost, "application/json",
		bytes.NewBuffer(json))
}

func (m *metlo) GinBodyLogMiddleware(c *gin.Context) {
	blw := &bodyLogWriter{body: bytes.NewBufferString(""), ResponseWriter: c.Writer}
	c.Writer = blw
	body, _ := ioutil.ReadAll(c.Request.Body)
	c.Request.Body = ioutil.NopCloser(bytes.NewReader(body))
	c.Next()

	reqHeaders := make([]nv, 0)
	for k := range c.Request.Header {
		reqHeaders = append(reqHeaders, nv{Name: k, Value: strings.Join(c.Request.Header[k], ",")})
	}
	resHeaderMap := c.Writer.Header()
	resHeaders := make([]nv, 0)
	for k := range resHeaderMap {
		resHeaders = append(resHeaders, nv{Name: k, Value: strings.Join(resHeaderMap[k], ",")})
	}
	queryMap := c.Request.URL.Query()
	queryParams := make([]nv, 0)
	for k := range queryMap {
		queryParams = append(queryParams, nv{Name: k, Value: strings.Join(queryMap[k], ",")})
	}
	splitAddr := strings.Split(c.Request.RemoteAddr, ":")
	remAddr := splitAddr[len(splitAddr)-1]
	sourcePort, err := strconv.Atoi(remAddr)
	if err != nil {
		log.Println("Metlo couldn't find source port for incoming request")
	}

	tr := &trace{
		Request: req{
			Url: url{
				Host:       c.Request.Host,
				Path:       c.Request.URL.Path,
				Parameters: queryParams,
			},
			Headers: reqHeaders,
			Body:    string(body),
			Method:  c.Request.Method,
		},
		Response: res{
			Url:     "",
			Status:  blw.Status(),
			Body:    blw.body.String(),
			Headers: resHeaders,
		},
		Meta: meta{
			Environment:     "production",
			Incoming:        true,
			Source:          c.ClientIP(),
			SourcePort:      sourcePort,
			Destination:     m.host,
			DestinationPort: m.hostPort,
			MetloSource:     "go/gin",
		},
	}
	if m.allow() {
		go send(m, tr)
	}
}
